import {
  getAcademicPeriods,
  getActiveAcademicPeriod,
} from "@/features/academic-periods/academic-periods.service"
import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

export type HomeroomClassSummary = Readonly<{
  id: string
  name: string
  gradeLevel: number
  studentCount: number
}>

export type HomeroomDashboardData = Readonly<{
  academicYear: string | null
  semester: number | null
  classes: ReadonlyArray<HomeroomClassSummary>
  studentCount: number
}>

export class HomeroomDashboardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HomeroomDashboardError"
  }
}

type ClassReference = Readonly<{
  id: string
  name: string
  grade_level: number
}>

type MembershipReference = Readonly<{
  class_id: string
  student_id: string
}>

export function buildHomeroomClassSummaries(
  classes: ReadonlyArray<ClassReference>,
  memberships: ReadonlyArray<MembershipReference>,
  activeStudentIds: ReadonlySet<string>,
): ReadonlyArray<HomeroomClassSummary> {
  return classes.map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
    gradeLevel: schoolClass.grade_level,
    studentCount: memberships.filter(
      (membership) =>
        membership.class_id === schoolClass.id &&
        activeStudentIds.has(membership.student_id),
    ).length,
  }))
}

export async function getHomeroomDashboardData(
  userId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<HomeroomDashboardData> {
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
    throw new HomeroomDashboardError(
      "Dashboard belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  const activePeriod = getActiveAcademicPeriod(periods)
  if (!teacherResult.data || !activePeriod.semester) {
    return {
      academicYear: activePeriod.academicYear?.name ?? null,
      semester: activePeriod.semester?.number ?? null,
      classes: [],
      studentCount: 0,
    }
  }

  const { data: classes, error: classError } = await client
    .from("classes")
    .select("id,name,grade_level")
    .eq("homeroom_teacher_id", teacherResult.data.id)
    .eq("semester_id", activePeriod.semester.id)
    .order("grade_level", { ascending: true })

  if (classError) {
    throw new HomeroomDashboardError(
      "Kelas wali belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  if (!classes.length) {
    return {
      academicYear: activePeriod.academicYear?.name ?? null,
      semester: activePeriod.semester.number,
      classes: [],
      studentCount: 0,
    }
  }

  const classIds = classes.map((schoolClass) => schoolClass.id)
  const { data: memberships, error: membershipError } = await client
    .from("class_members")
    .select("class_id,student_id")
    .in("class_id", classIds)
    .eq("semester_id", activePeriod.semester.id)

  if (membershipError) {
    throw new HomeroomDashboardError(
      "Daftar siswa kelas belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  const studentIds = [...new Set(memberships.map((item) => item.student_id))]
  let activeStudentIds = new Set<string>()

  if (studentIds.length) {
    const { data: students, error: studentError } = await client
      .from("students")
      .select("id")
      .in("id", studentIds)
      .eq("is_active", true)

    if (studentError) {
      throw new HomeroomDashboardError(
        "Daftar siswa kelas belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
      )
    }

    activeStudentIds = new Set(students.map((student) => student.id))
  }

  const classSummaries = buildHomeroomClassSummaries(
    classes,
    memberships,
    activeStudentIds,
  )

  return {
    academicYear: activePeriod.academicYear?.name ?? null,
    semester: activePeriod.semester.number,
    classes: classSummaries,
    studentCount: activeStudentIds.size,
  }
}
