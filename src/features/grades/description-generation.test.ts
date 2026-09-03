import { describe, expect, it } from "vitest"

import {
  generateDescriptionDraft,
  selectOutcomeExtremes,
} from "./description-generation"

const scores = [
  { outcomeId: "cp-1", description: "mengenal bilangan.", score: 80 },
  { outcomeId: "cp-2", description: "menghitung penjumlahan", score: 95 },
  { outcomeId: "cp-3", description: "menyelesaikan soal cerita.", score: 70 },
]

describe("selectOutcomeExtremes", () => {
  it("selects the highest and lowest CP", () => {
    expect(selectOutcomeExtremes(scores)).toEqual({
      strongest: scores[1],
      weakest: scores[2],
    })
  })

  it("uses stable distinct outcomes when every score is equal", () => {
    const equalScores = scores.map((item) => ({ ...item, score: 80 }))
    expect(selectOutcomeExtremes(equalScores)).toEqual({
      strongest: equalScores[0],
      weakest: equalScores[2],
    })
  })

  it("handles one CP without inventing a weakness", () => {
    expect(selectOutcomeExtremes([scores[0]])).toEqual({
      strongest: scores[0],
      weakest: null,
    })
  })

  it("rejects empty scores", () => {
    expect(() => selectOutcomeExtremes([])).toThrow("minimal satu nilai CP")
  })
})

describe("generateDescriptionDraft", () => {
  it("uses the approved strongest and weakest wording", () => {
    expect(generateDescriptionDraft(scores)).toEqual({
      strongestOutcomeId: "cp-2",
      weakestOutcomeId: "cp-3",
      text: "Menunjukkan capaian sangat baik dalam menghitung penjumlahan dan perlu meningkatkan menyelesaikan soal cerita.",
    })
  })

  it("creates a concise draft for one CP", () => {
    expect(generateDescriptionDraft([scores[0]]).text).toBe(
      "Menunjukkan capaian sangat baik dalam mengenal bilangan.",
    )
  })
})
