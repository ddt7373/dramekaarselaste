-- Create sys_menu_layouts table if it doesn't exist
create table if not exists public.sys_menu_layouts (
  role text not null primary key,
  layout jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Add RLS policies
alter table public.sys_menu_layouts enable row level security;

-- Drop existing policies to avoid errors
drop policy if exists "Allow read access to all authenticated users" on public.sys_menu_layouts;
drop policy if exists "Allow full access to hoof_admin" on public.sys_menu_layouts;

-- Allow read access to authenticated users (so they can load their menu)
create policy "Allow read access to all authenticated users"
  on public.sys_menu_layouts for select
  to authenticated
  using (true);

-- Allow full access to hoof_admin
create policy "Allow full access to hoof_admin"
  on public.sys_menu_layouts for all
  to authenticated
  using (
    exists (
      select 1 from public.gebruikers
      where id = auth.uid()::uuid and rol = 'hoof_admin'
    )
  );
