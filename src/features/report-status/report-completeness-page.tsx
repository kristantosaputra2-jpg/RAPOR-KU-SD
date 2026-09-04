import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  LoaderCircle,
  LogOut,
  Save,
} from "lucide-react"
import { getClasses } from "@/features/classes/class.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import {
  REPORT_STATUS_LABELS,
  type ReportChecklist,
  type ReportStatus,
} from "./report-completeness"
import {
  getReportCompleteness,
  saveCompletionConfirmations,
  type CompletionConfirmation,
  type StudentReportCompleteness,
} from "./report-completeness.service"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"
const checkLabels: ReadonlyArray<readonly [keyof ReportChecklist, string]> = [
  ["identity", "Identitas"],
  ["grades", "Nilai semua CP"],
  ["descriptions", "Deskripsi"],
  ["attendance", "Absensi"],
  ["extracurricular", "Ekstrakurikuler"],
  ["achievement", "Prestasi"],
  ["homeroomNote", "Catatan wali kelas"],
]

const statusClass: Readonly<Record<ReportStatus, string>> = {
  not_started: "bg-slate-100 text-slate-700",
  partial: "bg-amber-100 text-amber-800",
  complete: "bg-blue-100 text-blue-800",
  ready_to_print: "bg-emerald-100 text-emerald-800",
}

export function ReportCompletenessPage({
  userId,
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
  const [classId, setClassId] = useState("")
  const [rows, setRows] = useState<ReadonlyArray<StudentReportCompleteness>>([])
  const [confirmations, setConfirmations] = useState<
    Record<string, CompletionConfirmation>
  >({})
  const [revision, setRevision] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([getClasses(), getStudents(), getClassMemberships()])
      .then(([loadedClasses, loadedStudents, loadedMemberships]) => {
        if (!active) return
        setClasses(loadedClasses)
        setStudents(loadedStudents)
        setMemberships(loadedMemberships)
        setClassId(loadedClasses[0]?.id ?? "")
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Data belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

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
    return students.filter((student) => ids.has(student.id))
  }, [memberships, selectedClass, students])

  useEffect(() => {
    if (!selectedClass || classStudents.length === 0) return
    let active = true
    void getReportCompleteness(
      selectedClass.id,
      selectedClass.semester_id,
      selectedClass.grade_level,
      classStudents,
    )
      .then((loaded) => {
        if (!active) return
        setRows(loaded)
        setConfirmations(
          Object.fromEntries(
            loaded.map((item) => [item.studentId, item.confirmation]),
          ),
        )
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Kelengkapan belum dapat diperiksa.",
          )
        }
      })
      .finally(() => active && setIsChecking(false))
    return () => {
      active = false
    }
  }, [classStudents, revision, selectedClass])

  const statusCounts = useMemo(
    () =>
      rows.reduce<Record<ReportStatus, number>>(
        (counts, row) => ({
          ...counts,
          [row.status]: counts[row.status] + 1,
        }),
        { not_started: 0, partial: 0, complete: 0, ready_to_print: 0 },
      ),
    [rows],
  )

  function updateConfirmation(
    studentId: string,
    field: "extracurricularConfirmedEmpty" | "achievementConfirmedEmpty",
    checked: boolean,
  ) {
    setMessage("")
    setConfirmations((current) => ({
      ...current,
      [studentId]: {
        studentId,
        extracurricularConfirmedEmpty:
          current[studentId]?.extracurricularConfirmedEmpty ?? false,
        achievementConfirmedEmpty:
          current[studentId]?.achievementConfirmedEmpty ?? false,
        [field]: checked,
      },
    }))
  }

  async function handleSave() {
    if (!selectedClass) return
    setIsSaving(true)
    setMessage("")
    setError("")
    try {
      await saveCompletionConfirmations(
        userId,
        selectedClass.id,
        selectedClass.semester_id,
        rows.map(
          (row) =>
            confirmations[row.studentId] ?? {
              studentId: row.studentId,
              extracurricularConfirmedEmpty: false,
              achievementConfirmedEmpty: false,
            },
        ),
      )
      setMessage("Konfirmasi sudah tersimpan dan status diperiksa ulang.")
      setIsChecking(true)
      setRevision((current) => current + 1)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Konfirmasi belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="border-b border-[var(--rapotku-border)] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                aria-label="Kembali ke dashboard"
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--rapotku-brand)] text-white">
              <ClipboardCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Kelengkapan Rapor</p>
              <p className="truncate text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? "RapotKu"}
              </p>
            </div>
          </div>
          <button
            aria-label="Keluar"
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
            onClick={() => void onLogout()}
            type="button"
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-sm font-bold text-[var(--rapotku-brand)]">
          Pemeriksaan Otomatis
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Kelengkapan rapor siswa
        </h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Lihat bagian yang masih kurang sebelum mencetak. Masuk sebagai{" "}
          {userName}.
        </p>

        {error ? (
          <div
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            className="mt-5 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm text-[var(--rapotku-success)]"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
          <label className="block max-w-md text-sm font-bold">
            Kelas
            <select
              className={fieldClass}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setRows([])
                setConfirmations({})
                setIsChecking(true)
                setError("")
                setMessage("")
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

        {rows.length > 0 ? (
          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map(
              (status) => (
                <div
                  className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4"
                  key={status}
                >
                  <p className="text-2xl font-bold">{statusCounts[status]}</p>
                  <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                    {REPORT_STATUS_LABELS[status]}
                  </p>
                </div>
              ),
            )}
          </section>
        ) : null}

        {isLoading || isChecking ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" /> Memeriksa kelengkapan...
          </div>
        ) : rows.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <ClipboardCheck className="mx-auto text-[var(--rapotku-brand)]" />
            <h2 className="mt-3 font-bold">Belum ada siswa untuk diperiksa</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Pilih kelas yang sudah memiliki siswa.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {rows.map((row) => {
                const confirmation = confirmations[row.studentId]
                return (
                  <article
                    className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-5"
                    key={row.studentId}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="font-bold">{row.studentName}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[row.status]}`}
                      >
                        {REPORT_STATUS_LABELS[row.status]}
                      </span>
                    </div>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {checkLabels.map(([check, label]) => (
                        <li
                          className="flex items-center gap-2 text-sm"
                          key={check}
                        >
                          {row.checks[check] ? (
                            <CheckCircle2
                              className="shrink-0 text-emerald-600"
                              size={18}
                            />
                          ) : (
                            <Circle
                              className="shrink-0 text-slate-400"
                              size={18}
                            />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 space-y-3 border-t border-[var(--rapotku-border)] pt-4">
                      {!row.hasExtracurricular ? (
                        <label className="flex min-h-11 items-center gap-3 text-sm">
                          <input
                            aria-label={`Memang tidak ada ekstrakurikuler ${row.studentName}`}
                            checked={
                              confirmation?.extracurricularConfirmedEmpty ??
                              false
                            }
                            className="size-5 accent-[var(--rapotku-brand)]"
                            onChange={(event) =>
                              updateConfirmation(
                                row.studentId,
                                "extracurricularConfirmedEmpty",
                                event.target.checked,
                              )
                            }
                            type="checkbox"
                          />
                          Memang tidak ada ekstrakurikuler
                        </label>
                      ) : null}
                      {!row.hasAchievement ? (
                        <label className="flex min-h-11 items-center gap-3 text-sm">
                          <input
                            aria-label={`Memang tidak ada prestasi ${row.studentName}`}
                            checked={
                              confirmation?.achievementConfirmedEmpty ?? false
                            }
                            className="size-5 accent-[var(--rapotku-brand)]"
                            onChange={(event) =>
                              updateConfirmation(
                                row.studentId,
                                "achievementConfirmedEmpty",
                                event.target.checked,
                              )
                            }
                            type="checkbox"
                          />
                          Memang tidak ada prestasi
                        </label>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="sticky bottom-0 mt-6 border-t border-[var(--rapotku-border)] bg-[var(--rapotku-canvas)]/95 py-4 backdrop-blur">
              <button
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:ml-auto sm:w-auto"
                disabled={isSaving}
                onClick={() => void handleSave()}
                type="button"
              >
                {isSaving ? (
                  <LoaderCircle className="animate-spin" size={19} />
                ) : (
                  <Save size={19} />
                )}
                {isSaving ? "Menyimpan..." : "Simpan Konfirmasi"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
