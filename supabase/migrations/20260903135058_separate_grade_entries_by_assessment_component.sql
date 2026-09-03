alter table public.grade_entries
add column assessment_component_id uuid references public.assessment_components (id) on delete restrict;

update public.grade_entries
set assessment_component_id = (
  select id from public.assessment_components where code = 'knowledge'
)
where assessment_component_id is null;

alter table public.grade_entries
alter column assessment_component_id set not null;

alter table public.grade_entries
drop constraint grade_entries_scope_unique;

alter table public.grade_entries
add constraint grade_entries_component_scope_unique
unique (
  student_id,
  class_id,
  subject_id,
  learning_outcome_id,
  assessment_component_id,
  semester_id
);

create index grade_entries_assessment_component_id_idx
on public.grade_entries (assessment_component_id);

grant insert (assessment_component_id) on public.grade_entries to authenticated;

alter table public.report_descriptions
add column assessment_component_id uuid references public.assessment_components (id) on delete restrict;

update public.report_descriptions
set assessment_component_id = (
  select id from public.assessment_components where code = 'knowledge'
)
where assessment_component_id is null;

alter table public.report_descriptions
alter column assessment_component_id set not null;

alter table public.report_descriptions
drop constraint report_descriptions_scope_unique;

alter table public.report_descriptions
add constraint report_descriptions_component_scope_unique
unique (
  student_id,
  class_id,
  subject_id,
  assessment_component_id,
  semester_id
);

create index report_descriptions_assessment_component_id_idx
on public.report_descriptions (assessment_component_id);

grant insert (assessment_component_id) on public.report_descriptions to authenticated;

comment on column public.grade_entries.assessment_component_id is
  'Separates each CP score into a configurable assessment component such as knowledge or skills.';
comment on column public.report_descriptions.assessment_component_id is
  'Separates generated and final descriptions for each assessment component.';
