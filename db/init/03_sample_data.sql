SET NAMES utf8mb4;

-- サンプルデータ。初期化した日を基準に、直近約5か月分（150日）を作る。
-- 金額は日付から決まる擬似的な値なので、何度初期化しても同じ傾向になる。
SET SESSION cte_max_recursion_depth = 1000;

CREATE TEMPORARY TABLE sample_days AS
WITH RECURSIVE d AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 1 FROM d WHERE n < 150
)
SELECT n, CURDATE() - INTERVAL n DAY AS day FROM d;

-- 食費: 毎日
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 400 + (n * 137) % 1800,
       (SELECT id FROM categories WHERE name = '食費'),
       ELT(1 + n % 4, '昼食', '夕食', 'スーパー', 'コンビニ')
FROM sample_days;

-- 交通費: 平日
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 300 + (n * 53) % 500,
       (SELECT id FROM categories WHERE name = '交通費'), '電車'
FROM sample_days WHERE WEEKDAY(day) < 5;

-- 日用品: 5日ごと
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 500 + (n * 211) % 2500,
       (SELECT id FROM categories WHERE name = '日用品'),
       ELT(1 + n % 3, '洗剤', 'ティッシュ', 'ドラッグストア')
FROM sample_days WHERE n % 5 = 0;

-- 娯楽: 9日ごと
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 1000 + (n * 317) % 4000,
       (SELECT id FROM categories WHERE name = '娯楽'),
       ELT(1 + n % 3, '映画', '書籍', 'ゲーム')
FROM sample_days WHERE n % 9 = 0;

-- 通信費・住居・水道光熱費: 月の固定費
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 7000, (SELECT id FROM categories WHERE name = '通信費'), 'スマホ・インターネット'
FROM sample_days WHERE DAY(day) = 15;

INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 65000, (SELECT id FROM categories WHERE name = '住居'), '家賃'
FROM sample_days WHERE DAY(day) = 1;

INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'expense', 8000 + (n * 97) % 3000, (SELECT id FROM categories WHERE name = '水道光熱費'), '電気・ガス・水道'
FROM sample_days WHERE DAY(day) = 10;

-- 給与: 毎月25日
INSERT INTO transactions (date, type, amount, category_id, memo)
SELECT day, 'income', 250000, (SELECT id FROM categories WHERE name = '給与'), '給与'
FROM sample_days WHERE DAY(day) = 25;

DROP TEMPORARY TABLE sample_days;

-- 予算: 当月の全体予算（category_id が NULL）と、カテゴリ別予算
SET @this_month = DATE_FORMAT(CURDATE(), '%Y-%m-01');

INSERT INTO budgets (month, category_id, amount) VALUES
  (@this_month, NULL, 200000);

INSERT INTO budgets (month, category_id, amount)
SELECT @this_month, id,
       CASE name WHEN '食費' THEN 40000 WHEN '日用品' THEN 10000 WHEN '交通費' THEN 10000 WHEN '娯楽' THEN 15000 END
FROM categories
WHERE name IN ('食費', '日用品', '交通費', '娯楽');
