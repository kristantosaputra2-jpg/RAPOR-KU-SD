create table public.student_biodata (
  student_id uuid primary key references public.students (id) on delete cascade,
  photo_path text,
  student_phone text,
  father_name text,
  father_education text,
  father_occupation text,
  father_address text,
  father_phone text,
  mother_name text,
  mother_education text,
  mother_occupation text,
  mother_address text,
  mother_phone text,
  guardian_name text,
  guardian_education text,
  guardian_occupation text,
  guardian_address text,
  guardian_phone text,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_biodata_photo_path_length check (
    photo_path is null or char_length(btrim(photo_path)) between 1 and 300
  ),
  constraint student_biodata_phone_length check (
    (student_phone is null or char_length(btrim(student_phone)) between 1 and 30)
    and (father_phone is null or char_length(btrim(father_phone)) between 1 and 30)
    and (mother_phone is null or char_length(btrim(mother_phone)) between 1 and 30)
    and (guardian_phone is null or char_length(btrim(guardian_phone)) between 1 and 30)
  ),
  constraint student_biodata_name_length check (
    (father_name is null or char_length(btrim(father_name)) between 1 and 160)
    and (mother_name is null or char_length(btrim(mother_name)) between 1 and 160)
    and (guardian_name is null or char_length(btrim(guardian_name)) between 1 and 160)
  ),
  constraint student_biodata_education_length check (
    (father_education is null or char_length(btrim(father_education)) between 1 and 160)
    and (mother_education is null or char_length(btrim(mother_education)) between 1 and 160)
    and (guardian_education is null or char_length(btrim(guardian_education)) between 1 and 160)
  ),
  constraint student_biodata_occupation_length check (
    (father_occupation is null or char_length(btrim(father_occupation)) between 1 and 160)
    and (mother_occupation is null or char_length(btrim(mother_occupation)) between 1 and 160)
    and (guardian_occupation is null or char_length(btrim(guardian_occupation)) between 1 and 160)
  ),
  constraint student_biodata_address_length check (
    (father_address is null or char_length(btrim(father_address)) between 1 and 500)
    and (mother_address is null or char_length(btrim(mother_address)) between 1 and 500)
    and (guardian_address is null or char_length(btrim(guardian_address)) between 1 and 500)
  )
);

comment on table public.student_biodata is
  'Private report biodata maintained by Admin or the assigned homeroom teacher.';

comment on column public.student_biodata.photo_path is
  'Object path in the private student-photos bucket; the UI presents it in a 3:4 frame.';

create index student_biodata_created_by_idx
on public.student_biodata (created_by);

create index student_biodata_updated_by_idx
on public.student_biodata (updated_by);

create trigger student_biodata_set_updated_at
before update on public.student_biodata
for each row execute function private.set_updated_at();

insert into public.student_biodata (
  student_id,
  father_name,
  mother_name,
  guardian_name,
  created_by,
  updated_by
)
select
  students.id,
  students.father_name,
  students.mother_name,
  students.guardian_name,
  students.created_by,
  students.updated_by
from public.students
where students.father_name is not null
  or students.mother_name is not null
  or students.guardian_name is not null;

alter table public.student_biodata enable row level security;

revoke all on table public.student_biodata from anon, authenticated;
grant select on table public.student_biodata to authenticated;
grant insert (
  student_id,
  photo_path,
  student_phone,
  father_name,
  father_education,
  father_occupation,
  father_address,
  father_phone,
  mother_name,
  mother_education,
  mother_occupation,
  mother_address,
  mother_phone,
  guardian_name,
  guardian_education,
  guardian_occupation,
  guardian_address,
  guardian_phone,
  created_by,
  updated_by
) on public.student_biodata to authenticated;
grant update (
  photo_path,
  student_phone,
  father_name,
  father_education,
  father_occupation,
  father_address,
  father_phone,
  mother_name,
  mother_education,
  mother_occupation,
  mother_address,
  mother_phone,
  guardian_name,
  guardian_education,
  guardian_occupation,
  guardian_address,
  guardian_phone,
  updated_by
) on public.student_biodata to authenticated;

create policy student_biodata_admin_select
on public.student_biodata
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

create policy student_biodata_admin_insert
on public.student_biodata
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

create policy student_biodata_admin_update
on public.student_biodata
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

create policy student_biodata_homeroom_select
on public.student_biodata
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
    where class_members.student_id = student_biodata.student_id
      and class_members.semester_id = classes.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
);

create policy student_biodata_homeroom_insert
on public.student_biodata
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
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
    where class_members.student_id = student_biodata.student_id
      and class_members.semester_id = classes.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
);

create policy student_biodata_homeroom_update
on public.student_biodata
for update
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
    where class_members.student_id = student_biodata.student_id
      and class_members.semester_id = classes.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
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
    where class_members.student_id = student_biodata.student_id
      and class_members.semester_id = classes.semester_id
      and teacher_profiles.user_id = (select auth.uid())
      and teacher_profiles.is_active
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'student-photos',
  'student-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy student_photos_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-photos'
  and (
    exists (
      select 1
      from public.profiles
      join public.students
        on students.id::text = split_part(storage.objects.name, '/', 1)
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
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
        where class_members.student_id::text = split_part(storage.objects.name, '/', 1)
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
);

create policy student_photos_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-photos'
  and storage.objects.name = split_part(storage.objects.name, '/', 1) || '/photo'
  and (
    exists (
      select 1
      from public.profiles
      join public.students
        on students.id::text = split_part(storage.objects.name, '/', 1)
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
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
        where class_members.student_id::text = split_part(storage.objects.name, '/', 1)
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
);

create policy student_photos_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-photos'
  and (
    exists (
      select 1
      from public.profiles
      join public.students
        on students.id::text = split_part(storage.objects.name, '/', 1)
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
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
        where class_members.student_id::text = split_part(storage.objects.name, '/', 1)
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
)
with check (
  bucket_id = 'student-photos'
  and storage.objects.name = split_part(storage.objects.name, '/', 1) || '/photo'
  and (
    exists (
      select 1
      from public.profiles
      join public.students
        on students.id::text = split_part(storage.objects.name, '/', 1)
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
        and profiles.is_active
    )
    or (
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
        where class_members.student_id::text = split_part(storage.objects.name, '/', 1)
          and class_members.semester_id = classes.semester_id
          and teacher_profiles.user_id = (select auth.uid())
          and teacher_profiles.is_active
      )
    )
  )
);
