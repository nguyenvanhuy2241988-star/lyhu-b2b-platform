-- Allow telesales to view marketing campaigns to select as source
create policy "Telesales can view marketing campaigns"
  on public.marketing_campaigns for select
  using (
    auth.uid() in (
      select id from public.profiles
      where role = 'telesales'
    )
  );

-- Allow telesales to view marketing posts if needed
create policy "Telesales can view marketing posts"
  on public.marketing_posts for select
  using (
    auth.uid() in (
      select id from public.profiles
      where role = 'telesales'
    )
  );
