-- Create tables for Recruitment Module

-- 1. Recruitment Jobs
create table if not exists public.recruitment_jobs (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    department text,
    location text default 'Hồ Chí Minh',
    salary_range text,
    description text,
    requirements text,
    status text check (status in ('draft', 'open', 'closed')) default 'draft',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- 2. Recruitment Candidates
create table if not exists public.recruitment_candidates (
    id uuid default gen_random_uuid() primary key,
    job_id uuid references public.recruitment_jobs(id) on delete set null,
    full_name text not null,
    email text,
    phone text,
    cv_url text, -- Link to storage
    status text check (status in ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')) default 'new',
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Recruitment Interviews
create table if not exists public.recruitment_interviews (
    id uuid default gen_random_uuid() primary key,
    candidate_id uuid references public.recruitment_candidates(id) on delete cascade,
    interviewer_id uuid references auth.users(id),
    scheduled_at timestamptz not null,
    type text check (type in ('online', 'offline', 'phone')) default 'offline',
    status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
    meeting_link text,
    feedback text,
    created_at timestamptz default now()
);

-- RLS Policies
alter table public.recruitment_jobs enable row level security;
alter table public.recruitment_candidates enable row level security;
alter table public.recruitment_interviews enable row level security;

-- Simple Policy: Recruiters and Admins have full access.
-- Helper function to check role (reusing or inlining logic)
-- Note: 'recruiter' is now a valid role in profiles.

create policy "Recruiters and Admin Full Access Jobs" on public.recruitment_jobs
    for all using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'recruiter')
        )
    );

create policy "Recruiters and Admin Full Access Candidates" on public.recruitment_candidates
    for all using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'recruiter')
        )
    );

create policy "Recruiters and Admin Full Access Interviews" on public.recruitment_interviews
    for all using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'recruiter')
        )
    );

-- Allow Read Access to 'Jobs' for everyone (internal job board?) -> Maybe just authenticated for now.
create policy "Authenticated Read Access Jobs" on public.recruitment_jobs
    for select using ( auth.role() = 'authenticated' );

-- Seed some initial data
insert into public.recruitment_jobs (title, department, status, description)
values 
('Nhân viên kinh doanh', 'Sales', 'open', 'Tìm kiếm khách hàng mới...'),
('Kế toán tổng hợp', 'Accounting', 'open', 'Phụ trách sổ sách kế toán...'),
('Shipper', 'Logistics', 'closed', 'Giao hàng khu vực nội thành...');

-- Seed candidates
do $$
declare
    job_sales uuid;
begin
    select id into job_sales from public.recruitment_jobs where title = 'Nhân viên kinh doanh' limit 1;
    
    if job_sales is not null then
        insert into public.recruitment_candidates (job_id, full_name, email, status)
        values 
        (job_sales, 'Nguyễn Văn A', 'a@example.com', 'new'),
        (job_sales, 'Trần Thị B', 'b@example.com', 'interview');
    end if;
end $$;
