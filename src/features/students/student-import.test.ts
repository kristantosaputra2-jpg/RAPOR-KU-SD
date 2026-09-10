import { describe, expect, it } from "vitest"

import {
  suggestStudentImportMapping,
  validateStudentImport,
  validateStudentImportMapping,
  type SpreadsheetRow,
} from "@/features/students/student-import"
import type { Student } from "@/features/students/student.service"

const headers = [
  "Nama Siswa",
  "NIS",
  "NISN",
  "JK",
  "Tempat Lahir",
  "Tanggal Lahir",
]

const existingStudent: Student = {
  id: "student-existing",
  full_name: "Siswa Lama",
  nis: "099",
  nisn: "0012345699",
  gender: "male",
  birth_place: null,
  birth_date: "2015-01-01",
  religion: null,
  address: null,
  father_name: null,
  mother_name: null,
  guardian_name: null,
  is_active: true,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
}

describe("student import validation", () => {
  it("menyarankan mapping dan menyiapkan file valid", () => {
    const mapping = suggestStudentImportMapping(headers)
    const rows: SpreadsheetRow[] = [
      ["Budi Santoso", "001", "0012345678", "L", "Kasongan", "12/04/2016"],
      [
        "Siti Aminah",
        "002",
        null,
        "Perempuan",
        "Katingan",
        new Date(2016, 4, 2),
      ],
    ]

    expect(validateStudentImportMapping(mapping)).toEqual([])
    const result = validateStudentImport(rows, mapping, [])

    expect(result.issues).toEqual([])
    expect(result.validRows).toHaveLength(2)
    expect(result.validRows[0]).toMatchObject({
      full_name: "Budi Santoso",
      nis: "001",
      gender: "male",
      birth_date: "2016-04-12",
    })
    expect(result.validRows[1]).toMatchObject({
      nisn: null,
      gender: "female",
      birth_date: "2016-05-02",
    })
  })

  it("menolak mapping wajib yang kosong dan kolom ganda", () => {
    const mapping = suggestStudentImportMapping(headers)
    mapping.fullName = null
    mapping.nis = mapping.gender

    expect(validateStudentImportMapping(mapping)).toEqual(
      expect.arrayContaining([
        "Nama Lengkap wajib dipasangkan dengan kolom Excel.",
        "Kolom yang sama dipakai untuk NIS dan Jenis Kelamin.",
      ]),
    )
  })

  it("menampilkan nomor baris untuk tanggal dan gender yang rusak", () => {
    const mapping = suggestStudentImportMapping(headers)
    const result = validateStudentImport(
      [["Budi", "001", "", "X", "Kasongan", "31/02/2016"]],
      mapping,
      [],
    )

    expect(result.validRows).toEqual([])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rowNumber: 2, field: "gender" }),
        expect.objectContaining({ rowNumber: 2, field: "birthDate" }),
      ]),
    )
  })

  it("mendeteksi NIS dan NISN ganda di database maupun file", () => {
    const mapping = suggestStudentImportMapping(headers)
    const result = validateStudentImport(
      [
        ["Siswa Baru", "099", "0012345678", "L", "", ""],
        ["Siswa Kedua", "100", "0012345678", "P", "", ""],
        ["Siswa Ketiga", "101", "0012345699", "P", "", ""],
        ["Siswa Lama", "102", "0012345602", "L", "", "01/01/2015"],
      ],
      mapping,
      [existingStudent],
    )

    expect(result.validRows).toEqual([])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rowNumber: 2, field: "nis" }),
        expect.objectContaining({ rowNumber: 3, field: "nisn" }),
        expect.objectContaining({ rowNumber: 4, field: "nisn" }),
        expect.objectContaining({ rowNumber: 5, field: "row" }),
      ]),
    )
  })
})
