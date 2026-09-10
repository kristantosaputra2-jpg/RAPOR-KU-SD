import { readSheet } from "read-excel-file/universal"

import type {
  SpreadsheetRow,
  SpreadsheetCell,
} from "@/features/students/student-import"

export type ParsedStudentWorkbook = Readonly<{
  fileName: string
  headers: ReadonlyArray<string>
  rows: ReadonlyArray<SpreadsheetRow>
}>

export class StudentWorkbookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentWorkbookError"
  }
}

function cellText(value: SpreadsheetCell) {
  if (value === null) return ""
  if (value instanceof Date) return value.toLocaleDateString("id-ID")
  return String(value).trim()
}

export function getStudentWorkbookErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === "InvalidInputError") {
    return "File tidak dapat dibaca. Pastikan formatnya .xlsx, bukan .xls lama atau file lain yang diganti namanya."
  }
  return "File Excel rusak atau tidak dapat dibaca. Buka kembali di Excel, simpan sebagai .xlsx, lalu coba lagi."
}

export async function parseStudentWorkbook(
  file: File,
): Promise<ParsedStudentWorkbook> {
  if (!file.name.toLocaleLowerCase("id-ID").endsWith(".xlsx")) {
    throw new StudentWorkbookError(
      "Gunakan file Excel berformat .xlsx. File .xls lama perlu disimpan ulang sebagai .xlsx.",
    )
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new StudentWorkbookError(
      "Ukuran file maksimal 5 MB agar tetap ringan digunakan dari HP.",
    )
  }

  let data: SpreadsheetCell[][]
  try {
    const parsedData = await readSheet<string>(file, {
      parseNumber: (value) => value,
    })
    // The package declaration uses `typeof Date`, while browser values are Date instances.
    data = parsedData as unknown as SpreadsheetCell[][]
  } catch (error) {
    throw new StudentWorkbookError(getStudentWorkbookErrorMessage(error))
  }

  if (data.length < 2) {
    throw new StudentWorkbookError(
      "File belum berisi data siswa. Baris pertama harus judul kolom dan baris berikutnya berisi siswa.",
    )
  }

  const headers = data[0].map(
    (cell, index) => cellText(cell) || `Kolom ${index + 1}`,
  )
  const rows = data
    .slice(1)
    .filter((row) => row.some((cell) => cellText(cell) !== ""))

  if (rows.length === 0) {
    throw new StudentWorkbookError("File belum berisi baris data siswa.")
  }
  if (rows.length > 500) {
    throw new StudentWorkbookError(
      "Maksimal 500 siswa dalam satu kali import. Bagi file menjadi beberapa bagian.",
    )
  }

  return { fileName: file.name, headers, rows }
}
