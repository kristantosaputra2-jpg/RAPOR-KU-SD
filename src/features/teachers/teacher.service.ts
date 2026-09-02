import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const teacherColumns =
  "id,user_id,full_name,nip,nuptk,email,role,is_active,created_at,updated_at"

export type TeacherRole = "homeroom_teacher" | "subject_teacher"

export type Teacher = Pick<
  Tables<"teacher_profiles">,
  | "id"
  | "user_id"
  | "full_name"
  | "nip"
  | "nuptk"
  | "email"
  | "role"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type TeacherInput = Readonly<{
  fullName: string
  nip: string
  nuptk: string
  email: string
  role: TeacherRole
}>

type NormalizedTeacherInput = Readonly<{
  full_name: string
  nip: string | null
  nuptk: string | null
  email: string
  role: TeacherRole
}>

export class TeacherError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TeacherError"
  }
}

function cleanOptional(value: string): string | null {
  const cleaned = value.trim()
  return cleaned || null
}

function duplicateMessage(error: unknown): string | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "23505"
  ) {
    return null
  }

  const details =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : ""

  if (details.includes("nuptk")) {
    return "NUPTK tersebut sudah digunakan oleh guru lain."
  }

  if (details.includes("nip")) {
    return "NIP tersebut sudah digunakan oleh guru lain."
  }

  return "Email tersebut sudah digunakan oleh guru lain."
}

export function normalizeTeacherInput(
  input: TeacherInput,
): NormalizedTeacherInput {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const nip = cleanOptional(input.nip)
  const nuptk = cleanOptional(input.nuptk)

  if (!fullName) {
    throw new TeacherError("Nama guru wajib diisi.")
  }

  if (fullName.length > 160) {
    throw new TeacherError("Nama guru maksimal 160 karakter.")
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TeacherError("Masukkan alamat email yang valid.")
  }

  if (nip && nip.length > 30) {
    throw new TeacherError("NIP maksimal 30 karakter.")
  }

  if (nuptk && nuptk.length > 30) {
    throw new TeacherError("NUPTK maksimal 30 karakter.")
  }

  if (input.role !== "homeroom_teacher" && input.role !== "subject_teacher") {
    throw new TeacherError("Pilih peran guru yang tersedia.")
  }

  return {
    full_name: fullName,
    email,
    nip,
    nuptk,
    role: input.role,
  }
}

export async function getTeachers(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Teacher>> {
  const { data, error } = await client
    .from("teacher_profiles")
    .select(teacherColumns)
    .order("full_name", { ascending: true })

  if (error) {
    throw new TeacherError(
      "Data guru belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function createTeacher(
  userId: string,
  input: TeacherInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Teacher> {
  const normalized = normalizeTeacherInput(input)
  const insert: Database["public"]["Tables"]["teacher_profiles"]["Insert"] = {
    ...normalized,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("teacher_profiles")
    .insert(insert)
    .select(teacherColumns)
    .single()

  if (error || !data) {
    throw new TeacherError(
      duplicateMessage(error) ??
        "Data guru belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function updateTeacher(
  userId: string,
  teacherId: string,
  input: TeacherInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Teacher> {
  const normalized = normalizeTeacherInput(input)
  const update: Database["public"]["Tables"]["teacher_profiles"]["Update"] = {
    full_name: normalized.full_name,
    email: normalized.email,
    nip: normalized.nip,
    nuptk: normalized.nuptk,
    role: normalized.role,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("teacher_profiles")
    .update(update)
    .eq("id", teacherId)
    .select(teacherColumns)
    .single()

  if (error || !data) {
    throw new TeacherError(
      duplicateMessage(error) ??
        "Perubahan data guru belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function setTeacherActive(
  userId: string,
  teacherId: string,
  isActive: boolean,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Teacher> {
  const update: Database["public"]["Tables"]["teacher_profiles"]["Update"] = {
    is_active: isActive,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("teacher_profiles")
    .update(update)
    .eq("id", teacherId)
    .select(teacherColumns)
    .single()

  if (error || !data) {
    throw new TeacherError(
      isActive
        ? "Guru belum dapat diaktifkan kembali. Periksa koneksi internet lalu coba lagi."
        : "Guru belum dapat dinonaktifkan. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}
