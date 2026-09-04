create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  achievement_type text not null,
  achievement_level text not null,
  description text not null,
  event_year smallint not null,
  event_date date,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_type_length check (char_length(btrim(achievement_type)) between 1 and 80),
  constraint achievements_level_length check (char_length(btrim(achievement_level)) between 1 and 80),
  constraint achievements_description_length check (char_length(btrim(description)) between 1 and 500),
  constraint achievements_event_year_valid check (event_year between 1900 and 2200),
  constraint achievements_date_year_match check (event_date is null or extract(year from event_date) = event_year),
  constraint achievements_membership_fkey foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict
);

create index achievements_membership_idx on public.achievements (student_id, class_id, semester_id);
create index achievements_class_semester_idx on public.achievements (class_id, semester_id);
create index achievements_semester_id_idx on public.achievements (semester_id);
create index achievements_created_by_idx on public.achievements (created_by);
create index achievements_updated_by_idx on public.achievements (updated_by);

create trigger achievements_set_updated_at before update on public.achievements
for each row execute function private.set_updated_at();

alter table public.achievements enable row level security;
revoke all on table public.achievements from anon, authenticated;
grant select on table public.achievements to authenticated;
grant insert (student_id, class_id, semester_id, achievement_type, achievement_level, description, event_year, event_date, created_by, updated_by),
  update (achievement_type, achievement_level, description, event_year, event_date, updated_by)
on public.achievements to authenticated;

create policy achievements_authorized_select on public.achievements
for select to authenticated using (
  exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = achievements.class_id and classes.semester_id = achievements.semester_id
        )
      ))
  )
);

create policy achievements_authorized_insert on public.achievements
for insert to authenticated with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = achievements.class_id and classes.semester_id = achievements.semester_id
        )
      ))
  )
);

create policy achievements_authorized_update on public.achievements
for update to authenticated using (
  exists (
    select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_active
      and (profiles.role = 'admin' or (
        profiles.role = 'homeroom_teacher' and exists (
          select 1 from public.classes join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
          where teacher_profiles.user_id = (select auth.uid()) and teacher_profiles.is_active
            and classes.id = achievements.class_id and classes.semester_id = achievements.semester_id
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
            and classes.id = achievements.class_id and classes.semester_id = achievements.semester_id
        )
      ))
  )
);
