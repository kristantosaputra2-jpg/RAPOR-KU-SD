import type {
  AcademicYear,
  Semester,
} from "@/features/academic-periods/academic-periods.service"
import type { SchoolClass } from "@/features/classes/class.service"
import { getReportCompleteness } from "@/features/report-status/report-completeness.service"
import { buildReportViewModel } from "@/features/reports/report-view-model"
import { getClassReportSourceData } from "@/features/reports/report.service"
import type { Student } from "@/features/students/student.service"

import {
  buildLowerPrimaryLegerViewModel,
  LowerPrimaryLegerError,
} from "./leger-view-model"

export async function getLowerPrimaryLeger(
  schoolClass: SchoolClass,
  students: ReadonlyArray<Student>,
  academicYear: AcademicYear,
  semester: Semester,
) {
  if (schoolClass.template_group !== "lower_primary") {
    throw new LowerPrimaryLegerError(
      "Pilih kelas 1 sampai 3 untuk membuka leger ini.",
    )
  }
  if (students.length === 0) {
    throw new LowerPrimaryLegerError("Belum ada siswa aktif di kelas ini.")
  }

  const [sources, completeness] = await Promise.all([
    getClassReportSourceData(
      schoolClass.id,
      semester.id,
      students.map((student) => student.id),
    ),
    getReportCompleteness(
      schoolClass.id,
      semester.id,
      schoolClass.grade_level,
      students,
    ),
  ])
  const reports = students.flatMap((student) => {
    const source = sources.get(student.id)
    return source
      ? [
          buildReportViewModel({
            schoolClass,
            student,
            academicYear,
            semester,
            source,
          }),
        ]
      : []
  })
  if (reports.length !== students.length) {
    throw new LowerPrimaryLegerError(
      "Sebagian data siswa belum dapat disusun menjadi leger.",
    )
  }

  return buildLowerPrimaryLegerViewModel(reports, completeness)
}
