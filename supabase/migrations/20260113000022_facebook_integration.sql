-- Facebook Integration Schema

-- 1. Create Facebook Pages table
create table if not exists public.facebook_pages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  page_id text not null unique, -- Facebook Page ID
  name text not null,
  access_token text, -- Long-lived page access token
  category text,
  avatar_url text,
  is_connected boolean default true,
  connected_by uuid references auth.users(id)
);

-- 2. Add columns to marketing_posts
-- We add 'facebook_page_id' to know which page this post belongs to
-- We add 'fb_post_id' to store the returned ID from Facebook
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='marketing_posts' and column_name='facebook_page_id') then
    alter table public.marketing_posts add column facebook_page_id uuid references public.facebook_pages(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='marketing_posts' and column_name='fb_post_id') then
    alter table public.marketing_posts add column fb_post_id text;
  end if;
  
   if not exists (select 1 from information_schema.columns where table_name='marketing_posts' and column_name='media_urls') then
    alter table public.marketing_posts add column media_urls text[]; -- Array of image URLs
  end if;
end $$;

-- 3. Enable RLS
alter table public.facebook_pages enable row level security;

-- 4. Policies for facebook_pages
-- 4. Policies for facebook_pages
drop policy if exists "Marketing can manage facebook pages" on public.facebook_pages;

create policy "Marketing can manage facebook pages"
  on public.facebook_pages for all
  using (
    auth.uid() in (
      select id from public.profiles 
      where role in ('admin', 'marketing', 'sale_admin')
    )
  );

-- 5. Grant permissions to Marketing role (if specific grants needed beyond RLS, usually RLS matches authenticated users)
-- No extra grants needed if using service role or standard RLS.

-- 6. Helper RPC to get connected pages (Optional, simplifies frontend)
-- Standard select is fine.
