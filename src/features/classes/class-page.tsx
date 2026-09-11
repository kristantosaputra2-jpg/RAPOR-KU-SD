import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  UserCheck,
  X,
} from "lucide-react"

import {
  createClass,
  getClasses,
  getClassTemplateGroup,
  updateClass,
  type ClassInput,
  type SchoolClass,
} from "@/features/classes/class.service"
import {
  getAcademicPeriods,
  type AcademicPeriods,
} from "@/features/academic-periods/academic-periods.service"
import { getTeachers, type Teacher } from "@/features/teachers/teacher.service"

type ClassPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
  onOpenAcademicPeriods: () => void
}>

const emptyPeriods: AcademicPeriods = {
  schoolId: null,
  academicYears: [],
  semesters: [],
}

const emptyForm: ClassInput = {
  academicYearId: "",
  semesterId: "",
  gradeLevel: 1,
  name: "",
  homeroomTeacherId: "",
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

function templateLabel(gradeLevel: number) {
  return getClassTemplateGroup(gradeLevel) === "lower_primary"
    ? "Kelas Rendah"
    : "Kelas Tinggi"
}

function formFromClass(schoolClass: SchoolClass): ClassInput {
  return {
    academicYearId: schoolClass.academic_year_id,
    semesterId: schoolClass.semester_id,
    gradeLevel: schoolClass.grade_level,
    name: schoolClass.name,
    homeroomTeacherId: schoolClass.homeroom_teacher_id ?? "",
  }
}

export function ClassPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
  onOpenAcademicPeriods,
}: ClassPageProps) {
  const [classes, setClasses] = useState<ReadonlyArray<SchoolClass>>([])
  const [periods, setPeriods] = useState<AcademicPeriods>(emptyPeriods)
  const [teachers, setTeachers] = useState<ReadonlyArray<Teacher>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null)
  const [form, setForm] = useState<ClassInput>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [logoutError, setLogoutError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    void Promise.all([getClasses(), getAcademicPeriods(), getTeachers()])
      .then(([loadedClasses, loadedPeriods, loadedTeachers]) => {
        if (isMounted) {
          setClasses(loadedClasses)
          setPeriods(loadedPeriods)
          setTeachers(loadedTeachers)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Data kelas belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const academicYearsById = useMemo(
    () => new Map(periods.academicYears.map((year) => [year.id, year])),
    [periods.academicYears],
  )
  const semestersById = useMemo(
    () => new Map(periods.semesters.map((semester) => [semester.id, semester])),
    [periods.semesters],
  )
  const teachersById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers],
  )
  const filteredClasses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return classes.filter((schoolClass) => {
      const teacherName = schoolClass.homeroom_teacher_id
        ? (teachersById.get(schoolClass.homeroom_teacher_id)?.full_name ?? "")
        : ""
      const matchesSearch =
        !query ||
        schoolClass.name.toLowerCase().includes(query) ||
        teacherName.toLowerCase().includes(query)
      const matchesPeriod =
        periodFilter === "all" || schoolClass.semester_id === periodFilter

      return matchesSearch && matchesPeriod
    })
  }, [classes, periodFilter, searchTerm, teachersById])

  const formSemesters = periods.semesters.filter(
    (semester) => semester.academic_year_id === form.academicYearId,
  )
  const availableTeachers = teachers.filter(
    (teacher) => teacher.is_active || teacher.id === form.homeroomTeacherId,
  )
  const canCreateClass = periods.semesters.length > 0

  function getDefaultForm(): ClassInput {
    const activeYear =
      periods.academicYears.find((year) => year.is_active) ??
      periods.academicYears[0]
    const semestersForYear = periods.semesters.filter(
      (semester) => semester.academic_year_id === activeYear?.id,
    )
    const activeSemester =
      semestersForYear.find((semester) => semester.is_active) ??
      semestersForYear[0]

    return {
      ...emptyForm,
      academicYearId: activeYear?.id ?? "",
      semesterId: activeSemester?.id ?? "",
    }
  }

  function openCreateForm() {
    setEditingClass(null)
    setForm(getDefaultForm())
    setFormError("")
    setSuccessMessage("")
    setIsFormOpen(true)
  }

  function openEditForm(schoolClass: SchoolClass) {
    setEditingClass(schoolClass)
    setForm(formFromClass(schoolClass))
    setFormError("")
    setSuccessMessage("")
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!isSaving) {
      setIsFormOpen(false)
      setEditingClass(null)
      setFormError("")
    }
  }

  function updateField<Key extends keyof ClassInput>(
    key: Key,
    value: ClassInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError("")
  }

  function updateAcademicYear(academicYearId: string) {
    const semestersForYear = periods.semesters.filter(
      (semester) => semester.academic_year_id === academicYearId,
    )
    const preferredSemester =
      semestersForYear.find((semester) => semester.is_active) ??
      semestersForYear[0]

    setForm((current) => ({
      ...current,
      academicYearId,
      semesterId: preferredSemester?.id ?? "",
    }))
    setFormError("")
  }

  function retryLoad() {
    setIsLoading(true)
    setLoadError("")
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const savedClass = editingClass
        ? await updateClass(userId, editingClass.id, form)
        : await createClass(userId, form)

      setClasses((current) =>
        editingClass
          ? current.map((schoolClass) =>
              schoolClass.id === savedClass.id ? savedClass : schoolClass,
            )
          : [savedClass, ...current],
      )
      setSuccessMessage(
        editingClass
          ? "Perubahan kelas tersimpan."
          : "Kelas berhasil ditambahkan.",
      )
      setIsFormOpen(false)
      setEditingClass(null)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Data kelas belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsSaving(false)
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
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <GraduationCap aria-hidden="true" size={22} />
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
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-semibold disabled:opacity-60 sm:flex"
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
          <div>
            <p className="text-sm font-bold text-[var(--rapotku-brand)]">
              Data Master
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Data Kelas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
              Buat rombel kelas 1–6, pilih periode, dan tentukan wali kelas.
              Kelompok template ditentukan otomatis dari tingkat kelas.
            </p>
          </div>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_20px_rgba(201,29,36,0.2)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            type="button"
            onClick={openCreateForm}
            disabled={!canCreateClass || isLoading}
          >
            <Plus aria-hidden="true" size={19} /> Tambah Kelas
          </button>
        </section>

        {logoutError ? (
          <div
            className="mt-5 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            {logoutError}
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

        {!isLoading && periods.semesters.length === 0 ? (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#f0ce9a] bg-[#fff8ec] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[#9a5a00]"
                size={21}
              />
              <div>
                <p className="font-bold text-[#704300]">
                  Periode belum tersedia
                </p>
                <p className="mt-1 text-sm leading-6 text-[#795b2e]">
                  Tambahkan tahun ajaran dan semester sebelum membuat kelas.
                </p>
              </div>
            </div>
            <button
              className="min-h-11 shrink-0 rounded-xl bg-[#8a5200] px-4 text-sm font-bold text-white"
              type="button"
              onClick={onOpenAcademicPeriods}
            >
              Atur Tahun & Semester
            </button>
          </section>
        ) : null}

        <section className="mt-6 grid grid-cols-3 gap-3">
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <p className="text-xs font-semibold text-[var(--rapotku-muted)]">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold">{classes.length}</p>
          </article>
          <article className="rounded-2xl border border-[#f0d0d2] bg-[var(--rapotku-brand-soft)] p-4">
            <p className="text-xs font-semibold text-[var(--rapotku-brand)]">
              Kelas 1–3
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--rapotku-brand)]">
              {classes.filter((item) => item.grade_level <= 3).length}
            </p>
          </article>
          <article className="rounded-2xl border border-[#cddff5] bg-[#eef6ff] p-4">
            <p className="text-xs font-semibold text-[#245da8]">Kelas 4–6</p>
            <p className="mt-1 text-2xl font-bold text-[#245da8]">
              {classes.filter((item) => item.grade_level >= 4).length}
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_280px]">
            <label className="relative block">
              <span className="sr-only">Cari kelas</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a93a2]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] pl-11 pr-4 outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari rombel atau wali kelas"
              />
            </label>
            <label>
              <span className="sr-only">Filter periode kelas</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 font-semibold outline-none"
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
              >
                <option value="all">Semua periode</option>
                {periods.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {academicYearsById.get(semester.academic_year_id)?.name ??
                      "Tahun ajaran"}{" "}
                    · Semester {semester.number}
                  </option>
                ))}
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
                  Memuat data kelas...
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
                  className="mt-4 min-h-11 rounded-xl border border-[var(--rapotku-border)] px-4 text-sm font-bold"
                  type="button"
                  onClick={retryLoad}
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="grid min-h-64 place-items-center py-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                  <GraduationCap aria-hidden="true" size={28} />
                </span>
                <p className="mt-4 font-bold">
                  {classes.length === 0
                    ? "Belum ada data kelas"
                    : "Kelas tidak ditemukan"}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--rapotku-muted)]">
                  {classes.length === 0
                    ? "Tambahkan rombel pertama setelah periode tersedia."
                    : "Coba ubah kata pencarian atau filter periode."}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredClasses.map((schoolClass) => {
                const semester = semestersById.get(schoolClass.semester_id)
                const year = academicYearsById.get(schoolClass.academic_year_id)
                const teacher = schoolClass.homeroom_teacher_id
                  ? teachersById.get(schoolClass.homeroom_teacher_id)
                  : null

                return (
                  <article
                    className="rounded-2xl border border-[var(--rapotku-border)] p-4"
                    key={schoolClass.id}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--rapotku-brand)] text-xl font-bold text-white">
                        {schoolClass.grade_level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold">{schoolClass.name}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${schoolClass.grade_level <= 3 ? "bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]" : "bg-[#eef6ff] text-[#245da8]"}`}
                        >
                          {templateLabel(schoolClass.grade_level)}
                        </span>
                      </div>
                      <button
                        className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                        type="button"
                        aria-label={`Edit kelas ${schoolClass.name}`}
                        onClick={() => openEditForm(schoolClass)}
                      >
                        <Pencil aria-hidden="true" size={17} />
                      </button>
                    </div>
                    <dl className="mt-4 space-y-3 border-t border-[var(--rapotku-border)] pt-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-[#8a93a2]"
                          size={16}
                        />
                        <div>
                          <dt className="sr-only">Periode</dt>
                          <dd className="font-semibold">
                            {year?.name ?? "Tahun ajaran tidak ditemukan"} ·
                            Semester {semester?.number ?? "—"}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserCheck
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-[#8a93a2]"
                          size={16}
                        />
                        <div>
                          <dt className="sr-only">Wali kelas</dt>
                          <dd
                            className={
                              teacher
                                ? "font-semibold"
                                : "text-[var(--rapotku-muted)]"
                            }
                          >
                            {teacher?.full_name ??
                              "Wali kelas belum ditentukan"}
                            {teacher && !teacher.is_active ? " · Nonaktif" : ""}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#1d222b]/50 sm:place-items-center sm:p-5">
          <section
            aria-labelledby="class-form-title"
            aria-modal="true"
            role="dialog"
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--rapotku-brand)]">
                  Data Kelas
                </p>
                <h2 id="class-form-title" className="mt-1 text-xl font-bold">
                  {editingClass ? "Edit Kelas" : "Tambah Kelas"}
                </h2>
              </div>
              <button
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup form kelas"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold" htmlFor="class-grade">
                    Tingkat Kelas{" "}
                    <span className="text-[var(--rapotku-brand)]">*</span>
                  </label>
                  <select
                    id="class-grade"
                    className={inputClassName}
                    value={form.gradeLevel}
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
                </div>
                <div>
                  <label className="text-sm font-bold" htmlFor="class-name">
                    Nama Rombel{" "}
                    <span className="text-[var(--rapotku-brand)]">*</span>
                  </label>
                  <input
                    id="class-name"
                    className={inputClassName}
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    maxLength={80}
                    placeholder="Contoh: 1A"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#f7f8fa] p-4">
                <div className="flex items-center gap-3">
                  <BookOpenCheck
                    aria-hidden="true"
                    className="text-[var(--rapotku-brand)]"
                    size={21}
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--rapotku-muted)]">
                      Template Rapor Otomatis
                    </p>
                    <p className="font-bold">
                      {templateLabel(form.gradeLevel)} ·{" "}
                      {getClassTemplateGroup(form.gradeLevel)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold" htmlFor="class-year">
                    Tahun Ajaran{" "}
                    <span className="text-[var(--rapotku-brand)]">*</span>
                  </label>
                  <select
                    id="class-year"
                    className={inputClassName}
                    value={form.academicYearId}
                    onChange={(event) => updateAcademicYear(event.target.value)}
                    required
                  >
                    <option value="">Pilih tahun ajaran</option>
                    {periods.academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                        {year.is_active ? " · Aktif" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold" htmlFor="class-semester">
                    Semester{" "}
                    <span className="text-[var(--rapotku-brand)]">*</span>
                  </label>
                  <select
                    id="class-semester"
                    className={inputClassName}
                    value={form.semesterId}
                    onChange={(event) =>
                      updateField("semesterId", event.target.value)
                    }
                    required
                    disabled={!form.academicYearId}
                  >
                    <option value="">Pilih semester</option>
                    {formSemesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        Semester {semester.number}
                        {semester.is_active ? " · Aktif" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-bold" htmlFor="class-teacher">
                  Wali Kelas{" "}
                  <span className="font-normal text-[var(--rapotku-muted)]">
                    (boleh nanti)
                  </span>
                </label>
                <select
                  id="class-teacher"
                  className={inputClassName}
                  value={form.homeroomTeacherId}
                  onChange={(event) =>
                    updateField("homeroomTeacherId", event.target.value)
                  }
                >
                  <option value="">Belum ditentukan</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                      {teacher.is_active ? "" : " · Nonaktif"}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs leading-5 text-[var(--rapotku-muted)]">
                  Hak akses wali kelas akan diaktifkan saat akun dan assignment
                  guru diselesaikan.
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
                  className="min-h-12 rounded-xl border border-[var(--rapotku-border)] font-bold"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-60"
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
                    : editingClass
                      ? "Simpan Perubahan"
                      : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
