export type OutcomeScore = Readonly<{
  outcomeId: string
  description: string
  score: number
}>

export type OutcomeExtremes = Readonly<{
  strongest: OutcomeScore
  weakest: OutcomeScore | null
}>

export class DescriptionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DescriptionGenerationError"
  }
}

function cleanDescription(value: string) {
  return value.trim().replace(/[.!?]+$/, "")
}

export function selectOutcomeExtremes(
  scores: ReadonlyArray<OutcomeScore>,
): OutcomeExtremes {
  if (scores.length === 0) {
    throw new DescriptionGenerationError(
      "Isi minimal satu nilai CP sebelum membuat deskripsi.",
    )
  }
  const sorted = scores
    .map((item, index) => ({ ...item, index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
  return {
    strongest: scores[sorted[0].index],
    weakest: sorted.length > 1 ? scores[sorted[sorted.length - 1].index] : null,
  }
}

export function generateDescriptionDraft(scores: ReadonlyArray<OutcomeScore>) {
  const { strongest, weakest } = selectOutcomeExtremes(scores)
  const strength = cleanDescription(strongest.description)
  if (!strength) {
    throw new DescriptionGenerationError("Deskripsi CP terbaik masih kosong.")
  }
  if (!weakest) {
    return {
      strongestOutcomeId: strongest.outcomeId,
      weakestOutcomeId: null,
      text: `Menunjukkan capaian sangat baik dalam ${strength}.`,
    }
  }
  const improvement = cleanDescription(weakest.description)
  if (!improvement) {
    throw new DescriptionGenerationError(
      "Deskripsi CP yang perlu ditingkatkan masih kosong.",
    )
  }
  return {
    strongestOutcomeId: strongest.outcomeId,
    weakestOutcomeId: weakest.outcomeId,
    text: `Menunjukkan capaian sangat baik dalam ${strength} dan perlu meningkatkan ${improvement}.`,
  }
}
