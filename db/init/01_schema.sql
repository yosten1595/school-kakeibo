-- 家計簿アプリのテーブル定義。docker の初回起動時（空のデータボリューム）に自動実行される。
-- 作り直すときは: docker compose down -v && docker compose up -d
SET NAMES utf8mb4;

CREATE TABLE categories (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50) NOT NULL,
  type       ENUM('income', 'expense') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  -- transactions から (id, type) で参照するための索引
  UNIQUE KEY uq_categories_id_type (id, type)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  date        DATE NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  amount      INT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  memo        VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_date (date),
  KEY idx_transactions_category_date (category_id, date),
  CONSTRAINT chk_transactions_amount CHECK (amount >= 1),
  -- 収支の種別とカテゴリの種別が一致しない行を DB が拒否する。
  -- 使用中のカテゴリは削除できない（RESTRICT）。
  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id, type) REFERENCES categories (id, type)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE budgets (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  month       DATE NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  amount      INT UNSIGNED NOT NULL,
  -- category_id が NULL（月全体の予算）でも重複を防ぐため、NULL を 0 に置き換えた列で一意にする
  category_key BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(category_id, 0)) VIRTUAL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budgets_month_category (month, category_key),
  CONSTRAINT chk_budgets_amount CHECK (amount >= 1),
  CONSTRAINT chk_budgets_month CHECK (DAY(month) = 1),
  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
