import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LogOut,
  Save,
  Settings,
} from "lucide-react"

import { AppLogo } from "@/components/app-logo"

import {
  getAcademicPeriods,
  getActiveAcademicPeriod,
} from "@/features/academic-periods/academic-periods.service"
import { calculatePredicateRanges } from "@/features/grades/grade-calculation"
import {
  getReportGradingSettings,
  saveReportGradingSettings,
} from "@/features/grades/grading-settings.service"
import type { KkmMode } from "@/features/grades/grading-configuration"
import { getSubjects, type Subject } from "@/features/subjects/subject.service"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
  onOpenAcademicPeriods: () => void
}>

const kkmInputClass =
  "min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-base font-bold outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"

function PredicatePreview({ value }: Readonly<{ value: string }>) {
  const kkm = Number(value)
  const ranges = useMemo(() => {
    try {
      return calculatePredicateRanges(kkm)
    } catch {
      return []
    }
  }, [kkm])

  if (!ranges.length) {
    return (
      <p className="text-sm text-[var(--rapotku-muted)]">
        Isi KKM 1 sampai 100 untuk melihat rentang predikat.
      </p>
    )
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Rentang predikat"
    >
      {ranges.map((range) => (
        <div
          className="rounded-xl border border-[var(--rapotku-border)] bg-white p-3"
          key={range.predicate}
        >
          <p className="font-extrabold text-[var(--rapotku-brand)]">
            {range.predicate}
          </p>
          <p className="text-xs font-semibold">{range.label}</p>
          <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
            {range.minimum} - {range.maximum}
          </p>
        </div>
      ))}
    </div>
  )
}

export function ReportSettingsPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
  onOpenAcademicPeriods,
}: Props) {
  const [subjects, setSubjects] = useState<ReadonlyArray<Subject>>([])
  const [semesterId, setSemesterId] = useState("")
  const [periodLabel, setPeriodLabel] = useState("")
  const [mode, setMode] = useState<KkmMode>("single")
  const [singleKkm, setSingleKkm] = useState("")
  const [subjectKkms, setSubjectKkms] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true

    void Promise.all([getAcademicPeriods(), getSubjects()])
      .then(async ([periods, loadedSubjects]) => {
        const activePeriod = getActiveAcademicPeriod(periods)
        if (!active) return
        const activeSubjects = loadedSubjects.filter(
          (subject) => subject.is_active,
        )
        setSubjects(activeSubjects)
        setSemesterId(activePeriod.semester?.id ?? "")
        setPeriodLabel(
          activePeriod.academicYear && activePeriod.semester
            ? `${activePeriod.academicYear.name} · Semester ${activePeriod.semester.number}`
            : "",
        )
        if (!activePeriod.semester) return

        const settings = await getReportGradingSettings(
          activePeriod.semester.id,
        )
        if (!active) return
        const loadedMode =
          (settings.setting?.kkm_mode as KkmMode | undefined) ?? "single"
        setMode(loadedMode)
        setSingleKkm(settings.setting?.single_kkm?.toString() ?? "")
        setSubjectKkms(
          Object.fromEntries(
            settings.subjectRules.map((rule) => [
              rule.subject_id,
              rule.minimum_mastery_score.toString(),
            ]),
          ),
        )
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Pengaturan rapor belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))

    return () => {
      active = false
    }
  }, [revision])

  function reloadSettings() {
    setError("")
    setIsLoading(true)
    setRevision((current) => current + 1)
  }

  const completedSubjectCount = subjects.filter((subject) => {
    const value = Number(subjectKkms[subject.id])
    return Number.isInteger(value) && value >= 1 && value <= 100
  }).length

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)
    try {
      if (!semesterId) throw new Error("Semester aktif belum dipilih.")
      if (mode === "multi" && subjects.length === 0) {
        throw new Error("Tambahkan mata pelajaran aktif terlebih dahulu.")
      }
      await saveReportGradingSettings(userId, {
        semesterId,
        mode,
        singleKkm: singleKkm ? Number(singleKkm) : null,
        subjectKkms:
          mode === "multi"
            ? subjects.map((subject) => ({
                subjectId: subject.id,
                minimumMasteryScore: Number(subjectKkms[subject.id]),
              }))
            : [],
      })
      setSuccess("Pengaturan rapor berhasil disimpan.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Pengaturan rapor belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch {
      setError("Belum dapat keluar. Periksa koneksi internet lalu coba lagi.")
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            aria-label="Kembali ke Dashboard"
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <AppLogo className="size-10 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">RaporKu</p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Identitas sekolah"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold">{userName}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Admin</p>
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-semibold disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
              Konfigurasi Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Pengaturan Rapor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
              Atur KKM semester aktif dari satu tempat. Nilai siswa tetap diisi
              dengan angka 0 sampai 100.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_24px_rgba(66,20,23,0.05)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--rapotku-muted)]">
              Periode yang diatur
            </p>
            <p className="mt-1 font-bold">
              {periodLabel || "Belum ada semester aktif"}
            </p>
          </div>
        </section>

        {error || success ? (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand-strong)]" : "border-[#b9e3ce] bg-[#ecf8f2] text-[var(--rapotku-success)]"}`}
            role={error ? "alert" : "status"}
          >
            {error ? (
              <AlertCircle aria-hidden="true" className="shrink-0" size={19} />
            ) : (
              <CheckCircle2 aria-hidden="true" className="shrink-0" size={19} />
            )}
            <div className="flex-1">
              <p>{error || success}</p>
              {error && !isLoading ? (
                <button
                  className="mt-2 font-bold underline"
                  onClick={reloadSettings}
                  type="button"
                >
                  Muat ulang
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <section
            className="mt-6 grid min-h-80 place-items-center rounded-3xl border border-[var(--rapotku-border)] bg-white"
            role="status"
          >
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                size={30}
              />
              <p className="mt-3 font-semibold">Memuat pengaturan rapor...</p>
            </div>
          </section>
        ) : !semesterId ? (
          <section className="mt-6 rounded-3xl border border-[#f4d7a5] bg-[#fff9ed] p-6 text-center">
            <Settings className="mx-auto text-[#9a5a00]" size={34} />
            <h2 className="mt-4 text-xl font-bold">
              Semester aktif belum dipilih
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--rapotku-muted)]">
              Pilih tahun ajaran dan semester sebelum mengatur KKM rapor.
            </p>
            <button
              className="mt-5 min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
              onClick={onOpenAcademicPeriods}
              type="button"
            >
              Atur Tahun & Semester
            </button>
          </section>
        ) : (
          <form
            className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_12px_32px_rgba(66,20,23,0.05)] sm:p-6">
              <div>
                <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
                  Aturan nilai
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Pilih cara penggunaan KKM
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
                  KKM yang sama dipakai untuk Pengetahuan dan Keterampilan.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [
                      "single",
                      "Single KKM",
                      "Satu angka untuk semua mata pelajaran.",
                    ],
                    [
                      "multi",
                      "Multi KKM",
                      "Angka dapat berbeda pada setiap mata pelajaran.",
                    ],
                  ] as const
                ).map(([value, label, description]) => (
                  <button
                    aria-pressed={mode === value}
                    className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${mode === value ? "border-[var(--rapotku-brand)] bg-[var(--rapotku-brand-soft)] shadow-[0_8px_20px_rgba(201,29,36,0.08)]" : "border-[var(--rapotku-border)] bg-white"}`}
                    key={value}
                    onClick={() => {
                      setMode(value)
                      setError("")
                      setSuccess("")
                    }}
                    type="button"
                  >
                    <span className="font-bold">{label}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--rapotku-muted)]">
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              {mode === "single" ? (
                <div className="mt-6 rounded-2xl bg-[#f8f9fb] p-4 sm:p-5">
                  <label className="block max-w-xs text-sm font-semibold">
                    KKM semua mata pelajaran
                    <input
                      aria-label="KKM semua mata pelajaran"
                      className={`${kkmInputClass} mt-2`}
                      inputMode="numeric"
                      max={100}
                      min={1}
                      onChange={(event) => setSingleKkm(event.target.value)}
                      placeholder="Contoh: 70"
                      type="number"
                      value={singleKkm}
                    />
                  </label>
                  <div className="mt-5">
                    <PredicatePreview value={singleKkm} />
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold">KKM per mata pelajaran</h3>
                    <span className="text-sm font-semibold text-[var(--rapotku-muted)]">
                      {completedSubjectCount} dari {subjects.length} lengkap
                    </span>
                  </div>
                  {subjects.length ? (
                    <div className="mt-3 grid gap-3">
                      {subjects.map((subject) => (
                        <label
                          className="grid gap-3 rounded-2xl border border-[var(--rapotku-border)] p-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center"
                          key={subject.id}
                        >
                          <span>
                            <span className="block font-bold">
                              {subject.name}
                            </span>
                            <span className="mt-1 block text-xs text-[var(--rapotku-muted)]">
                              {subject.code || "Tanpa kode mata pelajaran"}
                            </span>
                          </span>
                          <span>
                            <span className="sr-only">KKM {subject.name}</span>
                            <input
                              aria-label={`KKM ${subject.name}`}
                              className={kkmInputClass}
                              inputMode="numeric"
                              max={100}
                              min={1}
                              onChange={(event) =>
                                setSubjectKkms((current) => ({
                                  ...current,
                                  [subject.id]: event.target.value,
                                }))
                              }
                              placeholder="1 - 100"
                              type="number"
                              value={subjectKkms[subject.id] ?? ""}
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-2xl bg-[#fff9ed] p-4 text-sm text-[#7a4a00]">
                      Belum ada mata pelajaran aktif. Tambahkan mata pelajaran
                      terlebih dahulu.
                    </p>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5">
                <FileText className="text-[var(--rapotku-brand)]" size={25} />
                <h2 className="mt-3 text-lg font-bold">Format cetak MVP</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--rapotku-muted)]">Rapor siswa</dt>
                    <dd className="font-bold">A4 Portrait</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--rapotku-muted)]">Leger kelas</dt>
                    <dd className="font-bold">A4 Landscape</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--rapotku-muted)]">Nilai input</dt>
                    <dd className="font-bold">0 - 100</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--rapotku-muted)]">Hasil cetak</dt>
                    <dd className="font-bold">A, B, C, D</dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-xl bg-[#f8f9fb] p-3 text-xs leading-5 text-[var(--rapotku-muted)]">
                  Format ini mengikuti keputusan yang sudah disetujui dan tidak
                  mengubah data nilai guru.
                </p>
              </section>
              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_10px_24px_rgba(201,29,36,0.2)] transition active:scale-[0.98] disabled:opacity-60"
                disabled={
                  isSaving || (mode === "multi" && subjects.length === 0)
                }
                type="submit"
              >
                {isSaving ? (
                  <LoaderCircle className="animate-spin" size={19} />
                ) : (
                  <Save aria-hidden="true" size={19} />
                )}
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </aside>
          </form>
        )}
      </main>
    </div>
  )
}
