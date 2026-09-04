import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

export const HOMEROOM_NOTE_MAX_LENGTH = 500

const columns = "id,student_id,class_id,semester_id,note,created_at,updated_at"

export type HomeroomNote = Pick<
  Tables<"homeroom_notes">,
  | "id"
  | "student_id"
  | "class_id"
  | "semester_id"
  | "note"
  | "created_at"
  | "updated_at"
>

export type HomeroomNoteInput = Readonly<{
  studentId: string
  note: string
}>

export class HomeroomNoteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HomeroomNoteError"
  }
}

export function validateHomeroomNote(note: string): string {
  const normalized = note.trim()
  if (normalized.length > HOMEROOM_NOTE_MAX_LENGTH) {
    throw new HomeroomNoteError(
      `Catatan maksimal ${HOMEROOM_NOTE_MAX_LENGTH} karakter.`,
    )
  }
  return normalized
}

export async function getHomeroomNotes(
  classId: string,
  semesterId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<HomeroomNote>> {
  const { data, error } = await client
    .from("homeroom_notes")
    .select(columns)
    .eq("class_id", classId)
    .eq("semester_id", semesterId)

  if (error) {
    throw new HomeroomNoteError(
      "Catatan wali kelas belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }
  return data
}

export async function saveHomeroomNotes(
  userId: string,
  classId: string,
  semesterId: string,
  entries: ReadonlyArray<HomeroomNoteInput>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const rows: Database["public"]["Tables"]["homeroom_notes"]["Insert"][] =
    entries.map(({ studentId, note }) => ({
      student_id: studentId,
      class_id: classId,
      semester_id: semesterId,
      note: validateHomeroomNote(note),
      created_by: userId,
      updated_by: userId,
    }))

  if (rows.length === 0) return
  const { error } = await client.from("homeroom_notes").upsert(rows, {
    onConflict: "student_id,class_id,semester_id",
  })
  if (error) {
    throw new HomeroomNoteError(
      "Catatan wali kelas belum dapat disimpan. Periksa koneksi lalu coba lagi.",
    )
  }
}
