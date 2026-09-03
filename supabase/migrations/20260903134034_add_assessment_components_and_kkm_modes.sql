create table public.assessment_components (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  display_order smallint not null,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete restrict,
  updated_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_components_code_length check (char_length(btrim(code)) between 1 and 40),
  constraint assessment_components_name_length check (char_length(btrim(name)) between 1 and 100),
  constraint assessment_components_display_order_valid check (display_order > 0),
  constraint assessment_components_code_unique unique (code),
  constraint assessment_components_name_unique unique (name),
  constraint assessment_components_display_order_unique unique (display_order)
);

insert into public.assessment_components (code, name, display_order)
values
  ('knowledge', 'Pengetahuan', 1),
  ('skills', 'Keterampilan', 2);

create trigger assessment_components_set_updated_at
before update on public.assessment_components
for each row execute function private.set_updated_at();

create table public.grading_settings (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters (id) on delete restrict,
  kkm_mode text not null,
  single_kkm smallint,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grading_settings_semester_unique unique (semester_id),
  constraint grading_settings_mode_valid check (kkm_mode in ('single', 'multi')),
  constraint grading_settings_single_kkm_valid check (
    (kkm_mode = 'single' and single_kkm between 1 and 100)
    or (kkm_mode = 'multi' and single_kkm is null)
  )
);

create index grading_settings_created_by_idx on public.grading_settings (created_by);
create index grading_settings_updated_by_idx on public.grading_settings (updated_by);

create trigger grading_settings_set_updated_at
before update on public.grading_settings
for each row execute function private.set_updated_at();

create table public.subject_kkm_rules (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters (id) on delete restrict,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  minimum_mastery_score smallint not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subject_kkm_rules_scope_unique unique (semester_id, subject_id),
  constraint subject_kkm_rules_score_valid check (minimum_mastery_score between 1 and 100)
);

create index subject_kkm_rules_subject_id_idx on public.subject_kkm_rules (subject_id);
create index subject_kkm_rules_created_by_idx on public.subject_kkm_rules (created_by);
create index subject_kkm_rules_updated_by_idx on public.subject_kkm_rules (updated_by);

create trigger subject_kkm_rules_set_updated_at
before update on public.subject_kkm_rules
for each row execute function private.set_updated_at();

comment on table public.assessment_components is
  'Configurable assessment dimensions. The approved MVP starts with knowledge and skills.';
comment on table public.grading_settings is
  'Chooses one school-wide KKM or subject-specific KKM for a semester.';
comment on table public.subject_kkm_rules is
  'Stores one configurable KKM per subject and semester when multi KKM mode is active.';

alter table public.assessment_components enable row level security;
alter table public.grading_settings enable row level security;
alter table public.subject_kkm_rules enable row level security;

revoke all on table public.assessment_components from anon, authenticated;
grant select on table public.assessment_components to authenticated;
grant insert (code, name, display_order, is_active, created_by, updated_by)
on public.assessment_components to authenticated;
grant update (code, name, display_order, is_active, updated_by)
on public.assessment_components to authenticated;

revoke all on table public.grading_settings from anon, authenticated;
grant select on table public.grading_settings to authenticated;
grant insert (semester_id, kkm_mode, single_kkm, created_by, updated_by)
on public.grading_settings to authenticated;
grant update (kkm_mode, single_kkm, updated_by)
on public.grading_settings to authenticated;

revoke all on table public.subject_kkm_rules from anon, authenticated;
grant select on table public.subject_kkm_rules to authenticated;
grant insert (semester_id, subject_id, minimum_mastery_score, created_by, updated_by)
on public.subject_kkm_rules to authenticated;
grant update (minimum_mastery_score, updated_by)
on public.subject_kkm_rules to authenticated;

create policy assessment_components_active_select
on public.assessment_components for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
      and (assessment_components.is_active or profiles.role = 'admin')
  )
);

create policy assessment_components_admin_insert
on public.assessment_components for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy assessment_components_admin_update
on public.assessment_components for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy grading_settings_active_user_select
on public.grading_settings for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
  )
);

create policy grading_settings_admin_insert
on public.grading_settings for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy grading_settings_admin_update
on public.grading_settings for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy subject_kkm_rules_active_user_select
on public.subject_kkm_rules for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_active
  )
);

create policy subject_kkm_rules_admin_insert
on public.subject_kkm_rules for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);

create policy subject_kkm_rules_admin_update
on public.subject_kkm_rules for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.is_active
  )
);
