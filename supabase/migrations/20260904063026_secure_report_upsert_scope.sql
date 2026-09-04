create function private.protect_report_owned_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.student_id is distinct from old.student_id
    or new.class_id is distinct from old.class_id
    or new.semester_id is distinct from old.semester_id
    or new.created_by is distinct from old.created_by then
    raise exception 'Report record ownership and scope cannot be changed.';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_report_owned_scope() from public;

create trigger homeroom_notes_protect_scope
before update on public.homeroom_notes
for each row execute function private.protect_report_owned_scope();

create trigger report_completion_confirmations_protect_scope
before update on public.report_completion_confirmations
for each row execute function private.protect_report_owned_scope();

grant update (student_id, class_id, semester_id, created_by)
on public.homeroom_notes to authenticated;

grant update (student_id, class_id, semester_id, created_by)
on public.report_completion_confirmations to authenticated;
