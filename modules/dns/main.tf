locals {
  fqdn = "${var.record_name}.${var.zone_name}"
}

resource "aws_route53_zone" "this" {
  name = var.zone_name

  tags = merge(var.tags, {
    Name = var.zone_name
  })
}

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_alb_dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  request_interval  = 30
  failure_threshold = 3

  tags = merge(var.tags, {
    Name = "${local.fqdn}-primary-health"
  })
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = var.secondary_alb_dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  request_interval  = 30
  failure_threshold = 3

  tags = merge(var.tags, {
    Name = "${local.fqdn}-secondary-health"
  })
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.this.zone_id
  name    = local.fqdn
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = var.primary_alb_dns_name
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.this.zone_id
  name    = local.fqdn
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = var.secondary_alb_dns_name
    zone_id                = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
}
