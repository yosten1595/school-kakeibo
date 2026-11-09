variable "region" {
  description = "リソースを作るリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project" {
  description = "リソース名の頭に付ける名前"
  type        = string
  default     = "kakeibo"
}

variable "allowed_cidr" {
  description = "アプリに接続できる IP（このPCのグローバル IP/32）。curl https://checkip.amazonaws.com で調べる"
  type        = string

  validation {
    condition     = can(cidrhost(var.allowed_cidr, 0)) && endswith(var.allowed_cidr, "/32")
    error_message = "allowed_cidr は 1 台だけを表す「x.x.x.x/32」の形で書いてください。"
  }
}

variable "alert_email" {
  description = "予算アラートを受け取るメールアドレス。書かないとき（null）は予算アラートを作らない"
  type        = string
  default     = null
}

variable "monthly_budget_usd" {
  description = "この金額（USD）を超えそうになったらメールで知らせる"
  type        = number
  default     = 1
}

variable "db_engine_version" {
  description = "RDS for MySQL のバージョン（RDS で使えるもの）"
  type        = string
  default     = "8.4"
}

variable "db_parameter_group_family" {
  description = "db_engine_version に合うパラメータグループのファミリー（例: mysql8.4）"
  type        = string
  default     = "mysql8.4"
}
