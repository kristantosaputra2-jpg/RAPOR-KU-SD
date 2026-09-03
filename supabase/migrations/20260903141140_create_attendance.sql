create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  sick_days integer not null default 0,
  permitted_days integer not null default 0,
  absent_days integer not null default 0,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_days_nonnegative check (
    sick_days >= 0 and permitted_days >= 0 and absent_days >= 0
  ),
  constraint attendance_membership_fkey foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict,
  constraint attendance_scope_unique unique (student_id, class_id, semester_id)
);

create index attendance_class_semester_idx on public.attendance (class_id, semester_id);
create index attendance_created_by_idx on public.attendance (created_by);
create index attendance_updated_by_idx on public.attendance (updated_by);

comment on table public.attendance is
  'Stores semester attendance totals for each student: sick, permitted, and absent without explanation.';

create trigger attendance_set_updated_at before update on public.attendance
for each row execute function private.set_updated_at();

alter table public.attendance enable row level security;
revoke all on table public.attendance from anon, authenticated;
grant select on table public.attendance to authenticated;
grant insert (student_id, class_id, semester_id, sick_days, permitted_days, absent_days, created_by, updated_by)
on public.attendance to authenticated;
grant update (sick_days, permitted_days, absent_days, updated_by)
on public.attendance to authenticated;

create policy attendance_authorized_select
on public.attendance for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = attendance.class_id
              and classes.semester_id = attendance.semester_id
          )
        )
      )
  )
);

create policy attendance_authorized_insert
on public.attendance for insert to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = attendance.class_id
              and classes.semester_id = attendance.semester_id
          )
        )
      )
  )
);

create policy attendance_authorized_update
on public.attendance for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = attendance.class_id
              and classes.semester_id = attendance.semester_id
          )
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = attendance.class_id
              and classes.semester_id = attendance.semester_id
          )
        )
      )
  )
);
