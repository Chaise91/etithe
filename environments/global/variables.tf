variable "use_localstack" {
  description = "Whether to use LocalStack for Route53 API endpoints"
  type        = bool
  default     = true
}

variable "use_remote_state" {
  description = "Whether to read ALB outputs from the regional Terraform states"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for provider initialization"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tags"
  type        = string
  default     = "etithe"
}

variable "environment" {
  description = "Environment name used for tags"
  type        = string
  default     = "dev"
}

variable "zone_name" {
  description = "Hosted zone name to create for the app"
  type        = string
  default     = "etithe.local"
}

variable "record_name" {
  description = "App subdomain within the hosted zone"
  type        = string
  default     = "app"
}

variable "health_check_path" {
  description = "Path Route53 uses for health checks"
  type        = string
  default     = "/api/health"
}

variable "primary_state_path" {
  description = "Path to the primary region Terraform state file"
  type        = string
  default     = "../us-east-1/terraform.tfstate"
}

variable "secondary_state_path" {
  description = "Path to the secondary region Terraform state file"
  type        = string
  default     = "../us-west-2/terraform.tfstate"
}

variable "primary_alb_dns_name" {
  description = "Primary region ALB DNS name when not using remote state"
  type        = string
  default     = ""

  validation {
    condition     = var.use_remote_state || length(var.primary_alb_dns_name) > 0
    error_message = "Set primary_alb_dns_name or enable use_remote_state after the regional stack has been applied."
  }
}

variable "primary_alb_zone_id" {
  description = "Primary region ALB hosted zone ID when not using remote state"
  type        = string
  default     = ""

  validation {
    condition     = var.use_remote_state || length(var.primary_alb_zone_id) > 0
    error_message = "Set primary_alb_zone_id or enable use_remote_state after the regional stack has been applied."
  }
}

variable "secondary_alb_dns_name" {
  description = "Secondary region ALB DNS name when not using remote state"
  type        = string
  default     = ""

  validation {
    condition     = var.use_remote_state || length(var.secondary_alb_dns_name) > 0
    error_message = "Set secondary_alb_dns_name or enable use_remote_state after the regional stack has been applied."
  }
}

variable "secondary_alb_zone_id" {
  description = "Secondary region ALB hosted zone ID when not using remote state"
  type        = string
  default     = ""

  validation {
    condition     = var.use_remote_state || length(var.secondary_alb_zone_id) > 0
    error_message = "Set secondary_alb_zone_id or enable use_remote_state after the regional stack has been applied."
  }
}
