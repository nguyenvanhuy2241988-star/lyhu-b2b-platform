
-- Chatbot Rules Table
create table if not exists public.chatbot_rules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  page_id uuid references public.facebook_pages(id) on delete cascade, -- Null = Apply to all pages (Global)
  keyword text not null, -- The keyword to match (e.g. "price", "address")
  match_type text default 'contains', -- 'exact' or 'contains'
  response_text text not null,
  is_active boolean default true,
  
  constraint chatbot_rules_page_keyword_key unique (page_id, keyword)
);

-- Enable RLS
alter table public.chatbot_rules enable row level security;

-- Policies
DROP POLICY IF EXISTS "Marketing manage chatbot rules" ON public.chatbot_rules;
create policy "Marketing manage chatbot rules"
  on public.chatbot_rules for all
  using (
    auth.uid() in (
      select id from public.profiles 
      where role in ('admin', 'marketing', 'sale_admin')
    )
  );

-- Seed some sample rules  
insert into public.chatbot_rules (keyword, response_text, match_type)
values 
('giá', 'Dạ anh/chị quan tâm sản phẩm nào ạ? Bên em có nhiều mức giá ưu đãi.', 'contains'),
('địa chỉ', 'Địa chỉ bên em là: 123 Đường ABC, Quận XYZ, TP.HCM ạ.', 'contains'),
('tư vấn', 'Dạ anh/chị để lại SĐT để nhân viên bên em gọi điện tư vấn kỹ hơn nhé!', 'contains')
on conflict do nothing;
