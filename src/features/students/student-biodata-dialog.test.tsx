import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentBiodataDialog } from "./student-biodata-dialog"

const biodataMocks = vi.hoisted(() => ({
  getStudentBiodata: vi.fn(),
  getStudentPhotoUrl: vi.fn(),
  saveStudentBiodata: vi.fn(),
  uploadStudentPhoto: vi.fn(),
}))

vi.mock("./student-biodata.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./student-biodata.service")>()
  return { ...original, ...biodataMocks }
})

const student = {
  id: "student-1",
  full_name: "Budi Santoso",
  nis: "001",
  nisn: null,
  gender: "male" as const,
  birth_place: null,
  birth_date: null,
  religion: null,
  address: null,
  father_name: "Ayah Budi",
  mother_name: "Ibu Budi",
  guardian_name: null,
  is_active: true,
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

describe("StudentBiodataDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    biodataMocks.getStudentBiodata.mockResolvedValue(null)
  })

  it("menampilkan foto 3×4 dan data keluarga tanpa data kesehatan", async () => {
    render(
      <StudentBiodataDialog
        student={student}
        userId="user-1"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    )

    expect(await screen.findByLabelText("Nama ayah")).toHaveValue("Ayah Budi")
    expect(screen.getByLabelText("Nama ibu")).toHaveValue("Ibu Budi")
    expect(screen.getByText("Pilih Foto 3×4")).toBeVisible()
    expect(screen.queryByText(/Tinggi badan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Kondisi kesehatan/i)).not.toBeInTheDocument()
  })
})
