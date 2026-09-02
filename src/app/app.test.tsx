import type { Session, User } from "@supabase/supabase-js"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/app/app"
import type { AuthenticatedUser } from "@/features/auth/auth.service"

const authMocks = vi.hoisted(() => ({
  getCurrentAuthenticatedUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("@/features/auth/auth.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/auth/auth.service")>()

  return { ...original, ...authMocks }
})

const account = {
  user: { id: "admin-1", email: "admin@example.com" } as User,
  session: { access_token: "token" } as Session,
  profile: {
    id: "admin-1",
    full_name: "Admin Sekolah",
    role: "admin",
    is_active: true,
  },
} satisfies AuthenticatedUser

describe("App", () => {
  beforeEach(() => {
    authMocks.getCurrentAuthenticatedUser.mockReset()
    authMocks.signInWithPassword.mockReset()
    authMocks.signOut.mockReset()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(null)
    authMocks.signOut.mockResolvedValue(undefined)
  })

  it("menampilkan login ketika tidak ada sesi aktif", async () => {
    render(<App />)

    expect(
      await screen.findByRole("heading", { name: "Masuk ke akun Anda" }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/daftar/i)).not.toBeInTheDocument()
  })

  it("memulihkan sesi aktif dan menampilkan identitas pengguna", async () => {
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)

    render(<App />)

    expect(
      await screen.findByText("Selamat datang, Admin Sekolah"),
    ).toBeInTheDocument()
    expect(screen.getByText(/masuk sebagai Admin/)).toBeInTheDocument()
  })

  it("masuk menggunakan email dan kata sandi dari form", async () => {
    const user = userEvent.setup()
    authMocks.signInWithPassword.mockResolvedValue(account)
    render(<App />)

    await user.type(await screen.findByLabelText("Email"), "admin@example.com")
    await user.type(screen.getByLabelText("Kata sandi"), "rahasia123")
    await user.click(screen.getByRole("button", { name: "Masuk" }))

    await waitFor(() => {
      expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@example.com",
        password: "rahasia123",
      })
    })
    expect(
      await screen.findByText("Selamat datang, Admin Sekolah"),
    ).toBeInTheDocument()
  })

  it("keluar dan kembali ke halaman login", async () => {
    const user = userEvent.setup()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)
    render(<App />)

    await user.click(await screen.findByRole("button", { name: "Keluar" }))

    expect(authMocks.signOut).toHaveBeenCalledOnce()
    expect(
      await screen.findByRole("heading", { name: "Masuk ke akun Anda" }),
    ).toBeInTheDocument()
  })
})
