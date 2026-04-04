variable "zone_name" {
  description = "DNS zone name to create in Route53"
  type        = string
}

variable "record_name" {
  description = "Subdomain to use for the application record"
  type        = string
}

variable "health_check_path" {
  description = "Path used by Route53 health checks"
  type        = string
  default     = "/api/health"
}

variable "primary_alb_dns_name" {
  description = "DNS name of the primary region ALB"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Route53 hosted zone ID of the primary region ALB"
  type        = string
}

variable "secondary_alb_dns_name" {
  description = "DNS name of the secondary region ALB"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Route53 hosted zone ID of the secondary region ALB"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
