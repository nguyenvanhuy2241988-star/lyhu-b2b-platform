-- Migration: Add Caro Game
-- Purpose: Enable Caro Game in the system

INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('caro', 'Cờ Caro (XO)', 'Đấu trí căng não. 5 nước thẳng hàng là thắng!', 'Grid3X3')
ON CONFLICT (code) DO NOTHING;
