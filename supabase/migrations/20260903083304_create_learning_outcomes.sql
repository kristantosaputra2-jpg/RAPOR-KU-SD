create table public.learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  grade_level smallint not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  code text,
  title text not null,
  description text not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_outcomes_grade_level_valid check (grade_level between 1 and 6),
  constraint learning_outcomes_code_length check (
    code is null or char_length(btrim(code)) between 1 and 40
  ),
  constraint learning_outcomes_title_length check (
    char_length(btrim(title)) between 1 and 200
  ),
  constraint learning_outcomes_description_length check (
    char_length(btrim(description)) between 1 and 2000
  )
);

create unique index learning_outcomes_scope_code_unique_idx
on public.learning_outcomes (
  subject_id,
  grade_level,
  semester_id,
  lower(btrim(code))
)
where code is not null;

create index learning_outcomes_scope_active_idx
on public.learning_outcomes (subject_id, semester_id, grade_level)
where is_active;

create index learning_outcomes_semester_id_idx
on public.learning_outcomes (semester_id);

create index learning_outcomes_created_by_idx
on public.learning_outcomes (created_by);

create index learning_outcomes_updated_by_idx
on public.learning_outcomes (updated_by);

comment on table public.learning_outcomes is
  'Generic learning outcomes scoped by subject, grade level, and semester; not tied to K13 KI/KD terminology.';

create trigger learning_outcomes_set_updated_at
before update on public.learning_outcomes
for each row execute function private.set_updated_at();

alter table public.learning_outcomes enable row level security;

revoke all on table public.learning_outcomes from anon, authenticated;
grant select on table public.learning_outcomes to authenticated;
grant insert (
  subject_id,
  grade_level,
  semester_id,
  code,
  title,
  description,
  is_active,
  created_by,
  updated_by
) on public.learning_outcomes to authenticated;
grant update (
  code,
  title,
  description,
  is_active,
  updated_by
) on public.learning_outcomes to authenticated;

create policy learning_outcomes_admin_or_assigned_select
on public.learning_outcomes
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
          learning_outcomes.is_active
          and exists (
            select 1
            from public.teacher_assignments
            join public.teacher_profiles
              on teacher_profiles.id = teacher_assignments.teacher_id
            join public.classes
              on classes.id = teacher_assignments.class_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and teacher_assignments.is_active
              and teacher_assignments.subject_id = learning_outcomes.subject_id
              and teacher_assignments.semester_id = learning_outcomes.semester_id
              and classes.grade_level = learning_outcomes.grade_level
          )
        )
      )
  )
);

create policy learning_outcomes_admin_or_assigned_insert
on public.learning_outcomes
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1
          from public.teacher_assignments
          join public.teacher_profiles
            on teacher_profiles.id = teacher_assignments.teacher_id
          join public.classes
            on classes.id = teacher_assignments.class_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.subject_id = learning_outcomes.subject_id
            and teacher_assignments.semester_id = learning_outcomes.semester_id
            and classes.grade_level = learning_outcomes.grade_level
        )
      )
  )
);

create policy learning_outcomes_admin_or_assigned_update
on public.learning_outcomes
for update
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
          from public.teacher_assignments
          join public.teacher_profiles
            on teacher_profiles.id = teacher_assignments.teacher_id
          join public.classes
            on classes.id = teacher_assignments.class_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.subject_id = learning_outcomes.subject_id
            and teacher_assignments.semester_id = learning_outcomes.semester_id
            and classes.grade_level = learning_outcomes.grade_level
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or exists (
          select 1
          from public.teacher_assignments
          join public.teacher_profiles
            on teacher_profiles.id = teacher_assignments.teacher_id
          join public.classes
            on classes.id = teacher_assignments.class_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.subject_id = learning_outcomes.subject_id
            and teacher_assignments.semester_id = learning_outcomes.semester_id
            and classes.grade_level = learning_outcomes.grade_level
        )
      )
  )
);
