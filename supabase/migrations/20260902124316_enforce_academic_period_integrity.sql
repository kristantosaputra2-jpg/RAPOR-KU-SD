alter table public.academic_years
add constraint academic_years_consecutive_years check (
  substring(name from 6 for 4)::integer =
    substring(name from 1 for 4)::integer + 1
);

create function private.validate_semester_activation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active and not exists (
    select 1
    from public.academic_years
    where academic_years.id = new.academic_year_id
      and academic_years.is_active
  ) then
    raise exception 'An active semester must belong to the active academic year.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_semester_activation()
from public, anon, authenticated;

create trigger semesters_validate_activation
before insert or update of is_active, academic_year_id on public.semesters
for each row execute function private.validate_semester_activation();

create function private.protect_active_academic_year()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_active and not new.is_active and exists (
    select 1
    from public.semesters
    where semesters.academic_year_id = old.id
      and semesters.is_active
  ) then
    raise exception 'Deactivate the active semester before changing its academic year.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_active_academic_year()
from public, anon, authenticated;

create trigger academic_years_protect_active_semester
before update of is_active on public.academic_years
for each row execute function private.protect_active_academic_year();

create or replace function public.set_active_semester(p_semester_id uuid)
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
  where id = v_academic_year_id;

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
