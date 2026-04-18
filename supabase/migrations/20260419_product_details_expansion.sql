-- Bổ sung các thông số phụ vào bảng products
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_spec text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS items_per_carton numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;

-- Bổ sung hỗ trợ Media (Đa ảnh và Video)
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS extra_images jsonb DEFAULT '[]'::jsonb;
