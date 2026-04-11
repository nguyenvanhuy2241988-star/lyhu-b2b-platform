-- =============================================
-- Migration: Add entered_brands to retail_chains
-- Description: Cho phép quản lý Telesales theo dõi chi tiết danh sách nhãn hàng (sản phẩm) đã đưa vào chuỗi
-- =============================================

ALTER TABLE retail_chains ADD COLUMN IF NOT EXISTS entered_brands TEXT[] DEFAULT '{}';
