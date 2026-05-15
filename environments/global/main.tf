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
  primary_alb_dns_name = var.use_remote_state ? data.terraform_remote_state.primary[0].outputs.alb_dns_name : var.primary_alb_dns_name
  primary_alb_zone_id  = var.use_remote_state ? data.terraform_remote_state.primary[0].outputs.alb_zone_id : var.primary_alb_zone_id

  secondary_alb_dns_name = var.use_remote_state ? data.terraform_remote_state.secondary[0].outputs.alb_dns_name : var.secondary_alb_dns_name
  secondary_alb_zone_id  = var.use_remote_state ? data.terraform_remote_state.secondary[0].outputs.alb_zone_id : var.secondary_alb_zone_id
}

provider "aws" {
  region = var.aws_region
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
