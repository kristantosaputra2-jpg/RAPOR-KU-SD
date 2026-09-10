import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const studentColumns =
  "id,full_name,nis,nisn,gender,birth_place,birth_date,religion,address,father_name,mother_name,guardian_name,is_active,created_at,updated_at"
const membershipColumns =
  "id,student_id,class_id,semester_id,created_at,updated_at"

export type Student = Pick<
  Tables<"students">,
  | "id"
  | "full_name"
  | "nis"
  | "nisn"
  | "gender"
  | "birth_place"
  | "birth_date"
  | "religion"
  | "address"
  | "father_name"
  | "mother_name"
  | "guardian_name"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type ClassMembership = Pick<
  Tables<"class_members">,
  "id" | "student_id" | "class_id" | "semester_id" | "created_at" | "updated_at"
>

export type StudentGender = "male" | "female"

export type StudentInput = Readonly<{
  fullName: string
  nis: string
  nisn: string
  gender: StudentGender
  birthPlace: string
  birthDate: string
  religion: string
  address: string
  fatherName: string
  motherName: string
  guardianName: string
}>

export type NormalizedStudentInput = Readonly<{
  full_name: string
  nis: string
  nisn: string | null
  gender: StudentGender
  birth_place: string | null
  birth_date: string | null
  religion: string | null
  address: string | null
  father_name: string | null
  mother_name: string | null
  guardian_name: string | null
}>

export class StudentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentError"
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

function optionalText(value: string, maxLength: number, label: string) {
  const normalized = value.trim()

  if (normalized.length > maxLength) {
    throw new StudentError(`${label} maksimal ${maxLength} karakter.`)
  }

  return normalized || null
}

function todayDateValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function normalizeStudentInput(
  input: StudentInput,
): NormalizedStudentInput {
  const fullName = input.fullName.trim()
  const nis = input.nis.trim()
  const nisn = input.nisn.trim()

  if (!fullName) {
    throw new StudentError("Nama lengkap wajib diisi.")
  }

  if (fullName.length > 160) {
    throw new StudentError("Nama lengkap maksimal 160 karakter.")
  }

  if (!nis) {
    throw new StudentError("NIS wajib diisi.")
  }

  if (nis.length > 30 || !/^[a-zA-Z0-9./-]+$/.test(nis)) {
    throw new StudentError(
      "NIS maksimal 30 karakter dan hanya boleh berisi huruf, angka, titik, garis miring, atau tanda hubung.",
    )
  }

  if (nisn && !/^\d{10}$/.test(nisn)) {
    throw new StudentError("NISN harus terdiri dari 10 angka.")
  }

  if (input.gender !== "male" && input.gender !== "female") {
    throw new StudentError("Pilih jenis kelamin siswa.")
  }

  if (input.birthDate) {
    const today = todayDateValue()
    if (input.birthDate > today) {
      throw new StudentError("Tanggal lahir tidak boleh melebihi hari ini.")
    }
  }

  return {
    full_name: fullName,
    nis,
    nisn: nisn || null,
    gender: input.gender,
    birth_place: optionalText(input.birthPlace, 100, "Tempat lahir"),
    birth_date: input.birthDate || null,
    religion: optionalText(input.religion, 80, "Agama"),
    address: optionalText(input.address, 500, "Alamat"),
    father_name: optionalText(input.fatherName, 160, "Nama ayah"),
    mother_name: optionalText(input.motherName, 160, "Nama ibu"),
    guardian_name: optionalText(input.guardianName, 160, "Nama wali"),
  }
}

function saveErrorMessage(error: unknown, action: "create" | "update") {
  if (errorCode(error) === "23505") {
    return "NIS atau NISN tersebut sudah digunakan siswa lain."
  }

  if (errorCode(error) === "23514") {
    return "Data siswa belum sesuai. Periksa kembali NIS, NISN, dan tanggal lahir."
  }

  return action === "create"
    ? "Data siswa belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
    : "Perubahan siswa belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
}

export async function getStudents(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Student>> {
  const { data, error } = await client
    .from("students")
    .select(studentColumns)
    .order("full_name", { ascending: true })

  if (error) {
    throw new StudentError(
      "Data siswa belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function getClassMemberships(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<ClassMembership>> {
  const { data, error } = await client
    .from("class_members")
    .select(membershipColumns)
    .order("created_at", { ascending: false })

  if (error) {
    throw new StudentError(
      "Penempatan kelas siswa belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function createStudent(
  userId: string,
  input: StudentInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Student> {
  const normalized = normalizeStudentInput(input)
  const insert: Database["public"]["Tables"]["students"]["Insert"] = {
    ...normalized,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("students")
    .insert(insert)
    .select(studentColumns)
    .single()

  if (error || !data) {
    throw new StudentError(saveErrorMessage(error, "create"))
  }

  return data
}

export async function updateStudent(
  userId: string,
  studentId: string,
  input: StudentInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Student> {
  const normalized = normalizeStudentInput(input)
  const update: Database["public"]["Tables"]["students"]["Update"] = {
    ...normalized,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("students")
    .update(update)
    .eq("id", studentId)
    .select(studentColumns)
    .single()

  if (error || !data) {
    throw new StudentError(saveErrorMessage(error, "update"))
  }

  return data
}

export async function setStudentActive(
  userId: string,
  studentId: string,
  isActive: boolean,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Student> {
  const update: Database["public"]["Tables"]["students"]["Update"] = {
    is_active: isActive,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("students")
    .update(update)
    .eq("id", studentId)
    .select(studentColumns)
    .single()

  if (error || !data) {
    throw new StudentError(
      "Status siswa belum dapat diubah. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function assignStudentToClass(
  userId: string,
  studentId: string,
  classId: string,
  semesterId: string,
  existingMembership: ClassMembership | undefined,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ClassMembership> {
  if (existingMembership?.class_id === classId) {
    return existingMembership
  }

  if (existingMembership) {
    const update: Database["public"]["Tables"]["class_members"]["Update"] = {
      class_id: classId,
      updated_by: userId,
    }
    const { data, error } = await client
      .from("class_members")
      .update(update)
      .eq("id", existingMembership.id)
      .select(membershipColumns)
      .single()

    if (error || !data) {
      throw new StudentError(
        "Kelas siswa belum dapat diubah. Periksa koneksi internet lalu coba lagi.",
      )
    }

    return data
  }

  const insert: Database["public"]["Tables"]["class_members"]["Insert"] = {
    student_id: studentId,
    class_id: classId,
    semester_id: semesterId,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("class_members")
    .insert(insert)
    .select(membershipColumns)
    .single()

  if (error || !data) {
    throw new StudentError(
      "Siswa sudah tersimpan, tetapi belum dapat ditempatkan ke kelas. Coba edit siswa kembali.",
    )
  }

  return data
}

export async function removeStudentFromClass(
  membershipId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const { error } = await client
    .from("class_members")
    .delete()
    .eq("id", membershipId)

  if (error) {
    throw new StudentError(
      "Penempatan kelas belum dapat dihapus. Periksa koneksi internet lalu coba lagi.",
    )
  }
}
