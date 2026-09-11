import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  UserCheck,
  X,
} from "lucide-react"

import {
  createTeacherAssignment,
  getTeacherAssignments,
  setTeacherAssignmentActive,
  updateTeacherAssignment,
  type TeacherAssignment,
} from "@/features/assignments/assignment.service"
import { getAcademicPeriods } from "@/features/academic-periods/academic-periods.service"
import { getClasses, type SchoolClass } from "@/features/classes/class.service"
import { getSubjects, type Subject } from "@/features/subjects/subject.service"
import { getTeachers, type Teacher } from "@/features/teachers/teacher.service"

type AssignmentPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

export function AssignmentPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
}: AssignmentPageProps) {
  const [assignments, setAssignments] = useState<
    ReadonlyArray<TeacherAssignment>
  >([])
  const [classes, setClasses] = useState<ReadonlyArray<SchoolClass>>([])
  const [subjects, setSubjects] = useState<ReadonlyArray<Subject>>([])
  const [teachers, setTeachers] = useState<ReadonlyArray<Teacher>>([])
  const [yearNames, setYearNames] = useState<Record<string, string>>({})
  const [semesterNumbers, setSemesterNumbers] = useState<
    Record<string, number>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherAssignment | null>(null)
  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [statusTarget, setStatusTarget] = useState<TeacherAssignment | null>(
    null,
  )
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true
    void Promise.all([
      getTeacherAssignments(),
      getClasses(),
      getSubjects(),
      getTeachers(),
      getAcademicPeriods(),
    ])
      .then(
        ([
          loadedAssignments,
          loadedClasses,
          loadedSubjects,
          loadedTeachers,
          periods,
        ]) => {
          if (!mounted) return
          setAssignments(loadedAssignments)
          setClasses(loadedClasses)
          setSubjects(loadedSubjects)
          setTeachers(loadedTeachers)
          setYearNames(
            Object.fromEntries(
              periods.academicYears.map((year) => [year.id, year.name]),
            ),
          )
          setSemesterNumbers(
            Object.fromEntries(
              periods.semesters.map((semester) => [
                semester.id,
                semester.number,
              ]),
            ),
          )
          setIsLoading(false)
        },
      )
      .catch(() => {
        if (!mounted) return
        setLoadError(
          "Penugasan belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
        )
        setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [loadAttempt])

  const classMap = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes],
  )
  const subjectMap = useMemo(
    () => new Map(subjects.map((item) => [item.id, item])),
    [subjects],
  )
  const teacherMap = useMemo(
    () => new Map(teachers.map((item) => [item.id, item])),
    [teachers],
  )
  const availableClasses = classes.filter((item) =>
    Boolean(yearNames[item.academic_year_id]),
  )
  const activeSubjects = subjects.filter((item) => item.is_active)
  const activeTeachers = teachers.filter((item) => item.is_active)

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return assignments.filter((assignment) => {
      const schoolClass = classMap.get(assignment.class_id)
      const subject = subjectMap.get(assignment.subject_id)
      const teacher = teacherMap.get(assignment.teacher_id)
      const matchesSearch =
        !query ||
        schoolClass?.name.toLowerCase().includes(query) ||
        subject?.name.toLowerCase().includes(query) ||
        teacher?.full_name.toLowerCase().includes(query)
      const matchesClass =
        classFilter === "all" || assignment.class_id === classFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? assignment.is_active
          : !assignment.is_active)
      return Boolean(matchesSearch && matchesClass && matchesStatus)
    })
  }, [
    assignments,
    classFilter,
    classMap,
    searchTerm,
    statusFilter,
    subjectMap,
    teacherMap,
  ])

  function openCreate() {
    setEditing(null)
    setClassId("")
    setSubjectId("")
    setTeacherId("")
    setFormError("")
    setIsFormOpen(true)
  }

  function openEdit(assignment: TeacherAssignment) {
    setEditing(assignment)
    setClassId(assignment.class_id)
    setSubjectId(assignment.subject_id)
    setTeacherId(assignment.teacher_id)
    setFormError("")
    setIsFormOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setFormError("")
    setSuccessMessage("")
    try {
      let saved: TeacherAssignment
      if (editing) {
        saved = await updateTeacherAssignment(userId, editing.id, teacherId)
      } else {
        const schoolClass = classMap.get(classId)
        saved = await createTeacherAssignment(userId, {
          teacherId,
          classId,
          subjectId,
          academicYearId: schoolClass?.academic_year_id ?? "",
          semesterId: schoolClass?.semester_id ?? "",
        })
      }
      setAssignments((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      )
      setSuccessMessage(
        editing
          ? "Penugasan berhasil diperbarui."
          : "Penugasan berhasil ditambahkan.",
      )
      setIsFormOpen(false)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Penugasan belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus() {
    if (!statusTarget) return
    setIsChangingStatus(true)
    setSuccessMessage("")
    try {
      const saved = await setTeacherAssignmentActive(
        userId,
        statusTarget.id,
        !statusTarget.is_active,
      )
      setAssignments((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      )
      setSuccessMessage(
        saved.is_active
          ? "Penugasan diaktifkan kembali."
          : "Penugasan dinonaktifkan.",
      )
      setStatusTarget(null)
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Status belum dapat diubah.",
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

  const cannotCreate =
    availableClasses.length === 0 ||
    activeSubjects.length === 0 ||
    activeTeachers.length === 0

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold hover:bg-[var(--rapotku-canvas)]"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={20} aria-hidden="true" />{" "}
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
            onClick={() => void logout()}
            disabled={isLoggingOut}
          >
            <LogOut size={19} aria-hidden="true" />{" "}
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
              Data Master
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Penugasan Guru
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)]">
              Hubungkan satu guru dengan mata pelajaran dan kelas yang menjadi
              tanggung jawabnya.
            </p>
          </div>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_20px_rgba(201,29,36,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={openCreate}
            disabled={cannotCreate}
          >
            <Plus size={19} aria-hidden="true" /> Tambah Penugasan
          </button>
        </div>

        {successMessage ? (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-xl border border-[#b9e0ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[#176b48]"
          >
            <CheckCircle2 size={19} />
            {successMessage}
          </div>
        ) : null}
        {cannotCreate && !isLoading ? (
          <div className="mt-5 rounded-xl border border-[#f1d394] bg-[#fff8e8] p-4 text-sm text-[#805a13]">
            Siapkan minimal satu kelas, mata pelajaran aktif, dan guru aktif
            sebelum membuat penugasan.
          </div>
        ) : null}

        <section className="mt-6 rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <span className="sr-only">Cari penugasan</span>
              <Search
                className="absolute left-4 top-3.5 text-[var(--rapotku-muted)]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] pl-11 pr-4 outline-none focus:border-[var(--rapotku-brand)]"
                placeholder="Cari kelas, mapel, atau guru"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select
              aria-label="Filter kelas"
              className="min-h-12 rounded-xl border border-[var(--rapotku-border)] bg-white px-4"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="all">Semua kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter status"
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
            <div className="text-center">
              <LoaderCircle className="mx-auto animate-spin text-[var(--rapotku-brand)]" />
              <p className="mt-3 font-semibold">Memuat penugasan...</p>
            </div>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-[#f3b8bb] bg-white p-6 text-center"
          >
            <AlertCircle className="mx-auto text-[var(--rapotku-brand)]" />
            <p className="mt-3 font-bold">{loadError}</p>
            <button
              className="mt-4 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
              type="button"
              onClick={() => {
                setLoadError("")
                setIsLoading(true)
                setLoadAttempt((value) => value + 1)
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[var(--rapotku-border)] bg-white p-8 text-center">
            <UserCheck
              className="mx-auto text-[var(--rapotku-brand)]"
              size={34}
            />
            <h2 className="mt-4 text-lg font-bold">Belum ada penugasan</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tambahkan guru untuk kelas dan mata pelajaran yang tersedia.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredAssignments.map((assignment) => {
              const schoolClass = classMap.get(assignment.class_id)
              const subject = subjectMap.get(assignment.subject_id)
              const teacher = teacherMap.get(assignment.teacher_id)
              return (
                <article
                  key={assignment.id}
                  className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">
                        {subject?.name ?? "Mata pelajaran tidak tersedia"}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-[var(--rapotku-muted)]">
                        <GraduationCap size={17} />
                        {schoolClass?.name ?? "Kelas tidak tersedia"} ·{" "}
                        {yearNames[assignment.academic_year_id] ?? "Periode"} /
                        Semester{" "}
                        {semesterNumbers[assignment.semester_id] ?? "-"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${assignment.is_active ? "bg-[#ecf8f2] text-[#176b48]" : "bg-[#f0f1f3] text-[#667085]"}`}
                    >
                      {assignment.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--rapotku-canvas)] p-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-[var(--rapotku-brand)]">
                      <UserCheck size={20} />
                    </span>
                    <div>
                      <p className="text-xs text-[var(--rapotku-muted)]">
                        Guru pengampu
                      </p>
                      <p className="font-bold">
                        {teacher?.full_name ?? "Guru tidak tersedia"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      className="min-h-11 rounded-xl border border-[var(--rapotku-border)] font-semibold"
                      type="button"
                      onClick={() => openEdit(assignment)}
                    >
                      <Pencil className="mr-2 inline" size={16} />
                      Ganti Guru
                    </button>
                    <button
                      className="min-h-11 rounded-xl border border-[var(--rapotku-border)] font-semibold"
                      type="button"
                      onClick={() => setStatusTarget(assignment)}
                    >
                      <ToggleLeft className="mr-2 inline" size={17} />
                      {assignment.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {isFormOpen ? (
        <div
          className="fixed inset-0 z-40 grid items-end bg-black/45 p-0 sm:place-items-center sm:p-6"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-form-title"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[var(--rapotku-brand)]">
                  Penugasan
                </p>
                <h2
                  id="assignment-form-title"
                  className="mt-1 text-xl font-bold"
                >
                  {editing ? "Ganti guru pengampu" : "Tambah penugasan"}
                </h2>
              </div>
              <button
                aria-label="Tutup form"
                className="grid size-11 place-items-center rounded-xl hover:bg-[var(--rapotku-canvas)]"
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
              <label className="block text-sm font-bold">
                Kelas
                <select
                  className={inputClassName}
                  value={classId}
                  onChange={(event) => {
                    setClassId(event.target.value)
                    setSubjectId("")
                  }}
                  disabled={Boolean(editing)}
                  required
                >
                  <option value="">Pilih kelas</option>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {yearNames[item.academic_year_id]} /
                      Semester {semesterNumbers[item.semester_id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Mata pelajaran
                <select
                  className={inputClassName}
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  disabled={Boolean(editing)}
                  required
                >
                  <option value="">Pilih mata pelajaran</option>
                  {activeSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.is_local_content ? " · Muatan lokal" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Guru pengampu
                <select
                  className={inputClassName}
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  required
                >
                  <option value="">Pilih guru</option>
                  {activeTeachers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </select>
              </label>
              {formError ? (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-[#f3b8bb] bg-[#fff5f5] p-3 text-sm text-[#9f1d25]"
                >
                  <AlertCircle className="shrink-0" size={19} />
                  {formError}
                </div>
              ) : null}
              <button
                className="min-h-12 w-full rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Guru"
                    : "Simpan Penugasan"}
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
            aria-labelledby="assignment-status-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 id="assignment-status-title" className="text-xl font-bold">
              {statusTarget.is_active
                ? "Nonaktifkan penugasan?"
                : "Aktifkan penugasan?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--rapotku-muted)]">
              {subjectMap.get(statusTarget.subject_id)?.name} di{" "}
              {classMap.get(statusTarget.class_id)?.name}. Data lama tetap
              tersimpan.
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
