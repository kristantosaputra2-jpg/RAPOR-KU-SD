import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TeacherPage } from "@/features/teachers/teacher-page"

const teacherMocks = vi.hoisted(() => ({
  getTeachers: vi.fn(),
  createTeacher: vi.fn(),
  updateTeacher: vi.fn(),
  setTeacherActive: vi.fn(),
}))

vi.mock("@/features/teachers/teacher.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/teachers/teacher.service")>()

  return { ...original, ...teacherMocks }
})

const teacher = {
  id: "teacher-1",
  user_id: null,
  full_name: "Ibu Rina",
  nip: "19800101",
  nuptk: null,
  email: "rina@example.com",
  role: "homeroom_teacher" as const,
  is_active: true,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

function renderPage() {
  return render(
    <TeacherPage
      userId="admin-1"
      userName="Admin Sekolah"
      schoolName="SD Negeri Tumbang Kawei"
      onBack={vi.fn()}
      onLogout={vi.fn()}
    />,
  )
}

describe("TeacherPage", () => {
  beforeEach(() => {
    teacherMocks.getTeachers.mockReset()
    teacherMocks.createTeacher.mockReset()
    teacherMocks.updateTeacher.mockReset()
    teacherMocks.setTeacherActive.mockReset()
    teacherMocks.getTeachers.mockResolvedValue([teacher])
  })

  it("menampilkan empty state yang menjelaskan tindakan", async () => {
    teacherMocks.getTeachers.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText("Belum ada data guru")).toBeInTheDocument()
    expect(
      screen.getByText("Tambahkan guru pertama untuk menyiapkan data sekolah."),
    ).toBeInTheDocument()
  })

  it("menambahkan guru dari form yang ramah layar kecil", async () => {
    const user = userEvent.setup()
    teacherMocks.getTeachers.mockResolvedValue([])
    teacherMocks.createTeacher.mockResolvedValue(teacher)
    renderPage()

    await screen.findByText("Belum ada data guru")
    await user.click(screen.getAllByRole("button", { name: "Tambah Guru" })[0])
    await user.type(screen.getByLabelText(/Nama Lengkap/), "Ibu Rina")
    await user.type(screen.getByLabelText(/^Email/), "rina@example.com")
    await user.type(screen.getByLabelText(/^NIP/), "19800101")
    await user.selectOptions(
      screen.getByLabelText(/Peran Utama/),
      "homeroom_teacher",
    )
    await user.click(screen.getByRole("button", { name: "Simpan Guru" }))

    await waitFor(() => {
      expect(teacherMocks.createTeacher).toHaveBeenCalledWith(
        "admin-1",
        expect.objectContaining({
          fullName: "Ibu Rina",
          email: "rina@example.com",
          role: "homeroom_teacher",
        }),
      )
    })
    expect(
      await screen.findByText("Guru berhasil ditambahkan."),
    ).toBeInTheDocument()
  })

  it("mencari guru tanpa membuka halaman lain", async () => {
    const user = userEvent.setup()
    teacherMocks.getTeachers.mockResolvedValue([
      teacher,
      {
        ...teacher,
        id: "teacher-2",
        full_name: "Pak Budi",
        email: "budi@example.com",
      },
    ])
    renderPage()

    await screen.findAllByText("Ibu Rina")
    await user.type(screen.getByLabelText("Cari guru"), "Budi")

    expect(screen.queryByText("Ibu Rina")).not.toBeInTheDocument()
    expect(screen.getAllByText("Pak Budi").length).toBeGreaterThan(0)
  })

  it("meminta konfirmasi sebelum menonaktifkan guru", async () => {
    const user = userEvent.setup()
    teacherMocks.setTeacherActive.mockResolvedValue({
      ...teacher,
      is_active: false,
    })
    renderPage()

    await screen.findAllByText("Ibu Rina")
    await user.click(screen.getAllByRole("button", { name: "Nonaktifkan" })[0])
    expect(
      screen.getByRole("heading", { name: "Nonaktifkan guru?" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Ya, Nonaktifkan" }))

    await waitFor(() => {
      expect(teacherMocks.setTeacherActive).toHaveBeenCalledWith(
        "admin-1",
        "teacher-1",
        false,
      )
    })
    expect(
      await screen.findByText("Ibu Rina telah dinonaktifkan."),
    ).toBeInTheDocument()
  })
})
