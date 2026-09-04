import { describe, expect, it } from "vitest"

import {
  calculateReportCompleteness,
  hasCompleteDescriptions,
  hasCompleteGrades,
  isSchoolIdentityComplete,
  isStudentIdentityComplete,
} from "./report-completeness"

const completeChecks = {
  identity: true,
  grades: true,
  descriptions: true,
  attendance: true,
  extracurricular: true,
  achievement: true,
  homeroomNote: true,
} as const

describe("calculateReportCompleteness", () => {
  it("menghasilkan Belum Diisi saat belum ada isi rapor", () => {
    expect(
      calculateReportCompleteness({
        ...completeChecks,
        grades: false,
        descriptions: false,
        attendance: false,
        extracurricular: false,
        achievement: false,
        homeroomNote: false,
      }),
    ).toBe("not_started")
  })

  it("menghasilkan Sebagian ketika masih ada isi yang kurang", () => {
    expect(
      calculateReportCompleteness({ ...completeChecks, homeroomNote: false }),
    ).toBe("partial")
  })

  it("menghasilkan Lengkap ketika isi selesai tetapi identitas kurang", () => {
    expect(
      calculateReportCompleteness({ ...completeChecks, identity: false }),
    ).toBe("complete")
  })

  it("menghasilkan Siap Cetak ketika semua pemeriksaan terpenuhi", () => {
    expect(calculateReportCompleteness(completeChecks)).toBe("ready_to_print")
  })
})

describe("academic completeness", () => {
  it("memerlukan nilai setiap CP dan komponen pada semua mapel", () => {
    const subjects = ["math"]
    const outcomes = [
      { id: "cp-1", subjectId: "math" },
      { id: "cp-2", subjectId: "math" },
    ]
    const components = ["knowledge", "skills"]
    const completeKeys = new Set([
      "student-1:math:cp-1:knowledge",
      "student-1:math:cp-1:skills",
      "student-1:math:cp-2:knowledge",
      "student-1:math:cp-2:skills",
    ])

    expect(
      hasCompleteGrades(
        "student-1",
        subjects,
        outcomes,
        components,
        completeKeys,
      ),
    ).toBe(true)
    completeKeys.delete("student-1:math:cp-2:skills")
    expect(
      hasCompleteGrades(
        "student-1",
        subjects,
        outcomes,
        components,
        completeKeys,
      ),
    ).toBe(false)
  })

  it("memerlukan deskripsi setiap mapel dan komponen", () => {
    expect(
      hasCompleteDescriptions(
        "student-1",
        ["math"],
        ["knowledge", "skills"],
        new Set(["student-1:math:knowledge", "student-1:math:skills"]),
      ),
    ).toBe(true)
  })
})

describe("identity completeness", () => {
  it("memerlukan identitas sekolah utama", () => {
    expect(
      isSchoolIdentityComplete({
        school_name: "SD Contoh",
        npsn: "12345678",
        address: "Jalan Sekolah",
        district: "Kecamatan",
        city: "Kabupaten",
        province: "Kalimantan Tengah",
        principal_name: "Kepala Sekolah",
      }),
    ).toBe(true)
  })

  it("menolak identitas siswa tanpa tanggal lahir", () => {
    expect(
      isStudentIdentityComplete({
        full_name: "Ani",
        nis: "1001",
        gender: "female",
        birth_place: "Kasongan",
        birth_date: null,
      }),
    ).toBe(false)
  })
})
