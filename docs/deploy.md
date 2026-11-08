# AWS へのデプロイ手順

家計簿アプリを AWS（EC2 + RDS）に置き、**このパソコンのグローバル IP からだけ**ブラウザで開けるようにする手順です。構成は Terraform（`infra/`）で管理します。費用は AWS の無料枠の範囲に収まるようにしています。

## 構成

```
このPC（グローバル IP/32）──HTTP:80──> EC2 t3.micro（public subnet、Amazon Linux 2023、Docker）
                                          └ アプリのコンテナ（80 → 3000）
                                               └─> RDS for MySQL db.t4g.micro（private subnet）
ECR: アプリのイメージ置き場 / SSM Parameter Store: DB のパスワード / Budgets: 予算アラート
```

| 守り方 | 内容 |
|---|---|
| アプリ（80 番） | セキュリティグループで、`allowed_cidr`（このPCの IP/32）からだけ許可 |
| EC2 の外向き | HTTPS（443 番、ECR・SSM・OS の更新）と、RDS への 3306 番だけ許可 |
| SSH（22 番） | 開けない。EC2 に入るときは SSM Session Manager を使う |
| RDS（3306 番） | private subnet に置き、public アクセスも無効。EC2 のセキュリティグループからだけ許可。RDS から外へ出る通信は許可しない |
| DB のパスワード | Terraform がランダムに作り、SSM Parameter Store（暗号化）に置く。EC2 が起動時に読む |
| 通信 | ドメインと証明書がないので HTTP のみ（暗号化されない）。IP 制限で守る |

無料枠に収めるため、ALB・NAT Gateway・Secrets Manager・Elastic IP・Multi-AZ は使いません。

## 無料枠の注意

- 2025年7月15日以降に作った AWS アカウントは、「12か月無料」ではなく**クレジット制の無料プラン（6か月）**です。Billing コンソールの「無料利用枠」で、どちらかを確認してください。
- 旧来の無料枠の場合、EC2（t3.micro）と RDS（db.t4g.micro）は**それぞれ 1 台を 1 か月つけっぱなしにした時間（750 時間）**まで無料です。2 台目を作ると超えます。
- RDS のストレージは 20GB、ECR は 500MB、EBS は 30GB までが無料です（この構成はその中に収まります）。
- 予算アラート（標準は月 1 ドル）を超えそうになると、`alert_email` にメールが届きます。最初に届く確認メールのリンクを押してください。
- 使わなくなったら、下の「片付け」で全部消してください。

## 準備（最初の 1 回）

1. ツールを入れる（PowerShell）

   ```powershell
   winget install Hashicorp.Terraform
   winget install Amazon.AWSCLI
   winget install Amazon.SessionManagerPlugin
   ```

2. AWS の認証を確認する。使う IAM ユーザーには、EC2・RDS・ECR・SSM・IAM・Budgets を操作する権限が必要です

   ```powershell
   aws sts get-caller-identity
   ```

3. 設定ファイルを作る

   ```powershell
   cd infra
   Copy-Item terraform.tfvars.example terraform.tfvars
   ```

   `terraform.tfvars`（Git に含めない）に、このPCの IP（`curl.exe https://checkip.amazonaws.com` で調べて末尾に `/32`）とメールアドレスを書きます。

## デプロイ

以降のコマンドは `infra/` で実行します。

1. 初期化して、作られるものを確認する

   ```powershell
   terraform init
   terraform plan
   ```

2. 先にイメージ置き場（ECR）だけ作り、アプリのイメージを push する。EC2 は起動したときにこのイメージを取ってくるため、先に置いておきます

   ```powershell
   terraform apply -target="aws_ecr_repository.app"
   $repo = terraform output -raw ecr_repository_url
   aws ecr get-login-password | docker login --username AWS --password-stdin $repo.Split("/")[0]
   docker build -t "${repo}:latest" ..
   docker push "${repo}:latest"
   ```

3. 残りを全部作る（RDS の作成に 10 分前後かかります）

   ```powershell
   terraform apply
   ```

4. DB にテーブルと初期カテゴリを作る（最初の 1 回だけ。2 回目以降は何もしません）。EC2 が起動してアプリが動き出すまで、数分待ってから実行します

   ```powershell
   $id = terraform output -raw instance_id
   aws ssm send-command --instance-ids $id --document-name AWS-RunShellScript `
     --parameters 'commands=["docker exec kakeibo node scripts/db-init.mjs"]' `
     --query Command.CommandId --output text
   # 結果を見る（<CommandId> は上で表示された値）
   aws ssm get-command-invocation --instance-id $id --command-id <CommandId> --query StandardOutputContent --output text
   ```

   サンプルデータも入れたいときは、`db-init.mjs` のあとに ` --sample` を付けます。

5. `terraform output app_url` の URL をブラウザで開く

## アプリを更新する

```powershell
docker build -t "${repo}:latest" ..
docker push "${repo}:latest"
aws ssm send-command --instance-ids $id --document-name AWS-RunShellScript `
  --parameters 'commands=["/opt/kakeibo/start.sh"]'
```

EC2 の `start.sh` が最新のイメージを取ってきて、コンテナを作り直します。

## このPCの IP が変わったとき

家庭の回線は、ルーターの再起動などでグローバル IP が変わることがあります。つながらなくなったら、`terraform.tfvars` の `allowed_cidr` を新しい IP に直して、`terraform apply` を実行します（セキュリティグループだけが更新されます）。

## EC2 に入る（調べものをするとき）

```powershell
aws ssm start-session --target $id
# 入ったあと
sudo docker ps
sudo docker logs kakeibo
```

## 片付け（全部消す）

```powershell
terraform destroy
```

RDS のデータも消えます（最終スナップショットは取りません）。残したいときは、先に EC2 から `mysqldump` で退避してください。

## うまくいかないとき

| 症状 | 確認すること |
|---|---|
| URL を開いてもタイムアウトする | `allowed_cidr` が今の IP と同じか / EC2 が起動しているか |
| 「データベースに接続できない」と出る | RDS の作成が終わっているか / `sudo docker logs kakeibo` |
| 「SQL の実行でエラー」と出る | DB の初期化（デプロイの手順 4）をしたか |
| EC2 を止めて起動し直したら URL が変わった | public IP は起動し直すと変わる。`terraform apply` のあと `terraform output app_url` |
