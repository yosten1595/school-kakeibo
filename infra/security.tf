# 通信の許可。アプリは認証がないので、allowed_cidr（このPC）以外からは一切つながらないようにする。

resource "aws_security_group" "app" {
  name        = "${var.project}-app"
  description = "Kakeibo app on EC2: HTTP from the allowed IP only"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-app" }
}

resource "aws_vpc_security_group_ingress_rule" "app_http" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP from this PC only"
  cidr_ipv4         = var.allowed_cidr
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# SSH（22 番）は開けない。EC2 の操作は SSM Session Manager で行う。

# 外向き 1: HTTPS だけ。ECR からのイメージ取得、SSM、OS の更新（dnf）はすべて 443 番を使う
# （DNS は VPC 内の Amazon DNS を使うので、セキュリティグループで許可しなくても届く）
resource "aws_vpc_security_group_egress_rule" "app_https" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS for ECR, SSM and package updates"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# 外向き 2: RDS（MySQL）へ。宛先は DB のセキュリティグループだけ
resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  security_group_id            = aws_security_group.app.id
  description                  = "MySQL to the RDS instance"
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

resource "aws_security_group" "db" {
  name        = "${var.project}-db"
  description = "RDS MySQL: only from the app instance"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.project}-db" }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "MySQL from the app instance"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

# DB の外向きのルールは作らない（Terraform で作ったセキュリティグループは、既定の「全部許可」が消える）。
# DB から外へ出る通信は一切許可しない。
