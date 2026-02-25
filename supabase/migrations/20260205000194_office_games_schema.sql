-- Migration: Office Games Module
-- Purpose: Store game data, leaderboards, and lucky wheel presets

BEGIN;

-- 1. Games Table (List of available games)
CREATE TABLE IF NOT EXISTS public.entertainment_games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL, -- 'lucky_wheel', 'bird', 'caro'
    name text NOT NULL,
    description text,
    icon_name text, -- Lucide icon name
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. Game Scores (For Leaderboard)
CREATE TABLE IF NOT EXISTS public.game_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code text REFERENCES public.entertainment_games(code) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    score int NOT NULL,
    played_at timestamptz DEFAULT now()
);

-- 3. Lucky Wheel Presets (Shared lists like "Lunch", "Drink")
CREATE TABLE IF NOT EXISTS public.lucky_wheel_presets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- e.g. "Trà sữa", "Cơm trưa"
    items jsonb NOT NULL, -- Array of strings/objects
    created_by uuid REFERENCES public.profiles(id),
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.entertainment_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wheel_presets ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Games: Everyone can read active games
CREATE POLICY "Everyone view active games" ON public.entertainment_games FOR SELECT USING (is_active = true);

-- Scores: Everyone can read scores (Leaderboard)
CREATE POLICY "Everyone view scores" ON public.game_scores FOR SELECT USING (true);
-- Scores: Authenticated users can insert their own scores
CREATE POLICY "Users submit own score" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Presets: Everyone can view public presets
CREATE POLICY "Everyone view public presets" ON public.lucky_wheel_presets FOR SELECT USING (is_public = true OR auth.uid() = created_by);
-- Presets: Users can create presets
CREATE POLICY "Users create presets" ON public.lucky_wheel_presets FOR INSERT WITH CHECK (auth.uid() = created_by);
-- Presets: Users delete own presets
CREATE POLICY "Users delete own presets" ON public.lucky_wheel_presets FOR DELETE USING (auth.uid() = created_by);

-- 6. Seed Data (Initial Games)
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('lucky_wheel', 'Vòng Quay Nhân Phẩm', 'Quyết định ai rửa bát, ai mời nước!', 'Fan'),
('lyhu_bird', 'Lyhu Bird', 'Bay xa nhất có thể. Cẩn thận các bức tường!', 'Bird')
ON CONFLICT (code) DO NOTHING;

COMMIT;
