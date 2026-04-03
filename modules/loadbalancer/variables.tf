variable "name" {
  description = "Name prefix for load balancer resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID to create the ALB security group in"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs where the ALB will be placed"
  type        = list(string)
}

variable "node_security_group_id" {
  description = "Security group ID of the EKS worker nodes (ALB will be allowed to reach them)"
  type        = string
}

variable "app_port" {
  description = "Port the Next.js app listens on inside the cluster"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "HTTP path used for ALB target group health checks"
  type        = string
  default     = "/api/health"
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
