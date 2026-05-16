variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "allowed_cidr_blocks" {
  type = list(string)
}

variable "engine_version" {
  type    = string
  default = "17.6"
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "db_name" {
  type    = string
  default = "etithe"
}

variable "master_username" {
  type    = string
  default = "etithe_admin"
}

variable "backup_retention_period" {
  type    = number
  default = 1
}

variable "tags" {
  type    = map(string)
  default = {}
}