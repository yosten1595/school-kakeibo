# アプリを動かす EC2（無料枠: t3.micro）。Docker で ECR のイメージを動かすだけで、ビルドはしない。

# 最新の Amazon Linux 2023（x86_64。このPCでビルドするイメージと同じ CPU アーキテクチャ）
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_caller_identity" "current" {}

# EC2 に付ける権限: SSM（Session Manager / Run Command）、ECR からの pull、DB パスワードの読み取りだけ
resource "aws_iam_role" "app" {
  name = "${var.project}-app-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy" "read_db_password" {
  name = "read-db-password"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = aws_ssm_parameter.db_password.arn
    }]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project}-app-ec2"
  role = aws_iam_role.app.name
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  # T 系の「unlimited」はCPUを使いすぎると追加料金がかかるので standard にする
  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens                 = "required" # IMDSv2 のみ
    http_put_response_hop_limit = 1          # コンテナからは IMDS に届かないようにする
  }

  root_block_device {
    volume_size = 8 # 無料枠は 30GB まで
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    region         = var.region
    registry       = split("/", aws_ecr_repository.app.repository_url)[0]
    image          = "${aws_ecr_repository.app.repository_url}:latest"
    db_host        = aws_db_instance.main.address
    db_name        = aws_db_instance.main.db_name
    db_user        = aws_db_instance.main.username
    password_param = aws_ssm_parameter.db_password.name
  })
  user_data_replace_on_change = true

  # 新しい AMI が出ても、勝手に作り直さない
  lifecycle {
    ignore_changes = [ami]
  }

  tags = { Name = "${var.project}-app" }
}
