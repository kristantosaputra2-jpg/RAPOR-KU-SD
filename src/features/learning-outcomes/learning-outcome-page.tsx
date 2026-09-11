import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  X,
} from "lucide-react"

import { getAcademicPeriods } from "@/features/academic-periods/academic-periods.service"
import {
  createLearningOutcome,
  getLearningOutcomes,
  setLearningOutcomeActive,
  updateLearningOutcome,
  type LearningOutcome,
  type LearningOutcomeInput,
} from "@/features/learning-outcomes/learning-outcome.service"
import { getSubjects, type Subject } from "@/features/subjects/subject.service"

type LearningOutcomePageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const emptyForm: LearningOutcomeInput = {
  subjectId: "",
  gradeLevel: 1,
  semesterId: "",
  code: "",
  title: "",
  description: "",
}
const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

export function LearningOutcomePage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
}: LearningOutcomePageProps) {
  const [outcomes, setOutcomes] = useState<ReadonlyArray<LearningOutcome>>([])
  const [subjects, setSubjects] = useState<ReadonlyArray<Subject>>([])
  const [semesterLabels, setSemesterLabels] = useState<Record<string, string>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<LearningOutcome | null>(null)
  const [form, setForm] = useState<LearningOutcomeInput>(emptyForm)
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [statusTarget, setStatusTarget] = useState<LearningOutcome | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true
    void Promise.all([
      getLearningOutcomes(),
      getSubjects(),
      getAcademicPeriods(),
    ])
      .then(([loadedOutcomes, loadedSubjects, periods]) => {
        if (!mounted) return
        const years = new Map(
          periods.academicYears.map((year) => [year.id, year.name]),
        )
        setOutcomes(loadedOutcomes)
        setSubjects(loadedSubjects)
        setSemesterLabels(
          Object.fromEntries(
            periods.semesters.map((semester) => [
              semester.id,
              `${years.get(semester.academic_year_id) ?? "Tahun ajaran"} · Semester ${semester.number}`,
            ]),
          ),
        )
        setIsLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoadError(
          "CP belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
        )
        setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [attempt])

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  )
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return outcomes.filter((outcome) => {
      const matchesSearch =
        !query ||
        outcome.title.toLowerCase().includes(query) ||
        outcome.description.toLowerCase().includes(query) ||
        (outcome.code ?? "").toLowerCase().includes(query)
      const matchesSubject =
        subjectFilter === "all" || outcome.subject_id === subjectFilter
      const matchesGrade =
        gradeFilter === "all" || outcome.grade_level === Number(gradeFilter)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? outcome.is_active : !outcome.is_active)
      return matchesSearch && matchesSubject && matchesGrade && matchesStatus
    })
  }, [gradeFilter, outcomes, search, statusFilter, subjectFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError("")
    setIsFormOpen(true)
  }
  function openEdit(outcome: LearningOutcome) {
    setEditing(outcome)
    setForm({
      subjectId: outcome.subject_id,
      gradeLevel: outcome.grade_level,
      semesterId: outcome.semester_id,
      code: outcome.code ?? "",
      title: outcome.title,
      description: outcome.description,
    })
    setFormError("")
    setIsFormOpen(true)
  }
  function updateField<Key extends keyof LearningOutcomeInput>(
    key: Key,
    value: LearningOutcomeInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setFormError("")
    setSuccess("")
    try {
      const saved = editing
        ? await updateLearningOutcome(userId, editing.id, form)
        : await createLearningOutcome(userId, form)
      setOutcomes((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      )
      setSuccess(
        editing ? "CP berhasil diperbarui." : "CP berhasil ditambahkan.",
      )
      setIsFormOpen(false)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "CP belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus() {
    if (!statusTarget) return
    setIsChangingStatus(true)
    try {
      const saved = await setLearningOutcomeActive(
        userId,
        statusTarget.id,
        !statusTarget.is_active,
      )
      setOutcomes((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      )
      setSuccess(
        saved.is_active ? "CP diaktifkan kembali." : "CP dinonaktifkan.",
      )
      setStatusTarget(null)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Status CP belum dapat diubah.",
      )
      setStatusTarget(null)
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function logout() {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const activeSubjects = subjects.filter((subject) => subject.is_active)
  const cannotCreate =
    activeSubjects.length === 0 || Object.keys(semesterLabels).length === 0

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold hover:bg-[var(--rapotku-canvas)]"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate font-bold">RaporKu</p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Admin Sekolah"}
            </p>
          </div>
          <button
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold hover:bg-[var(--rapotku-canvas)] disabled:opacity-60"
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
          >
            <LogOut size={19} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--rapotku-brand)]">
              Kurikulum
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              CP / Deskripsi
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)]">
              Kelola capaian pembelajaran secara umum tanpa mengunci aplikasi
              pada istilah KI/KD.
            </p>
          </div>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-50"
            type="button"
            disabled={cannotCreate}
            onClick={openCreate}
          >
            <Plus size={19} />
            Tambah CP
          </button>
        </div>
        <div className="mt-5 rounded-xl border border-[#f1d394] bg-[#fff8e8] p-4 text-sm leading-6 text-[#805a13]">
          Deskripsi otomatis baru dibuat setelah nilai tersedia dan rumus
          sekolah disetujui. Tahap ini tidak mengarang rumus nilai.
        </div>
        {success ? (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl border border-[#b9e0ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[#176b48]"
          >
            <CheckCircle2 size={19} />
            {success}
          </div>
        ) : null}
        {cannotCreate && !isLoading ? (
          <div className="mt-4 rounded-xl border border-[var(--rapotku-border)] bg-white p-4 text-sm text-[var(--rapotku-muted)]">
            Siapkan mata pelajaran aktif serta tahun ajaran dan semester
            terlebih dahulu.
          </div>
        ) : null}

        <section className="mt-6 rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_150px_150px]">
            <label className="relative">
              <span className="sr-only">Cari CP</span>
              <Search
                className="absolute left-4 top-3.5 text-[var(--rapotku-muted)]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] pl-11 pr-4"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode, judul, atau deskripsi"
              />
            </label>
            <select
              aria-label="Filter mata pelajaran"
              className="min-h-12 rounded-xl border border-[var(--rapotku-border)] bg-white px-4"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">Semua mapel</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter tingkat kelas"
              className="min-h-12 rounded-xl border border-[var(--rapotku-border)] bg-white px-4"
              value={gradeFilter}
              onChange={(event) => setGradeFilter(event.target.value)}
            >
              <option value="all">Semua kelas</option>
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <option key={grade} value={grade}>
                  Kelas {grade}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter status CP"
              className="min-h-12 rounded-xl border border-[var(--rapotku-border)] bg-white px-4"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="all">Semua status</option>
            </select>
          </div>
        </section>

        {isLoading ? (
          <div
            role="status"
            className="mt-6 grid min-h-56 place-items-center rounded-2xl border border-[var(--rapotku-border)] bg-white"
          >
            <LoaderCircle className="animate-spin text-[var(--rapotku-brand)]" />
            <span className="sr-only">Memuat CP</span>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-[#f3b8bb] bg-white p-6 text-center"
          >
            <AlertCircle className="mx-auto text-[var(--rapotku-brand)]" />
            <p className="mt-3 font-bold">{loadError}</p>
            <button
              type="button"
              className="mt-4 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
              onClick={() => {
                setLoadError("")
                setIsLoading(true)
                setAttempt((value) => value + 1)
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[var(--rapotku-border)] bg-white p-8 text-center">
            <FileText
              className="mx-auto text-[var(--rapotku-brand)]"
              size={34}
            />
            <h2 className="mt-4 text-lg font-bold">Belum ada CP</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tambahkan capaian pembelajaran sesuai mapel, kelas, dan semester.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filtered.map((outcome) => (
              <article
                key={outcome.id}
                className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--rapotku-brand)]">
                      {outcome.code || "Tanpa kode"} · Kelas{" "}
                      {outcome.grade_level}
                    </p>
                    <h2 className="mt-2 text-lg font-bold">{outcome.title}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${outcome.is_active ? "bg-[#ecf8f2] text-[#176b48]" : "bg-[#f0f1f3] text-[#667085]"}`}
                  >
                    {outcome.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {subjectMap.get(outcome.subject_id)?.name ??
                    "Mapel tidak tersedia"}
                </p>
                <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                  {semesterLabels[outcome.semester_id] ??
                    "Semester tidak tersedia"}
                </p>
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-[var(--rapotku-muted)]">
                  {outcome.description}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    className="min-h-11 rounded-xl border border-[var(--rapotku-border)] font-semibold"
                    type="button"
                    onClick={() => openEdit(outcome)}
                  >
                    <Pencil className="mr-2 inline" size={16} />
                    Edit
                  </button>
                  <button
                    className="min-h-11 rounded-xl border border-[var(--rapotku-border)] font-semibold"
                    type="button"
                    onClick={() => setStatusTarget(outcome)}
                  >
                    <ToggleLeft className="mr-2 inline" size={17} />
                    {outcome.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 grid items-end bg-black/45 sm:place-items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-form-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-[var(--rapotku-brand)]">
                  Capaian Pembelajaran
                </p>
                <h2 id="cp-form-title" className="mt-1 text-xl font-bold">
                  {editing ? "Edit CP" : "Tambah CP"}
                </h2>
              </div>
              <button
                aria-label="Tutup form"
                className="grid size-11 place-items-center rounded-xl"
                type="button"
                onClick={() => !isSaving && setIsFormOpen(false)}
              >
                <X />
              </button>
            </div>
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => void save(event)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Mata pelajaran
                  <select
                    className={inputClass}
                    value={form.subjectId}
                    disabled={Boolean(editing)}
                    required
                    onChange={(event) =>
                      updateField("subjectId", event.target.value)
                    }
                  >
                    <option value="">Pilih mapel</option>
                    {activeSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Tingkat kelas
                  <select
                    className={inputClass}
                    value={form.gradeLevel}
                    disabled={Boolean(editing)}
                    onChange={(event) =>
                      updateField("gradeLevel", Number(event.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        Kelas {grade}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-bold">
                Semester
                <select
                  className={inputClass}
                  value={form.semesterId}
                  disabled={Boolean(editing)}
                  required
                  onChange={(event) =>
                    updateField("semesterId", event.target.value)
                  }
                >
                  <option value="">Pilih semester</option>
                  {Object.entries(semesterLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Kode CP{" "}
                <span className="font-normal text-[var(--rapotku-muted)]">
                  (opsional)
                </span>
                <input
                  className={inputClass}
                  maxLength={40}
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value)}
                />
              </label>
              <label className="block text-sm font-bold">
                Judul CP
                <input
                  className={inputClass}
                  maxLength={200}
                  required
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </label>
              <label className="block text-sm font-bold">
                Deskripsi CP
                <textarea
                  className={`${inputClass} min-h-32 py-3`}
                  maxLength={2000}
                  required
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>
              {formError ? (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-[#f3b8bb] bg-[#fff5f5] p-3 text-sm text-[#9f1d25]"
                >
                  <AlertCircle size={19} />
                  {formError}
                </div>
              ) : null}
              <button
                className="min-h-12 w-full rounded-xl bg-[var(--rapotku-brand)] font-bold text-white disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Menyimpan..." : "Simpan CP"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
      {statusTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cp-status-title"
            className="w-full max-w-md rounded-3xl bg-white p-6"
          >
            <h2 id="cp-status-title" className="text-xl font-bold">
              {statusTarget.is_active ? "Nonaktifkan CP?" : "Aktifkan CP?"}
            </h2>
            <p className="mt-3 text-sm text-[var(--rapotku-muted)]">
              Data lama tetap tersimpan dan tidak dihapus.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-11 rounded-xl border border-[var(--rapotku-border)] font-semibold"
                type="button"
                disabled={isChangingStatus}
                onClick={() => setStatusTarget(null)}
              >
                Batal
              </button>
              <button
                className="min-h-11 rounded-xl bg-[var(--rapotku-brand)] font-bold text-white disabled:opacity-60"
                type="button"
                disabled={isChangingStatus}
                onClick={() => void changeStatus()}
              >
                {isChangingStatus ? "Memproses..." : "Ya, lanjutkan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <span className="sr-only">Masuk sebagai {userName}</span>
    </div>
  )
}
