SET NAMES utf8mb4;

-- 初期カテゴリ（アプリ上で追加・編集・削除できる）
INSERT INTO categories (name, type) VALUES
  ('食費', 'expense'),
  ('日用品', 'expense'),
  ('交通費', 'expense'),
  ('住居', 'expense'),
  ('水道光熱費', 'expense'),
  ('通信費', 'expense'),
  ('娯楽', 'expense'),
  ('医療', 'expense'),
  ('衣服', 'expense'),
  ('その他', 'expense'),
  ('給与', 'income'),
  ('賞与', 'income'),
  ('その他収入', 'income');
