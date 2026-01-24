-- Create table for tracking Marketing Bot Actions (Log)
create table if not exists marketing_action_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  action_type varchar not null, -- E.g: 'post', 'invite', 'defense', 'search'
  status varchar default 'success', -- 'success', 'failed'
  details jsonb default '{}'::jsonb, -- Store extra info like latency, specific errors
  profile_id varchar -- To track which profile performed the action
);

-- Enable RLS
alter table marketing_action_logs enable row level security;

-- Policy: Allow public read/write for now (for Scripts)
-- In production, restrict to service role or authenticated users
create policy "Public Audit Log Access"
  on marketing_action_logs for all
  using (true)
  with check (true);
