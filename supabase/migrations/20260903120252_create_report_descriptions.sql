create table public.report_descriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  semester_id uuid not null,
  grade_level smallint not null,
  strongest_outcome_id uuid references public.learning_outcomes (id) on delete restrict,
  weakest_outcome_id uuid references public.learning_outcomes (id) on delete restrict,
  generated_description text not null,
  final_description text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_descriptions_grade_level_valid check (grade_level between 1 and 6),
  constraint report_descriptions_generated_length check (char_length(btrim(generated_description)) between 1 and 2000),
  constraint report_descriptions_final_length check (char_length(btrim(final_description)) between 1 and 2000),
  constraint report_descriptions_membership_fkey foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict,
  constraint report_descriptions_class_scope_fkey foreign key (class_id, semester_id, grade_level)
    references public.classes (id, semester_id, grade_level) on delete restrict,
  constraint report_descriptions_scope_unique unique (student_id, class_id, subject_id, semester_id)
);

create index report_descriptions_membership_scope_idx on public.report_descriptions (student_id, class_id, semester_id);
create index report_descriptions_class_grade_scope_idx on public.report_descriptions (class_id, semester_id, grade_level);
create index report_descriptions_subject_id_idx on public.report_descriptions (subject_id);
create index report_descriptions_strongest_outcome_id_idx on public.report_descriptions (strongest_outcome_id);
create index report_descriptions_weakest_outcome_id_idx on public.report_descriptions (weakest_outcome_id);
create index report_descriptions_created_by_idx on public.report_descriptions (created_by);
create index report_descriptions_updated_by_idx on public.report_descriptions (updated_by);

comment on table public.report_descriptions is
  'Stores generated description separately from the teacher-reviewed final description.';

create trigger report_descriptions_set_updated_at before update on public.report_descriptions
for each row execute function private.set_updated_at();

alter table public.report_descriptions enable row level security;
revoke all on table public.report_descriptions from anon, authenticated;
grant select on table public.report_descriptions to authenticated;
grant insert (student_id, class_id, subject_id, semester_id, grade_level, strongest_outcome_id, weakest_outcome_id, generated_description, final_description, created_by, updated_by)
on public.report_descriptions to authenticated;
grant update (strongest_outcome_id, weakest_outcome_id, generated_description, final_description, updated_by)
on public.report_descriptions to authenticated;

create policy report_descriptions_authorized_select
on public.report_descriptions for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = report_descriptions.class_id
              and classes.semester_id = report_descriptions.semester_id
          )
        )
      )
  )
);

create policy report_descriptions_authorized_insert
on public.report_descriptions for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
      )
  )
);

create policy report_descriptions_authorized_update
on public.report_descriptions for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1 from public.teacher_assignments
          join public.teacher_profiles on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
      )
  )
);
