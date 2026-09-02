import type { Session, User } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import {
  AuthFlowError,
  getCurrentAuthenticatedUser,
  signInWithPassword,
  signOut,
} from "@/features/auth/auth.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const user = { id: "user-1", email: "guru@example.com" } as User
const session = { access_token: "token", user } as Session

function createClientMock(options?: {
  loginError?: boolean
  profileActive?: boolean
  profileRole?: "admin" | "homeroom_teacher" | "subject_teacher" | null
  sessionAvailable?: boolean
}) {
  const profile = {
    id: user.id,
    full_name: "Guru Contoh",
    role:
      options?.profileRole === undefined
        ? "subject_teacher"
        : options.profileRole,
    is_active: options?.profileActive ?? true,
  }
  const single = vi.fn().mockResolvedValue({ data: profile, error: null })
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  const auth = {
    signInWithPassword: vi
      .fn()
      .mockResolvedValue(
        options?.loginError
          ? { data: { user: null, session: null }, error: new Error("invalid") }
          : { data: { user, session }, error: null },
      ),
    getSession: vi.fn().mockResolvedValue({
      data: { session: options?.sessionAvailable === false ? null : session },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  }

  return {
    client: { auth, from } as unknown as RapotKuSupabaseClient,
    auth,
  }
}

describe("auth service", () => {
  it("signs in an active user and returns the assigned role", async () => {
    const { client, auth } = createClientMock({
      profileRole: "homeroom_teacher",
    })

    const result = await signInWithPassword(
      { email: " GURU@example.com ", password: "aman1234" },
      client,
    )

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "guru@example.com",
      password: "aman1234",
    })
    expect(result.profile.role).toBe("homeroom_teacher")
  })

  it("returns a generic message for invalid credentials", async () => {
    const { client } = createClientMock({ loginError: true })

    await expect(
      signInWithPassword(
        { email: "guru@example.com", password: "salah" },
        client,
      ),
    ).rejects.toThrow("Email atau kata sandi tidak sesuai.")
  })

  it("signs out a user whose profile is inactive", async () => {
    const { client, auth } = createClientMock({ profileActive: false })

    await expect(
      signInWithPassword(
        { email: "guru@example.com", password: "aman1234" },
        client,
      ),
    ).rejects.toBeInstanceOf(AuthFlowError)
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" })
  })

  it("restores a persisted active session", async () => {
    const { client } = createClientMock()

    await expect(getCurrentAuthenticatedUser(client)).resolves.toMatchObject({
      user,
      session,
      profile: { role: "subject_teacher" },
    })
  })

  it("returns null when no persisted session exists", async () => {
    const { client } = createClientMock({ sessionAvailable: false })

    await expect(getCurrentAuthenticatedUser(client)).resolves.toBeNull()
  })

  it("uses local sign-out so other devices remain signed in", async () => {
    const { client, auth } = createClientMock()

    await signOut(client)

    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" })
  })
})
