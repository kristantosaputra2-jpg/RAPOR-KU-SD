create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  name text not null,
  is_active boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_school_name_unique unique (school_id, name),
  constraint academic_years_name_format check (
    name ~ '^[0-9]{4}/[0-9]{4}$'
  )
);

create unique index academic_years_one_active_per_school_idx
on public.academic_years (school_id)
where is_active;

create index academic_years_created_by_idx
on public.academic_years (created_by);

create index academic_years_updated_by_idx
on public.academic_years (updated_by);

comment on table public.academic_years is
  'Historical-safe academic years for the school deployment.';

create trigger academic_years_set_updated_at
before update on public.academic_years
for each row execute function private.set_updated_at();

alter table public.academic_years enable row level security;

revoke all on table public.academic_years from anon, authenticated;
grant select, insert, update on table public.academic_years to authenticated;

create policy academic_years_active_users_select
on public.academic_years
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

create policy academic_years_admin_insert
on public.academic_years
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

create policy academic_years_admin_update
on public.academic_years
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

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  number smallint not null,
  is_active boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint semesters_academic_year_number_unique unique (academic_year_id, number),
  constraint semesters_number_valid check (number in (1, 2))
);

create unique index semesters_one_active_idx
on public.semesters (is_active)
where is_active;

create index semesters_academic_year_id_idx
on public.semesters (academic_year_id);

create index semesters_created_by_idx
on public.semesters (created_by);

create index semesters_updated_by_idx
on public.semesters (updated_by);

comment on table public.semesters is
  'Semester 1 and 2 records belonging to an academic year.';

create trigger semesters_set_updated_at
before update on public.semesters
for each row execute function private.set_updated_at();

alter table public.semesters enable row level security;

revoke all on table public.semesters from anon, authenticated;
grant select, insert, update on table public.semesters to authenticated;

create policy semesters_active_users_select
on public.semesters
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

create policy semesters_admin_insert
on public.semesters
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

create policy semesters_admin_update
on public.semesters
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

create function public.set_active_academic_year(p_academic_year_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
begin
  if v_user_id is null or not exists (
    select 1
    from public.profiles
    where profiles.id = v_user_id
      and profiles.role = 'admin'
      and profiles.is_active
  ) then
    raise exception 'Only an active admin can change the academic year.'
      using errcode = '42501';
  end if;

  select academic_years.school_id
  into v_school_id
  from public.academic_years
  where academic_years.id = p_academic_year_id;

  if v_school_id is null then
    raise exception 'Academic year not found.'
      using errcode = 'P0002';
  end if;

  update public.semesters
  set is_active = false,
      updated_by = v_user_id
  where is_active;

  update public.academic_years
  set is_active = false,
      updated_by = v_user_id
  where school_id = v_school_id
    and is_active;

  update public.academic_years
  set is_active = true,
      updated_by = v_user_id
  where id = p_academic_year_id;
end;
$$;

revoke all on function public.set_active_academic_year(uuid)
from public, anon, authenticated;
grant execute on function public.set_active_academic_year(uuid)
to authenticated;

create function public.set_active_semester(p_semester_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_academic_year_id uuid;
  v_school_id uuid;
begin
  if v_user_id is null or not exists (
    select 1
    from public.profiles
    where profiles.id = v_user_id
      and profiles.role = 'admin'
      and profiles.is_active
  ) then
    raise exception 'Only an active admin can change the semester.'
      using errcode = '42501';
  end if;

  select semesters.academic_year_id, academic_years.school_id
  into v_academic_year_id, v_school_id
  from public.semesters
  join public.academic_years
    on academic_years.id = semesters.academic_year_id
  where semesters.id = p_semester_id;

  if v_academic_year_id is null then
    raise exception 'Semester not found.'
      using errcode = 'P0002';
  end if;

  update public.academic_years
  set is_active = false,
      updated_by = v_user_id
  where school_id = v_school_id
    and is_active;

  update public.academic_years
  set is_active = true,
      updated_by = v_user_id
  where id = v_academic_year_id;

  update public.semesters
  set is_active = false,
      updated_by = v_user_id
  where is_active;

  update public.semesters
  set is_active = true,
      updated_by = v_user_id
  where id = p_semester_id;
end;
$$;

revoke all on function public.set_active_semester(uuid)
from public, anon, authenticated;
grant execute on function public.set_active_semester(uuid)
to authenticated;
