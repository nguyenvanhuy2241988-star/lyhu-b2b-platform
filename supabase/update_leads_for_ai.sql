-- Add AI Learning Columns to Leads Table
alter table marketing_leads_staging 
add column if not exists ai_score int default 0,
add column if not exists human_feedback varchar default 'none', -- 'good', 'bad', 'none'
add column if not exists profile_vector jsonb default '{}'::jsonb; -- Stores keywords found, etc.

-- Update RLS to allow updating feedback
drop policy if exists "Allow public update for feedback" on marketing_leads_staging;
create policy "Allow public update for feedback"
on marketing_leads_staging
for update
to public
using (true)
with check (true);
