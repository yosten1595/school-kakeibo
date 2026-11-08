output "app_url" {
  description = "アプリの URL（このPCからだけ開ける）。EC2 を止めて起動し直すと変わる"
  value       = "http://${aws_instance.app.public_ip}"
}

output "instance_id" {
  description = "EC2 のインスタンス ID（aws ssm start-session --target に使う）"
  value       = aws_instance.app.id
}

output "ecr_repository_url" {
  description = "イメージの push 先"
  value       = aws_ecr_repository.app.repository_url
}

output "db_endpoint" {
  description = "RDS のホスト名（VPC の中からだけつながる）"
  value       = aws_db_instance.main.address
}
