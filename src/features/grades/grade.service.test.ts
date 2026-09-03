import { describe, expect, it } from "vitest"

import { parseScoreInput, validateMinimumMasteryScore } from "./grade.service"

describe("parseScoreInput", () => {
  it("preserves empty, zero, and one hundred correctly", () => {
    expect(parseScoreInput("")).toBeNull()
    expect(parseScoreInput("  ")).toBeNull()
    expect(parseScoreInput("0")).toBe(0)
    expect(parseScoreInput("100")).toBe(100)
    expect(parseScoreInput("76.5")).toBe(76.5)
  })

  it("rejects invalid scores", () => {
    expect(() => parseScoreInput("-1")).toThrow("0 sampai 100")
    expect(() => parseScoreInput("101")).toThrow("0 sampai 100")
    expect(() => parseScoreInput("nilai")).toThrow("0 sampai 100")
  })
})

describe("validateMinimumMasteryScore", () => {
  it("accepts valid integer KKM", () => {
    expect(validateMinimumMasteryScore(65)).toBe(65)
  })

  it("rejects decimal or out-of-range KKM", () => {
    expect(() => validateMinimumMasteryScore(0)).toThrow("1 sampai 100")
    expect(() => validateMinimumMasteryScore(65.5)).toThrow("bilangan bulat")
  })
})
