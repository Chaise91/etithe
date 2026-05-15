#!/bin/bash
set -euo pipefail

# eTithe Infrastructure Deployment Script
# Orchestrates multi-region EKS deployment: us-east-1 → us-west-2 → global DNS
# Usage: ./deploy.sh [plan|apply] [--profile AWS_PROFILE]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-plan}"
AWS_PROFILE="${2#--profile=}"
AWS_PROFILE="${AWS_PROFILE:=default}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGIONS=("us-east-1" "us-west-2")
STACKS=("environments/us-east-1" "environments/us-west-2" "environments/global")

# ============================================================================
# Functions
# ============================================================================

log_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}▶ $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

confirm() {
  local prompt="$1"
  local response
  read -p "$(echo -e ${YELLOW}$prompt${NC}) (yes/no): " response
  [[ "$response" == "yes" ]] && return 0 || return 1
}

check_prerequisites() {
  log_header "Checking Prerequisites"
  
  # Check for terraform
  if ! command -v terraform &> /dev/null; then
    log_error "terraform not found. Please install Terraform first."
  fi
  log_success "terraform found"
  
  # Check for aws cli
  if ! command -v aws &> /dev/null; then
    log_error "aws cli not found. Please install AWS CLI first."
  fi
  log_success "aws cli found"
  
  # Check AWS profile
  if ! aws configure list --profile "$AWS_PROFILE" > /dev/null 2>&1; then
    log_error "AWS profile '$AWS_PROFILE' not configured. Run 'aws configure --profile $AWS_PROFILE'"
  fi
  log_success "AWS profile '$AWS_PROFILE' configured"
  
  # Verify AWS credentials work
  if ! AWS_PROFILE="$AWS_PROFILE" aws sts get-caller-identity > /dev/null 2>&1; then
    log_error "AWS credentials for profile '$AWS_PROFILE' are invalid or expired."
  fi
  log_success "AWS credentials valid"
}

init_stack() {
  local stack_path="$1"
  log_info "Initializing: $stack_path"
  
  cd "$SCRIPT_DIR/$stack_path"
  AWS_PROFILE="$AWS_PROFILE" terraform init -upgrade
  cd "$SCRIPT_DIR"
}

plan_stack() {
  local stack_path="$1"
  local stack_name="${stack_path##*/}"
  
  log_info "Planning: $stack_path"
  cd "$SCRIPT_DIR/$stack_path"
  
  AWS_PROFILE="$AWS_PROFILE" terraform plan \
    -out="tfplan-${stack_name}" \
    -lock=false
  
  cd "$SCRIPT_DIR"
}

apply_stack() {
  local stack_path="$1"
  local stack_name="${stack_path##*/}"
  
  log_info "Applying: $stack_path"
  cd "$SCRIPT_DIR/$stack_path"
  
  if [[ -f "tfplan-${stack_name}" ]]; then
    AWS_PROFILE="$AWS_PROFILE" terraform apply \
      -lock=false \
      -auto-approve \
      "tfplan-${stack_name}"
  else
    log_warn "No plan file found for $stack_path. Skipping apply."
  fi
  
  cd "$SCRIPT_DIR"
}

show_deployment_summary() {
  log_header "Deployment Summary"
  
  cat <<EOF
Mode:             $MODE
AWS Profile:      $AWS_PROFILE
Stacks:           ${#STACKS[@]}
Stack Order:
EOF
  
  for i in "${!STACKS[@]}"; do
    echo "  $((i+1)). ${STACKS[$i]}"
  done
  
  cat <<EOF

Deployment Flow:
  1. Check prerequisites (Terraform, AWS CLI, credentials)
  2. Initialize all stacks
  3. Plan all stacks (or apply if already planned)
  4. Show you the plan and ask for confirmation
  5. Apply stacks in order with inter-stack dependencies

Key Dependencies:
  • us-east-1:  Creates VPC, EKS cluster, ALB → outputs ALB DNS
  • us-west-2:  Creates VPC, EKS cluster, ALB → outputs ALB DNS
  • global:     Creates Route53 hosted zone and health checks
                Reads ALB outputs from regional states for failover routing

Post-Deploy:
  • Configure kubectl: aws eks update-kubeconfig --profile $AWS_PROFILE --name etithe-us-east-1 --region us-east-1
  • Verify cluster: kubectl get nodes
  • Next: Deploy Kubernetes manifests for the Next.js app

EOF
}

# ============================================================================
# Main Workflow
# ============================================================================

main() {
  if [[ "$MODE" != "plan" && "$MODE" != "apply" ]]; then
    log_error "Invalid mode: $MODE. Use 'plan' or 'apply'."
  fi
  
  show_deployment_summary
  
  # Step 1: Prerequisites
  check_prerequisites
  
  # Step 2: Initialize all stacks
  log_header "Initializing Terraform Stacks"
  for stack in "${STACKS[@]}"; do
    init_stack "$stack"
    log_success "Initialized: $stack"
  done
  
  # Step 3: Plan all stacks
  log_header "Planning Infrastructure Changes"
  for stack in "${STACKS[@]}"; do
    plan_stack "$stack"
    log_success "Planned: $stack"
  done
  
  # Step 4: Ask for confirmation before apply
  if [[ "$MODE" == "apply" ]]; then
    log_header "Ready to Apply"
    
    cat <<EOF
${YELLOW}⚠️  WARNING: You are about to apply infrastructure changes.${NC}

This will:
  • Create VPCs, subnets, and security groups in us-east-1 and us-west-2
  • Create EKS clusters (Kubernetes) in both regions
  • Create Application Load Balancers for your Next.js app
  • Create Route53 DNS records for failover
  
Estimated cost: Review the plan output above. Typical dev: $50-150/month.

${RED}This will incur AWS charges.${NC}
EOF
    
    if ! confirm "Do you want to proceed with the apply?"; then
      log_warn "Apply cancelled by user."
      exit 0
    fi
    
    # Step 5: Apply stacks in order
    log_header "Applying Infrastructure"
    for stack in "${STACKS[@]}"; do
      apply_stack "$stack"
      log_success "Applied: $stack"
    done
    
    log_header "Deployment Complete! 🎉"
    cat <<EOF
${GREEN}✓ Infrastructure deployed successfully${NC}

Next Steps:
1. Configure kubectl for us-east-1:
   aws eks update-kubeconfig --profile $AWS_PROFILE --name etithe-us-east-1 --region us-east-1

2. Verify cluster connectivity:
   kubectl get nodes

3. Deploy the Next.js app to Kubernetes:
   kubectl apply -f k8s/ # (You'll need to create k8s manifests)

4. Get ALB DNS names:
   cd environments/us-east-1 && AWS_PROFILE=$AWS_PROFILE terraform output alb_dns_name
   cd ../us-west-2 && AWS_PROFILE=$AWS_PROFILE terraform output alb_dns_name

5. Access your app:
   http://<alb_dns_name>:3000

To Clean Up (destroy all resources):
   ./deploy.sh destroy --profile=$AWS_PROFILE
   (Not yet implemented—requires confirmation flow)

EOF
  else
    log_header "Plan Complete"
    log_info "Review the plan output above."
    log_info "To apply changes, run:"
    echo -e "  ${GREEN}./deploy.sh apply --profile=$AWS_PROFILE${NC}"
  fi
}

main "$@"
