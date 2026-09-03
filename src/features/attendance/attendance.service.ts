import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const attendanceColumns =
  "id,student_id,class_id,semester_id,sick_days,permitted_days,absent_days,created_at,updated_at"

export type Attendance = Pick<
  Tables<"attendance">,
  | "id"
  | "student_id"
  | "class_id"
  | "semester_id"
  | "sick_days"
  | "permitted_days"
  | "absent_days"
  | "created_at"
  | "updated_at"
>

export type AttendanceInput = Readonly<{
  studentId: string
  sickDays: number
  permittedDays: number
  absentDays: number
}>

export class AttendanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AttendanceError"
  }
}

export function parseAttendanceDays(value: string): number {
  const normalized = value.trim()
  const days = Number(normalized)
  if (!normalized || !Number.isInteger(days) || days < 0) {
    throw new AttendanceError(
      "Jumlah hari harus berupa angka bulat 0 atau lebih.",
    )
  }
  return days
}

export async function getAttendance(
  classId: string,
  semesterId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Attendance>> {
  const { data, error } = await client
    .from("attendance")
    .select(attendanceColumns)
    .eq("class_id", classId)
    .eq("semester_id", semesterId)

  if (error) {
    throw new AttendanceError(
      "Absensi belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }
  return data
}

export async function saveAttendance(
  userId: string,
  classId: string,
  semesterId: string,
  entries: ReadonlyArray<AttendanceInput>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  entries.forEach(({ sickDays, permittedDays, absentDays }) => {
    for (const value of [sickDays, permittedDays, absentDays]) {
      if (!Number.isInteger(value) || value < 0) {
        throw new AttendanceError(
          "Jumlah hari harus berupa angka bulat 0 atau lebih.",
        )
      }
    }
  })

  const rows: Database["public"]["Tables"]["attendance"]["Insert"][] =
    entries.map(({ studentId, sickDays, permittedDays, absentDays }) => ({
      student_id: studentId,
      class_id: classId,
      semester_id: semesterId,
      sick_days: sickDays,
      permitted_days: permittedDays,
      absent_days: absentDays,
      created_by: userId,
      updated_by: userId,
    }))

  if (rows.length === 0) return

  const { error } = await client.from("attendance").upsert(rows, {
    onConflict: "student_id,class_id,semester_id",
  })
  if (error) {
    throw new AttendanceError(
      "Absensi belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  }
}
