import type { TeacherAssignment } from "@/features/assignments/assignment.service"
import type { UserRole } from "@/features/auth/auth.types"
import type { SchoolClass } from "@/features/classes/class.service"
import type { Subject } from "@/features/subjects/subject.service"

type GradeClassRecord = Pick<SchoolClass, "id" | "homeroom_teacher_id">
type GradeSubjectRecord = Pick<Subject, "id" | "is_active">
type GradeAssignmentRecord = Pick<
  TeacherAssignment,
  "class_id" | "subject_id" | "is_active"
>

export function getGradeClassOptions<T extends GradeClassRecord>(
  role: UserRole,
  classes: ReadonlyArray<T>,
  assignments: ReadonlyArray<GradeAssignmentRecord>,
) {
  if (role === "admin" || role === "homeroom_teacher") return classes

  const assignedClassIds = new Set(
    assignments
      .filter((assignment) => assignment.is_active)
      .map((assignment) => assignment.class_id),
  )
  return classes.filter((schoolClass) => assignedClassIds.has(schoolClass.id))
}

export function getGradeSubjectOptions<T extends GradeSubjectRecord>(
  role: UserRole,
  classId: string,
  homeroomTeacherId: string | null,
  currentTeacherId: string | null,
  subjects: ReadonlyArray<T>,
  assignments: ReadonlyArray<GradeAssignmentRecord>,
) {
  const activeSubjects = subjects.filter((subject) => subject.is_active)
  const isOwnHomeroomClass =
    role === "homeroom_teacher" &&
    currentTeacherId !== null &&
    homeroomTeacherId === currentTeacherId

  if (role === "admin" || isOwnHomeroomClass) return activeSubjects

  const assignedSubjectIds = new Set(
    assignments
      .filter(
        (assignment) => assignment.is_active && assignment.class_id === classId,
      )
      .map((assignment) => assignment.subject_id),
  )
  return activeSubjects.filter((subject) => assignedSubjectIds.has(subject.id))
}
