import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  UserCheck,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react"

import {
  createTeacher,
  getTeachers,
  setTeacherActive,
  updateTeacher,
  type Teacher,
  type TeacherInput,
  type TeacherRole,
} from "@/features/teachers/teacher.service"

type TeacherPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const emptyForm: TeacherInput = {
  fullName: "",
  nip: "",
  nuptk: "",
  email: "",
  role: "subject_teacher",
}

const roleLabels: Record<TeacherRole, string> = {
  homeroom_teacher: "Wali Kelas",
  subject_teacher: "Guru Mata Pelajaran",
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition placeholder:text-[#a4aab4] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

function formFromTeacher(teacher: Teacher): TeacherInput {
  return {
    fullName: teacher.full_name,
    nip: teacher.nip ?? "",
    nuptk: teacher.nuptk ?? "",
    email: teacher.email,
    role:
      teacher.role === "homeroom_teacher"
        ? "homeroom_teacher"
        : "subject_teacher",
  }
}

function TeacherStatus({ teacher }: Readonly<{ teacher: Teacher }>) {
  return teacher.is_active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9e3ce] bg-[#ecf8f2] px-2.5 py-1 text-xs font-bold text-[var(--rapotku-success)]">
      <CheckCircle2 aria-hidden="true" size={14} /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dbe1] bg-[#f3f4f6] px-2.5 py-1 text-xs font-bold text-[#667085]">
      <UserRoundX aria-hidden="true" size={14} /> Nonaktif
    </span>
  )
}

function LoginStatus({ teacher }: Readonly<{ teacher: Teacher }>) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
        teacher.user_id ? "text-[var(--rapotku-success)]" : "text-[#7b8494]"
      }`}
    >
      <KeyRound aria-hidden="true" size={14} />
      {teacher.user_id ? "Akun login terhubung" : "Akun login belum dibuat"}
    </span>
  )
}

export function TeacherPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
}: TeacherPageProps) {
  const [teachers, setTeachers] = useState<ReadonlyArray<Teacher>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all")
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [form, setForm] = useState<TeacherInput>(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [teacherToDeactivate, setTeacherToDeactivate] =
    useState<Teacher | null>(null)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")

  useEffect(() => {
    let isMounted = true

    void getTeachers()
      .then((result) => {
        if (isMounted) {
          setTeachers(result)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Data guru belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return teachers.filter((teacher) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && teacher.is_active) ||
        (statusFilter === "inactive" && !teacher.is_active)
      const matchesSearch =
        !query ||
        teacher.full_name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.nip?.toLowerCase().includes(query) ||
        teacher.nuptk?.toLowerCase().includes(query)

      return matchesStatus && Boolean(matchesSearch)
    })
  }, [searchTerm, statusFilter, teachers])

  const activeTeacherCount = teachers.filter(
    (teacher) => teacher.is_active,
  ).length

  function retryLoad() {
    setIsLoading(true)
    setLoadError("")
    setLoadAttempt((attempt) => attempt + 1)
  }

  function updateField<Key extends keyof TeacherInput>(
    key: Key,
    value: TeacherInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError("")
  }

  function openCreateForm() {
    setEditingTeacher(null)
    setForm(emptyForm)
    setFormError("")
    setSuccessMessage("")
    setIsFormOpen(true)
  }

  function openEditForm(teacher: Teacher) {
    setEditingTeacher(teacher)
    setForm(formFromTeacher(teacher))
    setFormError("")
    setSuccessMessage("")
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!isSaving) {
      setIsFormOpen(false)
      setEditingTeacher(null)
      setFormError("")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const savedTeacher = editingTeacher
        ? await updateTeacher(userId, editingTeacher.id, form)
        : await createTeacher(userId, form)

      setTeachers((current) => {
        const next = editingTeacher
          ? current.map((teacher) =>
              teacher.id === savedTeacher.id ? savedTeacher : teacher,
            )
          : [...current, savedTeacher]

        return [...next].sort((left, right) =>
          left.full_name.localeCompare(right.full_name, "id"),
        )
      })
      setSuccessMessage(
        editingTeacher
          ? "Perubahan data guru tersimpan."
          : "Guru berhasil ditambahkan.",
      )
      setIsFormOpen(false)
      setEditingTeacher(null)
      setForm(emptyForm)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Data guru belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function changeTeacherStatus(teacher: Teacher, isActive: boolean) {
    setActionError("")
    setSuccessMessage("")
    setActiveActionId(teacher.id)

    try {
      const savedTeacher = await setTeacherActive(userId, teacher.id, isActive)
      setTeachers((current) =>
        current.map((item) =>
          item.id === savedTeacher.id ? savedTeacher : item,
        ),
      )
      setSuccessMessage(
        isActive
          ? `${teacher.full_name} kembali aktif.`
          : `${teacher.full_name} telah dinonaktifkan.`,
      )
      setTeacherToDeactivate(null)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Status guru belum dapat diubah. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setActiveActionId(null)
    }
  }

  async function handleLogout() {
    setLogoutError("")
    setIsLoggingOut(true)

    try {
      await onLogout()
    } catch {
      setLogoutError(
        "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
      )
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <UserCheck aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {schoolName ? `RaporKu - ${schoolName}` : "RaporKu"}
            </p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {userName} · Admin
            </p>
          </div>
          <button
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-semibold transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:opacity-60 sm:flex"
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? "Sedang keluar..." : "Keluar"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-[var(--rapotku-brand)]">
              Data Master
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Data Guru
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
              Kelola identitas dan peran utama guru. Penugasan kelas dan mata
              pelajaran akan diatur setelah data kelas dan mapel tersedia.
            </p>
          </div>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_20px_rgba(201,29,36,0.2)] transition hover:bg-[var(--rapotku-brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] sm:w-auto"
            type="button"
            onClick={openCreateForm}
          >
            <Plus aria-hidden="true" size={19} /> Tambah Guru
          </button>
        </section>

        {logoutError || actionError ? (
          <div
            className="mt-5 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            {logoutError || actionError}
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="mt-5 flex items-start gap-2 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[var(--rapotku-success)]"
            role="status"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            {successMessage}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <p className="text-xs font-semibold text-[var(--rapotku-muted)]">
              Total Guru
            </p>
            <p className="mt-1 text-2xl font-bold">{teachers.length}</p>
          </article>
          <article className="rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4">
            <p className="text-xs font-semibold text-[var(--rapotku-success)]">
              Guru Aktif
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--rapotku-success)]">
              {activeTeacherCount}
            </p>
          </article>
          <article className="col-span-2 rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 sm:col-span-1">
            <p className="text-xs font-semibold text-[var(--rapotku-muted)]">
              Belum Ada Akun Login
            </p>
            <p className="mt-1 text-2xl font-bold">
              {teachers.filter((teacher) => !teacher.user_id).length}
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <span className="sr-only">Cari guru</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a93a2]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white pl-11 pr-4 outline-none transition placeholder:text-[#a4aab4] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama, email, NIP, atau NUPTK"
              />
            </label>
            <label>
              <span className="sr-only">Filter status guru</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 font-semibold outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "active" | "inactive",
                  )
                }
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <div className="text-center">
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                  size={30}
                />
                <p className="mt-3 text-sm font-semibold text-[var(--rapotku-muted)]">
                  Memuat data guru...
                </p>
              </div>
            </div>
          ) : loadError ? (
            <div className="grid min-h-64 place-items-center py-8 text-center">
              <div>
                <AlertCircle
                  aria-hidden="true"
                  className="mx-auto text-[var(--rapotku-brand)]"
                  size={32}
                />
                <p className="mt-3 font-bold">Data belum dapat dimuat</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--rapotku-muted)]">
                  {loadError}
                </p>
                <button
                  className="mt-4 min-h-11 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-bold"
                  type="button"
                  onClick={retryLoad}
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="grid min-h-64 place-items-center py-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                  <UserCheck aria-hidden="true" size={26} />
                </span>
                <p className="mt-4 font-bold">
                  {teachers.length === 0
                    ? "Belum ada data guru"
                    : "Guru tidak ditemukan"}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--rapotku-muted)]">
                  {teachers.length === 0
                    ? "Tambahkan guru pertama untuk menyiapkan data sekolah."
                    : "Coba ubah kata pencarian atau filter status."}
                </p>
                {teachers.length === 0 ? (
                  <button
                    className="mt-4 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-4 text-sm font-bold text-white"
                    type="button"
                    onClick={openCreateForm}
                  >
                    Tambah Guru
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-3 md:hidden">
                {filteredTeachers.map((teacher) => (
                  <article
                    className="rounded-2xl border border-[var(--rapotku-border)] p-4"
                    key={teacher.id}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] font-bold text-[var(--rapotku-brand)]">
                        {teacher.full_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{teacher.full_name}</p>
                        <p className="mt-1 break-all text-sm text-[var(--rapotku-muted)]">
                          {teacher.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <TeacherStatus teacher={teacher} />
                          <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-bold text-[#245da8]">
                            {roleLabels[teacher.role as TeacherRole]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8fa] p-3 text-sm">
                      <div>
                        <dt className="text-xs text-[var(--rapotku-muted)]">
                          NIP
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {teacher.nip ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--rapotku-muted)]">
                          NUPTK
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {teacher.nuptk ?? "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <LoginStatus teacher={teacher} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-bold"
                        type="button"
                        onClick={() => openEditForm(teacher)}
                      >
                        <Pencil aria-hidden="true" size={16} /> Edit
                      </button>
                      {teacher.is_active ? (
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#f5b7ba] bg-white px-3 text-sm font-bold text-[var(--rapotku-brand)]"
                          type="button"
                          onClick={() => setTeacherToDeactivate(teacher)}
                        >
                          <UserRoundX aria-hidden="true" size={16} />{" "}
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b9e3ce] bg-white px-3 text-sm font-bold text-[var(--rapotku-success)] disabled:opacity-60"
                          type="button"
                          disabled={activeActionId === teacher.id}
                          onClick={() =>
                            void changeTeacherStatus(teacher, true)
                          }
                        >
                          <UserRoundCheck aria-hidden="true" size={16} />
                          {activeActionId === teacher.id
                            ? "Memproses..."
                            : "Aktifkan"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-[var(--rapotku-muted)]">
                      <th className="border-b border-[var(--rapotku-border)] px-3 py-3">
                        Guru
                      </th>
                      <th className="border-b border-[var(--rapotku-border)] px-3 py-3">
                        Identitas
                      </th>
                      <th className="border-b border-[var(--rapotku-border)] px-3 py-3">
                        Peran
                      </th>
                      <th className="border-b border-[var(--rapotku-border)] px-3 py-3">
                        Status
                      </th>
                      <th className="border-b border-[var(--rapotku-border)] px-3 py-3 text-right">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="border-b border-[var(--rapotku-border)] px-3 py-4 align-top">
                          <p className="font-bold">{teacher.full_name}</p>
                          <p className="mt-1 text-[var(--rapotku-muted)]">
                            {teacher.email}
                          </p>
                          <p className="mt-2">
                            <LoginStatus teacher={teacher} />
                          </p>
                        </td>
                        <td className="border-b border-[var(--rapotku-border)] px-3 py-4 align-top">
                          <p>
                            NIP:{" "}
                            <span className="font-semibold">
                              {teacher.nip ?? "—"}
                            </span>
                          </p>
                          <p className="mt-1">
                            NUPTK:{" "}
                            <span className="font-semibold">
                              {teacher.nuptk ?? "—"}
                            </span>
                          </p>
                        </td>
                        <td className="border-b border-[var(--rapotku-border)] px-3 py-4 align-top font-semibold">
                          {roleLabels[teacher.role as TeacherRole]}
                        </td>
                        <td className="border-b border-[var(--rapotku-border)] px-3 py-4 align-top">
                          <TeacherStatus teacher={teacher} />
                        </td>
                        <td className="border-b border-[var(--rapotku-border)] px-3 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] px-3 font-bold"
                              type="button"
                              onClick={() => openEditForm(teacher)}
                            >
                              <Pencil aria-hidden="true" size={15} /> Edit
                            </button>
                            {teacher.is_active ? (
                              <button
                                className="min-h-10 rounded-xl border border-[#f5b7ba] px-3 font-bold text-[var(--rapotku-brand)]"
                                type="button"
                                onClick={() => setTeacherToDeactivate(teacher)}
                              >
                                Nonaktifkan
                              </button>
                            ) : (
                              <button
                                className="min-h-10 rounded-xl border border-[#b9e3ce] px-3 font-bold text-[var(--rapotku-success)] disabled:opacity-60"
                                type="button"
                                disabled={activeActionId === teacher.id}
                                onClick={() =>
                                  void changeTeacherStatus(teacher, true)
                                }
                              >
                                {activeActionId === teacher.id
                                  ? "Memproses..."
                                  : "Aktifkan"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#1d222b]/50 p-0 sm:place-items-center sm:p-5">
          <section
            aria-labelledby="teacher-form-title"
            aria-modal="true"
            role="dialog"
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--rapotku-brand)]">
                  Data Guru
                </p>
                <h2 id="teacher-form-title" className="mt-1 text-xl font-bold">
                  {editingTeacher ? "Edit Guru" : "Tambah Guru"}
                </h2>
              </div>
              <button
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup form guru"
                onClick={closeForm}
                disabled={isSaving}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <form
              className="mt-5"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div>
                <label className="text-sm font-bold" htmlFor="teacher-name">
                  Nama Lengkap{" "}
                  <span className="text-[var(--rapotku-brand)]">*</span>
                </label>
                <input
                  id="teacher-name"
                  className={inputClassName}
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  maxLength={160}
                  required
                  autoFocus
                />
              </div>
              <div className="mt-4">
                <label className="text-sm font-bold" htmlFor="teacher-email">
                  Email <span className="text-[var(--rapotku-brand)]">*</span>
                </label>
                <input
                  id="teacher-email"
                  className={inputClassName}
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  maxLength={254}
                  required
                  placeholder="nama.guru@sekolah.id"
                />
                <p className="mt-1.5 text-xs leading-5 text-[var(--rapotku-muted)]">
                  Email disiapkan sebagai identitas akun. Akun login tidak
                  dibuat otomatis pada tahap ini.
                </p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold" htmlFor="teacher-nip">
                    NIP{" "}
                    <span className="font-normal text-[var(--rapotku-muted)]">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="teacher-nip"
                    className={inputClassName}
                    value={form.nip}
                    onChange={(event) => updateField("nip", event.target.value)}
                    maxLength={30}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold" htmlFor="teacher-nuptk">
                    NUPTK{" "}
                    <span className="font-normal text-[var(--rapotku-muted)]">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="teacher-nuptk"
                    className={inputClassName}
                    value={form.nuptk}
                    onChange={(event) =>
                      updateField("nuptk", event.target.value)
                    }
                    maxLength={30}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-bold" htmlFor="teacher-role">
                  Peran Utama{" "}
                  <span className="text-[var(--rapotku-brand)]">*</span>
                </label>
                <select
                  id="teacher-role"
                  className={inputClassName}
                  value={form.role}
                  onChange={(event) =>
                    updateField("role", event.target.value as TeacherRole)
                  }
                  required
                >
                  <option value="subject_teacher">Guru Mata Pelajaran</option>
                  <option value="homeroom_teacher">Wali Kelas</option>
                </select>
                <p className="mt-1.5 text-xs leading-5 text-[var(--rapotku-muted)]">
                  Akses kelas dan mata pelajaran baru diberikan melalui
                  penugasan, bukan hanya dari pilihan ini.
                </p>
              </div>

              {formError ? (
                <div
                  className="mt-4 rounded-xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-3 text-sm text-[var(--rapotku-brand-strong)]"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="min-h-12 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 font-bold"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={18}
                    />
                  ) : null}
                  {isSaving
                    ? "Menyimpan..."
                    : editingTeacher
                      ? "Simpan Perubahan"
                      : "Simpan Guru"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {teacherToDeactivate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d222b]/50 p-4">
          <section
            aria-labelledby="deactivate-title"
            aria-modal="true"
            role="dialog"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <UserRoundX aria-hidden="true" size={23} />
            </span>
            <h2 id="deactivate-title" className="mt-4 text-xl font-bold">
              Nonaktifkan guru?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
              <strong className="text-[var(--rapotku-text)]">
                {teacherToDeactivate.full_name}
              </strong>{" "}
              tidak akan dihapus. Data dapat diaktifkan kembali kapan saja.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-12 rounded-xl border border-[var(--rapotku-border)] font-bold"
                type="button"
                disabled={activeActionId === teacherToDeactivate.id}
                onClick={() => setTeacherToDeactivate(null)}
              >
                Batal
              </button>
              <button
                className="min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-60"
                type="button"
                disabled={activeActionId === teacherToDeactivate.id}
                onClick={() =>
                  void changeTeacherStatus(teacherToDeactivate, false)
                }
              >
                {activeActionId === teacherToDeactivate.id
                  ? "Memproses..."
                  : "Ya, Nonaktifkan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
