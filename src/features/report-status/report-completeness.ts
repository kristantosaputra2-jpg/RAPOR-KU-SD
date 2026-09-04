export type ReportStatus =
  "not_started" | "partial" | "complete" | "ready_to_print"

export type ReportChecklist = Readonly<{
  identity: boolean
  grades: boolean
  descriptions: boolean
  attendance: boolean
  extracurricular: boolean
  achievement: boolean
  homeroomNote: boolean
}>

export const REPORT_STATUS_LABELS: Readonly<Record<ReportStatus, string>> = {
  not_started: "Belum Diisi",
  partial: "Sebagian",
  complete: "Lengkap",
  ready_to_print: "Siap Cetak",
}

export function calculateReportCompleteness(
  checks: ReportChecklist,
): ReportStatus {
  const contentChecks = [
    checks.grades,
    checks.descriptions,
    checks.attendance,
    checks.extracurricular,
    checks.achievement,
    checks.homeroomNote,
  ]

  if (contentChecks.every((check) => !check)) return "not_started"
  if (contentChecks.some((check) => !check)) return "partial"
  return checks.identity ? "ready_to_print" : "complete"
}

export function isSchoolIdentityComplete(
  school: Readonly<{
    school_name: string
    npsn: string | null
    address: string | null
    district: string | null
    city: string | null
    province: string | null
    principal_name: string | null
  }> | null,
): boolean {
  if (!school) return false
  return [
    school.school_name,
    school.npsn,
    school.address,
    school.district,
    school.city,
    school.province,
    school.principal_name,
  ].every((value) => Boolean(value?.trim()))
}

export function isStudentIdentityComplete(
  student: Readonly<{
    full_name: string
    nis: string
    gender: string
    birth_place: string | null
    birth_date: string | null
  }>,
): boolean {
  return [
    student.full_name,
    student.nis,
    student.gender,
    student.birth_place,
    student.birth_date,
  ].every((value) => Boolean(value?.trim()))
}

function requirementKey(...parts: ReadonlyArray<string>) {
  return parts.join(":")
}

export function hasCompleteGrades(
  studentId: string,
  subjectIds: ReadonlyArray<string>,
  outcomes: ReadonlyArray<Readonly<{ id: string; subjectId: string }>>,
  componentIds: ReadonlyArray<string>,
  populatedGradeKeys: ReadonlySet<string>,
): boolean {
  return (
    subjectIds.length > 0 &&
    componentIds.length > 0 &&
    subjectIds.every((subjectId) => {
      const subjectOutcomes = outcomes.filter(
        (outcome) => outcome.subjectId === subjectId,
      )
      return (
        subjectOutcomes.length > 0 &&
        subjectOutcomes.every((outcome) =>
          componentIds.every((componentId) =>
            populatedGradeKeys.has(
              requirementKey(studentId, subjectId, outcome.id, componentId),
            ),
          ),
        )
      )
    })
  )
}

export function hasCompleteDescriptions(
  studentId: string,
  subjectIds: ReadonlyArray<string>,
  componentIds: ReadonlyArray<string>,
  populatedDescriptionKeys: ReadonlySet<string>,
): boolean {
  return (
    subjectIds.length > 0 &&
    componentIds.length > 0 &&
    subjectIds.every((subjectId) =>
      componentIds.every((componentId) =>
        populatedDescriptionKeys.has(
          requirementKey(studentId, subjectId, componentId),
        ),
      ),
    )
  )
}
