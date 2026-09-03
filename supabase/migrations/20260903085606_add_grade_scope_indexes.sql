create index grade_entries_membership_scope_idx
on public.grade_entries (student_id, class_id, semester_id);

create index grade_entries_class_grade_scope_idx
on public.grade_entries (class_id, semester_id, grade_level);

create index grade_entries_outcome_scope_idx
on public.grade_entries (
  learning_outcome_id,
  subject_id,
  semester_id,
  grade_level
);

create index grading_rules_class_semester_idx
on public.grading_rules (class_id, semester_id);
