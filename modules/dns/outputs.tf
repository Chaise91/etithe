output "zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.this.zone_id
}

output "name_servers" {
  description = "Route53 name servers for the hosted zone"
  value       = aws_route53_zone.this.name_servers
}

output "record_fqdn" {
  description = "Fully qualified DNS name of the failover record"
  value       = local.fqdn
}

output "primary_health_check_id" {
  description = "Health check ID for the primary region"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "Health check ID for the secondary region"
  value       = aws_route53_health_check.secondary.id
}
