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

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
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
  count = var.enable_compute ? 1 : 0
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
  count  = var.enable_compute && var.enable_loadbalancer ? 1 : 0
  source = "../../modules/loadbalancer"

  name                   = "${var.project_name}-${var.aws_region}"
  vpc_id                 = module.networking.vpc_id
  public_subnet_ids      = module.networking.public_subnet_ids
  node_security_group_id = module.compute[0].node_security_group_id
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
  value = var.enable_compute ? module.compute[0].cluster_name : null
}

output "cluster_endpoint" {
  value = var.enable_compute ? module.compute[0].cluster_endpoint : null
}

output "oidc_provider_arn" {
value = var.enable_compute ? module.compute[0].oidc_provider_arn : null
}

output "alb_dns_name" {
  value = var.enable_compute && var.enable_loadbalancer ? module.loadbalancer[0].alb_dns_name : null
}

output "alb_zone_id" {
value = var.enable_compute && var.enable_loadbalancer ? module.loadbalancer[0].alb_zone_id : null
}

output "target_group_arn" {
  value = var.enable_compute && var.enable_loadbalancer ? module.loadbalancer[0].target_group_arn : null
}
