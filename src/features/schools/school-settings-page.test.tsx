import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SchoolSettingsPage } from "@/features/schools/school-settings-page"
import type { SchoolSettings } from "@/features/schools/school-settings.service"

const schoolMocks = vi.hoisted(() => ({
  getSchoolSettings: vi.fn(),
  saveSchoolSettings: vi.fn(),
}))

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

const savedSettings: SchoolSettings = {
  id: "school-1",
  school_name: "Sekolah Dasar Contoh",
  npsn: "12345678",
  address: "Jalan Pendidikan",
  village: "Desa Contoh",
  district: "Kecamatan Contoh",
  city: "Kabupaten Contoh",
  province: "Kalimantan Tengah",
  postal_code: "73111",
  email: "sekolah@example.com",
  principal_name: "Kepala Sekolah",
  principal_nip: "1234567890",
  logo_url: null,
  updated_at: "2026-09-02T00:00:00.000Z",
}

function renderPage() {
  return render(
    <SchoolSettingsPage
      userId="admin-1"
      userName="Admin Sekolah"
      onBack={vi.fn()}
      onLogout={vi.fn().mockResolvedValue(undefined)}
    />,
  )
}

describe("SchoolSettingsPage", () => {
  beforeEach(() => {
    schoolMocks.getSchoolSettings.mockReset()
    schoolMocks.saveSchoolSettings.mockReset()
    schoolMocks.getSchoolSettings.mockResolvedValue(null)
  })

  it("menampilkan form kosong tanpa mengarang identitas sekolah", async () => {
    renderPage()

    expect(
      await screen.findByRole("heading", { name: "Pengaturan Sekolah" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Nama sekolah/)).toHaveValue("")
    expect(screen.getByLabelText("NPSN")).toHaveValue("")
    expect(
      screen.getByText(/Upload logo belum tersedia pada tahap ini/),
    ).toBeInTheDocument()
  })

  it("memuat identitas sekolah yang sudah tersimpan", async () => {
    schoolMocks.getSchoolSettings.mockResolvedValue(savedSettings)
    renderPage()

    expect(await screen.findByLabelText(/Nama sekolah/)).toHaveValue(
      "Sekolah Dasar Contoh",
    )
    expect(screen.getByLabelText("NPSN")).toHaveValue("12345678")
    expect(screen.getByLabelText("Nama kepala sekolah")).toHaveValue(
      "Kepala Sekolah",
    )
  })

  it("menyimpan semua bidang dengan identitas Admin", async () => {
    const user = userEvent.setup()
    schoolMocks.saveSchoolSettings.mockResolvedValue(savedSettings)
    renderPage()

    const schoolName = await screen.findByLabelText(/Nama sekolah/)
    await user.type(schoolName, "Sekolah Dasar Contoh")
    await user.type(screen.getByLabelText("NPSN"), "12345678")
    await user.click(screen.getByRole("button", { name: "Simpan pengaturan" }))

    await waitFor(() => {
      expect(schoolMocks.saveSchoolSettings).toHaveBeenCalledWith(
        "admin-1",
        expect.objectContaining({
          schoolName: "Sekolah Dasar Contoh",
          npsn: "12345678",
        }),
      )
    })
    expect(
      await screen.findByText("Pengaturan sekolah tersimpan."),
    ).toBeInTheDocument()
  })

  it("menampilkan pesan aman ketika penyimpanan gagal", async () => {
    const user = userEvent.setup()
    schoolMocks.saveSchoolSettings.mockRejectedValue(
      new Error(
        "Pengaturan sekolah belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      ),
    )
    renderPage()

    await user.type(
      await screen.findByLabelText(/Nama sekolah/),
      "Sekolah Dasar Contoh",
    )
    await user.click(screen.getByRole("button", { name: "Simpan pengaturan" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pengaturan sekolah belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
    )
  })

  it("dapat mencoba lagi setelah pemuatan gagal", async () => {
    const user = userEvent.setup()
    schoolMocks.getSchoolSettings
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(null)
    renderPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pengaturan sekolah belum dapat dimuat",
    )
    await user.click(screen.getByRole("button", { name: "Coba lagi" }))

    expect(await screen.findByLabelText(/Nama sekolah/)).toBeInTheDocument()
    expect(schoolMocks.getSchoolSettings).toHaveBeenCalledTimes(2)
  })

  it("menampilkan pesan aman ketika logout gagal", async () => {
    const user = userEvent.setup()
    render(
      <SchoolSettingsPage
        userId="admin-1"
        userName="Admin Sekolah"
        onBack={vi.fn()}
        onLogout={vi.fn().mockRejectedValue(new Error("network error"))}
      />,
    )

    await screen.findByLabelText(/Nama sekolah/)
    await user.click(screen.getByRole("button", { name: "Keluar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
    )
  })
})
