import { useEffect, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import {
  ArrowLeft,
  BookOpenCheck,
  LoaderCircle,
  LogOut,
  Printer,
  RefreshCw,
} from "lucide-react"

import {
  getAcademicPeriods,
  type AcademicPeriods,
} from "@/features/academic-periods/academic-periods.service"
import { getClasses } from "@/features/classes/class.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"

import { ReportPreviewTemplate } from "./report-preview-template"
import { buildReportViewModel, type ReportViewModel } from "./report-view-model"
import { getClassReportSourceData, getReportSourceData } from "./report.service"

type Props = Readonly<{
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"

export function ReportPreviewPage({
  userName,
  schoolName,
  onBack,
  onLogout,
}: Props) {
  const [classes, setClasses] = useState<
    Awaited<ReturnType<typeof getClasses>>
  >([])
  const [students, setStudents] = useState<
    Awaited<ReturnType<typeof getStudents>>
  >([])
  const [memberships, setMemberships] = useState<
    Awaited<ReturnType<typeof getClassMemberships>>
  >([])
  const [periods, setPeriods] = useState<AcademicPeriods>({
    schoolId: null,
    academicYears: [],
    semesters: [],
  })
  const [classId, setClassId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [report, setReport] = useState<ReportViewModel | null>(null)
  const [classReports, setClassReports] = useState<
    ReadonlyArray<ReportViewModel>
  >([])
  const [isPreparingClassPrint, setIsPreparingClassPrint] = useState(false)
  const [revision, setRevision] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([
      getClasses(),
      getStudents(),
      getClassMemberships(),
      getAcademicPeriods(),
    ])
      .then(
        ([loadedClasses, loadedStudents, loadedMemberships, loadedPeriods]) => {
          if (!active) return
          setClasses(loadedClasses)
          setStudents(loadedStudents)
          setMemberships(loadedMemberships)
          setPeriods(loadedPeriods)
          setClassId(loadedClasses[0]?.id ?? "")
        },
      )
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Data awal preview belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [revision])

  const selectedClass = classes.find((item) => item.id === classId)
  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    const studentIds = new Set(
      memberships
        .filter(
          (membership) =>
            membership.class_id === selectedClass.id &&
            membership.semester_id === selectedClass.semester_id,
        )
        .map((membership) => membership.student_id),
    )
    return students.filter(
      (student) => student.is_active && studentIds.has(student.id),
    )
  }, [memberships, selectedClass, students])

  const selectedStudentId = classStudents.some(
    (student) => student.id === studentId,
  )
    ? studentId
    : (classStudents[0]?.id ?? "")
  const selectedStudent = classStudents.find(
    (item) => item.id === selectedStudentId,
  )
  const selectedSemester = periods.semesters.find(
    (item) => item.id === selectedClass?.semester_id,
  )
  const selectedAcademicYear = periods.academicYears.find(
    (item) => item.id === selectedClass?.academic_year_id,
  )

  useEffect(() => {
    if (
      !selectedClass ||
      !selectedStudent ||
      !selectedSemester ||
      !selectedAcademicYear
    ) {
      return
    }
    let active = true
    void getReportSourceData(
      selectedClass.id,
      selectedClass.semester_id,
      selectedStudent.id,
    )
      .then((source) => {
        if (!active) return
        setReport(
          buildReportViewModel({
            schoolClass: selectedClass,
            student: selectedStudent,
            academicYear: selectedAcademicYear,
            semester: selectedSemester,
            source,
          }),
        )
      })
      .catch((reason: unknown) => {
        if (active) {
          setReport(null)
          setError(
            reason instanceof Error
              ? reason.message
              : "Preview rapor belum dapat dimuat.",
          )
        }
      })
    return () => {
      active = false
    }
  }, [
    revision,
    selectedAcademicYear,
    selectedClass,
    selectedSemester,
    selectedStudent,
  ])

  async function handlePrintClass() {
    if (!selectedClass || !selectedSemester || !selectedAcademicYear) return

    setError("")
    setIsPreparingClassPrint(true)
    try {
      const sources = await getClassReportSourceData(
        selectedClass.id,
        selectedClass.semester_id,
        classStudents.map((student) => student.id),
      )
      const reports = classStudents.flatMap((student) => {
        const source = sources.get(student.id)
        return source
          ? [
              buildReportViewModel({
                schoolClass: selectedClass,
                student,
                academicYear: selectedAcademicYear,
                semester: selectedSemester,
                source,
              }),
            ]
          : []
      })
      if (reports.length !== classStudents.length) {
        throw new Error("Sebagian data rapor siswa belum dapat disusun.")
      }

      flushSync(() => setClassReports(reports))
      window.print()
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Rapor satu kelas belum dapat disiapkan.",
      )
    } finally {
      setClassReports([])
      setIsPreparingClassPrint(false)
    }
  }

  return (
    <div
      className={`app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)] ${classReports.length ? "report-print-mode-batch" : ""}`}
    >
      <header className="report-screen-only sticky top-0 z-30 border-b border-[var(--rapotku-border)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                aria-label="Kembali ke dashboard"
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={20} />
              </button>
            ) : null}
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--rapotku-brand)] text-white">
              <BookOpenCheck aria-hidden="true" size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Preview Rapor</p>
              <p className="truncate text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? "RapotKu"}
              </p>
            </div>
          </div>
          <button
            aria-label="Keluar"
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
            onClick={() => void onLogout()}
            type="button"
          >
            <LogOut aria-hidden="true" size={19} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        <div className="report-screen-only flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--rapotku-brand)]">
              Pemeriksaan sebelum cetak
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Preview rapor siswa
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
              Pilih kelas dan siswa, lalu periksa setiap bagian. Masuk sebagai{" "}
              {userName}.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-brand)] bg-white px-5 text-sm font-bold text-[var(--rapotku-brand)] transition hover:bg-[var(--rapotku-brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={classStudents.length === 0 || isPreparingClassPrint}
              onClick={() => void handlePrintClass()}
              type="button"
            >
              {isPreparingClassPrint ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <Printer aria-hidden="true" size={18} />
              )}
              {isPreparingClassPrint
                ? "Menyiapkan kelas..."
                : `Cetak satu kelas (${classStudents.length})`}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(198,31,39,0.2)] transition hover:bg-[var(--rapotku-brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!report || isPreparingClassPrint}
              onClick={() => window.print()}
              type="button"
            >
              <Printer aria-hidden="true" size={18} /> Cetak siswa ini
            </button>
          </div>
        </div>

        {error ? (
          <div
            className="report-screen-only mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 font-bold"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setError("")
                setReport(null)
                setRevision((current) => current + 1)
              }}
            >
              <RefreshCw aria-hidden="true" size={16} /> Coba lagi
            </button>
          </div>
        ) : null}

        <section className="report-screen-only mt-6 grid gap-4 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:grid-cols-2 sm:p-6">
          <label className="block text-sm font-bold">
            Kelas
            <select
              className={fieldClass}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setStudentId("")
                setReport(null)
                setError("")
              }}
            >
              <option value="">Pilih kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Kelas {item.grade_level}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Siswa
            <select
              className={fieldClass}
              value={selectedStudentId}
              disabled={!classId || classStudents.length === 0}
              onChange={(event) => {
                setStudentId(event.target.value)
                setReport(null)
                setError("")
              }}
            >
              <option value="">Pilih siswa</option>
              {classStudents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading || (selectedStudent && !report && !error) ? (
          <div
            className="report-screen-only mt-10 flex items-center justify-center gap-3 py-16"
            role="status"
          >
            <LoaderCircle className="animate-spin text-[var(--rapotku-brand)]" />
            {isLoading
              ? "Menyiapkan pilihan rapor..."
              : "Menyusun preview rapor..."}
          </div>
        ) : classes.length === 0 ? (
          <section className="report-screen-only mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada kelas</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tambahkan kelas terlebih dahulu sebelum membuat preview.
            </p>
          </section>
        ) : classStudents.length === 0 ? (
          <section className="report-screen-only mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada siswa di kelas ini</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tempatkan siswa ke kelas yang dipilih terlebih dahulu.
            </p>
          </section>
        ) : report ? (
          <div className="report-print-root report-single-print-root mx-auto mt-8 max-w-[900px]">
            <ReportPreviewTemplate report={report} />
          </div>
        ) : null}
        {classReports.length ? (
          <div
            aria-hidden="true"
            className="report-batch-print-root report-print-root"
          >
            {classReports.map((classReport) => (
              <div
                className="report-batch-student"
                key={`${classReport.student.nis}:${classReport.student.name}`}
              >
                <ReportPreviewTemplate report={classReport} />
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}
