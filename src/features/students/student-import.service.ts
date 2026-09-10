import type { NormalizedStudentInput } from "@/features/students/student.service"
import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

export class StudentImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentImportError"
  }
}

function errorCode(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : ""
}

export async function importStudentsToClass(
  classId: string,
  semesterId: string,
  students: ReadonlyArray<NormalizedStudentInput>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<number> {
  if (!classId || !semesterId) {
    throw new StudentImportError("Pilih kelas tujuan pada semester aktif.")
  }
  if (students.length < 1 || students.length > 500) {
    throw new StudentImportError(
      "Jumlah siswa yang diimport harus antara 1 dan 500.",
    )
  }

  const { data, error } = await client.rpc("import_students_to_class", {
    p_class_id: classId,
    p_semester_id: semesterId,
    p_students: students.map((student) => ({ ...student })),
  })

  if (error || typeof data !== "number") {
    if (errorCode(error) === "23505") {
      throw new StudentImportError(
        "Import dibatalkan karena ada NIS atau NISN yang sudah digunakan. Muat ulang data lalu periksa kembali.",
      )
    }
    if (errorCode(error) === "23503") {
      throw new StudentImportError(
        "Kelas tujuan tidak cocok dengan semester aktif. Muat ulang lalu pilih kelas kembali.",
      )
    }
    if (errorCode(error) === "42501") {
      throw new StudentImportError(
        "Hanya Admin aktif yang dapat mengimpor siswa.",
      )
    }
    throw new StudentImportError(
      "Data belum dapat diimport. Tidak ada data yang disimpan. Periksa koneksi lalu coba lagi.",
    )
  }

  return data
}
