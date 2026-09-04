import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const columns =
  "id,student_id,class_id,semester_id,achievement_type,achievement_level,description,event_year,event_date,created_at,updated_at"
export type Achievement = Pick<
  Tables<"achievements">,
  | "id"
  | "student_id"
  | "class_id"
  | "semester_id"
  | "achievement_type"
  | "achievement_level"
  | "description"
  | "event_year"
  | "event_date"
  | "created_at"
  | "updated_at"
>
export type AchievementInput = Readonly<{
  studentId: string
  classId: string
  semesterId: string
  achievementType: string
  achievementLevel: string
  description: string
  eventYear: string
  eventDate: string
}>

export class AchievementError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AchievementError"
  }
}

export function normalizeAchievementInput(input: AchievementInput) {
  const achievementType = input.achievementType.trim()
  const achievementLevel = input.achievementLevel.trim()
  const description = input.description.trim()
  const eventYear = Number(input.eventYear)
  if (!input.studentId) throw new AchievementError("Pilih siswa.")
  if (!achievementType || achievementType.length > 80)
    throw new AchievementError(
      "Jenis prestasi wajib diisi, maksimal 80 karakter.",
    )
  if (!achievementLevel || achievementLevel.length > 80)
    throw new AchievementError(
      "Tingkat prestasi wajib diisi, maksimal 80 karakter.",
    )
  if (!description || description.length > 500)
    throw new AchievementError("Keterangan wajib diisi, maksimal 500 karakter.")
  if (!Number.isInteger(eventYear) || eventYear < 1900 || eventYear > 2200)
    throw new AchievementError("Tahun prestasi belum sesuai.")
  if (input.eventDate && Number(input.eventDate.slice(0, 4)) !== eventYear)
    throw new AchievementError("Tahun harus sama dengan tanggal prestasi.")
  return {
    student_id: input.studentId,
    class_id: input.classId,
    semester_id: input.semesterId,
    achievement_type: achievementType,
    achievement_level: achievementLevel,
    description,
    event_year: eventYear,
    event_date: input.eventDate || null,
  }
}

export async function getAchievements(
  classId: string,
  semesterId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Achievement>> {
  const { data, error } = await client
    .from("achievements")
    .select(columns)
    .eq("class_id", classId)
    .eq("semester_id", semesterId)
    .order("event_year", { ascending: false })
  if (error) throw new AchievementError("Data prestasi belum dapat dimuat.")
  return data
}

export async function createAchievement(
  userId: string,
  input: AchievementInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Achievement> {
  const row: Database["public"]["Tables"]["achievements"]["Insert"] = {
    ...normalizeAchievementInput(input),
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("achievements")
    .insert(row)
    .select(columns)
    .single()
  if (error || !data)
    throw new AchievementError(
      "Prestasi belum dapat disimpan. Periksa koneksi lalu coba lagi.",
    )
  return data
}
