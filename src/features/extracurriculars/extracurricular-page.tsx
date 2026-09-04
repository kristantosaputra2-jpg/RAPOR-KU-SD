import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
  LoaderCircle,
  LogOut,
  Plus,
  Save,
} from "lucide-react"
import type { UserRole } from "@/features/auth/auth.types"
import { getClasses } from "@/features/classes/class.service"
import { getSchoolSettings } from "@/features/schools/school-settings.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import {
  createExtracurricular,
  getExtracurriculars,
  getStudentExtracurriculars,
  saveStudentExtracurriculars,
  type StudentExtracurricular,
} from "./extracurricular.service"

type Props = Readonly<{
  userId: string
  userName: string
  userRole: UserRole
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>
type Draft = Readonly<{ achievement: string; description: string }>
const emptyDraft: Draft = { achievement: "", description: "" }
const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"

export function ExtracurricularPage({
  userId,
  userName,
  userRole,
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
  const [activities, setActivities] = useState<
    Awaited<ReturnType<typeof getExtracurriculars>>
  >([])
  const [schoolId, setSchoolId] = useState("")
  const [classId, setClassId] = useState("")
  const [activityId, setActivityId] = useState("")
  const [activityName, setActivityName] = useState("")
  const [entries, setEntries] = useState<ReadonlyArray<StudentExtracurricular>>(
    [],
  )
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void Promise.all([
      getClasses(),
      getStudents(),
      getClassMemberships(),
      getExtracurriculars(),
      getSchoolSettings(),
    ])
      .then(
        ([
          loadedClasses,
          loadedStudents,
          loadedMemberships,
          loadedActivities,
          school,
        ]) => {
          if (!active) return
          setClasses(loadedClasses)
          setStudents(loadedStudents)
          setMemberships(loadedMemberships)
          setActivities(loadedActivities)
          setSchoolId(school?.id ?? "")
          setClassId(loadedClasses[0]?.id ?? "")
          setActivityId(loadedActivities[0]?.id ?? "")
        },
      )
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Data belum dapat dimuat.",
          ),
      )
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
            item.class_id === classId &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return students.filter((item) => ids.has(item.id))
  }, [classId, memberships, selectedClass, students])

  useEffect(() => {
    if (!selectedClass || !activityId) return
    let active = true
    void getStudentExtracurriculars(selectedClass.id, selectedClass.semester_id)
      .then((loaded) => {
        if (!active) return
        const relevant = loaded.filter(
          (item) => item.extracurricular_id === activityId,
        )
        setEntries(relevant)
        setSelected(new Set(relevant.map((item) => item.student_id)))
        setDrafts(
          Object.fromEntries(
            classStudents.map((student) => {
              const entry = relevant.find(
                (item) => item.student_id === student.id,
              )
              return [
                student.id,
                entry
                  ? {
                      achievement: entry.achievement,
                      description: entry.description,
                    }
                  : emptyDraft,
              ]
            }),
          ),
        )
      })
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Data belum dapat dimuat.",
          ),
      )
      .finally(() => active && setIsLoadingEntries(false))
    return () => {
      active = false
    }
  }, [activityId, classStudents, selectedClass])

  async function handleCreateActivity() {
    if (!schoolId)
      return setError("Lengkapi Pengaturan Sekolah terlebih dahulu.")
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      const created = await createExtracurricular(
        userId,
        schoolId,
        activityName,
      )
      setActivities((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      )
      setActivityId(created.id)
      setActivityName("")
      setMessage("Ekstrakurikuler berhasil ditambahkan.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Ekstrakurikuler belum dapat ditambahkan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave() {
    if (!selectedClass || !activityId) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      await saveStudentExtracurriculars(
        userId,
        {
          classId: selectedClass.id,
          semesterId: selectedClass.semester_id,
          extracurricularId: activityId,
        },
        classStudents
          .filter((student) => selected.has(student.id))
          .map((student) => ({
            studentId: student.id,
            ...(drafts[student.id] ?? emptyDraft),
          })),
      )
      setMessage("Ekstrakurikuler siswa sudah tersimpan.")
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Data belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  function changeScope(field: "class" | "activity", value: string) {
    setIsLoadingEntries(true)
    setError("")
    setMessage("")
    if (field === "class") setClassId(value)
    else setActivityId(value)
  }
  function updateDraft(studentId: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? emptyDraft), [field]: value },
    }))
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
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
              <p className="truncate font-bold">Ekstrakurikuler</p>
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
          Ekstrakurikuler siswa
        </h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Pilih kegiatan, siswa, lalu isi capaian dan deskripsinya. Masuk
          sebagai {userName}.
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
        {userRole === "admin" ? (
          <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
            <h2 className="font-bold">Tambah kegiatan</h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="flex-1 text-sm font-bold">
                Nama ekstrakurikuler
                <input
                  aria-label="Nama ekstrakurikuler"
                  className={fieldClass}
                  maxLength={120}
                  placeholder="Contoh: Pramuka"
                  value={activityName}
                  onChange={(event) => setActivityName(event.target.value)}
                />
              </label>
              <button
                className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
                disabled={isSaving}
                onClick={() => void handleCreateActivity()}
                type="button"
              >
                <Plus size={19} />
                Tambah
              </button>
            </div>
          </section>
        ) : null}
        <section className="mt-6 grid gap-4 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6 lg:grid-cols-2">
          <label className="text-sm font-bold">
            Kelas
            <select
              aria-label="Pilih kelas"
              className={fieldClass}
              value={classId}
              onChange={(event) => changeScope("class", event.target.value)}
            >
              <option value="">Pilih kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Kelas {item.grade_level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Ekstrakurikuler
            <select
              aria-label="Pilih ekstrakurikuler"
              className={fieldClass}
              value={activityId}
              onChange={(event) => changeScope("activity", event.target.value)}
            >
              <option value="">Pilih kegiatan</option>
              {activities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>
        {isLoading || isLoadingEntries ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" />
            Memuat data...
          </div>
        ) : !activityId ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada ekstrakurikuler</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Admin perlu menambahkan kegiatan terlebih dahulu.
            </p>
          </section>
        ) : classStudents.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada siswa di kelas ini</h2>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4">
              {classStudents.map((student, index) => {
                const existing = entries.some(
                  (entry) => entry.student_id === student.id,
                )
                const checked = selected.has(student.id)
                const draft = drafts[student.id] ?? emptyDraft
                return (
                  <section
                    className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-5"
                    key={student.id}
                  >
                    <label className="flex min-h-11 items-center gap-3 font-bold">
                      <input
                        checked={checked}
                        className="size-5 accent-[var(--rapotku-brand)]"
                        disabled={existing}
                        type="checkbox"
                        onChange={(event) =>
                          setSelected((current) => {
                            const next = new Set(current)
                            if (event.target.checked) next.add(student.id)
                            else next.delete(student.id)
                            return next
                          })
                        }
                      />
                      <span>
                        {index + 1}. {student.full_name}
                      </span>
                      {existing ? (
                        <span className="ml-auto text-xs text-[var(--rapotku-success)]">
                          Sudah tersimpan
                        </span>
                      ) : null}
                    </label>
                    {checked ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
                        <label className="text-sm font-bold">
                          Predikat / capaian
                          <input
                            aria-label={`Predikat ${student.full_name}`}
                            className={fieldClass}
                            maxLength={40}
                            placeholder="Contoh: Baik"
                            value={draft.achievement}
                            onChange={(event) =>
                              updateDraft(
                                student.id,
                                "achievement",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="text-sm font-bold">
                          Deskripsi
                          <textarea
                            aria-label={`Deskripsi ${student.full_name}`}
                            className={`${fieldClass} min-h-24 py-3`}
                            maxLength={500}
                            placeholder="Tuliskan capaian siswa"
                            value={draft.description}
                            onChange={(event) =>
                              updateDraft(
                                student.id,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                    ) : null}
                  </section>
                )
              })}
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
                )}{" "}
                {isSaving ? "Menyimpan..." : "Simpan Ekstrakurikuler"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
