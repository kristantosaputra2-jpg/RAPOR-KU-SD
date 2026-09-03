import { describe, expect, it } from "vitest"

import { calculateAssessmentResult, resolveKkm } from "./grading-configuration"

describe("resolveKkm", () => {
  it("uses one school KKM in single mode", () => {
    expect(resolveKkm({ mode: "single", singleKkm: 70, subjectKkm: 80 })).toBe(
      70,
    )
  })

  it("uses the subject KKM in multi mode", () => {
    expect(resolveKkm({ mode: "multi", singleKkm: null, subjectKkm: 75 })).toBe(
      75,
    )
  })

  it("rejects missing or invalid KKM", () => {
    expect(() =>
      resolveKkm({ mode: "single", singleKkm: null, subjectKkm: null }),
    ).toThrow("Single KKM")
    expect(() =>
      resolveKkm({ mode: "multi", singleKkm: null, subjectKkm: 101 }),
    ).toThrow("KKM mata pelajaran")
  })
})

describe("calculateAssessmentResult", () => {
  it("calculates a separate average and predicate for one assessment component", () => {
    expect(
      calculateAssessmentResult([80, 90, 100], {
        mode: "single",
        singleKkm: 70,
        subjectKkm: null,
      }),
    ).toEqual({ average: 90, predicate: "A" })
  })

  it("keeps an empty component empty", () => {
    expect(
      calculateAssessmentResult([], {
        mode: "multi",
        singleKkm: null,
        subjectKkm: 65,
      }),
    ).toEqual({ average: null, predicate: null })
  })
})
