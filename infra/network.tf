# VPC: EC2 は public subnet、RDS は private subnet（インターネットへの経路なし）に置く。
# NAT Gateway は有料なので作らない。

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  az_primary   = data.aws_availability_zones.available.names[0]
  az_secondary = data.aws_availability_zones.available.names[1]
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project}-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = local.az_primary
  map_public_ip_on_launch = true

  tags = { Name = "${var.project}-public" }
}

# RDS のサブネットグループは 2 つ以上の AZ が必要なので 2 つ作る（DB 自体は 1 台だけ）
resource "aws_subnet" "private" {
  for_each = {
    primary   = { cidr = "10.0.11.0/24", az = local.az_primary }
    secondary = { cidr = "10.0.12.0/24", az = local.az_secondary }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = { Name = "${var.project}-private-${each.key}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# private subnet 用（VPC 内の通信だけ。インターネットへの経路は持たない）
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project}-private" }
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}
