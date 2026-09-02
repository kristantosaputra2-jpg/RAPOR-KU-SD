import { describe, expect, it, vi } from "vitest"

import {
  AcademicPeriodsError,
  activateAcademicYear,
  activateSemester,
  createAcademicYear,
  createSemester,
  getAcademicPeriods,
  getActiveAcademicPeriod,
  validateAcademicYearName,
} from "@/features/academic-periods/academic-periods.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

describe("academic periods service", () => {
  it("memvalidasi format tahun ajaran dan merapikan spasi", () => {
    expect(validateAcademicYearName(" 2026/2027 ")).toBe("2026/2027")
    expect(() => validateAcademicYearName("2026-2027")).toThrow(
      new AcademicPeriodsError(
        "Gunakan format tahun ajaran seperti 2026/2027.",
      ),
    )
    expect(() => validateAcademicYearName("2026/2028")).toThrow(
      new AcademicPeriodsError(
        "Tahun kedua harus satu tahun setelah tahun pertama.",
      ),
    )
  })

  it("mengembalikan periode aktif tanpa mengarang data", () => {
    const academicYear = {
      id: "year-1",
      school_id: "school-1",
      name: "2026/2027",
      is_active: true,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    }
    const semester = {
      id: "semester-1",
      academic_year_id: "year-1",
      number: 1,
      is_active: true,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    }

    expect(
      getActiveAcademicPeriod({
        schoolId: "school-1",
        academicYears: [academicYear],
        semesters: [semester],
      }),
    ).toEqual({ academicYear, semester })
  })

  it("mengembalikan daftar kosong jika pengaturan sekolah belum ada", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(getAcademicPeriods(client)).resolves.toEqual({
      schoolId: null,
      academicYears: [],
      semesters: [],
    })
  })

  it("menambahkan tahun ajaran dengan audit Admin", async () => {
    const savedYear = {
      id: "year-1",
      school_id: "school-1",
      name: "2026/2027",
      is_active: false,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    }
    const single = vi.fn().mockResolvedValue({ data: savedYear, error: null })
    const selectResult = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectResult })
    const from = vi.fn().mockReturnValue({ insert })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(
      createAcademicYear("admin-1", "school-1", "2026/2027", client),
    ).resolves.toEqual(savedYear)
    expect(insert).toHaveBeenCalledWith({
      school_id: "school-1",
      name: "2026/2027",
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("menjelaskan tahun ajaran duplikat dengan bahasa sederhana", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505" },
    })
    const selectResult = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectResult })
    const from = vi.fn().mockReturnValue({ insert })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(
      createAcademicYear("admin-1", "school-1", "2026/2027", client),
    ).rejects.toEqual(
      new AcademicPeriodsError("Tahun ajaran tersebut sudah tersedia."),
    )
  })

  it("mengaktifkan tahun ajaran melalui operasi database atomik", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const client = { rpc } as unknown as RapotKuSupabaseClient

    await expect(
      activateAcademicYear("year-1", client),
    ).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith("set_active_academic_year", {
      p_academic_year_id: "year-1",
    })
  })

  it("menambahkan Semester 1 dengan audit Admin", async () => {
    const savedSemester = {
      id: "semester-1",
      academic_year_id: "year-1",
      number: 1,
      is_active: false,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    }
    const single = vi
      .fn()
      .mockResolvedValue({ data: savedSemester, error: null })
    const selectResult = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectResult })
    const from = vi.fn().mockReturnValue({ insert })
    const client = { from } as unknown as RapotKuSupabaseClient

    await expect(
      createSemester("admin-1", "year-1", 1, client),
    ).resolves.toEqual(savedSemester)
    expect(insert).toHaveBeenCalledWith({
      academic_year_id: "year-1",
      number: 1,
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("mengaktifkan semester dan tahun ajarannya secara atomik", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    const client = { rpc } as unknown as RapotKuSupabaseClient

    await expect(
      activateSemester("semester-1", client),
    ).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith("set_active_semester", {
      p_semester_id: "semester-1",
    })
  })
})
