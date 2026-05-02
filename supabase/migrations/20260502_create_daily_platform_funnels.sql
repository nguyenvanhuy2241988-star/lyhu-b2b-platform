-- Thêm bảng theo dõi phễu chuyển đổi trên từng nền tảng
create table if not exists recruitment_daily_platform_funnels (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date date not null,
    platform text not null, -- 'facebook', 'zalo', 'threads', 'tiktok', 'linkedin', 'other'
    inquiries_count int default 0 not null,
    cvs_count int default 0 not null,
    interviews_count int default 0 not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, date, platform)
);

-- Cấp quyền RLS cho bảng mới
alter table recruitment_daily_platform_funnels enable row level security;

create policy "Users can view their own funnels"
    on recruitment_daily_platform_funnels for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own funnels"
    on recruitment_daily_platform_funnels for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own funnels"
    on recruitment_daily_platform_funnels for update
    using ( auth.uid() = user_id );

-- Admin can view all
create policy "Admins can view all funnels"
    on recruitment_daily_platform_funnels for select
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'manager', 'recruiter_manager')
        )
    );

-- Admin can update all
create policy "Admins can update all funnels"
    on recruitment_daily_platform_funnels for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'manager', 'recruiter_manager')
        )
    );

-- Thêm cột feedback vào báo cáo ngày
alter table recruitment_daily_activities 
add column if not exists candidate_feedback text default '';
