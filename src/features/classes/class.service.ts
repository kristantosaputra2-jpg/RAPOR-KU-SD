import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const classColumns =
  "id,academic_year_id,semester_id,grade_level,name,homeroom_teacher_id,template_group,created_at,updated_at"

export type ClassTemplateGroup = "lower_primary" | "upper_primary"

export type SchoolClass = Pick<
  Tables<"classes">,
  | "id"
  | "academic_year_id"
  | "semester_id"
  | "grade_level"
  | "name"
  | "homeroom_teacher_id"
  | "template_group"
  | "created_at"
  | "updated_at"
>

export type ClassInput = Readonly<{
  academicYearId: string
  semesterId: string
  gradeLevel: number
  name: string
  homeroomTeacherId: string
}>

type NormalizedClassInput = Readonly<{
  academic_year_id: string
  semester_id: string
  grade_level: number
  name: string
  homeroom_teacher_id: string | null
}>

export class ClassError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ClassError"
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : ""
}

export function getClassTemplateGroup(gradeLevel: number): ClassTemplateGroup {
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 6) {
    throw new ClassError("Tingkat kelas harus antara 1 sampai 6.")
  }

  return gradeLevel <= 3 ? "lower_primary" : "upper_primary"
}

export function normalizeClassInput(input: ClassInput): NormalizedClassInput {
  const name = input.name.trim()

  getClassTemplateGroup(input.gradeLevel)

  if (!name) {
    throw new ClassError("Nama rombel wajib diisi.")
  }

  if (name.length > 80) {
    throw new ClassError("Nama rombel maksimal 80 karakter.")
  }

  if (!input.academicYearId) {
    throw new ClassError("Pilih tahun ajaran.")
  }

  if (!input.semesterId) {
    throw new ClassError("Pilih semester.")
  }

  return {
    academic_year_id: input.academicYearId,
    semester_id: input.semesterId,
    grade_level: input.gradeLevel,
    name,
    homeroom_teacher_id: input.homeroomTeacherId || null,
  }
}

function saveErrorMessage(error: unknown, action: "create" | "update") {
  if (errorCode(error) === "23505") {
    return "Nama rombel tersebut sudah digunakan pada semester yang dipilih."
  }

  if (errorCode(error) === "23503") {
    return "Tahun ajaran, semester, atau wali kelas tidak cocok. Muat ulang lalu coba lagi."
  }

  return action === "create"
    ? "Data kelas belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
    : "Perubahan kelas belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
}

export async function getClasses(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<SchoolClass>> {
  const { data, error } = await client
    .from("classes")
    .select(classColumns)
    .order("created_at", { ascending: false })

  if (error) {
    throw new ClassError(
      "Data kelas belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function createClass(
  userId: string,
  input: ClassInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SchoolClass> {
  const normalized = normalizeClassInput(input)
  const insert: Database["public"]["Tables"]["classes"]["Insert"] = {
    ...normalized,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("classes")
    .insert(insert)
    .select(classColumns)
    .single()

  if (error || !data) {
    throw new ClassError(saveErrorMessage(error, "create"))
  }

  return data
}

export async function updateClass(
  userId: string,
  classId: string,
  input: ClassInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SchoolClass> {
  const normalized = normalizeClassInput(input)
  const update: Database["public"]["Tables"]["classes"]["Update"] = {
    ...normalized,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("classes")
    .update(update)
    .eq("id", classId)
    .select(classColumns)
    .single()

  if (error || !data) {
    throw new ClassError(saveErrorMessage(error, "update"))
  }

  return data
}
