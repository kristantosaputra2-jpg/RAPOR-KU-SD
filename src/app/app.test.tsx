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

const schoolMocks = vi.hoisted(() => ({
  getSchoolSettings: vi.fn(),
  saveSchoolSettings: vi.fn(),
}))

const identityMocks = vi.hoisted(() => ({
  getPublicSchoolIdentity: vi.fn(),
}))

const academicPeriodMocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn(),
}))

const teacherMocks = vi.hoisted(() => ({
  getTeachers: vi.fn(),
}))

const classMocks = vi.hoisted(() => ({
  getClasses: vi.fn(),
}))

vi.mock("@/features/auth/auth.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/auth/auth.service")>()

  return { ...original, ...authMocks }
})

vi.mock(
  "@/features/schools/school-settings.service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/features/schools/school-settings.service")
      >()

    return { ...original, ...schoolMocks }
  },
)

vi.mock("@/features/teachers/teacher.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/teachers/teacher.service")>()

  return { ...original, ...teacherMocks }
})

vi.mock("@/features/classes/class.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/classes/class.service")>()

  return { ...original, ...classMocks }
})

vi.mock(
  "@/features/academic-periods/academic-periods.service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/features/academic-periods/academic-periods.service")
      >()

    return { ...original, ...academicPeriodMocks }
  },
)

vi.mock(
  "@/features/schools/school-identity.service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/features/schools/school-identity.service")
      >()

    return { ...original, ...identityMocks }
  },
)

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
    schoolMocks.getSchoolSettings.mockReset()
    schoolMocks.saveSchoolSettings.mockReset()
    schoolMocks.getSchoolSettings.mockResolvedValue(null)
    identityMocks.getPublicSchoolIdentity.mockReset()
    identityMocks.getPublicSchoolIdentity.mockResolvedValue({
      schoolName: "SD Negeri Tumbang Kawei",
      logoUrl: null,
    })
    academicPeriodMocks.getAcademicPeriods.mockReset()
    academicPeriodMocks.getAcademicPeriods.mockResolvedValue({
      schoolId: "school-1",
      academicYears: [],
      semesters: [],
    })
    teacherMocks.getTeachers.mockReset()
    teacherMocks.getTeachers.mockResolvedValue([])
    classMocks.getClasses.mockReset()
    classMocks.getClasses.mockResolvedValue([])
  })

  it("menampilkan login ketika tidak ada sesi aktif", async () => {
    render(<App />)

    expect(
      await screen.findByRole("heading", { name: "Masuk ke akun Anda" }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/daftar/i)).not.toBeInTheDocument()
    expect(
      (await screen.findAllByText("SD Negeri Tumbang Kawei")).length,
    ).toBeGreaterThan(0)
  })

  it("memulihkan sesi aktif dan menampilkan identitas pengguna", async () => {
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)

    render(<App />)

    expect(
      await screen.findByText("Selamat datang, Admin Sekolah"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Akun Admin aktif")).toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe("RapotKu - SD Negeri Tumbang Kawei")
    })
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

  it("membuka pengaturan sekolah lalu kembali ke dashboard", async () => {
    const user = userEvent.setup()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)
    render(<App />)

    await user.click(await screen.findByRole("button", { name: "Atur" }))
    expect(
      await screen.findByRole("heading", { name: "Pengaturan Sekolah" }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Kembali ke Dashboard" }),
    )
    expect(
      await screen.findByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeInTheDocument()
  })

  it("membuka pengaturan tahun ajaran dan semester", async () => {
    const user = userEvent.setup()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)
    render(<App />)

    await user.click(
      await screen.findByRole("button", { name: "Periode belum aktif" }),
    )
    expect(
      await screen.findByRole("heading", { name: "Tahun Ajaran & Semester" }),
    ).toBeInTheDocument()
  })

  it("membuka Data Guru lalu kembali ke dashboard", async () => {
    const user = userEvent.setup()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)
    render(<App />)

    await user.click(
      (await screen.findAllByRole("button", { name: "Data Guru" }))[0],
    )
    expect(
      await screen.findByRole("heading", { name: "Data Guru" }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Kembali ke Dashboard" }),
    )
    expect(
      await screen.findByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeInTheDocument()
  })

  it("membuka Data Kelas dari navigasi", async () => {
    const user = userEvent.setup()
    authMocks.getCurrentAuthenticatedUser.mockResolvedValue(account)
    render(<App />)

    await user.click(
      (await screen.findAllByRole("button", { name: "Data Kelas" }))[0],
    )

    expect(
      await screen.findByRole("heading", { name: "Data Kelas" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Periode belum tersedia")).toBeInTheDocument()
  })
})
