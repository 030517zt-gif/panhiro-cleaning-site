ALTER TABLE products ADD COLUMN show_in_marquee INTEGER NOT NULL DEFAULT 0;

UPDATE products
SET show_in_marquee = 1
WHERE id IN (
  SELECT id
  FROM products
  WHERE published = 1
  ORDER BY sort_order ASC, id ASC
  LIMIT 8
);
