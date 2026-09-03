import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const assignmentColumns =
  "id,teacher_id,class_id,subject_id,academic_year_id,semester_id,is_active,created_at,updated_at"

export type TeacherAssignment = Pick<
  Tables<"teacher_assignments">,
  | "id"
  | "teacher_id"
  | "class_id"
  | "subject_id"
  | "academic_year_id"
  | "semester_id"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type AssignmentInput = Readonly<{
  teacherId: string
  classId: string
  subjectId: string
  academicYearId: string
  semesterId: string
}>

export class AssignmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AssignmentError"
  }
}

export function validateAssignmentInput(input: AssignmentInput) {
  if (!input.classId) throw new AssignmentError("Pilih kelas.")
  if (!input.subjectId) throw new AssignmentError("Pilih mata pelajaran.")
  if (!input.teacherId) throw new AssignmentError("Pilih guru.")
  if (!input.academicYearId || !input.semesterId) {
    throw new AssignmentError("Periode kelas belum lengkap. Muat ulang data.")
  }
  return input
}

function saveError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : ""
  if (code === "23505") {
    return "Mata pelajaran tersebut sudah memiliki guru di kelas ini. Edit penugasan yang ada."
  }
  if (code === "23503") {
    return "Guru, kelas, mata pelajaran, atau periode tidak cocok. Muat ulang lalu coba lagi."
  }
  return "Penugasan belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
}

export async function getTeacherAssignments(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<TeacherAssignment>> {
  const { data, error } = await client
    .from("teacher_assignments")
    .select(assignmentColumns)
    .order("created_at", { ascending: false })
  if (error) {
    throw new AssignmentError(
      "Penugasan belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }
  return data
}

export async function createTeacherAssignment(
  userId: string,
  input: AssignmentInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<TeacherAssignment> {
  const valid = validateAssignmentInput(input)
  const insert: Database["public"]["Tables"]["teacher_assignments"]["Insert"] =
    {
      teacher_id: valid.teacherId,
      class_id: valid.classId,
      subject_id: valid.subjectId,
      academic_year_id: valid.academicYearId,
      semester_id: valid.semesterId,
      created_by: userId,
      updated_by: userId,
    }
  const { data, error } = await client
    .from("teacher_assignments")
    .insert(insert)
    .select(assignmentColumns)
    .single()
  if (error || !data) throw new AssignmentError(saveError(error))
  return data
}

export async function updateTeacherAssignment(
  userId: string,
  assignmentId: string,
  teacherId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<TeacherAssignment> {
  if (!teacherId) throw new AssignmentError("Pilih guru.")
  const { data, error } = await client
    .from("teacher_assignments")
    .update({ teacher_id: teacherId, updated_by: userId })
    .eq("id", assignmentId)
    .select(assignmentColumns)
    .single()
  if (error || !data) throw new AssignmentError(saveError(error))
  return data
}

export async function setTeacherAssignmentActive(
  userId: string,
  assignmentId: string,
  isActive: boolean,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<TeacherAssignment> {
  const { data, error } = await client
    .from("teacher_assignments")
    .update({ is_active: isActive, updated_by: userId })
    .eq("id", assignmentId)
    .select(assignmentColumns)
    .single()
  if (error || !data) {
    throw new AssignmentError(
      "Status penugasan belum dapat diubah. Periksa koneksi lalu coba lagi.",
    )
  }
  return data
}
