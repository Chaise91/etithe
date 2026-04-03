terraform {
  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }
}

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
      elbv2      = local.aws_endpoints.elbv2
      eks        = local.aws_endpoints.eks
      route53    = local.aws_endpoints.route53
      cognitoidp = local.aws_endpoints.cognitoidp
      dynamodb   = local.aws_endpoints.dynamodb
      cloudwatch = local.aws_endpoints.cloudwatch
      logs       = local.aws_endpoints.logs
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  name                 = "${var.project_name}-${var.aws_region}"
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Region      = var.aws_region
    ManagedBy   = "terraform"
  }
}

module "compute" {
  source = "../../modules/compute"

  name               = "${var.project_name}-${var.aws_region}"
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  kubernetes_version = var.kubernetes_version
  node_instance_type = var.node_instance_type
  node_desired       = var.node_desired
  node_min           = var.node_min
  node_max           = var.node_max

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Region      = var.aws_region
    ManagedBy   = "terraform"
  }
}

module "loadbalancer" {
  source = "../../modules/loadbalancer"

  name                   = "${var.project_name}-${var.aws_region}"
  vpc_id                 = module.networking.vpc_id
  public_subnet_ids      = module.networking.public_subnet_ids
  node_security_group_id = module.compute.node_security_group_id
  app_port               = var.app_port
  health_check_path      = var.health_check_path

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Region      = var.aws_region
    ManagedBy   = "terraform"
  }
}

output "vpc_id" {
  value = module.networking.vpc_id
}

output "cluster_name" {
  value = module.compute.cluster_name
}

output "cluster_endpoint" {
  value = module.compute.cluster_endpoint
}

output "oidc_provider_arn" {
  value = module.compute.oidc_provider_arn
}

output "alb_dns_name" {
  value = module.loadbalancer.alb_dns_name
}

output "alb_zone_id" {
  value = module.loadbalancer.alb_zone_id
}

output "target_group_arn" {
  value = module.loadbalancer.target_group_arn
}
