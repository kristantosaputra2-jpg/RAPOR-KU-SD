import { describe, expect, it } from "vitest"

import { isUserRole, USER_ROLE_LABELS, USER_ROLES } from "./auth.types"

describe("user roles", () => {
  it("keeps the three approved MVP roles in one source", () => {
    expect(USER_ROLES).toEqual(["admin", "homeroom_teacher", "subject_teacher"])
    expect(USER_ROLE_LABELS.homeroom_teacher).toBe("Wali Kelas")
  })

  it("rejects roles outside the approved MVP scope", () => {
    expect(isUserRole("admin")).toBe(true)
    expect(isUserRole("parent")).toBe(false)
  })
})
