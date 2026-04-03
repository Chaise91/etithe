provider "aws" {
  region                      = var.aws_region
  access_key                  = local.localstack ? "mock_access_key" : null
  secret_key                  = local.localstack ? "mock_secret_key" : null
  skip_credentials_validation = local.localstack
  skip_requesting_account_id  = local.localstack
  skip_metadata_api_check     = local.localstack

  dynamic "endpoints" {
    for_each = local.localstack ? [1] : []
    content {
      s3         = local.aws_endpoints.s3
      ec2        = local.aws_endpoints.ec2
      iam        = local.aws_endpoints.iam
      route53    = local.aws_endpoints.route53
      elbv2      = local.aws_endpoints.elbv2
      eks        = local.aws_endpoints.eks
      cognitoidp = local.aws_endpoints.cognitoidp
      dynamodb   = local.aws_endpoints.dynamodb
      cloudwatch = local.aws_endpoints.cloudwatch
      logs       = local.aws_endpoints.logs
    }
  }
}

