variable "name" {
  description = "Name prefix for compute resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID from the networking module"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs (used for EKS vpc_config)"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs (node group runs here)"
  type        = list(string)
}

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.35"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "node_desired" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "node_max" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 4
}

variable "cluster_log_types" {
  description = "EKS control plane log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "enable_ci_deployer_access" {
  description = "Whether to grant cluster admin access to the CI deployer IAM role"
  type        = bool
  default     = true
}

variable "ci_deployer_role_name" {
  description = "IAM role name used by CI/CD to deploy to the cluster"
  type        = string
  default     = "etithe-infra-deployer-role"
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
