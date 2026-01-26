-- Migration: Add Quiz Game (Đuổi Hình Bắt Chữ)
-- Purpose: Enable Quiz Game

-- 1. Register Game
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('quiz_image', 'Đuổi Hình Bắt Chữ', 'Xem hình ảnh và đoán từ khóa bí ẩn.', 'Image')
ON CONFLICT (code) DO NOTHING;

-- 2. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_code text REFERENCES public.entertainment_games(code) ON DELETE CASCADE,
    question text NOT NULL, -- e.g. "Đây là con gì?"
    image_url text, -- URL of the image clue
    correct_answer text NOT NULL, -- The answer content
    options jsonb, -- Array of strings for multiple choice (optional)
    explanation text, -- Shown after answering
    created_at timestamptz DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can view questions (Should filter by game logic in real app, but ok for now)
CREATE POLICY "Everyone view quiz" ON public.quiz_questions FOR SELECT USING (true);
-- Only Admin can manage (Assuming RLS setup for admin later, currently restrictive or public depending on needs)
-- For this demo, let's allow authenticated to insert for "User Generated Content" mode, or restrict. 
-- Let's stick to "Everyone Read" for now.

-- 4. Seed Data
INSERT INTO public.quiz_questions (game_code, question, image_url, correct_answer, options, explanation) VALUES
('quiz_image', 'Biểu tượng của sự may mắn ở phương Đông?', 'https://images.unsplash.com/photo-1547619292-240402b5ae5d?w=500', 'Con Rồng', '["Con Rồng", "Con Lân", "Con Phượng", "Con Rùa"]'::jsonb, 'Rồng là linh vật đứng đầu tứ linh.'),
('quiz_image', 'Đây là loại quả gì?', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500', 'Chuối', '["Táo", "Cam", "Chuối", "Dưa hấu"]'::jsonb, 'Chuối giàu kali và rất tốt cho sức khỏe.')
ON CONFLICT DO NOTHING;
