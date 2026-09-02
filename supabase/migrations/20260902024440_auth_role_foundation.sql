create type public.user_role as enum (
  'admin',
  'homeroom_teacher',
  'subject_teacher'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (char_length(btrim(full_name)) between 1 and 120)
);

comment on table public.profiles is
  'Application profile linked to Supabase Auth. Authorization roles are assigned only by a trusted admin flow.';

comment on column public.profiles.role is
  'Null until a trusted admin assigns one of the approved MVP roles.';

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant usage on type public.user_role to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pengguna'
    )
  );

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();
