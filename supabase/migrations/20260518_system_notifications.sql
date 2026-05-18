-- System notifications sent by the developer to all users
create table if not exists public.system_notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  type        text not null default 'info' check (type in ('info', 'success', 'warning')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Track which users have dismissed each notification
create table if not exists public.user_notification_reads (
  user_id         uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references public.system_notifications(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (user_id, notification_id)
);

-- RLS
alter table public.system_notifications enable row level security;
alter table public.user_notification_reads enable row level security;

-- All authenticated users can read active notifications
create policy "authenticated users can read active notifications"
  on public.system_notifications for select
  to authenticated
  using (is_active = true);

-- Admin (service role) can do everything
create policy "service role full access on notifications"
  on public.system_notifications for all
  to service_role
  using (true) with check (true);

-- Users manage their own reads
create policy "users can read own reads"
  on public.user_notification_reads for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert own reads"
  on public.user_notification_reads for insert
  to authenticated
  with check (user_id = auth.uid());
