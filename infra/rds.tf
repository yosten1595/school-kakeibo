# RDS for MySQL（無料枠: db.t4g.micro、Single-AZ、20GB）

resource "random_password" "db" {
  length = 32
  # RDS のパスワードに使えない文字（/ @ " と空白）を避ける
  override_special = "!#%*()-_=+[]{}<>:?"
}

# パスワードは SSM Parameter Store（標準パラメータは無料）に置き、EC2 が起動時に読む。
# Secrets Manager は有料なので使わない。
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project}/db/password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = [for s in aws_subnet.private : s.id]
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project}-mysql"
  family = var.db_parameter_group_family

  # ローカルの docker-compose.yml と同じ文字コード・タイムゾーンにする
  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }
  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }
  parameter {
    name  = "time_zone"
    value = "Asia/Tokyo"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = "db.t4g.micro"

  allocated_storage     = 20
  max_allocated_storage = 0 # 自動拡張しない（無料枠の 20GB を超えないように）
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "kakeibo"
  username = "kakeibo"
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  availability_zone      = local.az_primary # EC2 と同じ AZ（AZ 間の通信料を避ける）
  multi_az               = false
  publicly_accessible    = false

  backup_retention_period      = 1
  performance_insights_enabled = false
  monitoring_interval          = 0
  auto_minor_version_upgrade   = true
  apply_immediately            = true

  # 学習用のため、削除時に最終スナップショットは取らない（必要なら先に mysqldump で退避する）
  skip_final_snapshot = true
  deletion_protection = false
}
