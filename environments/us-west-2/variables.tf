variable "project_name" {
  type    = string
  default = "etithe"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "vpc_cidr" {
  type    = string
  default = "10.30.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.30.1.0/24", "10.30.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.30.11.0/24", "10.30.12.0/24"]
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-west-2a", "us-west-2b"]
}

variable "kubernetes_version" {
  type    = string
  default = "1.32"
}

variable "node_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "node_desired" {
  type    = number
  default = 2
}

variable "node_min" {
  type    = number
  default = 1
}

variable "node_max" {
  type    = number
  default = 4
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "health_check_path" {
  type    = string
  default = "/api/health"
}

variable "enable_compute" {
  type    = bool
  default = true
}

variable "enable_loadbalancer" {
  type    = bool
  default = true
}