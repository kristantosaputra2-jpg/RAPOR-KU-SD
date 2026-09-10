import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  FileUp,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Search,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react"

import {
  getAcademicPeriods,
  type AcademicPeriods,
} from "@/features/academic-periods/academic-periods.service"
import { getClasses, type SchoolClass } from "@/features/classes/class.service"
import {
  assignStudentToClass,
  createStudent,
  getClassMemberships,
  getStudents,
  removeStudentFromClass,
  setStudentActive,
  updateStudent,
  type ClassMembership,
  type Student,
  type StudentInput,
} from "@/features/students/student.service"

type StudentPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
  onOpenAcademicPeriods: () => void
  onOpenImport: () => void
}>

const emptyPeriods: AcademicPeriods = {
  schoolId: null,
  academicYears: [],
  semesters: [],
}

const emptyForm: StudentInput = {
  fullName: "",
  nis: "",
  nisn: "",
  gender: "male",
  birthPlace: "",
  birthDate: "",
  religion: "",
  address: "",
  fatherName: "",
  motherName: "",
  guardianName: "",
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

function todayDateValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formFromStudent(student: Student): StudentInput {
  return {
    fullName: student.full_name,
    nis: student.nis,
    nisn: student.nisn ?? "",
    gender: student.gender,
    birthPlace: student.birth_place ?? "",
    birthDate: student.birth_date ?? "",
    religion: student.religion ?? "",
    address: student.address ?? "",
    fatherName: student.father_name ?? "",
    motherName: student.mother_name ?? "",
    guardianName: student.guardian_name ?? "",
  }
}

function genderLabel(student: Student) {
  return student.gender === "male" ? "Laki-laki" : "Perempuan"
}

export function StudentPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
  onOpenAcademicPeriods,
  onOpenImport,
}: StudentPageProps) {
  const [students, setStudents] = useState<ReadonlyArray<Student>>([])
  const [memberships, setMemberships] = useState<
    ReadonlyArray<ClassMembership>
  >([])
  const [classes, setClasses] = useState<ReadonlyArray<SchoolClass>>([])
  const [periods, setPeriods] = useState<AcademicPeriods>(emptyPeriods)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [form, setForm] = useState<StudentInput>(emptyForm)
  const [selectedClassId, setSelectedClassId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [statusTarget, setStatusTarget] = useState<Student | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    void Promise.all([
      getStudents(),
      getClassMemberships(),
      getClasses(),
      getAcademicPeriods(),
    ])
      .then(
        ([loadedStudents, loadedMemberships, loadedClasses, loadedPeriods]) => {
          if (isMounted) {
            setStudents(loadedStudents)
            setMemberships(loadedMemberships)
            setClasses(loadedClasses)
            setPeriods(loadedPeriods)
            setIsLoading(false)
          }
        },
      )
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Data siswa belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const activeSemester = useMemo(
    () => periods.semesters.find((semester) => semester.is_active) ?? null,
    [periods.semesters],
  )
  const activeAcademicYear = useMemo(
    () =>
      activeSemester
        ? (periods.academicYears.find(
            (year) => year.id === activeSemester.academic_year_id,
          ) ?? null)
        : null,
    [activeSemester, periods.academicYears],
  )
  const activeClasses = useMemo(
    () =>
      activeSemester
        ? classes.filter(
            (schoolClass) => schoolClass.semester_id === activeSemester.id,
          )
        : [],
    [activeSemester, classes],
  )
  const classesById = useMemo(
    () =>
      new Map(
        activeClasses.map((schoolClass) => [schoolClass.id, schoolClass]),
      ),
    [activeClasses],
  )
  const membershipByStudent = useMemo(() => {
    const result = new Map<string, ClassMembership>()
    if (!activeSemester) return result

    memberships.forEach((membership) => {
      if (membership.semester_id === activeSemester.id) {
        result.set(membership.student_id, membership)
      }
    })
    return result
  }, [activeSemester, memberships])

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return students.filter((student) => {
      const membership = membershipByStudent.get(student.id)
      const matchesSearch =
        !query ||
        student.full_name.toLowerCase().includes(query) ||
        student.nis.toLowerCase().includes(query) ||
        (student.nisn ?? "").includes(query)
      const matchesClass =
        classFilter === "all" ||
        (classFilter === "unassigned"
          ? !membership
          : membership?.class_id === classFilter)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? student.is_active : !student.is_active)

      return matchesSearch && matchesClass && matchesStatus
    })
  }, [classFilter, membershipByStudent, searchTerm, statusFilter, students])

  function openCreateForm() {
    setEditingStudent(null)
    setForm(emptyForm)
    setSelectedClassId("")
    setFormError("")
    setIsFormOpen(true)
  }

  function retryLoad() {
    setIsLoading(true)
    setLoadError("")
    setLoadAttempt((current) => current + 1)
  }

  function openEditForm(student: Student) {
    const membership = membershipByStudent.get(student.id)
    setEditingStudent(student)
    setForm(formFromStudent(student))
    setSelectedClassId(membership?.class_id ?? "")
    setFormError("")
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!isSaving) setIsFormOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setSuccessMessage("")
    setIsSaving(true)
    let persistedStudent: Student | null = null

    try {
      const savedStudent = editingStudent
        ? await updateStudent(userId, editingStudent.id, form)
        : await createStudent(userId, form)
      persistedStudent = savedStudent

      setStudents((current) =>
        editingStudent
          ? current.map((student) =>
              student.id === savedStudent.id ? savedStudent : student,
            )
          : [...current, savedStudent].sort((left, right) =>
              left.full_name.localeCompare(right.full_name, "id"),
            ),
      )

      if (activeSemester) {
        const currentMembership = membershipByStudent.get(savedStudent.id)

        if (selectedClassId) {
          const savedMembership = await assignStudentToClass(
            userId,
            savedStudent.id,
            selectedClassId,
            activeSemester.id,
            currentMembership,
          )
          setMemberships((current) => [
            savedMembership,
            ...current.filter(
              (membership) => membership.id !== savedMembership.id,
            ),
          ])
        } else if (currentMembership) {
          await removeStudentFromClass(currentMembership.id)
          setMemberships((current) =>
            current.filter(
              (membership) => membership.id !== currentMembership.id,
            ),
          )
        }
      }

      setSuccessMessage(
        editingStudent
          ? "Data siswa berhasil diperbarui."
          : "Siswa berhasil ditambahkan.",
      )
      setIsFormOpen(false)
    } catch (error) {
      if (!editingStudent && persistedStudent) {
        // A retry must update the identity already saved instead of creating a duplicate.
        setEditingStudent(persistedStudent)
      }
      setFormError(
        error instanceof Error
          ? error.message
          : "Data siswa belum dapat disimpan. Coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(student: Student) {
    setIsChangingStatus(true)
    setSuccessMessage("")
    setLoadError("")

    try {
      const savedStudent = await setStudentActive(
        userId,
        student.id,
        !student.is_active,
      )
      setStudents((current) =>
        current.map((item) =>
          item.id === savedStudent.id ? savedStudent : item,
        ),
      )
      setSuccessMessage(
        savedStudent.is_active
          ? "Siswa berhasil diaktifkan kembali."
          : "Siswa berhasil dinonaktifkan.",
      )
      setStatusTarget(null)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Status siswa belum dapat diubah. Coba lagi.",
      )
    } finally {
      setIsChangingStatus(false)
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

  const activeStudentCount = students.filter(
    (student) => student.is_active,
  ).length
  const unassignedCount = students.filter(
    (student) => student.is_active && !membershipByStudent.has(student.id),
  ).length

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white transition hover:bg-[var(--rapotku-canvas)]"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <BookOpenCheck aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">RapotKu</p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Admin Sekolah"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold">{userName}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Admin</p>
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-semibold disabled:opacity-60"
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={18} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
              Data Master
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Data Siswa
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
              Kelola identitas siswa dan tempatkan ke kelas pada semester aktif.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-brand)] bg-white px-5 font-bold text-[var(--rapotku-brand)] transition hover:bg-[var(--rapotku-brand-soft)]"
              type="button"
              onClick={onOpenImport}
            >
              <FileUp aria-hidden="true" size={20} />
              Import Excel
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_18px_rgba(201,29,36,0.2)] transition hover:bg-[var(--rapotku-brand-strong)]"
              type="button"
              onClick={openCreateForm}
            >
              <Plus aria-hidden="true" size={20} />
              Tambah Siswa
            </button>
          </div>
        </section>

        {logoutError || loadError ? (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
            />
            <div className="flex-1">
              <p>{logoutError || loadError}</p>
              {loadError ? (
                <button
                  className="mt-2 font-bold underline"
                  type="button"
                  onClick={retryLoad}
                >
                  Coba lagi
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[var(--rapotku-success)]"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" size={19} />
            {successMessage}
          </div>
        ) : null}

        <section
          aria-label="Ringkasan siswa"
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <Users aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Total siswa</p>
          </article>
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[#ecf8f2] text-[var(--rapotku-success)]">
              <UserRoundCheck aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{activeStudentCount}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Siswa aktif</p>
          </article>
          <article className="col-span-2 rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 sm:col-span-1">
            <span className="grid size-10 place-items-center rounded-xl bg-[#fff7e8] text-[#9a5a00]">
              <GraduationCap aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{unassignedCount}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">
              Belum masuk kelas
            </p>
          </article>
        </section>

        {!activeSemester ? (
          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#f4d7a5] bg-[#fff9ed] p-4 text-sm text-[var(--rapotku-warning)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong>Semester aktif belum dipilih.</strong> Siswa tetap dapat
              ditambahkan, tetapi belum bisa ditempatkan ke kelas.
            </p>
            <button
              className="min-h-11 shrink-0 rounded-xl bg-white px-4 font-bold shadow-sm"
              type="button"
              onClick={onOpenAcademicPeriods}
            >
              Atur Tahun & Semester
            </button>
          </section>
        ) : null}

        <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_180px]">
            <label className="relative block">
              <span className="sr-only">Cari siswa</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rapotku-muted)]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white pl-12 pr-4 outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                aria-label="Cari siswa"
                placeholder="Cari nama, NIS, atau NISN"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filter kelas</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)]"
                aria-label="Filter kelas"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="all">Semua kelas</option>
                <option value="unassigned">Belum masuk kelas</option>
                {activeClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter status siswa</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)]"
                aria-label="Filter status siswa"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="active">Siswa aktif</option>
                <option value="inactive">Tidak aktif</option>
                <option value="all">Semua status</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--rapotku-muted)]">
            <p>
              {activeAcademicYear && activeSemester
                ? `${activeAcademicYear.name} · Semester ${activeSemester.number}`
                : "Belum ada semester aktif"}
            </p>
            <p>{filteredStudents.length} siswa ditampilkan</p>
          </div>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <div className="text-center">
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                  size={30}
                />
                <p className="mt-3 text-sm text-[var(--rapotku-muted)]">
                  Memuat data siswa...
                </p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="grid min-h-72 place-items-center py-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                  <UserRound aria-hidden="true" size={26} />
                </span>
                <h2 className="mt-4 text-lg font-bold">Belum ada data siswa</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--rapotku-muted)]">
                  Tambahkan siswa satu per satu atau import bersama-sama dari
                  file Excel.
                </p>
                <button
                  className="mt-5 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
                  type="button"
                  onClick={openCreateForm}
                >
                  Tambah Siswa
                </button>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="grid min-h-56 place-items-center py-8 text-center">
              <div>
                <Search
                  aria-hidden="true"
                  className="mx-auto text-[#98a2b3]"
                  size={30}
                />
                <h2 className="mt-3 font-bold">Siswa tidak ditemukan</h2>
                <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
                  Coba ubah kata pencarian atau filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--rapotku-border)]">
              <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_160px] gap-4 bg-[#f8f9fb] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--rapotku-muted)] md:grid">
                <span>Siswa</span>
                <span>Nomor Induk</span>
                <span>Kelas</span>
                <span>Aksi</span>
              </div>
              <ul className="divide-y divide-[var(--rapotku-border)]">
                {filteredStudents.map((student) => {
                  const membership = membershipByStudent.get(student.id)
                  const schoolClass = membership
                    ? classesById.get(membership.class_id)
                    : undefined
                  return (
                    <li
                      className="grid gap-4 p-4 md:grid-cols-[minmax(220px,1.5fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_160px] md:items-center md:px-5"
                      key={student.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] font-bold text-[var(--rapotku-brand)]">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {student.full_name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                            {genderLabel(student)}
                          </p>
                          {!student.is_active ? (
                            <span className="mt-1 inline-flex rounded-full bg-[#f0f1f3] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#667085]">
                              Tidak aktif
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm md:block">
                        <div>
                          <p className="text-xs text-[var(--rapotku-muted)] md:hidden">
                            NIS
                          </p>
                          <p className="font-semibold">{student.nis}</p>
                        </div>
                        <div className="md:mt-1">
                          <p className="text-xs text-[var(--rapotku-muted)] md:inline">
                            NISN:{" "}
                          </p>
                          <p className="font-semibold md:inline">
                            {student.nisn ?? "Belum ada"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--rapotku-muted)] md:hidden">
                          Kelas semester aktif
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-3 py-1.5 text-xs font-bold md:mt-0 ${schoolClass ? "bg-[#eef6ff] text-[#245da8]" : "bg-[#fff7e8] text-[#9a5a00]"}`}
                        >
                          {schoolClass?.name ?? "Belum ditempatkan"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] px-3 text-sm font-semibold"
                          type="button"
                          onClick={() => openEditForm(student)}
                        >
                          <Pencil aria-hidden="true" size={17} />
                          Edit
                        </button>
                        <button
                          className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                          type="button"
                          aria-label={
                            student.is_active
                              ? `Nonaktifkan ${student.full_name}`
                              : `Aktifkan ${student.full_name}`
                          }
                          onClick={() =>
                            student.is_active
                              ? setStatusTarget(student)
                              : void handleStatusChange(student)
                          }
                        >
                          {student.is_active ? (
                            <UserRoundX aria-hidden="true" size={18} />
                          ) : (
                            <UserRoundCheck aria-hidden="true" size={18} />
                          )}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 grid items-end bg-[#1d222b]/50 sm:items-center sm:p-5">
          <button
            className="absolute inset-0"
            type="button"
            aria-label="Tutup formulir"
            onClick={closeForm}
          />
          <section
            className="relative mx-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
          >
            <div className="flex items-center justify-between border-b border-[var(--rapotku-border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
                  Data Siswa
                </p>
                <h2 className="mt-1 text-xl font-bold" id="student-form-title">
                  {editingStudent ? "Edit Siswa" : "Tambah Siswa"}
                </h2>
              </div>
              <button
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup"
                onClick={closeForm}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <form
              className="min-h-0 overflow-y-auto"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="space-y-6 p-5 sm:p-6">
                {formError ? (
                  <div
                    className="flex gap-3 rounded-xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
                    role="alert"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="shrink-0"
                      size={19}
                    />
                    <p>{formError}</p>
                  </div>
                ) : null}
                <fieldset>
                  <legend className="font-bold">Identitas utama</legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold">
                        Nama Lengkap{" "}
                        <span className="text-[var(--rapotku-brand)]">*</span>
                      </span>
                      <input
                        className={inputClassName}
                        value={form.fullName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        required
                        maxLength={160}
                        autoFocus
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">
                        NIS{" "}
                        <span className="text-[var(--rapotku-brand)]">*</span>
                      </span>
                      <input
                        className={inputClassName}
                        value={form.nis}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            nis: event.target.value,
                          }))
                        }
                        required
                        maxLength={30}
                        inputMode="text"
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">
                        NISN{" "}
                        <span className="font-normal text-[var(--rapotku-muted)]">
                          (bila ada)
                        </span>
                      </span>
                      <input
                        className={inputClassName}
                        value={form.nisn}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            nisn: event.target.value,
                          }))
                        }
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        placeholder="10 angka"
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">
                        Jenis Kelamin{" "}
                        <span className="text-[var(--rapotku-brand)]">*</span>
                      </span>
                      <select
                        className={inputClassName}
                        value={form.gender}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            gender:
                              event.target.value === "female"
                                ? "female"
                                : "male",
                          }))
                        }
                      >
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-sm font-semibold">
                        Kelas Semester Aktif
                      </span>
                      <select
                        className={inputClassName}
                        value={selectedClassId}
                        onChange={(event) =>
                          setSelectedClassId(event.target.value)
                        }
                        disabled={!activeSemester}
                      >
                        <option value="">Belum ditempatkan</option>
                        {activeClasses.map((schoolClass) => (
                          <option key={schoolClass.id} value={schoolClass.id}>
                            {schoolClass.name} · Kelas {schoolClass.grade_level}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="font-bold">Kelahiran</legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="text-sm font-semibold">
                        Tempat Lahir
                      </span>
                      <input
                        className={inputClassName}
                        value={form.birthPlace}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            birthPlace: event.target.value,
                          }))
                        }
                        maxLength={100}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">
                        Tanggal Lahir
                      </span>
                      <input
                        className={inputClassName}
                        type="date"
                        value={form.birthDate}
                        max={todayDateValue()}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            birthDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold">Agama</span>
                      <input
                        className={inputClassName}
                        value={form.religion}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            religion: event.target.value,
                          }))
                        }
                        maxLength={80}
                        placeholder="Isi sesuai data siswa"
                      />
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="font-bold">Alamat dan orang tua</legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold">Alamat</span>
                      <textarea
                        className={`${inputClassName} min-h-24 py-3`}
                        value={form.address}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        maxLength={500}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">Nama Ayah</span>
                      <input
                        className={inputClassName}
                        value={form.fatherName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            fatherName: event.target.value,
                          }))
                        }
                        maxLength={160}
                      />
                    </label>
                    <label>
                      <span className="text-sm font-semibold">Nama Ibu</span>
                      <input
                        className={inputClassName}
                        value={form.motherName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            motherName: event.target.value,
                          }))
                        }
                        maxLength={160}
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-sm font-semibold">
                        Nama Wali{" "}
                        <span className="font-normal text-[var(--rapotku-muted)]">
                          (bila ada)
                        </span>
                      </span>
                      <input
                        className={inputClassName}
                        value={form.guardianName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            guardianName: event.target.value,
                          }))
                        }
                        maxLength={160}
                      />
                    </label>
                  </div>
                </fieldset>
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-[var(--rapotku-border)] bg-white px-5 py-4 sm:justify-end sm:px-6">
                <button
                  className="min-h-12 flex-1 rounded-xl border border-[var(--rapotku-border)] px-5 font-bold sm:flex-none"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:flex-none"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={19}
                    />
                  ) : null}
                  {isSaving ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {statusTarget ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1d222b]/50 p-4">
          <section
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-student-title"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <UserRoundX aria-hidden="true" size={23} />
            </span>
            <h2
              className="mt-4 text-xl font-bold"
              id="deactivate-student-title"
            >
              Nonaktifkan siswa?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
              <strong>{statusTarget.full_name}</strong> tidak akan muncul pada
              daftar siswa aktif. Datanya tetap tersimpan dan dapat diaktifkan
              kembali.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                className="min-h-12 flex-1 rounded-xl border border-[var(--rapotku-border)] font-bold"
                type="button"
                onClick={() => setStatusTarget(null)}
                disabled={isChangingStatus}
              >
                Batal
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-60"
                type="button"
                onClick={() => void handleStatusChange(statusTarget)}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : null}
                Nonaktifkan
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
