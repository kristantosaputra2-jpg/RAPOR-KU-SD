create policy class_members_subject_teacher_select
on public.class_members
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'subject_teacher'
      and profiles.is_active
      and exists (
        select 1
        from public.teacher_assignments
        join public.teacher_profiles
          on teacher_profiles.id = teacher_assignments.teacher_id
        where teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
          and teacher_assignments.is_active
          and teacher_assignments.class_id = class_members.class_id
          and teacher_assignments.semester_id = class_members.semester_id
      )
  )
);

create policy students_subject_teacher_select
on public.students
for select
to authenticated
using (
  students.is_active
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'subject_teacher'
      and profiles.is_active
      and exists (
        select 1
        from public.class_members
        join public.teacher_assignments
          on teacher_assignments.class_id = class_members.class_id
          and teacher_assignments.semester_id = class_members.semester_id
        join public.teacher_profiles
          on teacher_profiles.id = teacher_assignments.teacher_id
        where class_members.student_id = students.id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
          and teacher_assignments.is_active
      )
  )
);
