import type { LowerPrimaryLegerViewModel } from "./leger-view-model"

function escapeCsv(value: string | number | null) {
  const text = value === null ? "" : String(value)
  return /[";,\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildLowerPrimaryLegerCsv(
  leger: LowerPrimaryLegerViewModel,
): string {
  const scoreHeadings = leger.subjectColumns.flatMap((subject) =>
    subject.components.flatMap((component) => [
      `${subject.subjectName} - ${component.componentName} - Nilai`,
      `${subject.subjectName} - ${component.componentName} - Predikat`,
    ]),
  )
  const rows = leger.rows.map((row, index) => {
    const scores = leger.subjectColumns.flatMap((subject) =>
      subject.components.flatMap((component) => {
        const value = row.subjects
          .find((item) => item.subjectId === subject.subjectId)
          ?.components.find(
            (item) => item.componentId === component.componentId,
          )
        return [value?.average ?? null, value?.predicate ?? null]
      }),
    )
    return [
      index + 1,
      row.nis,
      row.studentName,
      ...scores,
      row.statusLabel,
      row.achievementSummary.join(" | "),
    ]
  })

  return [
    ["Leger Kelas", leger.className],
    ["Sekolah", leger.schoolName],
    ["Tahun Ajaran", leger.academicYear],
    ["Semester", leger.semester],
    [],
    [
      "No",
      "NIS",
      "Nama Siswa",
      ...scoreHeadings,
      "Status",
      "Ringkasan Capaian",
    ],
    ...rows,
  ]
    .map((row) => row.map(escapeCsv).join(";"))
    .join("\r\n")
}

export function createLegerFilename(leger: LowerPrimaryLegerViewModel) {
  const safeClassName = leger.className
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `leger-${safeClassName || "kelas"}.csv`
}
