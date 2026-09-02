create table public.schools (
  id uuid primary key default gen_random_uuid(),
  singleton_key boolean not null default true,
  school_name text not null,
  npsn text,
  address text,
  village text,
  district text,
  city text,
  province text,
  postal_code text,
  email text,
  principal_name text,
  principal_nip text,
  logo_url text,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_singleton_key_unique unique (singleton_key),
  constraint schools_singleton_key_true check (singleton_key),
  constraint schools_name_length check (
    char_length(btrim(school_name)) between 1 and 160
  ),
  constraint schools_npsn_length check (
    npsn is null or char_length(btrim(npsn)) between 1 and 20
  ),
  constraint schools_address_length check (
    address is null or char_length(btrim(address)) between 1 and 500
  ),
  constraint schools_village_length check (
    village is null or char_length(btrim(village)) between 1 and 120
  ),
  constraint schools_district_length check (
    district is null or char_length(btrim(district)) between 1 and 120
  ),
  constraint schools_city_length check (
    city is null or char_length(btrim(city)) between 1 and 120
  ),
  constraint schools_province_length check (
    province is null or char_length(btrim(province)) between 1 and 120
  ),
  constraint schools_postal_code_length check (
    postal_code is null or char_length(btrim(postal_code)) between 1 and 10
  ),
  constraint schools_email_length check (
    email is null or char_length(btrim(email)) between 3 and 254
  ),
  constraint schools_principal_name_length check (
    principal_name is null or char_length(btrim(principal_name)) between 1 and 160
  ),
  constraint schools_principal_nip_length check (
    principal_nip is null or char_length(btrim(principal_nip)) between 1 and 30
  ),
  constraint schools_logo_url_length check (
    logo_url is null or char_length(btrim(logo_url)) between 1 and 2048
  )
);

create index schools_created_by_idx on public.schools (created_by);
create index schools_updated_by_idx on public.schools (updated_by);

comment on table public.schools is
  'Editable school identity for this single-school deployment. At most one row is allowed.';

comment on column public.schools.singleton_key is
  'Enforces one school configuration row per deployment.';

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger schools_set_updated_at
before update on public.schools
for each row execute function private.set_updated_at();

alter table public.schools enable row level security;

revoke all on table public.schools from anon, authenticated;
grant select, insert on table public.schools to authenticated;
grant update (
  school_name,
  npsn,
  address,
  village,
  district,
  city,
  province,
  postal_code,
  email,
  principal_name,
  principal_nip,
  logo_url,
  updated_by
) on public.schools to authenticated;

create policy schools_active_users_select
on public.schools
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
  )
);

create policy schools_admin_insert
on public.schools
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

create policy schools_admin_update
on public.schools
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
