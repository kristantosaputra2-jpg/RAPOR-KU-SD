import { describe, expect, it } from "vitest"

import type { LowerPrimaryLegerViewModel } from "./leger-view-model"
import {
  buildLegerCsv,
  buildLowerPrimaryLegerCsv,
  buildUpperPrimaryLegerCsv,
  createLegerFilename,
} from "./leger-export"

const leger: LowerPrimaryLegerViewModel = {
  templateGroup: "lower_primary",
  schoolName: "SD Uji",
  className: "Kelas 2A",
  academicYear: "2026/2027",
  semester: "Semester 1",
  subjectColumns: [
    {
      subjectId: "math",
      subjectName: "Matematika",
      components: [
        { componentId: "knowledge", componentName: "Pengetahuan" },
        { componentId: "skill", componentName: "Keterampilan" },
      ],
    },
  ],
  rows: [
    {
      studentId: "student-1",
      studentName: "Ayu, Putri",
      nis: "001",
      status: "partial",
      statusLabel: "Sebagian",
      achievementSummary: ['Mampu membaca "dengan baik".'],
      subjects: [
        {
          subjectId: "math",
          subjectName: "Matematika",
          components: [
            {
              componentId: "knowledge",
              componentName: "Pengetahuan",
              average: 86,
              predicate: "B",
              description: null,
            },
            {
              componentId: "skill",
              componentName: "Keterampilan",
              average: null,
              predicate: null,
              description: null,
            },
          ],
        },
      ],
    },
  ],
}

describe("buildLowerPrimaryLegerCsv", () => {
  it("mengekspor nilai dan predikat dua komponen tanpa menghilangkan nilai kosong", () => {
    const csv = buildLowerPrimaryLegerCsv(leger)

    expect(csv).toContain("Matematika - Pengetahuan - Nilai")
    expect(csv).toContain("Matematika - Keterampilan - Predikat")
    expect(csv).toContain('1;001;"Ayu, Putri";86;B;;;Sebagian;')
    expect(csv).toContain('"Mampu membaca ""dengan baik""."')
  })

  it("membuat nama file yang aman", () => {
    expect(createLegerFilename(leger)).toBe("leger-kelas-2a.csv")
  })
})

describe("buildUpperPrimaryLegerCsv", () => {
  const upperLeger = {
    ...leger,
    templateGroup: "upper_primary" as const,
  }

  it("mengekspor nilai, predikat, dan deskripsi setiap komponen secara terpisah", () => {
    const csv = buildUpperPrimaryLegerCsv(upperLeger)

    expect(csv).toContain("Matematika - Pengetahuan - Deskripsi")
    expect(csv).toContain("Matematika - Keterampilan - Deskripsi")
    expect(csv).toContain('1;001;"Ayu, Putri";86;B;;;;;Sebagian;')
  })

  it("memilih format ekspor berdasarkan kelompok template", () => {
    expect(buildLegerCsv(upperLeger)).toBe(
      buildUpperPrimaryLegerCsv(upperLeger),
    )
    expect(buildLegerCsv(leger)).toBe(buildLowerPrimaryLegerCsv(leger))
  })
})
