create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  is_local_content boolean not null default false,
  display_order smallint not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_name_length check (
    char_length(btrim(name)) between 1 and 120
  ),
  constraint subjects_code_format check (
    code is null or (
      char_length(btrim(code)) between 1 and 30
      and btrim(code) ~ '^[[:alnum:]./_-]+$'
    )
  ),
  constraint subjects_display_order_valid check (
    display_order between 1 and 999
  )
);

create unique index subjects_name_unique_idx
on public.subjects (lower(btrim(name)));

create unique index subjects_code_unique_idx
on public.subjects (lower(btrim(code)))
where code is not null;

create index subjects_display_order_idx
on public.subjects (display_order, name);

create index subjects_created_by_idx on public.subjects (created_by);
create index subjects_updated_by_idx on public.subjects (updated_by);

comment on table public.subjects is
  'Configurable school subject master data. Class and teacher assignments are stored separately.';

comment on column public.subjects.is_local_content is
  'Marks school-configured local content without hardcoding subject names.';

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function private.set_updated_at();

alter table public.subjects enable row level security;

revoke all on table public.subjects from anon, authenticated;
grant select on table public.subjects to authenticated;
grant insert (
  name,
  code,
  is_local_content,
  display_order,
  is_active,
  created_by,
  updated_by
) on public.subjects to authenticated;
grant update (
  name,
  code,
  is_local_content,
  display_order,
  is_active,
  updated_by
) on public.subjects to authenticated;

create policy subjects_active_users_select
on public.subjects
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
  )
);

create policy subjects_admin_insert
on public.subjects
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy subjects_admin_update
on public.subjects
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);
