drop policy if exists subjects_admin_or_assigned_select on public.subjects;
drop policy if exists subjects_homeroom_select on public.subjects;
drop policy if exists subjects_authorized_select on public.subjects;

create policy subjects_authorized_select
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
          and (
            exists (
              select 1
              from public.teacher_profiles
              join public.classes
                on classes.homeroom_teacher_id = teacher_profiles.id
              where teacher_profiles.user_id = (select auth.uid())
                and teacher_profiles.is_active
            )
            or exists (
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
  )
);

drop policy if exists learning_outcomes_admin_or_assigned_select on public.learning_outcomes;
drop policy if exists learning_outcomes_homeroom_select on public.learning_outcomes;
drop policy if exists learning_outcomes_authorized_select on public.learning_outcomes;

create policy learning_outcomes_authorized_select
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
          and (
            exists (
              select 1
              from public.teacher_profiles
              join public.classes
                on classes.homeroom_teacher_id = teacher_profiles.id
              where teacher_profiles.user_id = (select auth.uid())
                and teacher_profiles.is_active
                and classes.grade_level = learning_outcomes.grade_level
                and classes.semester_id = learning_outcomes.semester_id
            )
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
  )
);

drop policy if exists grading_rules_authorized_select on public.grading_rules;
drop policy if exists grading_rules_homeroom_select on public.grading_rules;

create policy grading_rules_authorized_select
on public.grading_rules
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
          from public.teacher_assignments
          join public.teacher_profiles
            on teacher_profiles.id = teacher_assignments.teacher_id
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = grading_rules.class_id
            and teacher_assignments.subject_id = grading_rules.subject_id
            and teacher_assignments.semester_id = grading_rules.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grading_rules.class_id
              and classes.semester_id = grading_rules.semester_id
          )
        )
      )
  )
);

drop policy if exists grade_entries_authorized_insert on public.grade_entries;
drop policy if exists grade_entries_homeroom_insert on public.grade_entries;

create policy grade_entries_authorized_insert
on public.grade_entries
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grade_entries.class_id
              and classes.semester_id = grade_entries.semester_id
          )
        )
      )
  )
);

drop policy if exists grade_entries_authorized_update on public.grade_entries;
drop policy if exists grade_entries_homeroom_update on public.grade_entries;

create policy grade_entries_authorized_update
on public.grade_entries
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grade_entries.class_id
              and classes.semester_id = grade_entries.semester_id
          )
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grade_entries.class_id
              and classes.semester_id = grade_entries.semester_id
          )
        )
      )
  )
);

drop policy if exists grade_entries_authorized_delete on public.grade_entries;
drop policy if exists grade_entries_homeroom_delete on public.grade_entries;

create policy grade_entries_authorized_delete
on public.grade_entries
for delete
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = grade_entries.class_id
            and teacher_assignments.subject_id = grade_entries.subject_id
            and teacher_assignments.semester_id = grade_entries.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = grade_entries.class_id
              and classes.semester_id = grade_entries.semester_id
          )
        )
      )
  )
);

drop policy if exists report_descriptions_authorized_insert on public.report_descriptions;
drop policy if exists report_descriptions_homeroom_insert on public.report_descriptions;

create policy report_descriptions_authorized_insert
on public.report_descriptions
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = report_descriptions.class_id
              and classes.semester_id = report_descriptions.semester_id
          )
        )
      )
  )
);

drop policy if exists report_descriptions_authorized_update on public.report_descriptions;
drop policy if exists report_descriptions_homeroom_update on public.report_descriptions;

create policy report_descriptions_authorized_update
on public.report_descriptions
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = report_descriptions.class_id
              and classes.semester_id = report_descriptions.semester_id
          )
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
          where teacher_profiles.user_id = (select auth.uid())
            and teacher_profiles.is_active
            and teacher_assignments.is_active
            and teacher_assignments.class_id = report_descriptions.class_id
            and teacher_assignments.subject_id = report_descriptions.subject_id
            and teacher_assignments.semester_id = report_descriptions.semester_id
        )
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1
            from public.classes
            join public.teacher_profiles
              on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = report_descriptions.class_id
              and classes.semester_id = report_descriptions.semester_id
          )
        )
      )
  )
);
