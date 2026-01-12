-- Lead Assignment Automation (Round Robin / Least Recently Used)

-- 1. Create the function to find the best available sales person
create or replace function public.assign_lead_round_robin()
returns trigger
language plpgsql
security definer
as $$
declare
    selected_user_id uuid;
begin
    -- Only assign if owner_user_id is NULL
    if NEW.owner_user_id is null then
        
        -- Find the user with role 'telesales' or 'sales' 
        -- who has the OLDEST 'last assigned deal' (or no deals at all)
        -- This effectively distributes leads to those who haven't received one in a while.
        select id into selected_user_id
        from public.profiles
        where role in ('telesales', 'sales')
        -- We order by the creation time of their latest deal.
        -- If they have no deals, this subquery returns NULL.
        -- NULLS FIRST ensures new staff get leads first.
        order by (
            select max(created_at) 
            from public.crm_deals 
            where owner_user_id = profiles.id
        ) asc nulls first
        limit 1;

        -- If we found someone, assign them
        if selected_user_id is not null then
            NEW.owner_user_id := selected_user_id;
            -- We can also log this if we had an audit table
        end if;
        
    end if;

    return NEW;
end;
$$;

-- 2. Create the Trigger on crm_deals
-- Only fire on INSERT directly.
drop trigger if exists trigger_assign_lead_round_robin on public.crm_deals;

create trigger trigger_assign_lead_round_robin
before insert on public.crm_deals
for each row
execute function public.assign_lead_round_robin();

-- 3. Optional: Notification Trigger (Stub)
-- If we want to notify, we can do it here or let the client handle it via Realtime.
-- ideally, we'd insert into a 'notifications' table.
