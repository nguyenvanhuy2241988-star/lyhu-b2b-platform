-- Migration: Admin RLS for Quiz and Typing
-- Purpose: Allow Admins to Manage Quiz Questions and Typing Texts.

-- 1. Quiz Settings: Admin Full Access
CREATE POLICY "Admin manage quiz" ON public.quiz_questions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Typing Texts: Admin Full Access
CREATE POLICY "Admin manage typing" ON public.typing_texts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
