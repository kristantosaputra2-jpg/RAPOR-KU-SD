import {
  getAcademicPeriods,
  getActiveAcademicPeriod,
} from "@/features/academic-periods/academic-periods.service"
import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

export type SubjectTeacherAssignmentSummary = Readonly<{
  id: string
  classId: string
  className: string
  gradeLevel: number
  subjectId: string
  subjectName: string
}>

export type SubjectTeacherDashboardData = Readonly<{
  academicYear: string | null
  semester: number | null
  assignments: ReadonlyArray<SubjectTeacherAssignmentSummary>
  classCount: number
  subjectCount: number
}>

export class SubjectTeacherDashboardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SubjectTeacherDashboardError"
  }
}

type AssignmentReference = Readonly<{
  id: string
  class_id: string
  subject_id: string
}>

type ClassReference = Readonly<{
  id: string
  name: string
  grade_level: number
}>

type SubjectReference = Readonly<{
  id: string
  name: string
}>

export function buildSubjectTeacherAssignmentSummaries(
  assignments: ReadonlyArray<AssignmentReference>,
  classes: ReadonlyArray<ClassReference>,
  subjects: ReadonlyArray<SubjectReference>,
): ReadonlyArray<SubjectTeacherAssignmentSummary> {
  const classesById = new Map(classes.map((item) => [item.id, item]))
  const subjectsById = new Map(subjects.map((item) => [item.id, item]))

  return assignments
    .flatMap((assignment) => {
      const schoolClass = classesById.get(assignment.class_id)
      const subject = subjectsById.get(assignment.subject_id)
      if (!schoolClass || !subject) return []

      return [
        {
          id: assignment.id,
          classId: schoolClass.id,
          className: schoolClass.name,
          gradeLevel: schoolClass.grade_level,
          subjectId: subject.id,
          subjectName: subject.name,
        },
      ]
    })
    .sort(
      (left, right) =>
        left.gradeLevel - right.gradeLevel ||
        left.className.localeCompare(right.className, "id") ||
        left.subjectName.localeCompare(right.subjectName, "id"),
    )
}

export async function getSubjectTeacherDashboardData(
  userId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<SubjectTeacherDashboardData> {
  const [periods, teacherResult] = await Promise.all([
    getAcademicPeriods(client),
    client
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
  ])

  if (teacherResult.error) {
    throw new SubjectTeacherDashboardError(
      "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  const activePeriod = getActiveAcademicPeriod(periods)
  if (!teacherResult.data || !activePeriod.semester) {
    return {
      academicYear: activePeriod.academicYear?.name ?? null,
      semester: activePeriod.semester?.number ?? null,
      assignments: [],
      classCount: 0,
      subjectCount: 0,
    }
  }

  const { data: assignments, error: assignmentError } = await client
    .from("teacher_assignments")
    .select("id,class_id,subject_id")
    .eq("teacher_id", teacherResult.data.id)
    .eq("semester_id", activePeriod.semester.id)
    .eq("is_active", true)

  if (assignmentError) {
    throw new SubjectTeacherDashboardError(
      "Penugasan mengajar belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  if (!assignments.length) {
    return {
      academicYear: activePeriod.academicYear?.name ?? null,
      semester: activePeriod.semester.number,
      assignments: [],
      classCount: 0,
      subjectCount: 0,
    }
  }

  const classIds = [...new Set(assignments.map((item) => item.class_id))]
  const subjectIds = [...new Set(assignments.map((item) => item.subject_id))]
  const [classResult, subjectResult] = await Promise.all([
    client.from("classes").select("id,name,grade_level").in("id", classIds),
    client.from("subjects").select("id,name").in("id", subjectIds),
  ])

  if (classResult.error || subjectResult.error) {
    throw new SubjectTeacherDashboardError(
      "Rincian penugasan belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  const summaries = buildSubjectTeacherAssignmentSummaries(
    assignments,
    classResult.data,
    subjectResult.data,
  )

  return {
    academicYear: activePeriod.academicYear?.name ?? null,
    semester: activePeriod.semester.number,
    assignments: summaries,
    classCount: new Set(summaries.map((item) => item.classId)).size,
    subjectCount: new Set(summaries.map((item) => item.subjectId)).size,
  }
}
