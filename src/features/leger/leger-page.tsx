import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardList,
  Download,
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

import type { LegerViewModel } from "./leger-view-model"
import { buildLegerCsv, createLegerFilename } from "./leger-export"
import { getLeger } from "./leger.service"

type Props = Readonly<{
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

const selectClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-semibold focus:border-[var(--rapotku-brand)] focus:outline-none focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"

const statusClass = {
  not_started: "border-[#d5d8de] bg-[#f5f6f7] text-[#626b79]",
  partial: "border-[#f1d294] bg-[#fff8e8] text-[#875500]",
  complete: "border-[#b9e3ce] bg-[#ecf8f2] text-[#176b46]",
  ready_to_print: "border-[#b9e3ce] bg-[#e6f7ef] text-[#12633f]",
} as const

function ScoreValue({
  average,
  predicate,
}: Readonly<{ average: number | null; predicate: string | null }>) {
  if (average === null)
    return <span className="text-[var(--rapotku-muted)]">—</span>
  return (
    <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
      {average}
      {predicate ? (
        <small className="text-[10px] text-[var(--rapotku-brand)]">
          {predicate}
        </small>
      ) : null}
    </span>
  )
}

export function LegerPage({ userName, schoolName, onBack, onLogout }: Props) {
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
  const [leger, setLeger] = useState<LegerViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.all([
      getClasses(),
      getStudents(),
      getClassMemberships(),
      getAcademicPeriods(),
    ])
      .then(([allClasses, allStudents, allMemberships, loadedPeriods]) => {
        if (!active) return
        setClasses(allClasses)
        setStudents(allStudents)
        setMemberships(allMemberships)
        setPeriods(loadedPeriods)
        setIsLoading(Boolean(allClasses[0]))
        setClassId((current) =>
          allClasses.some((item) => item.id === current)
            ? current
            : (allClasses[0]?.id ?? ""),
        )
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Data awal leger belum dapat dimuat.",
          )
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [revision])

  const selectedClass = classes.find((item) => item.id === classId)
  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    const ids = new Set(
      memberships
        .filter(
          (item) =>
            item.class_id === selectedClass.id &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return students.filter(
      (student) => student.is_active && ids.has(student.id),
    )
  }, [memberships, selectedClass, students])
  const academicYear = periods.academicYears.find(
    (item) => item.id === selectedClass?.academic_year_id,
  )
  const semester = periods.semesters.find(
    (item) => item.id === selectedClass?.semester_id,
  )

  useEffect(() => {
    if (
      !selectedClass ||
      !academicYear ||
      !semester ||
      classStudents.length === 0
    ) {
      return
    }
    let active = true
    void getLeger(selectedClass, classStudents, academicYear, semester)
      .then((data) => active && setLeger(data))
      .catch((reason: unknown) => {
        if (active) {
          setLeger(null)
          setError(
            reason instanceof Error
              ? reason.message
              : "Leger belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [academicYear, classStudents, revision, selectedClass, semester])

  function handleExport() {
    if (!leger) return
    const blob = new Blob(["\uFEFF", buildLegerCsv(leger)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = createLegerFilename(leger)
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="leger-screen-only sticky top-0 z-30 border-b border-[var(--rapotku-border)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
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
              <ClipboardList aria-hidden="true" size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Leger Kelas 1–6</p>
              <p className="truncate text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? "RaporKu"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-[var(--rapotku-muted)] sm:block">
              {userName}
            </span>
            <button
              aria-label="Keluar"
              className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
              onClick={() => void onLogout()}
              type="button"
            >
              <LogOut aria-hidden="true" size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
        <section className="leger-screen-only overflow-hidden rounded-3xl bg-[linear-gradient(130deg,#841016_0%,#c91d24_72%,#e34a4f_100%)] p-5 text-white shadow-[0_18px_50px_rgba(130,18,23,0.18)] sm:p-7">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <BookOpenCheck aria-hidden="true" size={24} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                Ringkasan otomatis
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Nilai kelas 1–6, terbaca dalam sekali lihat
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Nilai Pengetahuan dan Keterampilan tetap dipisahkan. Leger hanya
                membaca data yang sudah diisi, bukan tempat memasukkan nilai.
              </p>
            </div>
          </div>
        </section>

        <section className="leger-screen-only relative z-10 mx-2 -mt-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_16px_38px_rgba(80,30,33,0.09)] backdrop-blur sm:mx-5 sm:-mt-5 sm:p-5">
          <label className="block max-w-md text-sm font-bold">
            Pilih kelas
            <select
              className={selectClass}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setLeger(null)
                setError("")
                setIsLoading(Boolean(event.target.value))
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
        </section>

        {error ? (
          <div
            className="leger-screen-only mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3 font-bold"
              onClick={() => {
                setError("")
                setLeger(null)
                setIsLoading(true)
                setRevision((value) => value + 1)
              }}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Coba lagi
            </button>
          </div>
        ) : null}
        {isLoading ? (
          <div
            className="mt-6 grid min-h-64 place-items-center rounded-3xl border border-[var(--rapotku-border)] bg-white"
            role="status"
          >
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                size={30}
              />
              <p className="mt-3 font-semibold">Menyusun leger...</p>
            </div>
          </div>
        ) : null}
        {!isLoading && classes.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="text-lg font-bold">Belum ada kelas</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tambahkan kelas terlebih dahulu di Data Kelas.
            </p>
          </div>
        ) : null}
        {!isLoading && selectedClass && classStudents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="text-lg font-bold">Belum ada siswa di kelas ini</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tempatkan siswa ke kelas sebelum membuka leger.
            </p>
          </div>
        ) : null}

        {leger && !isLoading ? (
          <section
            className={`leger-print-sheet mt-6 ${
              leger.templateGroup === "upper_primary"
                ? "leger-upper-primary"
                : ""
            }`}
            aria-labelledby="leger-title"
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="leger-print-only hidden text-sm font-bold uppercase tracking-[0.12em]">
                  {leger.schoolName}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
                  {leger.academicYear} · {leger.semester}
                </p>
                <h2 id="leger-title" className="mt-1 text-xl font-bold">
                  Leger {leger.className}
                </h2>
              </div>
              <div className="leger-screen-only flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--rapotku-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--rapotku-muted)]">
                  {leger.rows.length} siswa · {leger.subjectColumns.length}{" "}
                  mapel
                </span>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-bold transition active:scale-[0.98]"
                  onClick={handleExport}
                  type="button"
                >
                  <Download aria-hidden="true" size={17} />
                  Ekspor CSV
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--rapotku-brand-strong)] active:scale-[0.98]"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Printer aria-hidden="true" size={17} />
                  Cetak leger
                </button>
              </div>
            </div>

            <div className="leger-table-results hidden overflow-x-auto rounded-3xl border border-[var(--rapotku-border)] bg-white shadow-[0_8px_28px_rgba(24,31,45,0.04)] md:block">
              <table className="min-w-max border-collapse text-sm">
                <thead>
                  <tr className="bg-[#fff7f7] text-left">
                    <th className="sticky left-0 z-10 min-w-56 border-b border-r border-[var(--rapotku-border)] bg-[#fff7f7] px-4 py-3">
                      Siswa
                    </th>
                    {leger.subjectColumns.map((subject) => (
                      <th
                        className="border-b border-r border-[var(--rapotku-border)] px-3 py-3 text-center"
                        colSpan={subject.components.length}
                        key={subject.subjectId}
                      >
                        {subject.subjectName}
                      </th>
                    ))}
                    <th className="border-b border-[var(--rapotku-border)] px-4 py-3">
                      Status
                    </th>
                  </tr>
                  <tr className="bg-[#fffafa] text-xs text-[var(--rapotku-muted)]">
                    <th className="sticky left-0 z-10 border-b border-r border-[var(--rapotku-border)] bg-[#fffafa] px-4 py-2">
                      Nama · NIS
                    </th>
                    {leger.subjectColumns.flatMap((subject) =>
                      subject.components.map((component) => (
                        <th
                          className="min-w-28 border-b border-r border-[var(--rapotku-border)] px-3 py-2 text-center"
                          key={`${subject.subjectId}-${component.componentId}`}
                        >
                          {component.componentName}
                        </th>
                      )),
                    )}
                    <th className="border-b border-[var(--rapotku-border)] px-4 py-2">
                      Kelengkapan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leger.rows.map((row) => (
                    <tr
                      className="align-top hover:bg-[#fffafa]"
                      key={row.studentId}
                    >
                      <th className="sticky left-0 z-10 border-r border-t border-[var(--rapotku-border)] bg-white px-4 py-4 text-left">
                        <span className="block font-bold">
                          {row.studentName}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[var(--rapotku-muted)]">
                          NIS {row.nis}
                        </span>
                      </th>
                      {leger.subjectColumns.flatMap((subject) =>
                        subject.components.map((component) => {
                          const value = row.subjects
                            .find(
                              (item) => item.subjectId === subject.subjectId,
                            )
                            ?.components.find(
                              (item) =>
                                item.componentId === component.componentId,
                            )
                          return (
                            <td
                              className="border-r border-t border-[var(--rapotku-border)] px-3 py-4 text-center"
                              key={`${row.studentId}-${subject.subjectId}-${component.componentId}`}
                            >
                              <ScoreValue
                                average={value?.average ?? null}
                                predicate={value?.predicate ?? null}
                              />
                            </td>
                          )
                        }),
                      )}
                      <td className="border-t border-[var(--rapotku-border)] px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass[row.status]}`}
                        >
                          {row.statusLabel}
                        </span>
                        <details className="mt-3 max-w-72">
                          <summary className="cursor-pointer text-xs font-bold text-[var(--rapotku-brand)]">
                            Ringkasan capaian
                          </summary>
                          <div className="mt-2 space-y-2 text-xs leading-5 text-[var(--rapotku-muted)]">
                            {row.achievementSummary.length ? (
                              row.achievementSummary.map((text) => (
                                <p key={text}>{text}</p>
                              ))
                            ) : (
                              <p>Deskripsi capaian belum tersedia.</p>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="leger-mobile-results grid gap-4 md:hidden">
              {leger.rows.map((row) => (
                <article
                  className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_24px_rgba(24,31,45,0.04)]"
                  key={row.studentId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{row.studentName}</h3>
                      <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                        NIS {row.nis}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass[row.status]}`}
                    >
                      {row.statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 divide-y divide-[var(--rapotku-border)]">
                    {row.subjects.map((subject) => (
                      <div className="py-3 first:pt-0" key={subject.subjectId}>
                        <p className="text-sm font-bold">
                          {subject.subjectName}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {subject.components.map((component) => (
                            <div
                              className="rounded-xl bg-[#faf5f5] px-3 py-2"
                              key={component.componentId}
                            >
                              <p className="text-[11px] font-semibold text-[var(--rapotku-muted)]">
                                {component.componentName}
                              </p>
                              <p className="mt-1">
                                <ScoreValue
                                  average={component.average}
                                  predicate={component.predicate}
                                />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <details className="mt-3 border-t border-[var(--rapotku-border)] pt-3">
                    <summary className="cursor-pointer text-sm font-bold text-[var(--rapotku-brand)]">
                      Lihat ringkasan capaian
                    </summary>
                    <div className="mt-3 space-y-2 text-xs leading-5 text-[var(--rapotku-muted)]">
                      {row.achievementSummary.length ? (
                        row.achievementSummary.map((text) => (
                          <p key={text}>{text}</p>
                        ))
                      ) : (
                        <p>Deskripsi capaian belum tersedia.</p>
                      )}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
