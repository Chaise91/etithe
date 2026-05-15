# eTithe Infrastructure Deployment Scripts

One-command orchestration for multi-region EKS deployment with AWS profile support.

## Files Overview

### 📜 Main Deployment Script
**[deploy.sh](./deploy.sh)** — Full infrastructure orchestration
- Checks prerequisites (Terraform, AWS CLI, credentials)
- Initializes all Terraform stacks in correct order
- Plans multi-stack changes and shows summaries
- Applies with confirmation prompts and cost warnings
- Supports `--profile=PROFILE_NAME` for different AWS accounts

**Usage:**
```bash
./deploy.sh plan --profile=prod          # Plan only
./deploy.sh apply --profile=prod         # Plan + Apply with confirmation
./deploy.sh plan                         # Uses default AWS profile
```

### 🛠️ Utilities Script
**[utils.sh](./utils.sh)** — Quick post-deployment commands
- Configure kubectl for both regions
- Retrieve outputs (ALB DNS, cluster endpoints, OIDC ARN, Route53 FQDN)
- Individual lookups for scripting/automation

**Usage:**
```bash
./utils.sh kubeconfig --profile=prod     # Update kubeconfig
./utils.sh outputs                       # Show all endpoints
./utils.sh alb-dns-east                  # Get us-east-1 ALB
AWS_PROFILE=prod ./utils.sh app-fqdn     # Get Route53 FQDN
```

### 📖 Deployment Guide
**[DEPLOY.md](./DEPLOY.md)** — Comprehensive documentation
- Prerequisites and setup steps
- Deployment workflow explanation
- Post-deployment configuration (kubectl, kubeconfig, EKS access)
- Troubleshooting common issues
- Cost estimates
- Cleanup instructions
- Security best practices

---

## Quick Start

### 1. Set Up AWS Profile
```bash
aws configure --profile=my-profile
# Enter: Access Key, Secret Key, Region, Output format
```

### 2. Plan Infrastructure
```bash
cd etithe-infra
./deploy.sh plan --profile=my-profile
```

Review the plan output. Check:
- ✓ Correct regions (us-east-1, us-west-2)
- ✓ VPC CIDR ranges don't conflict
- ✓ Resource counts (1 cluster per region, etc.)

### 3. Apply Infrastructure
```bash
./deploy.sh apply --profile=my-profile
```

Wait for all stacks to apply (usually 15–20 minutes for EKS clusters).

### 4. Configure kubectl
```bash
./utils.sh kubeconfig --profile=my-profile
kubectl get nodes  # Verify cluster access
```

### 5. Get Access Details
```bash
./utils.sh outputs  # Show all endpoints and DNS names
```

---

## Deployment Flow

```
┌─────────────────────────────────────┐
│ 1. Check Prerequisites              │
│    - Terraform, AWS CLI, creds      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Initialize All Stacks            │
│    - us-east-1                      │
│    - us-west-2                      │
│    - global                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Plan Infrastructure Changes      │
│    (3 separate plans)               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Ask for Confirmation             │
│    (Cost warning, approve/reject)   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Apply in Sequence                │
│    us-east-1 → us-west-2 → global   │
│                                     │
│ Each region gets:                   │
│  • VPC + subnets                    │
│  • EKS cluster                      │
│  • ALB + target groups              │
│                                     │
│ Global gets:                        │
│  • Route53 zone                     │
│  • Failover routing                 │
│  • Health checks                    │
└─────────────────────────────────────┘
```

---

## Key Features

### ✅ Multi-Stack Orchestration
- Handles 3 independent Terraform stacks in correct dependency order
- Each stack tracked separately (no cross-stack contamination)
- Regional ALB outputs automatically feed into global DNS stack

### ✅ AWS Profile Support
```bash
./deploy.sh apply --profile=prod
./deploy.sh apply --profile=staging
./deploy.sh apply --profile=dev
```

### ✅ Safety Checks
- Verifies prerequisites before starting
- Shows deployment summary with costs
- Asks for confirmation with cost warning
- All Terraform commands include `-lock=false` to avoid state locks

### ✅ Clear Logging
- Color-coded output (blue headers, green success, yellow warnings, red errors)
- Status indicators (✓, ✗, ℹ, ⚠)
- Progress tracking through each stage

---

## Stack Details

### us-east-1 (Primary Region)
Creates:
- VPC: `10.20.0.0/16`
- Public subnets: `10.20.1.0/24`, `10.20.2.0/24`
- Private subnets: `10.20.11.0/24`, `10.20.12.0/24`
- EKS cluster (Kubernetes 1.32)
- 2x t3.medium nodes (auto-scaling 1–4)
- Application Load Balancer

**Outputs:**
- `cluster_name` → `etithe-us-east-1`
- `cluster_endpoint` → EKS API endpoint
- `alb_dns_name` → `xxx.elb.us-east-1.amazonaws.com`
- `oidc_provider_arn` → For IRSA (IAM roles for pods)

### us-west-2 (Secondary Region)
Creates:
- VPC: `10.30.0.0/16`
- Public subnets: `10.30.1.0/24`, `10.30.2.0/24`
- Private subnets: `10.30.11.0/24`, `10.30.12.0/24`
- EKS cluster (Kubernetes 1.32)
- 2x t3.medium nodes (auto-scaling 1–4)
- Application Load Balancer

**Outputs:**
- `cluster_name` → `etithe-us-west-2`
- `cluster_endpoint` → EKS API endpoint
- `alb_dns_name` → `xxx.elb.us-west-2.amazonaws.com`
- `oidc_provider_arn` → For IRSA

### global (Route53 DNS)
Creates:
- Route53 hosted zone: `etithe-dev.test`
- A record with failover: `app.etithe-dev.test`
- Health checks pointing to both ALBs
- Primary: us-east-1 ALB
- Secondary: us-west-2 ALB (if primary fails)

**Outputs:**
- `app_fqdn` → `app.etithe-dev.test`
- `dns_zone_id` → Route53 zone ID

---

## Cost Breakdown (Monthly, Dev)

| Component | us-east-1 | us-west-2 | Total |
|-----------|-----------|-----------|-------|
| EKS Control Plane (per hour) | $73 | $73 | $146 |
| EC2 (2× t3.medium, on-demand) | ~$30 | ~$30 | ~$60 |
| ALB | ~$20 | ~$20 | ~$40 |
| Data transfer | — | — | ~$5 |
| **Total Monthly** | | | **~$250** |

To reduce:
- Use `t3.small` instead of `t3.medium` (save ~$10/region)
- Disable us-west-2 (save ~$170; modify `enable_compute = false`)
- Use spot instances (save ~50% on EC2; not yet configured)

---

## Troubleshooting

### ❌ "terraform not found"
```bash
# macOS
brew install terraform

# Linux (Ubuntu/Debian)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### ❌ "AWS profile 'prod' not configured"
```bash
aws configure --profile=prod
# Enter credentials and region
```

### ❌ "AWS credentials valid" fails
```bash
# If using temporary credentials (SSO)
aws sso login --profile=prod

# If using key-based auth
aws configure --profile=prod  # Re-enter keys
```

### ❌ Plan shows destroy for resources that should exist
```bash
# Refresh state and compare with actual AWS resources
cd environments/us-east-1
AWS_PROFILE=prod terraform refresh
cd ../../
```

### ❌ Global stack fails to find ALB outputs
Global stack reads from regional `.tfstate` files. Ensure:
1. Both regional stacks applied successfully
2. State files exist: `environments/us-east-1/terraform.tfstate`
3. Run `terraform refresh` in each region

---

## After Deployment

### Deploy Your App to Kubernetes
```bash
# Create Kubernetes manifests for eTithe Next.js app
# Example: k8s/deployment.yaml

kubectl apply -f k8s/

# Verify
kubectl get pods
kubectl get services
```

### Access Your App
```bash
# Via ALB (direct)
curl http://alb-dns-name:3000

# Via Route53 (with failover)
curl http://app.etithe-dev.test:3000
```

### Monitor Clusters
```bash
# View nodes
kubectl get nodes -o wide

# View pods
kubectl get pods --all-namespaces

# View events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# View logs
kubectl logs -f deployment/etithe-app --namespace=default
```

### Set Up Container Insights (Observability)
See [DEPLOY.md](./DEPLOY.md) for CloudWatch integration steps.

---

## Cleanup

**⚠️ This will delete all resources and stop all charges.**

```bash
# Destroy in reverse order (global first, then regions)
cd environments/global && AWS_PROFILE=prod terraform destroy -auto-approve
cd ../us-west-2 && AWS_PROFILE=prod terraform destroy -auto-approve
cd ../us-east-1 && AWS_PROFILE=prod terraform destroy -auto-approve
```

Charges stop immediately after deletion completes.

---

## Next Steps for Learning

1. **Review Terraform Code**
   - Read `environments/us-east-1/main.tf` to see VPC + EKS setup
   - Explore `modules/compute/` to understand EKS configuration
   - Check `modules/networking/` for VPC design

2. **Explore EKS Cluster**
   - `kubectl get nodes` — see worker nodes
   - `kubectl get pods -A` — see system pods
   - `kubectl describe node` — node details

3. **Deploy the App**
   - Create Kubernetes manifests (Deployment, Service, ConfigMap, Secret)
   - Deploy Next.js app to both regions
   - Verify health checks and failover

4. **Add Observability**
   - Enable CloudWatch Container Insights
   - Set up Prometheus + Grafana
   - Configure alerts for pod failures

5. **Optimize Costs**
   - Use spot instances for worker nodes
   - Implement pod autoscaling (HPA)
   - Review network costs (data transfer charges)

---

## 📖 K8s Concept: Multi-Region Failover

The deployment creates a **multi-region active-active architecture**:

1. **Regional Stacks (us-east-1 + us-west-2)**: Each has its own EKS cluster, VPC, and ALB. These are *independent* Kubernetes clusters that don't know about each other.

2. **Global DNS (Route53)**: Health checks monitor both ALBs. If us-east-1 fails, Route53 automatically routes traffic to us-west-2. This is **failover at the DNS level**, not Kubernetes replication.

3. **Why separate clusters?**: Each region has its own control plane (Kubernetes API), so failure in one region doesn't affect the other. Your app must be deployed to both clusters separately (either via GitOps or manual deployment to each).

4. **Terraform State**: Each stack has its own `.tfstate` file. The global stack reads outputs from regional states to configure Route53—this creates a **declarative dependency chain** that Terraform respects.

This design prioritizes **resilience** (failure of one region doesn't take down the other) and **cost visibility** (separate billing per region).

---

For detailed documentation, see [DEPLOY.md](./DEPLOY.md).
