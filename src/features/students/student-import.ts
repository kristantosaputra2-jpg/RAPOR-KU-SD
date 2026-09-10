import {
  normalizeStudentInput,
  StudentError,
  type NormalizedStudentInput,
  type Student,
  type StudentGender,
  type StudentInput,
} from "@/features/students/student.service"

export type SpreadsheetCell = string | number | boolean | Date | null
export type SpreadsheetRow = ReadonlyArray<SpreadsheetCell>

export type StudentImportField =
  | "fullName"
  | "nis"
  | "nisn"
  | "gender"
  | "birthPlace"
  | "birthDate"
  | "religion"
  | "address"
  | "fatherName"
  | "motherName"
  | "guardianName"

export type StudentImportMapping = Record<StudentImportField, number | null>

export type StudentImportIssue = Readonly<{
  rowNumber: number
  field: StudentImportField | "row"
  columnLabel: string
  message: string
  suggestion: string
}>

export type StudentImportPreviewRow = Readonly<{
  rowNumber: number
  input: StudentInput
  normalized: NormalizedStudentInput | null
  issues: ReadonlyArray<StudentImportIssue>
}>

export type StudentImportValidation = Readonly<{
  rows: ReadonlyArray<StudentImportPreviewRow>
  validRows: ReadonlyArray<NormalizedStudentInput>
  issues: ReadonlyArray<StudentImportIssue>
}>

type FieldDefinition = Readonly<{
  field: StudentImportField
  label: string
  required: boolean
  aliases: ReadonlyArray<string>
}>

export const STUDENT_IMPORT_FIELDS: ReadonlyArray<FieldDefinition> = [
  {
    field: "fullName",
    label: "Nama Lengkap",
    required: true,
    aliases: ["nama", "nama lengkap", "nama siswa", "siswa"],
  },
  {
    field: "nis",
    label: "NIS",
    required: true,
    aliases: ["nis", "nomor induk", "nomor induk siswa"],
  },
  {
    field: "nisn",
    label: "NISN",
    required: false,
    aliases: ["nisn", "nomor induk siswa nasional"],
  },
  {
    field: "gender",
    label: "Jenis Kelamin",
    required: true,
    aliases: ["jenis kelamin", "jk", "gender", "l/p", "lp"],
  },
  {
    field: "birthPlace",
    label: "Tempat Lahir",
    required: false,
    aliases: ["tempat lahir", "tempatlahir"],
  },
  {
    field: "birthDate",
    label: "Tanggal Lahir",
    required: false,
    aliases: ["tanggal lahir", "tgl lahir", "tanggallahir", "ttl tanggal"],
  },
  {
    field: "religion",
    label: "Agama",
    required: false,
    aliases: ["agama"],
  },
  {
    field: "address",
    label: "Alamat",
    required: false,
    aliases: ["alamat", "alamat siswa"],
  },
  {
    field: "fatherName",
    label: "Nama Ayah",
    required: false,
    aliases: ["nama ayah", "ayah"],
  },
  {
    field: "motherName",
    label: "Nama Ibu",
    required: false,
    aliases: ["nama ibu", "ibu"],
  },
  {
    field: "guardianName",
    label: "Nama Wali",
    required: false,
    aliases: ["nama wali", "wali"],
  },
]

const emptyMapping = Object.fromEntries(
  STUDENT_IMPORT_FIELDS.map(({ field }) => [field, null]),
) as StudentImportMapping

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function cellText(value: SpreadsheetCell): string {
  if (value === null) return ""
  if (value instanceof Date) return formatDate(value)
  return String(value).trim()
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDate(value: SpreadsheetCell): string | null {
  if (value === null || cellText(value) === "") return ""

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value)
  }

  const text = cellText(value)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const idMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text)
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : idMatch
      ? [Number(idMatch[3]), Number(idMatch[2]), Number(idMatch[1])]
      : null

  if (!parts) return null

  const [year, month, day] = parts
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function parseGender(value: SpreadsheetCell): StudentGender | null {
  const normalized = normalizeHeader(cellText(value))
  if (["l", "lk", "laki laki", "laki", "male", "pria"].includes(normalized)) {
    return "male"
  }
  if (["p", "pr", "perempuan", "female", "wanita"].includes(normalized)) {
    return "female"
  }
  return null
}

function valueAt(
  row: SpreadsheetRow,
  mapping: StudentImportMapping,
  field: StudentImportField,
) {
  const index = mapping[field]
  return index === null ? null : (row[index] ?? null)
}

function fieldLabel(field: StudentImportField) {
  return (
    STUDENT_IMPORT_FIELDS.find((definition) => definition.field === field)
      ?.label ?? field
  )
}

function issue(
  rowNumber: number,
  field: StudentImportIssue["field"],
  message: string,
  suggestion: string,
): StudentImportIssue {
  return {
    rowNumber,
    field,
    columnLabel: field === "row" ? "Baris" : fieldLabel(field),
    message,
    suggestion,
  }
}

export function suggestStudentImportMapping(
  headers: ReadonlyArray<string>,
): StudentImportMapping {
  const result = { ...emptyMapping }
  const normalizedHeaders = headers.map(normalizeHeader)

  for (const definition of STUDENT_IMPORT_FIELDS) {
    const aliasSet = new Set(definition.aliases.map(normalizeHeader))
    const columnIndex = normalizedHeaders.findIndex((header) =>
      aliasSet.has(header),
    )
    result[definition.field] = columnIndex >= 0 ? columnIndex : null
  }

  return result
}

export function validateStudentImportMapping(
  mapping: StudentImportMapping,
): ReadonlyArray<string> {
  const errors: string[] = []
  const usedColumns = new Map<number, string>()

  for (const definition of STUDENT_IMPORT_FIELDS) {
    const column = mapping[definition.field]
    if (definition.required && column === null) {
      errors.push(`${definition.label} wajib dipasangkan dengan kolom Excel.`)
    }
    if (column !== null) {
      const previous = usedColumns.get(column)
      if (previous) {
        errors.push(
          `Kolom yang sama dipakai untuk ${previous} dan ${definition.label}.`,
        )
      } else {
        usedColumns.set(column, definition.label)
      }
    }
  }

  return errors
}

export function validateStudentImport(
  sourceRows: ReadonlyArray<SpreadsheetRow>,
  mapping: StudentImportMapping,
  existingStudents: ReadonlyArray<Student>,
): StudentImportValidation {
  const mappingErrors = validateStudentImportMapping(mapping)
  if (mappingErrors.length > 0) {
    throw new StudentError(mappingErrors[0])
  }

  const existingNis = new Set(
    existingStudents.map((student) =>
      student.nis.trim().toLocaleLowerCase("id-ID"),
    ),
  )
  const existingNisn = new Set(
    existingStudents.flatMap((student) =>
      student.nisn ? [student.nisn.trim()] : [],
    ),
  )
  const existingCandidates = new Set(
    existingStudents
      .filter((student) => student.birth_date)
      .map(
        (student) =>
          `${student.full_name.trim().toLocaleLowerCase("id-ID")}|${student.birth_date}`,
      ),
  )
  const fileNis = new Set<string>()
  const fileNisn = new Set<string>()
  const fileCandidates = new Set<string>()
  const rows: StudentImportPreviewRow[] = []

  sourceRows.forEach((row, index) => {
    const rowNumber = index + 2
    const rowIssues: StudentImportIssue[] = []
    const fullName = cellText(valueAt(row, mapping, "fullName"))
    const nis = cellText(valueAt(row, mapping, "nis"))
    const nisn = cellText(valueAt(row, mapping, "nisn"))
    const genderValue = valueAt(row, mapping, "gender")
    const gender = parseGender(genderValue)
    const birthDateValue = valueAt(row, mapping, "birthDate")
    const birthDate = parseDate(birthDateValue)

    if (!fullName) {
      rowIssues.push(
        issue(rowNumber, "fullName", "Nama lengkap kosong.", "Isi nama siswa."),
      )
    }
    if (!nis) {
      rowIssues.push(issue(rowNumber, "nis", "NIS kosong.", "Isi NIS siswa."))
    } else if (nis.length > 30 || !/^[a-zA-Z0-9./-]+$/.test(nis)) {
      rowIssues.push(
        issue(
          rowNumber,
          "nis",
          "Format NIS tidak sesuai.",
          "Gunakan maksimal 30 karakter berupa huruf, angka, titik, garis miring, atau tanda hubung.",
        ),
      )
    }
    if (nisn && !/^\d{10}$/.test(nisn)) {
      rowIssues.push(
        issue(
          rowNumber,
          "nisn",
          "NISN harus terdiri dari 10 angka.",
          "Perbaiki NISN atau kosongkan bila belum tersedia.",
        ),
      )
    }
    if (!gender) {
      rowIssues.push(
        issue(
          rowNumber,
          "gender",
          `Jenis kelamin “${cellText(genderValue) || "kosong"}” tidak dikenali.`,
          "Gunakan L/Laki-laki atau P/Perempuan.",
        ),
      )
    }
    if (birthDate === null) {
      rowIssues.push(
        issue(
          rowNumber,
          "birthDate",
          "Format tanggal lahir tidak dikenali.",
          "Gunakan DD/MM/YYYY atau YYYY-MM-DD.",
        ),
      )
    }

    const normalizedNis = nis.toLocaleLowerCase("id-ID")
    if (nis && (existingNis.has(normalizedNis) || fileNis.has(normalizedNis))) {
      rowIssues.push(
        issue(
          rowNumber,
          "nis",
          `NIS ${nis} sudah digunakan.`,
          "Periksa siswa yang sudah ada atau gunakan NIS yang benar.",
        ),
      )
    }
    if (nisn && (existingNisn.has(nisn) || fileNisn.has(nisn))) {
      rowIssues.push(
        issue(
          rowNumber,
          "nisn",
          `NISN ${nisn} sudah digunakan.`,
          "Periksa siswa yang sudah ada atau gunakan NISN yang benar.",
        ),
      )
    }

    if (nis) fileNis.add(normalizedNis)
    if (nisn) fileNisn.add(nisn)

    const input: StudentInput = {
      fullName,
      nis,
      nisn,
      gender: gender ?? "male",
      birthPlace: cellText(valueAt(row, mapping, "birthPlace")),
      birthDate: birthDate ?? "",
      religion: cellText(valueAt(row, mapping, "religion")),
      address: cellText(valueAt(row, mapping, "address")),
      fatherName: cellText(valueAt(row, mapping, "fatherName")),
      motherName: cellText(valueAt(row, mapping, "motherName")),
      guardianName: cellText(valueAt(row, mapping, "guardianName")),
    }

    let normalized: NormalizedStudentInput | null = null
    if (rowIssues.length === 0) {
      try {
        normalized = normalizeStudentInput(input)
      } catch (error) {
        rowIssues.push(
          issue(
            rowNumber,
            "row",
            error instanceof Error ? error.message : "Data siswa tidak sesuai.",
            "Periksa kembali isi baris ini.",
          ),
        )
      }
    }

    if (normalized?.birth_date) {
      const candidateKey = `${normalized.full_name.toLocaleLowerCase("id-ID")}|${normalized.birth_date}`
      if (
        existingCandidates.has(candidateKey) ||
        fileCandidates.has(candidateKey)
      ) {
        rowIssues.push(
          issue(
            rowNumber,
            "row",
            "Nama dan tanggal lahir sama dengan siswa yang sudah ada.",
            "Pastikan ini bukan siswa yang sama sebelum melanjutkan.",
          ),
        )
        normalized = null
      }
      fileCandidates.add(candidateKey)
    }

    rows.push({ rowNumber, input, normalized, issues: rowIssues })
  })

  const issues = rows.flatMap((row) => row.issues)
  return {
    rows,
    validRows:
      issues.length === 0
        ? rows.flatMap((row) => (row.normalized ? [row.normalized] : []))
        : [],
    issues,
  }
}
