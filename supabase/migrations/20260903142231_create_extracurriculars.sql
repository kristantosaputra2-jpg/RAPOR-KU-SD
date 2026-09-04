create table public.extracurriculars (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  name text not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extracurriculars_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint extracurriculars_school_name_unique unique (school_id, name)
);

create table public.student_extracurriculars (
  id uuid primary key default gen_random_uuid(),
  extracurricular_id uuid not null references public.extracurriculars (id) on delete restrict,
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  achievement text not null,
  description text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_extracurriculars_achievement_length check (char_length(btrim(achievement)) between 1 and 40),
  constraint student_extracurriculars_description_length check (char_length(btrim(description)) between 1 and 500),
  constraint student_extracurriculars_membership_fkey foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict,
  constraint student_extracurriculars_scope_unique unique (extracurricular_id, student_id, class_id, semester_id)
);

create index extracurriculars_school_id_idx on public.extracurriculars (school_id);
create index extracurriculars_created_by_idx on public.extracurriculars (created_by);
create index extracurriculars_updated_by_idx on public.extracurriculars (updated_by);
create index student_extracurriculars_extracurricular_id_idx on public.student_extracurriculars (extracurricular_id);
create index student_extracurriculars_class_semester_idx on public.student_extracurriculars (class_id, semester_id);
create index student_extracurriculars_semester_id_idx on public.student_extracurriculars (semester_id);
create index student_extracurriculars_created_by_idx on public.student_extracurriculars (created_by);
create index student_extracurriculars_updated_by_idx on public.student_extracurriculars (updated_by);

create trigger extracurriculars_set_updated_at before update on public.extracurriculars
for each row execute function private.set_updated_at();
create trigger student_extracurriculars_set_updated_at before update on public.student_extracurriculars
for each row execute function private.set_updated_at();

alter table public.extracurriculars enable row level security;
alter table public.student_extracurriculars enable row level security;
revoke all on table public.extracurriculars, public.student_extracurriculars from anon, authenticated;
grant select on table public.extracurriculars, public.student_extracurriculars to authenticated;
grant insert (school_id, name, is_active, created_by, updated_by), update (name, is_active, updated_by)
on public.extracurriculars to authenticated;
grant insert (extracurricular_id, student_id, class_id, semester_id, achievement, description, created_by, updated_by),
  update (achievement, description, updated_by)
on public.student_extracurriculars to authenticated;

create policy extracurriculars_authorized_select on public.extracurriculars
for select to authenticated using (
  exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active)
);
create policy extracurriculars_admin_insert on public.extracurriculars
for insert to authenticated with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active and profiles.role = 'admin')
);
create policy extracurriculars_admin_update on public.extracurriculars
for update to authenticated using (
  exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active and profiles.role = 'admin')
) with check (
  updated_by = (select auth.uid())
  and exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active and profiles.role = 'admin')
);

create policy student_extracurriculars_authorized_select on public.student_extracurriculars
for select to authenticated using (
  exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = student_extracurriculars.class_id and classes.semester_id = student_extracurriculars.semester_id
        )
      ))
  )
);
create policy student_extracurriculars_authorized_insert on public.student_extracurriculars
for insert to authenticated with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = student_extracurriculars.class_id and classes.semester_id = student_extracurriculars.semester_id
        )
      ))
  )
);
create policy student_extracurriculars_authorized_update on public.student_extracurriculars
for update to authenticated using (
  exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = student_extracurriculars.class_id and classes.semester_id = student_extracurriculars.semester_id
        )
      ))
  )
) with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = student_extracurriculars.class_id and classes.semester_id = student_extracurriculars.semester_id
        )
      ))
  )
);
