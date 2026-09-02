create type public.class_template_group as enum (
  'lower_primary',
  'upper_primary'
);

alter table public.semesters
add constraint semesters_id_academic_year_unique
unique (id, academic_year_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  semester_id uuid not null,
  grade_level smallint not null,
  name text not null,
  homeroom_teacher_id uuid references public.teacher_profiles (id) on delete restrict,
  template_group public.class_template_group generated always as (
    case
      when grade_level between 1 and 3 then 'lower_primary'::public.class_template_group
      else 'upper_primary'::public.class_template_group
    end
  ) stored,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_grade_level_valid check (grade_level between 1 and 6),
  constraint classes_name_length check (
    char_length(btrim(name)) between 1 and 80
  ),
  constraint classes_semester_academic_year_fkey
    foreign key (semester_id, academic_year_id)
    references public.semesters (id, academic_year_id)
    on delete restrict
);

create unique index classes_semester_name_unique_idx
on public.classes (semester_id, lower(btrim(name)));

create index classes_academic_year_id_idx
on public.classes (academic_year_id);

create index classes_homeroom_teacher_id_idx
on public.classes (homeroom_teacher_id)
where homeroom_teacher_id is not null;

create index classes_created_by_idx on public.classes (created_by);
create index classes_updated_by_idx on public.classes (updated_by);

comment on table public.classes is
  'Class groups scoped to one academic year and semester.';

comment on column public.classes.template_group is
  'Automatically lower_primary for grades 1-3 and upper_primary for grades 4-6.';

comment on column public.classes.homeroom_teacher_id is
  'Optional until the school assigns a homeroom teacher.';

create trigger classes_set_updated_at
before update on public.classes
for each row execute function private.set_updated_at();

alter table public.classes enable row level security;

revoke all on table public.classes from anon, authenticated;
grant select on table public.classes to authenticated;
grant insert (
  academic_year_id,
  semester_id,
  grade_level,
  name,
  homeroom_teacher_id,
  created_by,
  updated_by
) on public.classes to authenticated;
grant update (
  academic_year_id,
  semester_id,
  grade_level,
  name,
  homeroom_teacher_id,
  updated_by
) on public.classes to authenticated;
grant usage on type public.class_template_group to authenticated;

create policy classes_active_users_select
on public.classes
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

create policy classes_admin_insert
on public.classes
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

create policy classes_admin_update
on public.classes
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
