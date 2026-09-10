import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

const PHOTO_BUCKET = "student-photos"
const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const PHONE_PATTERN = /^[+\d][\d\s()-]*$/

export type StudentBiodata =
  Database["public"]["Tables"]["student_biodata"]["Row"]

export type StudentBiodataInput = Readonly<{
  studentPhone: string
  fatherName: string
  fatherEducation: string
  fatherOccupation: string
  fatherAddress: string
  fatherPhone: string
  motherName: string
  motherEducation: string
  motherOccupation: string
  motherAddress: string
  motherPhone: string
  guardianName: string
  guardianEducation: string
  guardianOccupation: string
  guardianAddress: string
  guardianPhone: string
  photoPath: string
}>

export const emptyStudentBiodataInput: StudentBiodataInput = {
  studentPhone: "",
  fatherName: "",
  fatherEducation: "",
  fatherOccupation: "",
  fatherAddress: "",
  fatherPhone: "",
  motherName: "",
  motherEducation: "",
  motherOccupation: "",
  motherAddress: "",
  motherPhone: "",
  guardianName: "",
  guardianEducation: "",
  guardianOccupation: "",
  guardianAddress: "",
  guardianPhone: "",
  photoPath: "",
}

function optionalText(value: string, label: string, maxLength: number) {
  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw new Error(`${label} maksimal ${maxLength} karakter.`)
  }
  return normalized || null
}

function optionalPhone(value: string, label: string) {
  const normalized = optionalText(value, label, 30)
  if (normalized && !PHONE_PATTERN.test(normalized)) {
    throw new Error(`${label} hanya boleh berisi angka dan tanda telepon.`)
  }
  return normalized
}

export function normalizeStudentBiodataInput(input: StudentBiodataInput) {
  return {
    student_phone: optionalPhone(input.studentPhone, "Nomor telepon siswa"),
    father_name: optionalText(input.fatherName, "Nama ayah", 160),
    father_education: optionalText(
      input.fatherEducation,
      "Pendidikan ayah",
      160,
    ),
    father_occupation: optionalText(
      input.fatherOccupation,
      "Pekerjaan ayah",
      160,
    ),
    father_address: optionalText(input.fatherAddress, "Alamat ayah", 500),
    father_phone: optionalPhone(input.fatherPhone, "Nomor telepon ayah"),
    mother_name: optionalText(input.motherName, "Nama ibu", 160),
    mother_education: optionalText(
      input.motherEducation,
      "Pendidikan ibu",
      160,
    ),
    mother_occupation: optionalText(
      input.motherOccupation,
      "Pekerjaan ibu",
      160,
    ),
    mother_address: optionalText(input.motherAddress, "Alamat ibu", 500),
    mother_phone: optionalPhone(input.motherPhone, "Nomor telepon ibu"),
    guardian_name: optionalText(input.guardianName, "Nama wali", 160),
    guardian_education: optionalText(
      input.guardianEducation,
      "Pendidikan wali",
      160,
    ),
    guardian_occupation: optionalText(
      input.guardianOccupation,
      "Pekerjaan wali",
      160,
    ),
    guardian_address: optionalText(input.guardianAddress, "Alamat wali", 500),
    guardian_phone: optionalPhone(input.guardianPhone, "Nomor telepon wali"),
    photo_path: optionalText(input.photoPath, "Lokasi foto", 300),
  }
}

export function inputFromStudentBiodata(
  biodata: StudentBiodata | null,
  legacyNames?: Readonly<{
    fatherName?: string | null
    motherName?: string | null
    guardianName?: string | null
  }>,
): StudentBiodataInput {
  return {
    studentPhone: biodata?.student_phone ?? "",
    fatherName: biodata?.father_name ?? legacyNames?.fatherName ?? "",
    fatherEducation: biodata?.father_education ?? "",
    fatherOccupation: biodata?.father_occupation ?? "",
    fatherAddress: biodata?.father_address ?? "",
    fatherPhone: biodata?.father_phone ?? "",
    motherName: biodata?.mother_name ?? legacyNames?.motherName ?? "",
    motherEducation: biodata?.mother_education ?? "",
    motherOccupation: biodata?.mother_occupation ?? "",
    motherAddress: biodata?.mother_address ?? "",
    motherPhone: biodata?.mother_phone ?? "",
    guardianName: biodata?.guardian_name ?? legacyNames?.guardianName ?? "",
    guardianEducation: biodata?.guardian_education ?? "",
    guardianOccupation: biodata?.guardian_occupation ?? "",
    guardianAddress: biodata?.guardian_address ?? "",
    guardianPhone: biodata?.guardian_phone ?? "",
    photoPath: biodata?.photo_path ?? "",
  }
}

export async function getStudentBiodata(
  studentId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
) {
  const { data, error } = await client
    .from("student_biodata")
    .select(
      "student_id,photo_path,student_phone,father_name,father_education,father_occupation,father_address,father_phone,mother_name,mother_education,mother_occupation,mother_address,mother_phone,guardian_name,guardian_education,guardian_occupation,guardian_address,guardian_phone,created_by,updated_by,created_at,updated_at",
    )
    .eq("student_id", studentId)
    .maybeSingle()

  if (error) {
    throw new Error("Biodata keluarga belum dapat dimuat. Coba lagi.")
  }
  return data
}

export async function saveStudentBiodata(
  userId: string,
  studentId: string,
  input: StudentBiodataInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
) {
  const values = normalizeStudentBiodataInput(input)
  const { data: existing, error: lookupError } = await client
    .from("student_biodata")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle()

  if (lookupError) {
    throw new Error("Biodata keluarga belum dapat disimpan. Coba lagi.")
  }

  const query = existing
    ? client
        .from("student_biodata")
        .update({ ...values, updated_by: userId })
        .eq("student_id", studentId)
    : client.from("student_biodata").insert({
        student_id: studentId,
        ...values,
        created_by: userId,
        updated_by: userId,
      })
  const { data, error } = await query.select().single()

  if (error) {
    throw new Error("Biodata keluarga belum dapat disimpan. Coba lagi.")
  }
  return data
}

export function validateStudentPhoto(file: File) {
  if (
    !(["image/jpeg", "image/png"] as ReadonlyArray<string>).includes(file.type)
  ) {
    throw new Error("Foto harus berformat JPG atau PNG.")
  }
  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("Ukuran foto maksimal 2 MB.")
  }
}

export async function uploadStudentPhoto(
  studentId: string,
  file: File,
  client: RapotKuSupabaseClient = getSupabaseClient(),
) {
  validateStudentPhoto(file)
  const path = `${studentId}/photo`
  const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  })
  if (error) throw new Error("Foto belum dapat diunggah. Coba lagi.")
  return path
}

export async function getStudentPhotoUrl(
  path: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
) {
  const { data, error } = await client.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}
