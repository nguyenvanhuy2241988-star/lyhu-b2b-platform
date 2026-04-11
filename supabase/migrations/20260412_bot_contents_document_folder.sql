-- Migration: Add Document Folder support to bot_contents
-- Description: Cho phép BOT bốc ngẫu nhiên số lượng ảnh từ một thư mục Tài liệu hệ thống.

ALTER TABLE bot_contents 
ADD COLUMN IF NOT EXISTS doc_folder_id UUID NULL,
ADD COLUMN IF NOT EXISTS doc_folder_name TEXT NULL,
ADD COLUMN IF NOT EXISTS media_count INTEGER DEFAULT 1;
