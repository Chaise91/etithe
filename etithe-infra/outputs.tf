output "vpc_id" {
  description = "VPC ID from networking module"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs from networking module"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs from networking module"
  value       = module.networking.private_subnet_ids
}
