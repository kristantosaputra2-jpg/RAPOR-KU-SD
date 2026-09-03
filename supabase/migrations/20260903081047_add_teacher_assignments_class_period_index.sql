create index teacher_assignments_class_period_idx
on public.teacher_assignments (class_id, academic_year_id, semester_id);
