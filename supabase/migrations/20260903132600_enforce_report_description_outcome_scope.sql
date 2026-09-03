alter table public.report_descriptions
add constraint report_descriptions_strongest_outcome_scope_fkey
foreign key (strongest_outcome_id, subject_id, semester_id, grade_level)
references public.learning_outcomes (id, subject_id, semester_id, grade_level)
on delete restrict;

alter table public.report_descriptions
add constraint report_descriptions_weakest_outcome_scope_fkey
foreign key (weakest_outcome_id, subject_id, semester_id, grade_level)
references public.learning_outcomes (id, subject_id, semester_id, grade_level)
on delete restrict;

create index report_descriptions_strongest_outcome_scope_idx
on public.report_descriptions (
  strongest_outcome_id,
  subject_id,
  semester_id,
  grade_level
);

create index report_descriptions_weakest_outcome_scope_idx
on public.report_descriptions (
  weakest_outcome_id,
  subject_id,
  semester_id,
  grade_level
);
