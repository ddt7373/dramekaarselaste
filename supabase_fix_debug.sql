-- STEP 1: RESET
-- We drop the table to ensure a clean slate.
DROP TABLE IF EXISTS public.sys_menu_layouts;

-- STEP 2: CREATE TABLE
create table public.sys_menu_layouts (
  "role" text not null primary key,
  "layout" jsonb not null default '[]'::jsonb,
  "updated_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "updated_by" uuid references auth.users(id)
);

-- STEP 3: SECURITY
alter table public.sys_menu_layouts enable row level security;

-- Policy 1: Everyone can read
create policy "Allow read access to all authenticated users"
  on public.sys_menu_layouts for select
  to authenticated
  using (true);

-- Policy 2: TEMPORARY - Allow all authenticated users to edit
-- (We will restrict this to hoof_admin once the table creation works)
create policy "Allow all authenticated to edit"
  on public.sys_menu_layouts for all
  to authenticated
  using (true)
  with check (true);
