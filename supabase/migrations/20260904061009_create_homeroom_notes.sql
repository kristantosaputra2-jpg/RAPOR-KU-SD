create table public.homeroom_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  semester_id uuid not null references public.semesters (id) on delete restrict,
  note text not null default '',
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homeroom_notes_note_length check (char_length(note) <= 500),
  constraint homeroom_notes_membership_fkey foreign key (student_id, class_id, semester_id)
    references public.class_members (student_id, class_id, semester_id) on delete restrict,
  constraint homeroom_notes_scope_unique unique (student_id, class_id, semester_id)
);

create index homeroom_notes_class_semester_idx on public.homeroom_notes (class_id, semester_id);
create index homeroom_notes_semester_id_idx on public.homeroom_notes (semester_id);
create index homeroom_notes_created_by_idx on public.homeroom_notes (created_by);
create index homeroom_notes_updated_by_idx on public.homeroom_notes (updated_by);

comment on table public.homeroom_notes is
  'Stores an editable homeroom teacher note for each student report period.';

create trigger homeroom_notes_set_updated_at before update on public.homeroom_notes
for each row execute function private.set_updated_at();

alter table public.homeroom_notes enable row level security;
revoke all on table public.homeroom_notes from anon, authenticated;
grant select on table public.homeroom_notes to authenticated;
grant insert (student_id, class_id, semester_id, note, created_by, updated_by)
on public.homeroom_notes to authenticated;
grant update (note, updated_by) on public.homeroom_notes to authenticated;

create policy homeroom_notes_authorized_select
on public.homeroom_notes for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = homeroom_notes.class_id
              and classes.semester_id = homeroom_notes.semester_id
          )
        )
      )
  )
);

create policy homeroom_notes_authorized_insert
on public.homeroom_notes for insert to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = homeroom_notes.class_id
              and classes.semester_id = homeroom_notes.semester_id
          )
        )
      )
  )
);

create policy homeroom_notes_authorized_update
on public.homeroom_notes for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = homeroom_notes.class_id
              and classes.semester_id = homeroom_notes.semester_id
          )
        )
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
      and (
        profiles.role = 'admin'
        or (
          profiles.role = 'homeroom_teacher'
          and exists (
            select 1 from public.classes
            join public.teacher_profiles on teacher_profiles.id = classes.homeroom_teacher_id
            where teacher_profiles.user_id = (select auth.uid())
              and teacher_profiles.is_active
              and classes.id = homeroom_notes.class_id
              and classes.semester_id = homeroom_notes.semester_id
          )
        )
      )
  )
);
