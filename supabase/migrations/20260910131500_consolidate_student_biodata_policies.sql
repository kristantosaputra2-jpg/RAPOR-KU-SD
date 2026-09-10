drop policy student_biodata_admin_select on public.student_biodata;
drop policy student_biodata_admin_insert on public.student_biodata;
drop policy student_biodata_admin_update on public.student_biodata;
drop policy student_biodata_homeroom_select on public.student_biodata;
drop policy student_biodata_homeroom_insert on public.student_biodata;
drop policy student_biodata_homeroom_update on public.student_biodata;

create policy student_biodata_authorized_select
on public.student_biodata
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
  or (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'homeroom_teacher'
        and profiles.is_active
    )
    and exists (
      select 1
      from public.class_members
      join public.classes on classes.id = class_members.class_id
      join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
      where class_members.student_id = student_biodata.student_id
        and class_members.semester_id = classes.semester_id
        and teacher_profiles.user_id = (select auth.uid())
        and teacher_profiles.is_active
    )
  )
);

create policy student_biodata_authorized_insert
on public.student_biodata
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
      exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'homeroom_teacher'
          and profiles.is_active
      )
      and exists (
        select 1
        from public.class_members
        join public.classes on classes.id = class_members.class_id
        join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
        where class_members.student_id = student_biodata.student_id
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
);

create policy student_biodata_authorized_update
on public.student_biodata
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
  or (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'homeroom_teacher'
        and profiles.is_active
    )
    and exists (
      select 1
      from public.class_members
      join public.classes on classes.id = class_members.class_id
      join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
      where class_members.student_id = student_biodata.student_id
        and class_members.semester_id = classes.semester_id
        and teacher_profiles.user_id = (select auth.uid())
        and teacher_profiles.is_active
    )
  )
)
with check (
  updated_by = (select auth.uid())
  and (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
      exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'homeroom_teacher'
          and profiles.is_active
      )
      and exists (
        select 1
        from public.class_members
        join public.classes on classes.id = class_members.class_id
        join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
        where class_members.student_id = student_biodata.student_id
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
);
