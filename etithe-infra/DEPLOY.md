# eTithe Infrastructure Deployment Guide

One-command orchestration for multi-region EKS deployment with AWS profile support.

## Quick Start

### Prerequisites
- Terraform ≥ 6.0
- AWS CLI v2
- AWS account with appropriate permissions (IAM, EC2, EKS, Route53)
- AWS credentials configured: `aws configure --profile <YOUR_PROFILE>`

### Deploy Infrastructure (Plan Only)
```bash
./deploy.sh plan --profile=my-profile
```

This will:
1. ✓ Verify prerequisites (Terraform, AWS CLI, credentials)
2. ✓ Initialize all Terraform stacks
3. ✓ Generate and display plans for all regions
4. **Stop** — review and approve before applying

### Deploy Infrastructure (Apply)
```bash
./deploy.sh apply --profile=my-profile
```

This will:
1. Run all steps from plan mode
2. Show the deployment flow (us-east-1 → us-west-2 → global)
3. Ask for confirmation with cost warning
4. Apply infrastructure in sequence

## Deployment Architecture

### Stack Execution Order
1. **us-east-1** (primary region)
   - VPC with public/private subnets
   - EKS cluster (Kubernetes)
   - Application Load Balancer
   - Outputs: ALB DNS, cluster endpoint, OIDC provider ARN

2. **us-west-2** (secondary region)
   - VPC with public/private subnets (different CIDR)
   - EKS cluster (Kubernetes)
   - Application Load Balancer
   - Outputs: ALB DNS, cluster endpoint, OIDC provider ARN

3. **global** (Route53 DNS)
   - Reads ALB outputs from both regional states
   - Creates Route53 hosted zone
   - Configures failover routing (health checks)
   - Points to your primary ALB by default

### Why This Order?
- **Regional stacks first**: Each creates independent infrastructure (VPCs don't overlap)
- **Global stack last**: Depends on ALB outputs from regional stacks
- **Independent parallelization**: Could be run in parallel but sequentially is safer

## Usage Examples

### Plan for review (no changes)
```bash
./deploy.sh plan --profile=prod
```

### Plan with different profile
```bash
./deploy.sh plan --profile=dev
```

### Apply with confirmation
```bash
./deploy.sh apply --profile=prod
```

### Use default AWS profile
```bash
./deploy.sh plan  # Uses "default" profile
./deploy.sh apply  # Uses "default" profile
```

## Post-Deployment Configuration

### 1. Get Cluster Credentials
```bash
aws eks update-kubeconfig \
  --profile=my-profile \
  --name=etithe-us-east-1 \
  --region=us-east-1

aws eks update-kubeconfig \
  --profile=my-profile \
  --name=etithe-us-west-2 \
  --region=us-west-2
```

### 2. Verify Cluster Access
```bash
kubectl get nodes
kubectl get pods -A
```

### 3. Get ALB DNS Names
```bash
cd environments/us-east-1
AWS_PROFILE=my-profile terraform output alb_dns_name

cd ../us-west-2
AWS_PROFILE=my-profile terraform output alb_dns_name
```

### 4. Get App FQDN (Route53)
```bash
cd environments/global
AWS_PROFILE=my-profile terraform output app_fqdn
```

### 5. Deploy the eTithe Next.js App
Create Kubernetes manifests (Deployment, Service, ConfigMap, Secret):
```bash
# Example directory structure
k8s/
├── deployment.yaml
├── service.yaml
├── configmap.yaml
└── secret.yaml

# Deploy
kubectl apply -f k8s/
```

### 6. Access Your App
```
https://app.etithe-dev.test  # via Route53 FQDN
```

## Troubleshooting

### "AWS profile not configured"
```bash
aws configure --profile=my-profile
# Enter: Access Key ID, Secret Access Key, Default region, Output format
```

### "terraform not found"
```bash
# macOS (brew)
brew install terraform

# Linux (manual)
# Download from https://www.terraform.io/downloads.html
```

### "AWS credentials expired"
```bash
# Refresh temporary credentials (if using SSO)
aws sso login --profile=my-profile

# Or update credentials
aws configure --profile=my-profile
```

### Terraform plan shows destroy operations
This usually means:
1. State file mismatch (delete `.terraform/` and re-init)
2. Variables changed (review terraform.tfvars in each environment)
3. Manual changes in AWS console (use Terraform to manage instead)

**Solution:**
```bash
cd environments/us-east-1
AWS_PROFILE=my-profile terraform refresh
cd ../../
```

### ALB not appearing in global stack
The global stack reads ALB outputs from regional `.tfstate` files. Ensure:
1. Both regional stacks applied successfully
2. State files exist: `environments/us-east-1/terraform.tfstate` and `environments/us-west-2/terraform.tfstate`
3. Regional state contains ALB outputs (check with `terraform output`)

## Cleanup / Destroy

**⚠️ Destructive Operation**

To remove all infrastructure (optional, not yet in script):
```bash
# Destroy in reverse order (global first, then regions)
cd environments/global && AWS_PROFILE=my-profile terraform destroy
cd ../us-west-2 && AWS_PROFILE=my-profile terraform destroy
cd ../us-east-1 && AWS_PROFILE=my-profile terraform destroy
```

This will delete:
- EKS clusters
- VPCs and subnets
- Load balancers
- All associated resources

Charges will stop immediately after deletion completes.

## Cost Estimates (Dev Environment)

| Component | us-east-1 | us-west-2 | Monthly |
|-----------|-----------|-----------|---------|
| EKS Control Plane | $73 | $73 | $146 |
| EC2 (t3.medium, 2 nodes ea) | $30 | $30 | $60 |
| ALB | $20 | $20 | $40 |
| Data transfer (minimal) | ~ | ~ | $5 |
| **Total** | | | **~$250** |

To reduce costs:
- Use single `t3.small` nodes (`node_instance_type` in `terraform.tfvars`)
- Disable us-west-2 by setting `enable_compute = false` in `environments/us-west-2/terraform.tfvars`
- Use spot instances (not yet configured)

## Advanced: Manual Stack Management

If you need to manage individual stacks:

```bash
# Just us-east-1
cd environments/us-east-1
AWS_PROFILE=my-profile terraform init
AWS_PROFILE=my-profile terraform plan
AWS_PROFILE=my-profile terraform apply

# Just global (DNS)
cd ../global
AWS_PROFILE=my-profile terraform init
AWS_PROFILE=my-profile terraform plan -var use_remote_state=true
AWS_PROFILE=my-profile terraform apply
```

## Support & Learning

- **Terraform Docs**: https://www.terraform.io/docs
- **EKS Workshop**: https://www.eksworkshop.com
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/latest/userguide/

## Security Notes

- **Secrets**: Store passwords/tokens in AWS Secrets Manager, not in `.tfvars` or environment variables
- **State files**: Terraform state contains sensitive data—commit `.gitignore` rules
- **Credentials**: Never hardcode AWS keys; use IAM roles or named profiles
- **Network**: EKS nodes are in private subnets; access via ALB or bastion host
