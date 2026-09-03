import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

import {
  resolveKkm,
  type GradingConfiguration,
  type KkmMode,
} from "./grading-configuration"
import { GradeError, validateMinimumMasteryScore } from "./grade.service"

export type AssessmentComponent = Pick<
  Tables<"assessment_components">,
  "id" | "code" | "name" | "display_order" | "is_active"
>

export type StoredGradingSetting = Pick<
  Tables<"grading_settings">,
  "id" | "semester_id" | "kkm_mode" | "single_kkm"
>

export type SubjectKkmRule = Pick<
  Tables<"subject_kkm_rules">,
  "id" | "semester_id" | "subject_id" | "minimum_mastery_score"
>

export type LoadedGradingConfiguration = Readonly<{
  setting: StoredGradingSetting | null
  subjectRule: SubjectKkmRule | null
  effectiveKkm: number | null
}>

export async function getAssessmentComponents(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<AssessmentComponent>> {
  const { data, error } = await client
    .from("assessment_components")
    .select("id,code,name,display_order,is_active")
    .eq("is_active", true)
    .order("display_order")
  if (error) throw new GradeError("Komponen nilai belum dapat dimuat.")
  return data
}

export async function getGradingConfiguration(
  semesterId: string,
  subjectId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<LoadedGradingConfiguration> {
  const [settingResult, ruleResult] = await Promise.all([
    client
      .from("grading_settings")
      .select("id,semester_id,kkm_mode,single_kkm")
      .eq("semester_id", semesterId)
      .maybeSingle(),
    client
      .from("subject_kkm_rules")
      .select("id,semester_id,subject_id,minimum_mastery_score")
      .eq("semester_id", semesterId)
      .eq("subject_id", subjectId)
      .maybeSingle(),
  ])
  if (settingResult.error || ruleResult.error) {
    throw new GradeError("Pengaturan KKM belum dapat dimuat.")
  }
  const setting = settingResult.data
  const subjectRule = ruleResult.data
  let effectiveKkm: number | null = null
  if (setting) {
    try {
      effectiveKkm = resolveKkm({
        mode: setting.kkm_mode as KkmMode,
        singleKkm: setting.single_kkm,
        subjectKkm: subjectRule?.minimum_mastery_score ?? null,
      })
    } catch {
      effectiveKkm = null
    }
  }
  return { setting, subjectRule, effectiveKkm }
}

export async function saveGradingConfiguration(
  userId: string,
  input: Readonly<{
    semesterId: string
    subjectId: string
    mode: KkmMode
    kkm: number
  }>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const kkm = validateMinimumMasteryScore(input.kkm)
  const setting: Database["public"]["Tables"]["grading_settings"]["Insert"] = {
    semester_id: input.semesterId,
    kkm_mode: input.mode,
    single_kkm: input.mode === "single" ? kkm : null,
    created_by: userId,
    updated_by: userId,
  }
  const { error: settingError } = await client
    .from("grading_settings")
    .upsert(setting, { onConflict: "semester_id" })
  if (settingError) throw new GradeError("Pengaturan KKM belum tersimpan.")
  if (input.mode === "multi") {
    const rule: Database["public"]["Tables"]["subject_kkm_rules"]["Insert"] = {
      semester_id: input.semesterId,
      subject_id: input.subjectId,
      minimum_mastery_score: kkm,
      created_by: userId,
      updated_by: userId,
    }
    const { error } = await client
      .from("subject_kkm_rules")
      .upsert(rule, { onConflict: "semester_id,subject_id" })
    if (error) throw new GradeError("KKM mata pelajaran belum tersimpan.")
  }
}

export function toDomainConfiguration(
  loaded: LoadedGradingConfiguration,
): GradingConfiguration | null {
  if (!loaded.setting) return null
  return {
    mode: loaded.setting.kkm_mode as KkmMode,
    singleKkm: loaded.setting.single_kkm,
    subjectKkm: loaded.subjectRule?.minimum_mastery_score ?? null,
  }
}
