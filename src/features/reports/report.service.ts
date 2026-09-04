import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

import type { ReportSourceData } from "./report-view-model"

export class ReportPreviewError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportPreviewError"
  }
}

export async function getReportSourceData(
  classId: string,
  semesterId: string,
  studentId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReportSourceData> {
  const [
    schoolResult,
    assignmentResult,
    subjectResult,
    componentResult,
    gradeResult,
    descriptionResult,
    gradingSettingResult,
    subjectKkmResult,
    attendanceResult,
    extracurricularCatalogResult,
    extracurricularResult,
    achievementResult,
    noteResult,
  ] = await Promise.all([
    client
      .from("schools")
      .select(
        "id,school_name,npsn,address,village,district,city,province,postal_code,email,principal_name,principal_nip,logo_url,updated_at",
      )
      .eq("singleton_key", true)
      .maybeSingle(),
    client
      .from("teacher_assignments")
      .select("subject_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client
      .from("subjects")
      .select(
        "id,name,code,is_local_content,display_order,is_active,created_at,updated_at",
      )
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    client
      .from("assessment_components")
      .select("id,code,name,display_order,is_active")
      .eq("is_active", true)
      .order("display_order"),
    client
      .from("grade_entries")
      .select(
        "id,student_id,class_id,subject_id,learning_outcome_id,assessment_component_id,semester_id,grade_level,score,created_at,updated_at",
      )
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("report_descriptions")
      .select(
        "id,student_id,class_id,subject_id,assessment_component_id,semester_id,grade_level,strongest_outcome_id,weakest_outcome_id,generated_description,final_description,created_at,updated_at",
      )
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("grading_settings")
      .select("semester_id,kkm_mode,single_kkm")
      .eq("semester_id", semesterId)
      .maybeSingle(),
    client
      .from("subject_kkm_rules")
      .select("semester_id,subject_id,minimum_mastery_score")
      .eq("semester_id", semesterId),
    client
      .from("attendance")
      .select(
        "id,student_id,class_id,semester_id,sick_days,permitted_days,absent_days,created_at,updated_at",
      )
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .maybeSingle(),
    client
      .from("extracurriculars")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    client
      .from("student_extracurriculars")
      .select("student_id,extracurricular_id,achievement,description")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("achievements")
      .select(
        "id,student_id,class_id,semester_id,achievement_type,achievement_level,description,event_year,event_date,created_at,updated_at",
      )
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .order("event_year", { ascending: false }),
    client
      .from("homeroom_notes")
      .select("id,student_id,class_id,semester_id,note,created_at,updated_at")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .maybeSingle(),
  ])

  const results = [
    schoolResult,
    assignmentResult,
    subjectResult,
    componentResult,
    gradeResult,
    descriptionResult,
    gradingSettingResult,
    subjectKkmResult,
    attendanceResult,
    extracurricularCatalogResult,
    extracurricularResult,
    achievementResult,
    noteResult,
  ]
  if (results.some((result) => result.error)) {
    throw new ReportPreviewError(
      "Preview rapor belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }

  return {
    school: schoolResult.data,
    assignedSubjectIds: [
      ...new Set((assignmentResult.data ?? []).map((item) => item.subject_id)),
    ],
    subjects: subjectResult.data ?? [],
    assessmentComponents: componentResult.data ?? [],
    gradeEntries: gradeResult.data ?? [],
    descriptions: descriptionResult.data ?? [],
    gradingSetting: gradingSettingResult.data,
    subjectKkmRules: subjectKkmResult.data ?? [],
    attendance: attendanceResult.data,
    extracurricularCatalog: extracurricularCatalogResult.data ?? [],
    extracurricularEntries: extracurricularResult.data ?? [],
    achievements: achievementResult.data ?? [],
    homeroomNote: noteResult.data,
  }
}
