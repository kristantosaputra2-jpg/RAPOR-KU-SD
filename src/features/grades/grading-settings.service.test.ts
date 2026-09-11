import { describe, expect, it, vi } from "vitest"

import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

import { saveReportGradingSettings } from "./grading-settings.service"

const unusedClient = {} as RapotKuSupabaseClient

describe("saveReportGradingSettings", () => {
  it("menolak Single KKM di luar rentang sebelum menghubungi database", async () => {
    await expect(
      saveReportGradingSettings(
        "admin-1",
        {
          semesterId: "semester-1",
          mode: "single",
          singleKkm: 0,
          subjectKkms: [],
        },
        unusedClient,
      ),
    ).rejects.toThrow("1 sampai 100")
  })

  it("menolak mata pelajaran ganda pada Multi KKM", async () => {
    await expect(
      saveReportGradingSettings(
        "admin-1",
        {
          semesterId: "semester-1",
          mode: "multi",
          singleKkm: null,
          subjectKkms: [
            { subjectId: "subject-1", minimumMasteryScore: 70 },
            { subjectId: "subject-1", minimumMasteryScore: 75 },
          ],
        },
        unusedClient,
      ),
    ).rejects.toThrow("tidak boleh ganda")
  })

  it("menyimpan Single KKM pada pengaturan semester yang sudah ada", async () => {
    const settingUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const settingQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "setting-1" },
        error: null,
      }),
      update: settingUpdate,
    }
    const client = {
      from: vi.fn().mockReturnValue(settingQuery),
    } as unknown as RapotKuSupabaseClient

    await saveReportGradingSettings(
      "admin-1",
      {
        semesterId: "semester-1",
        mode: "single",
        singleKkm: 70,
        subjectKkms: [],
      },
      client,
    )

    expect(settingUpdate).toHaveBeenCalledWith({
      kkm_mode: "single",
      single_kkm: 70,
      updated_by: "admin-1",
    })
  })
})
