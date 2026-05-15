#!/usr/bin/env bash
set -euo pipefail

# Creates a least-privilege deployer role + managed policy for eTithe Terraform deployments.
# Example:
# ./iam/create-etithe-deployer-role.sh \
#   --profile etithe \
#   --principal-arn arn:aws:iam::123456789012:user/chaise

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PROFILE=""
PRINCIPAL_ARN=""
ROLE_NAME="etithe-infra-deployer-role"
POLICY_NAME="etithe-infra-deployer-policy"

usage() {
  cat <<EOF
Usage: $0 --profile PROFILE --principal-arn ARN [--role-name NAME] [--policy-name NAME]

Required:
  --profile        AWS CLI profile to run IAM creation against (e.g. etithe)
  --principal-arn  IAM principal allowed to assume role (user or role ARN)

Optional:
  --role-name      IAM role name (default: etithe-infra-deployer-role)
  --policy-name    IAM managed policy name (default: etithe-infra-deployer-policy)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --principal-arn)
      PRINCIPAL_ARN="$2"
      shift 2
      ;;
    --role-name)
      ROLE_NAME="$2"
      shift 2
      ;;
    --policy-name)
      POLICY_NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROFILE" || -z "$PRINCIPAL_ARN" ]]; then
  usage
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found" >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)"
TRUST_POLICY_FILE="$(mktemp)"
trap 'rm -f "$TRUST_POLICY_FILE"' EXIT

cat > "$TRUST_POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeFromPrincipal",
      "Effect": "Allow",
      "Principal": {
        "AWS": "$PRINCIPAL_ARN"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

POLICY_DOC="file://$SCRIPT_DIR/etithe-deployer-policy.json"

echo "Creating or updating managed policy: $POLICY_NAME"
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

if aws iam get-policy --profile "$PROFILE" --policy-arn "$POLICY_ARN" >/dev/null 2>&1; then
  VERSION_ID="v$(date +%s)"
  aws iam create-policy-version \
    --profile "$PROFILE" \
    --policy-arn "$POLICY_ARN" \
    --policy-document "$POLICY_DOC" \
    --set-as-default >/dev/null

  # Keep policy versions below IAM limit (5 versions)
  OLD_VERSIONS="$(aws iam list-policy-versions --profile "$PROFILE" --policy-arn "$POLICY_ARN" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)"
  COUNT="$(wc -w <<< "$OLD_VERSIONS" | xargs)"
  if [[ "$COUNT" -gt 4 ]]; then
    for VERSION in $OLD_VERSIONS; do
      aws iam delete-policy-version --profile "$PROFILE" --policy-arn "$POLICY_ARN" --version-id "$VERSION" || true
    done
  fi
else
  aws iam create-policy \
    --profile "$PROFILE" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC" >/dev/null
fi

echo "Creating or updating role: $ROLE_NAME"
if aws iam get-role --profile "$PROFILE" --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam update-assume-role-policy \
    --profile "$PROFILE" \
    --role-name "$ROLE_NAME" \
    --policy-document "file://$TRUST_POLICY_FILE" >/dev/null
else
  aws iam create-role \
    --profile "$PROFILE" \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "file://$TRUST_POLICY_FILE" \
    --description "Least-privilege role for eTithe Terraform deployments" >/dev/null
fi

echo "Attaching policy to role"
aws iam attach-role-policy \
  --profile "$PROFILE" \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN" >/dev/null

ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

cat <<EOF

Done.
Role ARN: $ROLE_ARN
Policy ARN: $POLICY_ARN

Add this profile to ~/.aws/config (replace source_profile as needed):

[profile etithe-deployer]
role_arn = $ROLE_ARN
source_profile = $PROFILE
region = us-east-1

Then use:
AWS_PROFILE=etithe-deployer terraform plan
EOF
