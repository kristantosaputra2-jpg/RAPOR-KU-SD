import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  LoaderCircle,
  LogOut,
  Plus,
} from "lucide-react"
import { getClasses } from "@/features/classes/class.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import {
  createAchievement,
  getAchievements,
  type AchievementInput,
} from "./achievement.service"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>
const currentYear = String(new Date().getFullYear())
const emptyForm: AchievementInput = {
  studentId: "",
  classId: "",
  semesterId: "",
  achievementType: "",
  achievementLevel: "",
  description: "",
  eventYear: currentYear,
  eventDate: "",
}
const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"

export function AchievementPage({
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
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof getAchievements>>
  >([])
  const [form, setForm] = useState<AchievementInput>(emptyForm)
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
    if (!selectedClass) return
    let active = true
    void getAchievements(selectedClass.id, selectedClass.semester_id)
      .then((loaded) => active && setItems(loaded))
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Prestasi belum dapat dimuat.",
          ),
      )
    return () => {
      active = false
    }
  }, [selectedClass])

  function update(field: keyof AchievementInput, value: string) {
    setMessage("")
    setForm((current) => ({ ...current, [field]: value }))
  }
  async function handleSave() {
    if (!selectedClass) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      const created = await createAchievement(userId, {
        ...form,
        classId: selectedClass.id,
        semesterId: selectedClass.semester_id,
      })
      setItems((current) => [created, ...current])
      setForm(emptyForm)
      setMessage("Prestasi siswa sudah tersimpan.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Prestasi belum dapat disimpan.",
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
              <BookOpenCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Prestasi</p>
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
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Prestasi siswa</h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Catat prestasi akademik maupun nonakademik. Masuk sebagai {userName}.
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
        {!isLoading && selectedClass ? (
          <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Plus className="text-[var(--rapotku-brand)]" size={20} />
              <h2 className="font-bold">Tambah prestasi</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Siswa
                <select
                  aria-label="Siswa"
                  className={fieldClass}
                  value={form.studentId}
                  onChange={(event) => update("studentId", event.target.value)}
                >
                  <option value="">Pilih siswa</option>
                  {classStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold">
                Jenis prestasi
                <input
                  aria-label="Jenis prestasi"
                  className={fieldClass}
                  maxLength={80}
                  placeholder="Akademik / Nonakademik"
                  value={form.achievementType}
                  onChange={(event) =>
                    update("achievementType", event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-bold">
                Tingkat prestasi
                <input
                  aria-label="Tingkat prestasi"
                  className={fieldClass}
                  maxLength={80}
                  placeholder="Sekolah, kecamatan, kabupaten..."
                  value={form.achievementLevel}
                  onChange={(event) =>
                    update("achievementLevel", event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-bold">
                Tahun
                <input
                  aria-label="Tahun prestasi"
                  className={fieldClass}
                  inputMode="numeric"
                  max="2200"
                  min="1900"
                  type="number"
                  value={form.eventYear}
                  onChange={(event) => update("eventYear", event.target.value)}
                />
              </label>
              <label className="text-sm font-bold">
                Tanggal (opsional)
                <input
                  aria-label="Tanggal prestasi"
                  className={fieldClass}
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => update("eventDate", event.target.value)}
                />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Keterangan
                <textarea
                  aria-label="Keterangan prestasi"
                  className={`${fieldClass} min-h-24 py-3`}
                  maxLength={500}
                  placeholder="Contoh: Juara 1 lomba membaca puisi"
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </label>
            </div>
            <button
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:ml-auto sm:w-auto"
              disabled={isSaving}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? (
                <LoaderCircle className="animate-spin" size={19} />
              ) : (
                <Plus size={19} />
              )}{" "}
              {isSaving ? "Menyimpan..." : "Simpan Prestasi"}
            </button>
          </section>
        ) : null}
        {isLoading ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" />
            Memuat prestasi...
          </div>
        ) : items.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <Award className="mx-auto text-[var(--rapotku-brand)]" />
            <h2 className="mt-3 font-bold">Belum ada prestasi</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Prestasi yang ditambahkan akan tampil di sini.
            </p>
          </section>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const student = students.find(
                (candidate) => candidate.id === item.student_id,
              )
              return (
                <article
                  className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5"
                  key={item.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0f1] text-[var(--rapotku-brand)]">
                      <Award size={20} />
                    </span>
                    <div>
                      <h2 className="font-bold">
                        {student?.full_name ?? "Siswa"}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                        {item.achievement_type} · {item.achievement_level} ·{" "}
                        {item.event_year}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm">{item.description}</p>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
