-- Fix Missing Game Variations
-- Reason: Previous migrations for variations likely ran before the table creation migration due to alphabetical ordering.

-- 1. Ensure Lyhu Bird Variations
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('lyhu_bird_easy', 'Lyhu Bird (Dễ)', 'Chế độ luyện tập, ống rộng, bay chậm.', 'Trophy'),
('lyhu_bird_medium', 'Lyhu Bird (Vừa)', 'Chế độ cân bằng, dành cho người chơi phổ thông.', 'Trophy'),
('lyhu_bird_hard', 'Lyhu Bird (Khó)', 'Chế độ thử thách, ống hẹp, tốc độ cao.', 'Trophy')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name;

-- 2. Ensure Caro Variations
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('caro_easy', 'Cờ Caro (Dễ)', 'Đấu với Máy cấp độ Thực tập sinh.', 'Grid3X3'),
('caro_medium', 'Cờ Caro (Vừa)', 'Đấu với Máy cấp độ Nhân viên chính thức.', 'Grid3X3'),
('caro_hard', 'Cờ Caro (Khó)', 'Đấu với Máy cấp độ Senior.', 'Grid3X3')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name;

-- 3. Ensure Typing Game
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('typing', 'Đua Gõ Phím', 'Cuộc thi tốc độ gõ phím hàng tuần.', 'Keyboard')
ON CONFLICT (code) DO NOTHING;
