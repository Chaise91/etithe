#!/usr/bin/env bash
set -euo pipefail

# Fast app iteration script: build once, push to ECR, roll out to both EKS clusters.
# Usage:
# ./deploy-app.sh --profile etithe
# ./deploy-app.sh --profile etithe --skip-secondary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

AWS_PROFILE="default"
AWS_REGION_PRIMARY="us-east-1"
AWS_REGION_SECONDARY="us-west-2"
CLUSTER_NAME_PRIMARY="etithe-us-east-1-cluster"
CLUSTER_NAME_SECONDARY="etithe-us-west-2-cluster"
ECR_REPOSITORY="etithe-app"
APP_NAMESPACE="etithe"
SKIP_SECONDARY="false"

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  --profile NAME         AWS profile (default: default)
  --ecr-repo NAME        ECR repository name (default: etithe-app)
  --skip-secondary       Deploy only to us-east-1
  --help                 Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    --ecr-repo)
      ECR_REPOSITORY="$2"
      shift 2
      ;;
    --skip-secondary)
      SKIP_SECONDARY="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Required command not found: $1" >&2; exit 1; }
}

require_cmd aws
require_cmd docker
require_cmd kubectl

AWS_ACCOUNT_ID="$(AWS_PROFILE="$AWS_PROFILE" aws sts get-caller-identity --query Account --output text)"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)-$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo dev)"
IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION_PRIMARY.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"

echo "Using profile: $AWS_PROFILE"
echo "Image: $IMAGE_URI"

echo "Ensuring ECR repository exists"
AWS_PROFILE="$AWS_PROFILE" aws ecr describe-repositories --region "$AWS_REGION_PRIMARY" --repository-names "$ECR_REPOSITORY" >/dev/null 2>&1 || \
AWS_PROFILE="$AWS_PROFILE" aws ecr create-repository --region "$AWS_REGION_PRIMARY" --repository-name "$ECR_REPOSITORY" --image-scanning-configuration scanOnPush=true >/dev/null

echo "Logging in to ECR"
AWS_PROFILE="$AWS_PROFILE" aws ecr get-login-password --region "$AWS_REGION_PRIMARY" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION_PRIMARY.amazonaws.com"

echo "Building and pushing image"
docker build -t "$IMAGE_URI" -f "$ROOT_DIR/etithe-app/Dockerfile" "$ROOT_DIR/etithe-app"
docker push "$IMAGE_URI"

deploy_cluster() {
  local region="$1"
  local cluster="$2"

  echo "Deploying to $cluster ($region)"
  AWS_PROFILE="$AWS_PROFILE" aws eks update-kubeconfig --name "$cluster" --region "$region" >/dev/null

  kubectl apply -f "$ROOT_DIR/etithe-app/k8s/base/namespace.yaml"
  kubectl apply -f "$ROOT_DIR/etithe-app/k8s/base/service.yaml"
  sed "s|PLACEHOLDER_IMAGE|$IMAGE_URI|g" "$ROOT_DIR/etithe-app/k8s/base/deployment.yaml" | kubectl apply -f -
  kubectl -n "$APP_NAMESPACE" rollout status deployment/etithe-app --timeout=300s
}

deploy_cluster "$AWS_REGION_PRIMARY" "$CLUSTER_NAME_PRIMARY"

if [[ "$SKIP_SECONDARY" != "true" ]]; then
  deploy_cluster "$AWS_REGION_SECONDARY" "$CLUSTER_NAME_SECONDARY"
fi

echo "Done."
echo "Rolled out image: $IMAGE_URI"
