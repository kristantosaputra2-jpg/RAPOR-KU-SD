import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const activityColumns = "id,school_id,name,is_active,created_at,updated_at"
const entryColumns =
  "id,extracurricular_id,student_id,class_id,semester_id,achievement,description,created_at,updated_at"

export type Extracurricular = Pick<
  Tables<"extracurriculars">,
  "id" | "school_id" | "name" | "is_active" | "created_at" | "updated_at"
>
export type StudentExtracurricular = Pick<
  Tables<"student_extracurriculars">,
  | "id"
  | "extracurricular_id"
  | "student_id"
  | "class_id"
  | "semester_id"
  | "achievement"
  | "description"
  | "created_at"
  | "updated_at"
>

export class ExtracurricularError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ExtracurricularError"
  }
}

export function normalizeExtracurricularName(value: string) {
  const name = value.trim()
  if (!name) throw new ExtracurricularError("Nama ekstrakurikuler wajib diisi.")
  if (name.length > 120)
    throw new ExtracurricularError(
      "Nama ekstrakurikuler maksimal 120 karakter.",
    )
  return name
}

function normalizeEntry(value: { achievement: string; description: string }) {
  const achievement = value.achievement.trim()
  const description = value.description.trim()
  if (!achievement)
    throw new ExtracurricularError("Predikat atau capaian wajib diisi.")
  if (achievement.length > 40)
    throw new ExtracurricularError(
      "Predikat atau capaian maksimal 40 karakter.",
    )
  if (!description)
    throw new ExtracurricularError("Deskripsi ekstrakurikuler wajib diisi.")
  if (description.length > 500)
    throw new ExtracurricularError(
      "Deskripsi ekstrakurikuler maksimal 500 karakter.",
    )
  return { achievement, description }
}

export async function getExtracurriculars(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Extracurricular>> {
  const { data, error } = await client
    .from("extracurriculars")
    .select(activityColumns)
    .eq("is_active", true)
    .order("name")
  if (error)
    throw new ExtracurricularError("Daftar ekstrakurikuler belum dapat dimuat.")
  return data
}

export async function createExtracurricular(
  userId: string,
  schoolId: string,
  name: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Extracurricular> {
  const input: Database["public"]["Tables"]["extracurriculars"]["Insert"] = {
    school_id: schoolId,
    name: normalizeExtracurricularName(name),
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("extracurriculars")
    .insert(input)
    .select(activityColumns)
    .single()
  if (error || !data)
    throw new ExtracurricularError(
      "Ekstrakurikuler belum dapat ditambahkan. Pastikan nama belum digunakan.",
    )
  return data
}

export async function getStudentExtracurriculars(
  classId: string,
  semesterId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<StudentExtracurricular>> {
  const { data, error } = await client
    .from("student_extracurriculars")
    .select(entryColumns)
    .eq("class_id", classId)
    .eq("semester_id", semesterId)
  if (error)
    throw new ExtracurricularError(
      "Data ekstrakurikuler siswa belum dapat dimuat.",
    )
  return data
}

export async function saveStudentExtracurriculars(
  userId: string,
  scope: { classId: string; semesterId: string; extracurricularId: string },
  entries: ReadonlyArray<{
    studentId: string
    achievement: string
    description: string
  }>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const rows: Database["public"]["Tables"]["student_extracurriculars"]["Insert"][] =
    entries.map((entry) => ({
      extracurricular_id: scope.extracurricularId,
      student_id: entry.studentId,
      class_id: scope.classId,
      semester_id: scope.semesterId,
      ...normalizeEntry(entry),
      created_by: userId,
      updated_by: userId,
    }))
  if (!rows.length) throw new ExtracurricularError("Pilih minimal satu siswa.")
  const { error } = await client.from("student_extracurriculars").upsert(rows, {
    onConflict: "extracurricular_id,student_id,class_id,semester_id",
  })
  if (error)
    throw new ExtracurricularError(
      "Data ekstrakurikuler siswa belum dapat disimpan. Periksa koneksi lalu coba lagi.",
    )
}
