output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_ca_cert" {
  description = "Base64-encoded cluster CA certificate"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "node_group_arn" {
  description = "ARN of the managed node group"
  value       = aws_eks_node_group.this.arn
}

output "node_group_asg_names" {
  description = "Auto Scaling Group names backing the managed node group"
  value       = [for group in aws_eks_node_group.this.resources[0].autoscaling_groups : group.name]
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider (for IRSA)"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "URL of the OIDC provider (for IRSA)"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS control plane"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_primary_security_group_id" {
  description = "EKS-managed primary security group attached to cluster resources and worker nodes"
  value       = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group ID attached to worker nodes"
  value       = aws_security_group.eks_nodes.id
}
