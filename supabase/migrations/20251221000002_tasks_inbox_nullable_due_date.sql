-- Make due_date nullable for Inbox tasks
alter table public.telesales_tasks alter column due_date drop not null;
alter table public.telesales_tasks alter column due_date drop default;
