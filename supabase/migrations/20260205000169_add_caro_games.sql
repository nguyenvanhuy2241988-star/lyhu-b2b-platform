-- Migration: Add Caro Game Codes
-- Purpose: Fix 406 errors when fetching config and ensure Foreign Keys for scores work.

INSERT INTO public.entertainment_games (code, name, description, icon_name, config) VALUES
('caro_ai', 'Cờ Caro (AI Config)', 'Cấu hình điểm thưởng cho game Caro', 'Grid3X3', '{"points_easy": 50, "points_medium": 120, "points_hard": 300}'::jsonb),
('caro_easy', 'Caro (Dễ)', 'Bảng xếp hạng Caro cấp độ Dễ', 'Grid3X3', null),
('caro_medium', 'Caro (Vừa)', 'Bảng xếp hạng Caro cấp độ Vừa', 'Grid3X3', null),
('caro_hard', 'Caro (Khó)', 'Bảng xếp hạng Caro cấp độ Khó', 'Grid3X3', null)
ON CONFLICT (code) DO UPDATE 
SET config = EXCLUDED.config 
WHERE public.entertainment_games.code = 'caro_ai';
