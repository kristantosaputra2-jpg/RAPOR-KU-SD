import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getStudentWorkbookErrorMessage,
  parseStudentWorkbook,
} from "@/features/students/student-import.parser"

const excelMocks = vi.hoisted(() => ({ readSheet: vi.fn() }))

vi.mock("read-excel-file/universal", () => ({
  readSheet: excelMocks.readSheet,
}))

describe("student workbook parser", () => {
  beforeEach(() => excelMocks.readSheet.mockReset())

  it("membaca file .xlsx valid dan membuang baris kosong", async () => {
    excelMocks.readSheet.mockResolvedValue([
      ["Nama", "NIS", "JK"],
      ["Budi", "001", "L"],
      [null, null, null],
    ])

    const file = new File(["xlsx"], "siswa.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    await expect(parseStudentWorkbook(file)).resolves.toEqual({
      fileName: "siswa.xlsx",
      headers: ["Nama", "NIS", "JK"],
      rows: [["Budi", "001", "L"]],
    })
  })

  it("menolak file .xls lama sebelum dibaca", async () => {
    const file = new File(["xls"], "siswa.xls")

    await expect(parseStudentWorkbook(file)).rejects.toThrow(
      "Gunakan file Excel berformat .xlsx",
    )
    expect(excelMocks.readSheet).not.toHaveBeenCalled()
  })

  it("memberi pesan sederhana ketika workbook rusak", () => {
    expect(getStudentWorkbookErrorMessage(new Error("invalid zip"))).toContain(
      "File Excel rusak atau tidak dapat dibaca",
    )
  })
})
