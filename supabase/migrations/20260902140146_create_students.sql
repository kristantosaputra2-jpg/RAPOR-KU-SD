create type public.student_gender as enum (
  'male',
  'female'
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nis text not null,
  nisn text,
  gender public.student_gender not null,
  birth_place text,
  birth_date date,
  religion text,
  address text,
  father_name text,
  mother_name text,
  guardian_name text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_full_name_length check (
    char_length(btrim(full_name)) between 1 and 160
  ),
  constraint students_nis_format check (
    char_length(btrim(nis)) between 1 and 30
    and btrim(nis) ~ '^[[:alnum:]./-]+$'
  ),
  constraint students_nisn_format check (
    nisn is null or btrim(nisn) ~ '^[0-9]{10}$'
  ),
  constraint students_birth_place_length check (
    birth_place is null or char_length(btrim(birth_place)) between 1 and 100
  ),
  constraint students_birth_date_valid check (
    birth_date is null or birth_date <= current_date
  ),
  constraint students_religion_length check (
    religion is null or char_length(btrim(religion)) between 1 and 80
  ),
  constraint students_address_length check (
    address is null or char_length(btrim(address)) between 1 and 500
  ),
  constraint students_parent_names_length check (
    (father_name is null or char_length(btrim(father_name)) between 1 and 160)
    and (mother_name is null or char_length(btrim(mother_name)) between 1 and 160)
    and (guardian_name is null or char_length(btrim(guardian_name)) between 1 and 160)
  )
);

create unique index students_nis_unique_idx
on public.students (lower(btrim(nis)));

create unique index students_nisn_unique_idx
on public.students (btrim(nisn))
where nisn is not null;

create index students_full_name_idx
on public.students (lower(full_name));

create index students_created_by_idx on public.students (created_by);
create index students_updated_by_idx on public.students (updated_by);

comment on table public.students is
  'Student master identity data. Class placement is stored separately to preserve history.';

comment on column public.students.nisn is
  'Optional because valid report workflows must also handle students who do not yet have an NISN.';

create trigger students_set_updated_at
before update on public.students
for each row execute function private.set_updated_at();

alter table public.classes
add constraint classes_id_semester_unique unique (id, semester_id);

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  class_id uuid not null,
  semester_id uuid not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_members_class_semester_fkey
    foreign key (class_id, semester_id)
    references public.classes (id, semester_id)
    on delete restrict,
  constraint class_members_student_semester_unique
    unique (student_id, semester_id)
);

create index class_members_class_id_idx on public.class_members (class_id);
create index class_members_semester_id_idx on public.class_members (semester_id);
create index class_members_created_by_idx on public.class_members (created_by);
create index class_members_updated_by_idx on public.class_members (updated_by);

comment on table public.class_members is
  'Historical class placement. A student can belong to at most one class in each semester.';

create trigger class_members_set_updated_at
before update on public.class_members
for each row execute function private.set_updated_at();

alter table public.students enable row level security;
alter table public.class_members enable row level security;

revoke all on table public.students from anon, authenticated;
grant select on table public.students to authenticated;
grant insert (
  full_name,
  nis,
  nisn,
  gender,
  birth_place,
  birth_date,
  religion,
  address,
  father_name,
  mother_name,
  guardian_name,
  is_active,
  created_by,
  updated_by
) on public.students to authenticated;
grant update (
  full_name,
  nis,
  nisn,
  gender,
  birth_place,
  birth_date,
  religion,
  address,
  father_name,
  mother_name,
  guardian_name,
  is_active,
  updated_by
) on public.students to authenticated;
grant usage on type public.student_gender to authenticated;

revoke all on table public.class_members from anon, authenticated;
grant select on table public.class_members to authenticated;
grant insert (
  student_id,
  class_id,
  semester_id,
  created_by,
  updated_by
) on public.class_members to authenticated;
grant update (
  class_id,
  semester_id,
  updated_by
) on public.class_members to authenticated;
grant delete on table public.class_members to authenticated;

create policy students_admin_select
on public.students
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy students_admin_insert
on public.students
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy students_admin_update
on public.students
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy class_members_admin_select
on public.class_members
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy class_members_admin_insert
on public.class_members
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy class_members_admin_update
on public.class_members
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);

create policy class_members_admin_delete
on public.class_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
      and profiles.is_active
  )
);
