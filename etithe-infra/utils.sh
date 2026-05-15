#!/bin/bash
# eTithe Infrastructure Utilities
# Quick commands for post-deployment tasks

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AWS_PROFILE="${AWS_PROFILE:-default}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

usage() {
  cat <<EOF
Usage: ./utils.sh <command> [options]

Commands:
  kubeconfig              Configure kubectl for both regions
  outputs                 Show all Terraform outputs (endpoints, DNS, etc.)
  alb-dns-east            Show us-east-1 ALB DNS name
  alb-dns-west            Show us-west-2 ALB DNS name
  cluster-endpoint-east   Show us-east-1 EKS cluster endpoint
  cluster-endpoint-west   Show us-west-2 EKS cluster endpoint
  app-fqdn                Show Route53 FQDN for the app
  oidc-east               Show us-east-1 OIDC provider ARN
  oidc-west               Show us-west-2 OIDC provider ARN

Options:
  --profile PROFILE       AWS profile (default: \$AWS_PROFILE or 'default')
  --help                  Show this help message

Examples:
  ./utils.sh kubeconfig --profile=prod
  ./utils.sh outputs --profile=dev
  AWS_PROFILE=prod ./utils.sh alb-dns-east
EOF
  exit 1
}

log() {
  echo -e "${BLUE}→${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

get_tf_output() {
  local stack_path="$1"
  local output_key="$2"
  
  cd "$SCRIPT_DIR/$stack_path"
  AWS_PROFILE="$AWS_PROFILE" terraform output -raw "$output_key" 2>/dev/null || echo "N/A"
  cd "$SCRIPT_DIR"
}

cmd_kubeconfig() {
  log "Configuring kubectl for us-east-1..."
  aws eks update-kubeconfig \
    --profile "$AWS_PROFILE" \
    --name etithe-us-east-1 \
    --region us-east-1
  success "Configured kubeconfig for us-east-1"
  
  log "Configuring kubectl for us-west-2..."
  aws eks update-kubeconfig \
    --profile "$AWS_PROFILE" \
    --name etithe-us-west-2 \
    --region us-west-2
  success "Configured kubeconfig for us-west-2"
  
  echo -e "\n${GREEN}Next step:${NC} kubectl get nodes"
}

cmd_outputs() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}US-EAST-1 Outputs${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  alb_dns=$(get_tf_output "environments/us-east-1" "alb_dns_name")
  cluster_ep=$(get_tf_output "environments/us-east-1" "cluster_endpoint")
  cluster_name=$(get_tf_output "environments/us-east-1" "cluster_name")
  oidc=$(get_tf_output "environments/us-east-1" "oidc_provider_arn")
  
  echo "ALB DNS:               $alb_dns"
  echo "Cluster Name:          $cluster_name"
  echo "Cluster Endpoint:      $cluster_ep"
  echo "OIDC Provider ARN:     $oidc"
  
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}US-WEST-2 Outputs${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  alb_dns=$(get_tf_output "environments/us-west-2" "alb_dns_name")
  cluster_ep=$(get_tf_output "environments/us-west-2" "cluster_endpoint")
  cluster_name=$(get_tf_output "environments/us-west-2" "cluster_name")
  oidc=$(get_tf_output "environments/us-west-2" "oidc_provider_arn")
  
  echo "ALB DNS:               $alb_dns"
  echo "Cluster Name:          $cluster_name"
  echo "Cluster Endpoint:      $cluster_ep"
  echo "OIDC Provider ARN:     $oidc"
  
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Global (Route53) Outputs${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  app_fqdn=$(get_tf_output "environments/global" "app_fqdn")
  zone_id=$(get_tf_output "environments/global" "dns_zone_id")
  
  echo "App FQDN:              $app_fqdn"
  echo "Route53 Zone ID:       $zone_id"
  echo ""
}

# Parse arguments
[[ $# -eq 0 ]] && usage

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    --help)
      usage
      ;;
    kubeconfig)
      cmd_kubeconfig
      exit 0
      ;;
    outputs)
      cmd_outputs
      exit 0
      ;;
    alb-dns-east)
      get_tf_output "environments/us-east-1" "alb_dns_name"
      exit 0
      ;;
    alb-dns-west)
      get_tf_output "environments/us-west-2" "alb_dns_name"
      exit 0
      ;;
    cluster-endpoint-east)
      get_tf_output "environments/us-east-1" "cluster_endpoint"
      exit 0
      ;;
    cluster-endpoint-west)
      get_tf_output "environments/us-west-2" "cluster_endpoint"
      exit 0
      ;;
    app-fqdn)
      get_tf_output "environments/global" "app_fqdn"
      exit 0
      ;;
    oidc-east)
      get_tf_output "environments/us-east-1" "oidc_provider_arn"
      exit 0
      ;;
    oidc-west)
      get_tf_output "environments/us-west-2" "oidc_provider_arn"
      exit 0
      ;;
    *)
      echo "Unknown command: $1"
      usage
      ;;
  esac
done
