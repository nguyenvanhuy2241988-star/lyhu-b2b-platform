-- 1. Table: recruitment_daily_activities
create table if not exists recruitment_daily_activities (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date date default current_date not null,
    
    -- Facebook Metrics
    fb_posts_paid int default 0,
    fb_posts_free int default 0,
    fb_comments int default 0,
    fb_friends int default 0,
    
    -- Threads Metrics
    threads_posts int default 0,
    threads_comments int default 0,
    
    -- Issues & Support
    issues text,
    request_support text,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

    -- Unique constraint to prevent duplicate reports per user per day
    unique(user_id, date)
);

-- RLS for recruitment_daily_activities
alter table recruitment_daily_activities enable row level security;

create policy "Users can view their own reports"
    on recruitment_daily_activities for select
    using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'recruiter_manager')));

create policy "Users can insert their own reports"
    on recruitment_daily_activities for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own reports"
    on recruitment_daily_activities for update
    using (auth.uid() = user_id);


-- 2. Table: recruitment_contacts (Networking)
create table if not exists recruitment_contacts (
    id uuid default gen_random_uuid() primary key,
    created_by uuid references auth.users(id) on delete set null,
    
    name text not null,
    position text,
    organization text, -- e.g. "ĐH Phenikaa"
    phone text,
    email text,
    social_link text,
    
    notes text,
    status text default 'new', -- new, contacted, connected
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for recruitment_contacts (Shared among recruiters)
alter table recruitment_contacts enable row level security;

create policy "Recruiters can view all contacts"
    on recruitment_contacts for select
    using (true); -- Simplify for now, or filter by role existence if needed

create policy "Recruiters can insert contacts"
    on recruitment_contacts for insert
    with check (auth.uid() = created_by);

create policy "Recruiters can update contacts"
    on recruitment_contacts for update
    using (true);

create policy "Recruiters can delete contacts"
    on recruitment_contacts for delete
    using (true);


-- 3. Table: recruitment_platforms (Material)
create table if not exists recruitment_platforms (
    id uuid default gen_random_uuid() primary key,
    
    name text not null,
    type text not null, -- Website, App, Group Facebook
    pricing_details text, -- Can be markdown text
    tips text,
    
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for recruitment_platforms
alter table recruitment_platforms enable row level security;

create policy "Everyone can view platforms"
    on recruitment_platforms for select
    using (true);

create policy "Admins can manage platforms"
    on recruitment_platforms for all
    using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'recruiter_manager')));
