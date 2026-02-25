-- Allow telesales to view marketing campaigns to select as source
DROP POLICY IF EXISTS "Telesales can view marketing campaigns" ON public.marketing_campaigns;
create policy "Telesales can view marketing campaigns"
  on public.marketing_campaigns for select
  using (
    auth.uid() in (
      select id from public.profiles
      where role = 'telesales'
    )
  );

-- Allow telesales to view marketing posts if needed
DROP POLICY IF EXISTS "Telesales can view marketing posts" ON public.marketing_posts;
create policy "Telesales can view marketing posts"
  on public.marketing_posts for select
  using (
    auth.uid() in (
      select id from public.profiles
      where role = 'telesales'
    )
  );
