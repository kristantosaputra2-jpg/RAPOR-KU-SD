import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const columns =
  "id,subject_id,grade_level,semester_id,code,title,description,is_active,created_at,updated_at"

export type LearningOutcome = Pick<
  Tables<"learning_outcomes">,
  | "id"
  | "subject_id"
  | "grade_level"
  | "semester_id"
  | "code"
  | "title"
  | "description"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type LearningOutcomeInput = Readonly<{
  subjectId: string
  gradeLevel: number
  semesterId: string
  code: string
  title: string
  description: string
}>

export class LearningOutcomeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LearningOutcomeError"
  }
}

export function normalizeLearningOutcomeInput(input: LearningOutcomeInput) {
  const code = input.code.trim()
  const title = input.title.trim()
  const description = input.description.trim()
  if (!input.subjectId) throw new LearningOutcomeError("Pilih mata pelajaran.")
  if (
    !Number.isInteger(input.gradeLevel) ||
    input.gradeLevel < 1 ||
    input.gradeLevel > 6
  ) {
    throw new LearningOutcomeError("Pilih tingkat kelas 1 sampai 6.")
  }
  if (!input.semesterId) throw new LearningOutcomeError("Pilih semester.")
  if (code.length > 40)
    throw new LearningOutcomeError("Kode CP maksimal 40 karakter.")
  if (!title || title.length > 200) {
    throw new LearningOutcomeError(
      "Judul CP wajib diisi dan maksimal 200 karakter.",
    )
  }
  if (!description || description.length > 2000) {
    throw new LearningOutcomeError(
      "Deskripsi CP wajib diisi dan maksimal 2.000 karakter.",
    )
  }
  return {
    subject_id: input.subjectId,
    grade_level: input.gradeLevel,
    semester_id: input.semesterId,
    code: code || null,
    title,
    description,
  }
}

function saveMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : ""
  if (code === "23505")
    return "Kode CP tersebut sudah digunakan pada mapel, kelas, dan semester yang sama."
  if (code === "23503")
    return "Mata pelajaran atau semester tidak tersedia. Muat ulang lalu coba lagi."
  return "CP belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
}

export async function getLearningOutcomes(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<LearningOutcome>> {
  const { data, error } = await client
    .from("learning_outcomes")
    .select(columns)
    .order("created_at", { ascending: false })
  if (error)
    throw new LearningOutcomeError(
      "CP belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  return data
}

export async function createLearningOutcome(
  userId: string,
  input: LearningOutcomeInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<LearningOutcome> {
  const normalized = normalizeLearningOutcomeInput(input)
  const insert: Database["public"]["Tables"]["learning_outcomes"]["Insert"] = {
    ...normalized,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("learning_outcomes")
    .insert(insert)
    .select(columns)
    .single()
  if (error || !data) throw new LearningOutcomeError(saveMessage(error))
  return data
}

export async function updateLearningOutcome(
  userId: string,
  outcomeId: string,
  input: LearningOutcomeInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<LearningOutcome> {
  const normalized = normalizeLearningOutcomeInput(input)
  const update: Database["public"]["Tables"]["learning_outcomes"]["Update"] = {
    code: normalized.code,
    title: normalized.title,
    description: normalized.description,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("learning_outcomes")
    .update(update)
    .eq("id", outcomeId)
    .select(columns)
    .single()
  if (error || !data) throw new LearningOutcomeError(saveMessage(error))
  return data
}

export async function setLearningOutcomeActive(
  userId: string,
  outcomeId: string,
  isActive: boolean,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<LearningOutcome> {
  const { data, error } = await client
    .from("learning_outcomes")
    .update({ is_active: isActive, updated_by: userId })
    .eq("id", outcomeId)
    .select(columns)
    .single()
  if (error || !data)
    throw new LearningOutcomeError(
      "Status CP belum dapat diubah. Periksa koneksi lalu coba lagi.",
    )
  return data
}
