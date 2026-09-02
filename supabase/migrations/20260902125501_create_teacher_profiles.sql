create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  nip text,
  nuptk text,
  email text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_profiles_full_name_length check (
    char_length(btrim(full_name)) between 1 and 160
  ),
  constraint teacher_profiles_email_length check (
    char_length(btrim(email)) between 3 and 254
  ),
  constraint teacher_profiles_email_format check (
    btrim(email) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint teacher_profiles_email_lowercase check (email = lower(btrim(email))),
  constraint teacher_profiles_nip_length check (
    nip is null or char_length(btrim(nip)) between 1 and 30
  ),
  constraint teacher_profiles_nuptk_length check (
    nuptk is null or char_length(btrim(nuptk)) between 1 and 30
  ),
  constraint teacher_profiles_teacher_role check (
    role in ('homeroom_teacher', 'subject_teacher')
  )
);

create unique index teacher_profiles_email_unique_idx
on public.teacher_profiles (lower(email));

create unique index teacher_profiles_nip_unique_idx
on public.teacher_profiles (nip)
where nip is not null;

create unique index teacher_profiles_nuptk_unique_idx
on public.teacher_profiles (nuptk)
where nuptk is not null;

create index teacher_profiles_created_by_idx
on public.teacher_profiles (created_by);

create index teacher_profiles_updated_by_idx
on public.teacher_profiles (updated_by);

comment on table public.teacher_profiles is
  'Teacher master data. Optional user_id links a teacher to a Supabase Auth account when account provisioning is added.';

comment on column public.teacher_profiles.role is
  'Primary teacher role. Actual class and subject access is assigned separately.';

create trigger teacher_profiles_set_updated_at
before update on public.teacher_profiles
for each row execute function private.set_updated_at();

alter table public.teacher_profiles enable row level security;

revoke all on table public.teacher_profiles from anon, authenticated;
grant select on table public.teacher_profiles to authenticated;
grant insert (
  full_name,
  nip,
  nuptk,
  email,
  role,
  is_active,
  created_by,
  updated_by
) on public.teacher_profiles to authenticated;
grant update (
  full_name,
  nip,
  nuptk,
  email,
  role,
  is_active,
  updated_by
) on public.teacher_profiles to authenticated;

create policy teacher_profiles_active_users_select
on public.teacher_profiles
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

create policy teacher_profiles_admin_insert
on public.teacher_profiles
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

create policy teacher_profiles_admin_update
on public.teacher_profiles
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
