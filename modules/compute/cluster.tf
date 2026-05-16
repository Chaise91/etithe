# ── IAM: cluster role ────────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}

locals {
  ci_deployer_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.ci_deployer_role_name}"
}

resource "aws_iam_role" "eks_cluster" {
  name = "${var.name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, { Name = "${var.name}-eks-cluster-role" })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ── IAM: node group role ──────────────────────────────────────────────────────

resource "aws_iam_role" "eks_node_group" {
  name = "${var.name}-eks-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, { Name = "${var.name}-eks-node-group-role" })
}

resource "aws_iam_role_policy_attachment" "eks_node_worker_policy" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_node_ecr_policy" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "eks_node_cni_policy" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

# ── Security groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "eks_cluster" {
  name        = "${var.name}-eks-cluster-sg"
  description = "EKS control plane security group"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, { Name = "${var.name}-eks-cluster-sg" })
}

resource "aws_security_group" "eks_nodes" {
  name        = "${var.name}-eks-nodes-sg"
  description = "EKS worker node security group"
  vpc_id      = var.vpc_id

  lifecycle {
    # Allow other modules (like load balancer) to manage additional ingress rules.
    ignore_changes = [ingress]
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Allow intra-node traffic"
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
    description     = "Allow control plane to reach nodes"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, { Name = "${var.name}-eks-nodes-sg" })
}

# ── EKS cluster ───────────────────────────────────────────────────────────────

resource "aws_eks_cluster" "this" {
  name     = "${var.name}-cluster"
  version  = var.kubernetes_version
  role_arn = aws_iam_role.eks_cluster.arn

  enabled_cluster_log_types = var.cluster_log_types

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    subnet_ids              = concat(var.public_subnet_ids, var.private_subnet_ids)
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]

  tags = merge(var.tags, { Name = "${var.name}-cluster" })
}

# ── OIDC provider (enables IRSA) ──────────────────────────────────────────────

data "tls_certificate" "eks" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer

  tags = merge(var.tags, { Name = "${var.name}-oidc-provider" })
}

# ── Managed node group ────────────────────────────────────────────────────────

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.name}-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = [var.node_instance_type]

  scaling_config {
    desired_size = var.node_desired
    min_size     = var.node_min
    max_size     = var.node_max
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_worker_policy,
    aws_iam_role_policy_attachment.eks_node_ecr_policy,
    aws_iam_role_policy_attachment.eks_node_cni_policy,
  ]

  tags = merge(var.tags, { Name = "${var.name}-nodes" })
}

resource "aws_eks_access_entry" "ci_deployer" {
  count         = var.enable_ci_deployer_access ? 1 : 0
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = local.ci_deployer_role_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "ci_deployer_admin" {
  count         = var.enable_ci_deployer_access ? 1 : 0
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = local.ci_deployer_role_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.ci_deployer]
}