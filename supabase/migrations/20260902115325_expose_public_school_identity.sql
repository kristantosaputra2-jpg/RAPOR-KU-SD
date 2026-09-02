create view public.public_school_identity
with (security_barrier = true, security_invoker = false)
as
select
  school_name,
  logo_url
from public.schools
where singleton_key = true;

comment on view public.public_school_identity is
  'Public deployment branding. Only the school name and optional logo are exposed; private school details remain protected by RLS.';

revoke all on table public.public_school_identity from public, anon, authenticated;
grant select on table public.public_school_identity to anon, authenticated;
