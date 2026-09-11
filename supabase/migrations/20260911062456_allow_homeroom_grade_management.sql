drop policy if exists subjects_homeroom_select on public.subjects;
drop policy if exists learning_outcomes_homeroom_select on public.learning_outcomes;
drop policy if exists grading_rules_homeroom_select on public.grading_rules;
drop policy if exists grade_entries_homeroom_insert on public.grade_entries;
drop policy if exists grade_entries_homeroom_update on public.grade_entries;
drop policy if exists grade_entries_homeroom_delete on public.grade_entries;
drop policy if exists report_descriptions_homeroom_insert on public.report_descriptions;
drop policy if exists report_descriptions_homeroom_update on public.report_descriptions;

create policy subjects_homeroom_select
on public.subjects
for select
to authenticated
using (
  subjects.is_active
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
  )
);

create policy learning_outcomes_homeroom_select
on public.learning_outcomes
for select
to authenticated
using (
  learning_outcomes.is_active
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.grade_level = learning_outcomes.grade_level
      and classes.semester_id = learning_outcomes.semester_id
  )
);

create policy grading_rules_homeroom_select
on public.grading_rules
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = grading_rules.class_id
      and classes.semester_id = grading_rules.semester_id
  )
);

create policy grade_entries_homeroom_insert
on public.grade_entries
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = grade_entries.class_id
      and classes.semester_id = grade_entries.semester_id
  )
);

create policy grade_entries_homeroom_update
on public.grade_entries
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = grade_entries.class_id
      and classes.semester_id = grade_entries.semester_id
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = grade_entries.class_id
      and classes.semester_id = grade_entries.semester_id
  )
);

create policy grade_entries_homeroom_delete
on public.grade_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = grade_entries.class_id
      and classes.semester_id = grade_entries.semester_id
  )
);

create policy report_descriptions_homeroom_insert
on public.report_descriptions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = report_descriptions.class_id
      and classes.semester_id = report_descriptions.semester_id
  )
);

create policy report_descriptions_homeroom_update
on public.report_descriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = report_descriptions.class_id
      and classes.semester_id = report_descriptions.semester_id
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    join public.teacher_profiles
      on teacher_profiles.user_id = profiles.id
    join public.classes
      on classes.homeroom_teacher_id = teacher_profiles.id
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
      and teacher_profiles.is_active
      and classes.id = report_descriptions.class_id
      and classes.semester_id = report_descriptions.semester_id
  )
);
