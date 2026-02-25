-- Migration: Add Typing Game (Đua Gõ Phím)
-- Purpose: Enable Typing Game

-- 1. Register Game
INSERT INTO public.entertainment_games (code, name, description, icon_name) VALUES
('typing', 'Đua Gõ Phím', 'Luyện "ngón tay vàng" với những đoạn code/văn mẫu kinh điển.', 'Keyboard')
ON CONFLICT (code) DO NOTHING;

-- 2. Typing Texts Table (Optional, or just hardcode for MVP, let's use a table for flexibility)
CREATE TABLE IF NOT EXISTS public.typing_texts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    category text DEFAULT 'General', -- 'Code', 'Quotes', 'General'
    difficulty text DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    created_at timestamptz DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.typing_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone read typing texts" ON public.typing_texts FOR SELECT USING (true);

-- 4. Seed Data
INSERT INTO public.typing_texts (content, category, difficulty) VALUES
('The quick brown fox jumps over the lazy dog.', 'General', 'Easy'),
('To be or not to be, that is the question.', 'Quotes', 'Medium'),
('function helloWorld() { console.log("Hello World!"); }', 'Code', 'Medium'),
('Thất bại chỉ là cơ hội để bắt đầu lại một cách thông minh hơn.', 'Quotes', 'Medium'),
('Công nghệ thông tin là nền tảng của sự phát triển trong tương lai.', 'General', 'Hard')
ON CONFLICT DO NOTHING;
