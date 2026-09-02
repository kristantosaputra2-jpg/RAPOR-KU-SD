import type { Enums } from "@/types/database.types"

export const USER_ROLES = [
  "admin",
  "homeroom_teacher",
  "subject_teacher",
] as const

export type UserRole = Enums<"user_role">

export const USER_ROLE_LABELS = {
  admin: "Admin",
  homeroom_teacher: "Wali Kelas",
  subject_teacher: "Guru Mata Pelajaran",
} satisfies Record<UserRole, string>

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.some((role) => role === value)
}
