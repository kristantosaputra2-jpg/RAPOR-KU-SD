import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
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
  getAttendance,
  parseAttendanceDays,
  saveAttendance,
} from "./attendance.service"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

type AttendanceDraft = Readonly<{
  sickDays: string
  permittedDays: string
  absentDays: string
}>

const emptyDraft: AttendanceDraft = {
  sickDays: "0",
  permittedDays: "0",
  absentDays: "0",
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-center text-base font-bold focus:border-[var(--rapotku-brand)] focus:outline-none"

export function AttendancePage({
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
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
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
        setIsLoadingEntries(loadedClasses.length > 0)
        setClassId(loadedClasses[0]?.id ?? "")
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Data belum dapat dimuat.",
          )
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const selectedClass = classes.find((item) => item.id === classId)
  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    const studentIds = new Set(
      memberships
        .filter(
          (item) =>
            item.class_id === selectedClass.id &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return students.filter((item) => studentIds.has(item.id))
  }, [memberships, selectedClass, students])

  useEffect(() => {
    if (!selectedClass) {
      return
    }
    let active = true
    void getAttendance(selectedClass.id, selectedClass.semester_id)
      .then((entries) => {
        if (!active) return
        setDrafts(
          Object.fromEntries(
            classStudents.map((student) => {
              const entry = entries.find(
                (item) => item.student_id === student.id,
              )
              return [
                student.id,
                entry
                  ? {
                      sickDays: String(entry.sick_days),
                      permittedDays: String(entry.permitted_days),
                      absentDays: String(entry.absent_days),
                    }
                  : emptyDraft,
              ]
            }),
          ),
        )
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Absensi belum dapat dimuat.",
          )
      })
      .finally(() => active && setIsLoadingEntries(false))
    return () => {
      active = false
    }
  }, [classStudents, selectedClass])

  function updateDraft(
    studentId: string,
    field: keyof AttendanceDraft,
    value: string,
  ) {
    setMessage("")
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? emptyDraft), [field]: value },
    }))
  }

  async function handleSave() {
    if (!selectedClass) return
    setIsSaving(true)
    setMessage("")
    setError("")
    try {
      await saveAttendance(
        userId,
        selectedClass.id,
        selectedClass.semester_id,
        classStudents.map((student) => {
          const draft = drafts[student.id] ?? emptyDraft
          return {
            studentId: student.id,
            sickDays: parseAttendanceDays(draft.sickDays),
            permittedDays: parseAttendanceDays(draft.permittedDays),
            absentDays: parseAttendanceDays(draft.absentDays),
          }
        }),
      )
      setMessage("Absensi seluruh siswa sudah tersimpan.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Absensi belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const fields = [
    ["sickDays", "Sakit"],
    ["permittedDays", "Izin"],
    ["absentDays", "Tanpa keterangan"],
  ] as const

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
              <BookOpenCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Absensi</p>
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
          Wali Kelas
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Absensi seluruh siswa
        </h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Isi jumlah hari sakit, izin, dan tanpa keterangan dalam satu layar.
        </p>
        <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
          Masuk sebagai {userName}
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
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3"
              value={classId}
              onChange={(event) => {
                setIsLoadingEntries(true)
                setError("")
                setClassId(event.target.value)
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

        {isLoading || isLoadingEntries ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" /> Memuat absensi...
          </div>
        ) : classStudents.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada siswa di kelas ini</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tambahkan siswa ke kelas sebelum mengisi absensi.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:hidden">
              {classStudents.map((student, index) => (
                <section
                  className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-4"
                  key={student.id}
                >
                  <p className="font-bold">
                    {index + 1}. {student.full_name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                    NIS {student.nis}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {fields.map(([field, label]) => (
                      <label className="text-xs font-bold" key={field}>
                        {label}
                        <input
                          aria-label={`${label} ${student.full_name}`}
                          className={`${inputClass} mt-2`}
                          inputMode="numeric"
                          min="0"
                          step="1"
                          type="number"
                          value={(drafts[student.id] ?? emptyDraft)[field]}
                          onChange={(event) =>
                            updateDraft(student.id, field, event.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-6 hidden overflow-hidden rounded-3xl border border-[var(--rapotku-border)] bg-white md:block">
              <table className="w-full">
                <thead className="bg-[#fff7f7] text-left text-sm">
                  <tr>
                    <th className="p-4">Siswa</th>
                    {fields.map(([, label]) => (
                      <th className="p-4 text-center" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student) => (
                    <tr
                      className="border-t border-[var(--rapotku-border)]"
                      key={student.id}
                    >
                      <th className="p-4 text-left">
                        <p>{student.full_name}</p>
                        <p className="text-xs font-normal text-[var(--rapotku-muted)]">
                          NIS {student.nis}
                        </p>
                      </th>
                      {fields.map(([field, label]) => (
                        <td className="p-3" key={field}>
                          <input
                            aria-label={`${label} ${student.full_name}`}
                            className={inputClass}
                            min="0"
                            step="1"
                            type="number"
                            value={(drafts[student.id] ?? emptyDraft)[field]}
                            onChange={(event) =>
                              updateDraft(student.id, field, event.target.value)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sticky bottom-0 mt-6 border-t border-[var(--rapotku-border)] bg-[color:var(--rapotku-canvas)]/95 py-4 backdrop-blur">
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
                {isSaving ? "Menyimpan..." : "Simpan Absensi"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
