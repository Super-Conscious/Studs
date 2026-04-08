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
