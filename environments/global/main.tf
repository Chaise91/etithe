terraform {
  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }
}

locals {
  localstack = var.use_localstack

  aws_endpoints = local.localstack ? {
    route53 = "http://localhost:4566"
  } : {}

  primary_alb_dns_name = var.use_remote_state ? data.terraform_remote_state.primary[0].outputs.alb_dns_name : var.primary_alb_dns_name
  primary_alb_zone_id  = var.use_remote_state ? data.terraform_remote_state.primary[0].outputs.alb_zone_id : var.primary_alb_zone_id

  secondary_alb_dns_name = var.use_remote_state ? data.terraform_remote_state.secondary[0].outputs.alb_dns_name : var.secondary_alb_dns_name
  secondary_alb_zone_id  = var.use_remote_state ? data.terraform_remote_state.secondary[0].outputs.alb_zone_id : var.secondary_alb_zone_id
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
      route53 = local.aws_endpoints.route53
    }
  }
}

data "terraform_remote_state" "primary" {
  count   = var.use_remote_state ? 1 : 0
  backend = "local"

  config = {
    path = var.primary_state_path
  }
}

data "terraform_remote_state" "secondary" {
  count   = var.use_remote_state ? 1 : 0
  backend = "local"

  config = {
    path = var.secondary_state_path
  }
}

module "dns" {
  source = "../../modules/dns"

  zone_name         = var.zone_name
  record_name       = var.record_name
  health_check_path = var.health_check_path

  primary_alb_dns_name = local.primary_alb_dns_name
  primary_alb_zone_id  = local.primary_alb_zone_id

  secondary_alb_dns_name = local.secondary_alb_dns_name
  secondary_alb_zone_id  = local.secondary_alb_zone_id

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Scope       = "global"
  }
}

output "dns_zone_id" {
  value = module.dns.zone_id
}

output "dns_name_servers" {
  value = module.dns.name_servers
}

output "app_fqdn" {
  value = module.dns.record_fqdn
}

output "primary_health_check_id" {
  value = module.dns.primary_health_check_id
}

output "secondary_health_check_id" {
  value = module.dns.secondary_health_check_id
}
