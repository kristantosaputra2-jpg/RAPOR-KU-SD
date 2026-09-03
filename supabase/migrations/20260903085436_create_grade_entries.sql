alter table public.classes
add constraint classes_id_semester_grade_unique
unique (id, semester_id, grade_level);

alter table public.class_members
add constraint class_members_student_class_semester_unique
unique (student_id, class_id, semester_id);

alter table public.learning_outcomes
add constraint learning_outcomes_scope_id_unique
unique (id, subject_id, semester_id, grade_level);

create table public.grading_rules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  semester_id uuid not null,
  minimum_mastery_score smallint not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grading_rules_class_semester_fkey
    foreign key (class_id, semester_id)
    references public.classes (id, semester_id)
    on delete restrict,
  constraint grading_rules_minimum_mastery_score_valid
    check (minimum_mastery_score between 1 and 100),
  constraint grading_rules_scope_unique
    unique (class_id, subject_id, semester_id)
);

create index grading_rules_subject_id_idx on public.grading_rules (subject_id);
create index grading_rules_semester_id_idx on public.grading_rules (semester_id);
create index grading_rules_created_by_idx on public.grading_rules (created_by);
create index grading_rules_updated_by_idx on public.grading_rules (updated_by);

comment on table public.grading_rules is
  'Configurable KKM per class, subject, and semester. Predicate intervals are calculated by application domain logic.';

create trigger grading_rules_set_updated_at
before update on public.grading_rules
for each row execute function private.set_updated_at();

create table public.grade_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  subject_id uuid not null,
  learning_outcome_id uuid not null,
  semester_id uuid not null,
  grade_level smallint not null,
  score numeric(5,2) not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_entries_score_valid check (score between 0 and 100),
  constraint grade_entries_grade_level_valid check (grade_level between 1 and 6),
  constraint grade_entries_membership_fkey
    foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id)
    on delete restrict,
  constraint grade_entries_class_scope_fkey
    foreign key (class_id, semester_id, grade_level)
    references public.classes (id, semester_id, grade_level)
    on delete restrict,
  constraint grade_entries_outcome_scope_fkey
    foreign key (learning_outcome_id, subject_id, semester_id, grade_level)
    references public.learning_outcomes (id, subject_id, semester_id, grade_level)
    on delete restrict,
  constraint grade_entries_scope_unique
    unique (student_id, class_id, subject_id, learning_outcome_id, semester_id)
);

create index grade_entries_class_subject_semester_idx
on public.grade_entries (class_id, subject_id, semester_id);
create index grade_entries_learning_outcome_id_idx
on public.grade_entries (learning_outcome_id);
create index grade_entries_created_by_idx on public.grade_entries (created_by);
create index grade_entries_updated_by_idx on public.grade_entries (updated_by);

comment on table public.grade_entries is
  'Raw 0-100 score for one student and learning outcome. Final averages and predicates are derived.';

create trigger grade_entries_set_updated_at
before update on public.grade_entries
for each row execute function private.set_updated_at();

alter table public.grading_rules enable row level security;
alter table public.grade_entries enable row level security;

revoke all on table public.grading_rules from anon, authenticated;
grant select on table public.grading_rules to authenticated;
grant insert (class_id, subject_id, semester_id, minimum_mastery_score, created_by, updated_by)
on public.grading_rules to authenticated;
grant update (minimum_mastery_score, updated_by)
on public.grading_rules to authenticated;

revoke all on table public.grade_entries from anon, authenticated;
grant select on table public.grade_entries to authenticated;
grant insert (student_id, class_id, subject_id, learning_outcome_id, semester_id, grade_level, score, created_by, updated_by)
on public.grade_entries to authenticated;
grant update (score, updated_by)
on public.grade_entries to authenticated;
grant delete on public.grade_entries to authenticated;

create policy grading_rules_authorized_select
on public.grading_rules for select to authenticated
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
            and teacher_assignments.class_id = grading_rules.class_id
            and teacher_assignments.subject_id = grading_rules.subject_id
            and teacher_assignments.semester_id = grading_rules.semester_id
        )
      )
  )
);

create policy grading_rules_admin_insert
on public.grading_rules for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy grading_rules_admin_update
on public.grading_rules for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy grade_entries_authorized_select
on public.grade_entries for select to authenticated
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
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grade_entries.class_id
              and classes.semester_id = grade_entries.semester_id
          )
        )
      )
  )
);

create policy grade_entries_authorized_insert
on public.grade_entries for insert to authenticated
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
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
      )
  )
);

create policy grade_entries_authorized_update
on public.grade_entries for update to authenticated
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
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
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
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
      )
  )
);

create policy grade_entries_authorized_delete
on public.grade_entries for delete to authenticated
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
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
      )
  )
);
