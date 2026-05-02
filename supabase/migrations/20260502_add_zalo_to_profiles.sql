-- Thêm các cột quản lý tài khoản Zalo công ty cho nhân sự
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zalo_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS zalo_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS zalo_backup_password VARCHAR(255);
