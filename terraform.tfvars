use_localstack = true # flip to false when targeting real AWS
project_name   = "etithe"
environment    = "dev"
aws_region     = "us-east-1"

vpc_cidr             = "10.20.0.0/16"
public_subnet_cidrs  = ["10.20.1.0/24", "10.20.2.0/24"]
private_subnet_cidrs = ["10.20.11.0/24", "10.20.12.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]