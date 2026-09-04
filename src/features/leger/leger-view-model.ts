import {
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from "@/features/report-status/report-completeness"
import type { StudentReportCompleteness } from "@/features/report-status/report-completeness.service"
import type { ReportViewModel } from "@/features/reports/report-view-model"

export type LegerComponentValue = Readonly<{
  componentId: string
  componentName: string
  average: number | null
  predicate: string | null
  description: string | null
}>

export type LowerPrimaryLegerRow = Readonly<{
  studentId: string
  studentName: string
  nis: string
  subjects: ReadonlyArray<
    Readonly<{
      subjectId: string
      subjectName: string
      components: ReadonlyArray<LegerComponentValue>
    }>
  >
  status: ReportStatus
  statusLabel: string
  achievementSummary: ReadonlyArray<string>
}>

export type LowerPrimaryLegerViewModel = Readonly<{
  schoolName: string
  className: string
  academicYear: string
  semester: string
  subjectColumns: ReadonlyArray<
    Readonly<{
      subjectId: string
      subjectName: string
      components: ReadonlyArray<
        Readonly<{ componentId: string; componentName: string }>
      >
    }>
  >
  rows: ReadonlyArray<LowerPrimaryLegerRow>
}>

export class LowerPrimaryLegerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LowerPrimaryLegerError"
  }
}

export function buildLowerPrimaryLegerViewModel(
  reports: ReadonlyArray<ReportViewModel>,
  completeness: ReadonlyArray<StudentReportCompleteness>,
): LowerPrimaryLegerViewModel {
  const firstReport = reports[0]
  if (!firstReport) {
    throw new LowerPrimaryLegerError(
      "Belum ada siswa untuk ditampilkan di leger.",
    )
  }
  if (reports.some((report) => report.templateGroup !== "lower_primary")) {
    throw new LowerPrimaryLegerError(
      "Leger ini hanya digunakan untuk kelas 1 sampai 3.",
    )
  }

  const subjectColumns = firstReport.subjects.map((subject) => ({
    subjectId: subject.subjectId,
    subjectName: subject.subjectName,
    components: subject.components.map((component) => ({
      componentId: component.componentId,
      componentName: component.componentName,
    })),
  }))
  const completenessByStudent = new Map(
    completeness.map((item) => [item.studentId, item]),
  )

  return {
    schoolName: firstReport.school.name,
    className: firstReport.academicPeriod.className,
    academicYear: firstReport.academicPeriod.academicYear,
    semester: firstReport.academicPeriod.semester,
    subjectColumns,
    rows: reports.map((report) => {
      const status =
        completenessByStudent.get(report.student.id)?.status ?? "not_started"
      return {
        studentId: report.student.id,
        studentName: report.student.name,
        nis: report.student.nis,
        subjects: report.subjects.map((subject) => ({
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          components: subject.components.map((component) => ({
            componentId: component.componentId,
            componentName: component.componentName,
            average: component.average,
            predicate: component.predicate,
            description: component.description,
          })),
        })),
        status,
        statusLabel: REPORT_STATUS_LABELS[status],
        achievementSummary: report.subjects.flatMap((subject) =>
          subject.components.flatMap((component) =>
            component.description
              ? [
                  `${subject.subjectName} — ${component.componentName}: ${component.description}`,
                ]
              : [],
          ),
        ),
      }
    }),
  }
}
