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

variable "node_group_asg_names" {
  description = "Auto Scaling Group names for the EKS managed node groups"
  type        = list(string)
}

variable "app_port" {
  description = "NodePort exposed by the Kubernetes service that receives ALB traffic"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "HTTP path used for ALB target group health checks"
  type        = string
  default     = "/api/health"
}

variable "enable_access_logs" {
  description = "Whether to enable ALB access logs to S3"
  type        = bool
  default     = true
}

variable "enable_alarms" {
  description = "Whether to create CloudWatch alarms for the ALB"
  type        = bool
  default     = true
}

variable "access_logs_prefix" {
  description = "Prefix for ALB access logs in S3"
  type        = string
  default     = "alb"
}

variable "access_logs_force_destroy" {
  description = "Whether to purge ALB access log bucket objects before bucket deletion"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
