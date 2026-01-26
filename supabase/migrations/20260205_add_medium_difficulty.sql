-- Migration: Add Medium Difficulty for Office Games 2.0
-- Purpose: Support Medium modes for Leaderboards

-- 1. Lyhu Bird Medium
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('lyhu_bird_medium', 'Lyhu Bird (Vừa)', 'Chế độ cân bằng, dành cho người chơi phổ thông.', 'Trophy')
ON CONFLICT (code) DO NOTHING;

-- 2. Caro Medium
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('caro_medium', 'Cờ Caro (Vừa)', 'Đấu với Máy cấp độ Nhân viên chính thức.', 'Grid3X3')
ON CONFLICT (code) DO NOTHING;
