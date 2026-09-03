import {
  calculateFinalGrade,
  calculatePredicate,
  type GradePredicate,
} from "./grade-calculation"

export type KkmMode = "single" | "multi"

export type GradingConfiguration = Readonly<{
  mode: KkmMode
  singleKkm: number | null
  subjectKkm: number | null
}>

export type AssessmentResult = Readonly<{
  average: number | null
  predicate: GradePredicate | null
}>

export class GradingConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GradingConfigurationError"
  }
}

function validateKkm(value: number | null, label: string) {
  if (value === null || !Number.isInteger(value) || value < 1 || value > 100) {
    throw new GradingConfigurationError(
      `${label} harus berupa bilangan bulat 1 sampai 100.`,
    )
  }
  return value
}

export function resolveKkm(configuration: GradingConfiguration) {
  if (configuration.mode === "single") {
    return validateKkm(configuration.singleKkm, "Single KKM")
  }
  return validateKkm(configuration.subjectKkm, "KKM mata pelajaran")
}

export function calculateAssessmentResult(
  scores: ReadonlyArray<number>,
  configuration: GradingConfiguration,
): AssessmentResult {
  const average = calculateFinalGrade(scores)
  if (average === null) return { average: null, predicate: null }
  return {
    average,
    predicate: calculatePredicate(average, resolveKkm(configuration)),
  }
}
