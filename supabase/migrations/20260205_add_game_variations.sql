-- Migration: Register Game Variations for Office Games 2.0
-- Purpose: Support Easy/Hard modes for Leaderboards

-- 1. Lyhu Bird Variations
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('lyhu_bird_easy', 'Lyhu Bird (Dễ)', 'Chế độ luyện tập, ống rộng, bay chậm.', 'Trophy'),
('lyhu_bird_hard', 'Lyhu Bird (Khó)', 'Chế độ thử thách, ống hẹp, tốc độ cao.', 'Trophy')
ON CONFLICT (code) DO NOTHING;

-- 2. Caro Variations
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('caro_easy', 'Cờ Caro (Dễ)', 'Đấu với Máy cấp độ Thực tập sinh.', 'Grid3X3'),
('caro_hard', 'Cờ Caro (Khó)', 'Đấu với Máy cấp độ Senior.', 'Grid3X3')
ON CONFLICT (code) DO NOTHING;

-- 3. Typing Game (Weekly) - Just to be sure it exists
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('typing', 'Đua Gõ Phím', 'Cuộc thi tốc độ gõ phím hàng tuần.', 'Keyboard')
ON CONFLICT (code) DO NOTHING;
