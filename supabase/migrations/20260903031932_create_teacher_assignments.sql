alter table public.classes
add constraint classes_id_academic_year_semester_unique
unique (id, academic_year_id, semester_id);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles (id) on delete restrict,
  class_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  semester_id uuid not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_assignments_class_period_fkey
    foreign key (class_id, academic_year_id, semester_id)
    references public.classes (id, academic_year_id, semester_id)
    on delete restrict,
  constraint teacher_assignments_class_subject_unique
    unique (class_id, subject_id)
);

create index teacher_assignments_teacher_id_idx
on public.teacher_assignments (teacher_id);

create index teacher_assignments_subject_id_idx
on public.teacher_assignments (subject_id);

create index teacher_assignments_academic_year_id_idx
on public.teacher_assignments (academic_year_id);

create index teacher_assignments_semester_id_idx
on public.teacher_assignments (semester_id);

create index teacher_assignments_created_by_idx
on public.teacher_assignments (created_by);

create index teacher_assignments_updated_by_idx
on public.teacher_assignments (updated_by);

comment on table public.teacher_assignments is
  'Assigns one teacher to one subject in one class and its academic period.';

comment on constraint teacher_assignments_class_subject_unique
on public.teacher_assignments is
  'A class has one responsible teacher for each subject; change the existing assignment instead of duplicating it.';

create trigger teacher_assignments_set_updated_at
before update on public.teacher_assignments
for each row execute function private.set_updated_at();

alter table public.teacher_assignments enable row level security;

revoke all on table public.teacher_assignments from anon, authenticated;
grant select on table public.teacher_assignments to authenticated;
grant insert (
  teacher_id,
  class_id,
  subject_id,
  academic_year_id,
  semester_id,
  is_active,
  created_by,
  updated_by
) on public.teacher_assignments to authenticated;
grant update (
  teacher_id,
  is_active,
  updated_by
) on public.teacher_assignments to authenticated;

create policy teacher_assignments_admin_or_owner_select
on public.teacher_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1
          from public.teacher_profiles
          where teacher_profiles.id = teacher_assignments.teacher_id
            and teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
        )
      )
  )
);

create policy teacher_assignments_admin_insert
on public.teacher_assignments
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

create policy teacher_assignments_admin_update
on public.teacher_assignments
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

drop policy classes_active_users_select on public.classes;
create policy classes_admin_homeroom_or_assigned_select
on public.classes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1
          from public.teacher_profiles
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and (
              teacher_profiles.id = classes.homeroom_teacher_id
              or exists (
                select 1
                from public.teacher_assignments
                where teacher_assignments.teacher_id = teacher_profiles.id
                  and teacher_assignments.class_id = classes.id
                  and teacher_assignments.is_active
              )
            )
        )
      )
  )
);

drop policy subjects_active_users_select on public.subjects;
create policy subjects_admin_or_assigned_select
on public.subjects
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          subjects.is_active
          and exists (
          select 1
          from public.teacher_assignments
          join public.teacher_profiles
            on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.subject_id = subjects.id
            and teacher_assignments.is_active
          )
        )
      )
  )
);
