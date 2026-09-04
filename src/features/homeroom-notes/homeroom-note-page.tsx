import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookHeart, LoaderCircle, LogOut, Save } from "lucide-react"
import { getClasses } from "@/features/classes/class.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import {
  getHomeroomNotes,
  HOMEROOM_NOTE_MAX_LENGTH,
  saveHomeroomNotes,
} from "./homeroom-note.service"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"

export function HomeroomNotePage({
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
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
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
    const studentIds = new Set(
      memberships
        .filter(
          (item) =>
            item.class_id === selectedClass.id &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return students.filter((student) => studentIds.has(student.id))
  }, [memberships, selectedClass, students])

  useEffect(() => {
    if (!selectedClass) return
    let active = true
    void getHomeroomNotes(selectedClass.id, selectedClass.semester_id)
      .then((loaded) => {
        if (!active) return
        setNotes(
          Object.fromEntries(
            loaded.map((item) => [item.student_id, item.note]),
          ),
        )
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Catatan belum dapat dimuat.",
          )
        }
      })
    return () => {
      active = false
    }
  }, [selectedClass])

  async function handleSave() {
    if (!selectedClass) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      await saveHomeroomNotes(
        userId,
        selectedClass.id,
        selectedClass.semester_id,
        classStudents.map((student) => ({
          studentId: student.id,
          note: notes[student.id] ?? "",
        })),
      )
      setMessage("Semua catatan wali kelas sudah tersimpan.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Catatan belum dapat disimpan.",
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
              <BookHeart size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Catatan Wali Kelas</p>
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
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Catatan untuk setiap siswa
        </h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Tulis pesan singkat yang akan dibaca pada rapor. Masuk sebagai{" "}
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
                setNotes({})
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

        {isLoading ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" /> Memuat catatan...
          </div>
        ) : classStudents.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <BookHeart className="mx-auto text-[var(--rapotku-brand)]" />
            <h2 className="mt-3 font-bold">Belum ada siswa di kelas ini</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Tempatkan siswa ke kelas terlebih dahulu.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {classStudents.map((student) => {
                const value = notes[student.id] ?? ""
                return (
                  <article
                    className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-5"
                    key={student.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-bold">{student.full_name}</h2>
                      <span className="shrink-0 text-xs text-[var(--rapotku-muted)]">
                        {value.length}/{HOMEROOM_NOTE_MAX_LENGTH}
                      </span>
                    </div>
                    <label className="mt-4 block text-sm font-bold">
                      Catatan
                      <textarea
                        aria-label={`Catatan ${student.full_name}`}
                        className={`${fieldClass} min-h-28 py-3`}
                        maxLength={HOMEROOM_NOTE_MAX_LENGTH}
                        placeholder="Contoh: Pertahankan semangat belajar dan sikap baikmu."
                        value={value}
                        onChange={(event) => {
                          setMessage("")
                          setNotes((current) => ({
                            ...current,
                            [student.id]: event.target.value,
                          }))
                        }}
                      />
                    </label>
                    <div className="mt-4 rounded-2xl bg-[#fff8f8] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--rapotku-brand)]">
                        Pratinjau di rapor
                      </p>
                      <p className="mt-2 text-sm leading-6">
                        {value.trim() || "Catatan belum diisi."}
                      </p>
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
                {isSaving ? "Menyimpan..." : "Simpan Semua Catatan"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
