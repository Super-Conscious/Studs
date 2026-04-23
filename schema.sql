create table uploads (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type text not null check (type in ('content', 'reference')),
  url text not null,
  filename text not null,
  storage_path text not null,
  created_at timestamptz default now() not null
);

alter table uploads enable row level security;

create policy "Users can manage uploads in their projects"
  on uploads for all
  using (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));

create table generations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  prompt text not null,
  image_url text not null,
  saved boolean default false not null,
  created_at timestamptz default now() not null
);

alter table generations enable row level security;

create policy "Users can manage generations in their projects"
  on generations for all
  using (project_id in (select id from projects where user_id = auth.uid()))
  with check (project_id in (select id from projects where user_id = auth.uid()));

-- Shared workspace settings — single-row table for the one Gemini API key
-- every authenticated team member uses. Studs is an internal tool, so the
-- key lives once, not per-user. Any authenticated user can read and update.
create table app_settings (
  id int primary key,
  gemini_api_key text,
  updated_at timestamptz default now() not null,
  constraint single_row check (id = 1)
);

alter table app_settings enable row level security;

create policy "Authenticated users can read app_settings"
  on app_settings for select
  to authenticated using (true);

create policy "Authenticated users can insert app_settings"
  on app_settings for insert
  to authenticated with check (true);

create policy "Authenticated users can update app_settings"
  on app_settings for update
  to authenticated using (true) with check (true);

-- Backfill: copy any existing gemini_api_key from user_metadata into the
-- shared row. Picks the most recently updated user that has one set.
insert into app_settings (id, gemini_api_key)
select 1, raw_user_meta_data ->> 'gemini_api_key'
from auth.users
where raw_user_meta_data ? 'gemini_api_key'
  and length(coalesce(raw_user_meta_data ->> 'gemini_api_key', '')) > 0
order by updated_at desc
limit 1
on conflict (id) do nothing;
