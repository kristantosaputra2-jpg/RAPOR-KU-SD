import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const columns =
  "id,student_id,class_id,subject_id,assessment_component_id,semester_id,grade_level,strongest_outcome_id,weakest_outcome_id,generated_description,final_description,created_at,updated_at"

export type ReportDescription = Pick<
  Tables<"report_descriptions">,
  | "id"
  | "student_id"
  | "class_id"
  | "subject_id"
  | "assessment_component_id"
  | "semester_id"
  | "grade_level"
  | "strongest_outcome_id"
  | "weakest_outcome_id"
  | "generated_description"
  | "final_description"
  | "created_at"
  | "updated_at"
>

export type ReportDescriptionInput = Readonly<{
  studentId: string
  classId: string
  subjectId: string
  assessmentComponentId: string
  semesterId: string
  gradeLevel: number
  strongestOutcomeId: string
  weakestOutcomeId: string | null
  generatedDescription: string
  finalDescription: string
}>

export class ReportDescriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportDescriptionError"
  }
}

export async function getReportDescriptions(
  scope: Readonly<{ classId: string; subjectId: string; semesterId: string }>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<ReportDescription>> {
  const { data, error } = await client
    .from("report_descriptions")
    .select(columns)
    .eq("class_id", scope.classId)
    .eq("subject_id", scope.subjectId)
    .eq("semester_id", scope.semesterId)
  if (error)
    throw new ReportDescriptionError(
      "Deskripsi belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  return data
}

export async function saveReportDescription(
  userId: string,
  input: ReportDescriptionInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReportDescription> {
  const generated = input.generatedDescription.trim()
  const final = input.finalDescription.trim()
  if (!generated || !final || generated.length > 2000 || final.length > 2000) {
    throw new ReportDescriptionError(
      "Deskripsi wajib diisi dan maksimal 2.000 karakter.",
    )
  }
  const row: Database["public"]["Tables"]["report_descriptions"]["Insert"] = {
    student_id: input.studentId,
    class_id: input.classId,
    subject_id: input.subjectId,
    assessment_component_id: input.assessmentComponentId,
    semester_id: input.semesterId,
    grade_level: input.gradeLevel,
    strongest_outcome_id: input.strongestOutcomeId,
    weakest_outcome_id: input.weakestOutcomeId,
    generated_description: generated,
    final_description: final,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("report_descriptions")
    .upsert(row, {
      onConflict:
        "student_id,class_id,subject_id,assessment_component_id,semester_id",
    })
    .select(columns)
    .single()
  if (error || !data)
    throw new ReportDescriptionError(
      "Deskripsi belum dapat disimpan. Periksa koneksi lalu coba lagi.",
    )
  return data
}
