create policy students_homeroom_select
on public.students
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
  )
  and exists (
    select 1
    from public.class_members
    join public.classes on classes.id = class_members.class_id
    join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
    where class_members.student_id = students.id
      and class_members.semester_id = classes.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
);

create policy class_members_homeroom_select
on public.class_members
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'homeroom_teacher'
      and profiles.is_active
  )
  and exists (
    select 1
    from public.classes
    join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
    where classes.id = class_members.class_id
      and classes.semester_id = class_members.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
);
