# locals.tf
locals {
  localstack = var.use_localstack

  aws_endpoints = local.localstack ? {
    s3         = "http://localhost:4566"
    ec2        = "http://localhost:4566"
    iam        = "http://localhost:4566"
    elbv2      = "http://localhost:4566"
    eks        = "http://localhost:4566"
    route53    = "http://localhost:4566"
    cognitoidp = "http://localhost:4566"
    dynamodb   = "http://localhost:4566"
    cloudwatch = "http://localhost:4566"
    logs       = "http://localhost:4566"
  } : {}
}