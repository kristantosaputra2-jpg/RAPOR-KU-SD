import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const academicYearColumns = "id,school_id,name,is_active,created_at,updated_at"
const semesterColumns =
  "id,academic_year_id,number,is_active,created_at,updated_at"

export type AcademicYear = Pick<
  Tables<"academic_years">,
  "id" | "school_id" | "name" | "is_active" | "created_at" | "updated_at"
>

export type Semester = Pick<
  Tables<"semesters">,
  | "id"
  | "academic_year_id"
  | "number"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type SemesterNumber = 1 | 2

export type AcademicPeriods = Readonly<{
  schoolId: string | null
  academicYears: ReadonlyArray<AcademicYear>
  semesters: ReadonlyArray<Semester>
}>

export type ActiveAcademicPeriod = Readonly<{
  academicYear: AcademicYear | null
  semester: Semester | null
}>

export class AcademicPeriodsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AcademicPeriodsError"
  }
}

function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

export function validateAcademicYearName(value: string): string {
  const name = value.trim()
  const match = /^(\d{4})\/(\d{4})$/.exec(name)

  if (!match) {
    throw new AcademicPeriodsError(
      "Gunakan format tahun ajaran seperti 2026/2027.",
    )
  }

  if (Number(match[2]) !== Number(match[1]) + 1) {
    throw new AcademicPeriodsError(
      "Tahun kedua harus satu tahun setelah tahun pertama.",
    )
  }

  return name
}

export function getActiveAcademicPeriod(
  periods: AcademicPeriods,
): ActiveAcademicPeriod {
  return {
    academicYear:
      periods.academicYears.find((academicYear) => academicYear.is_active) ??
      null,
    semester: periods.semesters.find((semester) => semester.is_active) ?? null,
  }
}

export async function getAcademicPeriods(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AcademicPeriods> {
  const { data: school, error: schoolError } = await client
    .from("schools")
    .select("id")
    .eq("singleton_key", true)
    .maybeSingle()

  if (schoolError) {
    throw new AcademicPeriodsError(
      "Periode akademik belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  if (!school) {
    return { schoolId: null, academicYears: [], semesters: [] }
  }

  const { data: academicYears, error: academicYearsError } = await client
    .from("academic_years")
    .select(academicYearColumns)
    .eq("school_id", school.id)
    .order("name", { ascending: false })

  if (academicYearsError) {
    throw new AcademicPeriodsError(
      "Periode akademik belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  if (!academicYears.length) {
    return { schoolId: school.id, academicYears: [], semesters: [] }
  }

  const { data: semesters, error: semestersError } = await client
    .from("semesters")
    .select(semesterColumns)
    .in(
      "academic_year_id",
      academicYears.map((academicYear) => academicYear.id),
    )
    .order("number", { ascending: true })

  if (semestersError) {
    throw new AcademicPeriodsError(
      "Periode akademik belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return {
    schoolId: school.id,
    academicYears,
    semesters,
  }
}

export async function createAcademicYear(
  userId: string,
  schoolId: string,
  value: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AcademicYear> {
  const name = validateAcademicYearName(value)
  const insert: Database["public"]["Tables"]["academic_years"]["Insert"] = {
    school_id: schoolId,
    name,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("academic_years")
    .insert(insert)
    .select(academicYearColumns)
    .single()

  if (error || !data) {
    throw new AcademicPeriodsError(
      isDuplicateError(error)
        ? "Tahun ajaran tersebut sudah tersedia."
        : "Tahun ajaran belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function activateAcademicYear(
  academicYearId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const { error } = await client.rpc("set_active_academic_year", {
    p_academic_year_id: academicYearId,
  })

  if (error) {
    throw new AcademicPeriodsError(
      "Tahun ajaran belum dapat diaktifkan. Periksa koneksi internet lalu coba lagi.",
    )
  }
}

export async function createSemester(
  userId: string,
  academicYearId: string,
  number: SemesterNumber,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Semester> {
  const insert: Database["public"]["Tables"]["semesters"]["Insert"] = {
    academic_year_id: academicYearId,
    number,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("semesters")
    .insert(insert)
    .select(semesterColumns)
    .single()

  if (error || !data) {
    throw new AcademicPeriodsError(
      isDuplicateError(error)
        ? `Semester ${number} sudah tersedia untuk tahun ajaran ini.`
        : `Semester ${number} belum dapat disimpan. Periksa koneksi internet lalu coba lagi.`,
    )
  }

  return data
}

export async function activateSemester(
  semesterId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const { error } = await client.rpc("set_active_semester", {
    p_semester_id: semesterId,
  })

  if (error) {
    throw new AcademicPeriodsError(
      "Semester belum dapat diaktifkan. Periksa koneksi internet lalu coba lagi.",
    )
  }
}
