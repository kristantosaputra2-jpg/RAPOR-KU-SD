import { describe, expect, it } from "vitest"
import {
  AchievementError,
  normalizeAchievementInput,
} from "./achievement.service"

const input = {
  studentId: "student-1",
  classId: "class-1",
  semesterId: "semester-1",
  achievementType: " Akademik ",
  achievementLevel: " Kecamatan ",
  description: " Juara satu olimpiade ",
  eventYear: "2026",
  eventDate: "2026-08-17",
}

describe("normalizeAchievementInput", () => {
  it("membersihkan dan membentuk data prestasi", () =>
    expect(normalizeAchievementInput(input)).toMatchObject({
      achievement_type: "Akademik",
      achievement_level: "Kecamatan",
      event_year: 2026,
    }))
  it("menolak tahun yang berbeda dari tanggal", () =>
    expect(() =>
      normalizeAchievementInput({ ...input, eventYear: "2025" }),
    ).toThrow(AchievementError))
  it("menolak keterangan kosong", () =>
    expect(() =>
      normalizeAchievementInput({ ...input, description: " " }),
    ).toThrow("Keterangan wajib"))
})
