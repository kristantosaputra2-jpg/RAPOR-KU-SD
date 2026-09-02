drop view public.public_school_identity;

create table public.public_school_identity (
  singleton_key boolean primary key default true,
  school_name text not null,
  logo_url text,
  updated_at timestamptz not null default now(),
  constraint public_school_identity_singleton_true check (singleton_key),
  constraint public_school_identity_name_length check (
    char_length(btrim(school_name)) between 1 and 160
  ),
  constraint public_school_identity_logo_url_length check (
    logo_url is null or char_length(btrim(logo_url)) between 1 and 2048
  )
);

comment on table public.public_school_identity is
  'Public deployment branding. Only the school name and optional logo are exposed.';

alter table public.public_school_identity enable row level security;

revoke all on table public.public_school_identity from public, anon, authenticated;
grant select on table public.public_school_identity to anon, authenticated;

create policy public_school_identity_select
on public.public_school_identity
for select
to anon, authenticated
using (true);

create function private.sync_public_school_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.public_school_identity (
    singleton_key,
    school_name,
    logo_url,
    updated_at
  )
  values (
    true,
    new.school_name,
    new.logo_url,
    new.updated_at
  )
  on conflict (singleton_key)
  do update set
    school_name = excluded.school_name,
    logo_url = excluded.logo_url,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_public_school_identity()
from public, anon, authenticated;

create trigger schools_sync_public_identity
after insert or update of school_name, logo_url
on public.schools
for each row execute function private.sync_public_school_identity();

insert into public.public_school_identity (
  singleton_key,
  school_name,
  logo_url,
  updated_at
)
select
  true,
  school_name,
  logo_url,
  updated_at
from public.schools
where singleton_key = true;
