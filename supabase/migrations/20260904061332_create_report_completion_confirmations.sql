create table public.report_completion_confirmations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  extracurricular_confirmed_empty boolean not null default false,
  achievement_confirmed_empty boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_completion_confirmations_membership_fkey
    foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict,
  constraint report_completion_confirmations_scope_unique
    unique (student_id, class_id, semester_id)
);

create index report_completion_confirmations_class_semester_idx
  on public.report_completion_confirmations (class_id, semester_id);
create index report_completion_confirmations_semester_id_idx
  on public.report_completion_confirmations (semester_id);
create index report_completion_confirmations_created_by_idx
  on public.report_completion_confirmations (created_by);
create index report_completion_confirmations_updated_by_idx
  on public.report_completion_confirmations (updated_by);

comment on table public.report_completion_confirmations is
  'Stores explicit homeroom confirmations when optional report sections have no data.';

create trigger report_completion_confirmations_set_updated_at
before update on public.report_completion_confirmations
for each row execute function private.set_updated_at();

alter table public.report_completion_confirmations enable row level security;
revoke all on table public.report_completion_confirmations from anon, authenticated;
grant select on table public.report_completion_confirmations to authenticated;
grant insert (
  student_id,
  class_id,
  semester_id,
  extracurricular_confirmed_empty,
  achievement_confirmed_empty,
  created_by,
  updated_by
) on public.report_completion_confirmations to authenticated;
grant update (
  extracurricular_confirmed_empty,
  achievement_confirmed_empty,
  updated_by
) on public.report_completion_confirmations to authenticated;

create policy report_completion_confirmations_authorized_select
on public.report_completion_confirmations for select to authenticated
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
              and classes.id = report_completion_confirmations.class_id
              and classes.semester_id = report_completion_confirmations.semester_id
          )
        )
      )
  )
);

create policy report_completion_confirmations_authorized_insert
on public.report_completion_confirmations for insert to authenticated
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
              and classes.id = report_completion_confirmations.class_id
              and classes.semester_id = report_completion_confirmations.semester_id
          )
        )
      )
  )
);

create policy report_completion_confirmations_authorized_update
on public.report_completion_confirmations for update to authenticated
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
              and classes.id = report_completion_confirmations.class_id
              and classes.semester_id = report_completion_confirmations.semester_id
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
              and classes.id = report_completion_confirmations.class_id
              and classes.semester_id = report_completion_confirmations.semester_id
          )
        )
      )
  )
);
