-- Allow authenticated users to insert their own participation record
CREATE POLICY "Users can join events" ON public.hr_event_participants
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
