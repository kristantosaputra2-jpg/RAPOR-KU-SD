create function public.import_students_to_class(
  p_class_id uuid,
  p_semester_id uuid,
  p_students jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_student jsonb;
  v_student_id uuid;
  v_imported_count integer := 0;
begin
  if v_user_id is null or not exists (
    select 1
    from public.profiles
    where profiles.id = v_user_id
      and profiles.role = 'admin'
      and profiles.is_active
  ) then
    raise exception 'Only an active admin can import students.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.classes
    where classes.id = p_class_id
      and classes.semester_id = p_semester_id
  ) then
    raise exception 'Class and semester do not match.'
      using errcode = '23503';
  end if;

  if jsonb_typeof(p_students) is distinct from 'array'
    or jsonb_array_length(p_students) < 1
    or jsonb_array_length(p_students) > 500
  then
    raise exception 'Import must contain between 1 and 500 students.'
      using errcode = '22023';
  end if;

  for v_student in
    select value
    from jsonb_array_elements(p_students)
  loop
    insert into public.students (
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
      created_by,
      updated_by
    )
    values (
      btrim(v_student->>'full_name'),
      btrim(v_student->>'nis'),
      nullif(btrim(v_student->>'nisn'), ''),
      (v_student->>'gender')::public.student_gender,
      nullif(btrim(v_student->>'birth_place'), ''),
      nullif(v_student->>'birth_date', '')::date,
      nullif(btrim(v_student->>'religion'), ''),
      nullif(btrim(v_student->>'address'), ''),
      nullif(btrim(v_student->>'father_name'), ''),
      nullif(btrim(v_student->>'mother_name'), ''),
      nullif(btrim(v_student->>'guardian_name'), ''),
      v_user_id,
      v_user_id
    )
    returning id into v_student_id;

    insert into public.class_members (
      student_id,
      class_id,
      semester_id,
      created_by,
      updated_by
    )
    values (
      v_student_id,
      p_class_id,
      p_semester_id,
      v_user_id,
      v_user_id
    );

    v_imported_count := v_imported_count + 1;
  end loop;

  return v_imported_count;
end;
$$;

revoke all on function public.import_students_to_class(uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.import_students_to_class(uuid, uuid, jsonb)
to authenticated;

comment on function public.import_students_to_class(uuid, uuid, jsonb) is
  'Atomically imports validated students and their class membership for an active admin.';
