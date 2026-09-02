import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Circle,
  LoaderCircle,
  LogOut,
  Plus,
} from "lucide-react"

import {
  activateAcademicYear,
  activateSemester,
  createAcademicYear,
  createSemester,
  getAcademicPeriods,
  getActiveAcademicPeriod,
  type AcademicPeriods,
  type SemesterNumber,
} from "@/features/academic-periods/academic-periods.service"

type AcademicPeriodsPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const emptyPeriods: AcademicPeriods = {
  schoolId: null,
  academicYears: [],
  semesters: [],
}

const semesterNumbers: ReadonlyArray<SemesterNumber> = [1, 2]

export function AcademicPeriodsPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
}: AcademicPeriodsPageProps) {
  const [periods, setPeriods] = useState<AcademicPeriods>(emptyPeriods)
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("")
  const [academicYearName, setAcademicYearName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [actionError, setActionError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [activeAction, setActiveAction] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    void getAcademicPeriods()
      .then((loadedPeriods) => {
        if (!isMounted) {
          return
        }

        setPeriods(loadedPeriods)
        setSelectedAcademicYearId((current) => {
          if (
            current &&
            loadedPeriods.academicYears.some((year) => year.id === current)
          ) {
            return current
          }

          return (
            loadedPeriods.academicYears.find((year) => year.is_active)?.id ??
            loadedPeriods.academicYears[0]?.id ??
            ""
          )
        })
        setIsLoading(false)
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Periode akademik belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const activePeriod = useMemo(
    () => getActiveAcademicPeriod(periods),
    [periods],
  )
  const selectedAcademicYear = periods.academicYears.find(
    (year) => year.id === selectedAcademicYearId,
  )
  const selectedSemesters = periods.semesters.filter(
    (semester) => semester.academic_year_id === selectedAcademicYearId,
  )

  function clearFeedback() {
    setActionError("")
    setSuccessMessage("")
  }

  async function refreshPeriods(preferredAcademicYearId?: string) {
    const loadedPeriods = await getAcademicPeriods()
    setPeriods(loadedPeriods)

    if (preferredAcademicYearId) {
      setSelectedAcademicYearId(preferredAcademicYearId)
    }
  }

  async function handleCreateAcademicYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearFeedback()

    if (!periods.schoolId) {
      setActionError(
        "Lengkapi Pengaturan Sekolah sebelum menambah tahun ajaran.",
      )
      return
    }

    setActiveAction("create-year")

    try {
      const academicYear = await createAcademicYear(
        userId,
        periods.schoolId,
        academicYearName,
      )
      await refreshPeriods(academicYear.id)
      setAcademicYearName("")
      setSuccessMessage(
        `Tahun ajaran ${academicYear.name} ditambahkan. Aktifkan saat siap digunakan.`,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Tahun ajaran belum dapat disimpan.",
      )
    } finally {
      setActiveAction("")
    }
  }

  async function handleActivateAcademicYear(
    academicYearId: string,
    academicYearNameValue: string,
  ) {
    clearFeedback()
    setActiveAction(`activate-year-${academicYearId}`)

    try {
      await activateAcademicYear(academicYearId)
      await refreshPeriods(academicYearId)
      setSuccessMessage(
        `${academicYearNameValue} sekarang menjadi tahun ajaran aktif. Pilih semester aktif berikutnya.`,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Tahun ajaran belum dapat diaktifkan.",
      )
    } finally {
      setActiveAction("")
    }
  }

  async function handleCreateSemester(number: SemesterNumber) {
    if (!selectedAcademicYear) {
      return
    }

    clearFeedback()
    setActiveAction(`create-semester-${number}`)

    try {
      await createSemester(userId, selectedAcademicYear.id, number)
      await refreshPeriods(selectedAcademicYear.id)
      setSuccessMessage(
        `Semester ${number} ditambahkan untuk ${selectedAcademicYear.name}.`,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : `Semester ${number} belum dapat disimpan.`,
      )
    } finally {
      setActiveAction("")
    }
  }

  async function handleActivateSemester(semesterId: string, number: number) {
    clearFeedback()
    setActiveAction(`activate-semester-${semesterId}`)

    try {
      await activateSemester(semesterId)
      await refreshPeriods(selectedAcademicYearId)
      setSuccessMessage(
        `Semester ${number} sekarang aktif. Tahun ajarannya juga disesuaikan otomatis.`,
      )
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Semester belum dapat diaktifkan.",
      )
    } finally {
      setActiveAction("")
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
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1120px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <CalendarDays aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {schoolName ? `RapotKu - ${schoolName}` : "RapotKu"}
            </p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {userName} · Admin
            </p>
          </div>
          <button
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-semibold transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:opacity-60 sm:flex"
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? "Sedang keluar..." : "Keluar"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[var(--rapotku-brand)]">
            Pengaturan akademik
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Tahun Ajaran & Semester
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
            Tambahkan periode tanpa menghapus riwayat lama, lalu pilih satu
            semester yang sedang digunakan.
          </p>
        </div>

        {logoutError ? (
          <FeedbackMessage type="error" message={logoutError} />
        ) : null}

        {isLoading ? (
          <div
            className="mt-6 flex min-h-56 items-center justify-center rounded-3xl border border-[var(--rapotku-border)] bg-white p-6"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                aria-hidden="true"
                size={32}
              />
              <p className="mt-3 font-semibold">Memuat periode akademik...</p>
            </div>
          </div>
        ) : loadError ? (
          <section
            className="mt-6 rounded-3xl border border-[#f5b7ba] bg-white p-6 text-center"
            role="alert"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <AlertCircle aria-hidden="true" size={24} />
            </span>
            <h2 className="mt-4 text-lg font-bold">Data belum dapat dimuat</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--rapotku-muted)]">
              {loadError}
            </p>
            <button
              className="mt-5 min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError("")
                setLoadAttempt((attempt) => attempt + 1)
              }}
            >
              Coba lagi
            </button>
          </section>
        ) : (
          <div className="mt-6 space-y-5">
            {actionError ? (
              <FeedbackMessage type="error" message={actionError} />
            ) : null}
            {successMessage ? (
              <FeedbackMessage type="success" message={successMessage} />
            ) : null}

            <section className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#99151a_0%,#c91d24_100%)] p-5 text-white shadow-[0_16px_40px_rgba(130,18,23,0.16)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <CalendarCheck2 aria-hidden="true" size={25} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">
                    Periode aktif
                  </p>
                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                    {activePeriod.academicYear
                      ? activePeriod.academicYear.name
                      : "Belum dipilih"}
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    {activePeriod.semester
                      ? `Semester ${activePeriod.semester.number}`
                      : activePeriod.academicYear
                        ? "Semester aktif belum dipilih"
                        : "Aktifkan tahun ajaran dan semester sebelum mengelola kelas."}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                    <CalendarDays aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">Tahun ajaran</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                      Riwayat lama tetap aman saat periode baru ditambahkan.
                    </p>
                  </div>
                </div>

                <form
                  className="mt-5 flex flex-col gap-3 sm:flex-row"
                  onSubmit={handleCreateAcademicYear}
                >
                  <div className="flex-1">
                    <label
                      className="text-sm font-bold"
                      htmlFor="academic-year"
                    >
                      Nama tahun ajaran
                    </label>
                    <input
                      className="mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] px-4 outline-none transition placeholder:text-[#a4aab4] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                      id="academic-year"
                      value={academicYearName}
                      onChange={(event) => {
                        setAcademicYearName(event.target.value)
                        clearFeedback()
                      }}
                      placeholder="Contoh: 2026/2027"
                      inputMode="numeric"
                      maxLength={9}
                      required
                    />
                  </div>
                  <button
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_18px_rgba(201,29,36,0.2)] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7"
                    type="submit"
                    disabled={Boolean(activeAction) || !periods.schoolId}
                  >
                    {activeAction === "create-year" ? (
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                        size={18}
                      />
                    ) : (
                      <Plus aria-hidden="true" size={18} />
                    )}
                    Tambah
                  </button>
                </form>

                {!periods.schoolId ? (
                  <p className="mt-4 rounded-xl bg-[#fff7e8] px-4 py-3 text-sm leading-6 text-[var(--rapotku-warning)]">
                    Pengaturan sekolah belum tersedia. Kembali ke Dashboard dan
                    isi nama sekolah terlebih dahulu.
                  </p>
                ) : null}

                <div className="mt-5 space-y-3">
                  {periods.academicYears.length ? (
                    periods.academicYears.map((academicYear) => {
                      const isSelected =
                        academicYear.id === selectedAcademicYearId
                      const isActivating =
                        activeAction === `activate-year-${academicYear.id}`

                      return (
                        <article
                          className={`rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-[var(--rapotku-brand)] bg-[var(--rapotku-brand-soft)]"
                              : "border-[var(--rapotku-border)] bg-white"
                          }`}
                          key={academicYear.id}
                        >
                          <button
                            className="flex min-h-11 w-full items-center gap-3 text-left"
                            type="button"
                            onClick={() =>
                              setSelectedAcademicYearId(academicYear.id)
                            }
                          >
                            {academicYear.is_active ? (
                              <CheckCircle2
                                className="shrink-0 text-[var(--rapotku-success)]"
                                aria-hidden="true"
                                size={21}
                              />
                            ) : (
                              <Circle
                                className="shrink-0 text-[#98a2b3]"
                                aria-hidden="true"
                                size={21}
                              />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold">
                                {academicYear.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-[var(--rapotku-muted)]">
                                {academicYear.is_active
                                  ? "Tahun ajaran aktif"
                                  : "Ketuk untuk mengatur semester"}
                              </span>
                            </span>
                          </button>
                          {!academicYear.is_active ? (
                            <button
                              className="mt-3 min-h-11 w-full rounded-xl border border-[var(--rapotku-brand)] bg-white px-4 text-sm font-bold text-[var(--rapotku-brand)] disabled:opacity-60"
                              type="button"
                              disabled={Boolean(activeAction)}
                              onClick={() =>
                                void handleActivateAcademicYear(
                                  academicYear.id,
                                  academicYear.name,
                                )
                              }
                            >
                              {isActivating
                                ? "Mengaktifkan..."
                                : "Jadikan aktif"}
                            </button>
                          ) : null}
                        </article>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d7dae0] px-5 py-8 text-center">
                      <CalendarDays
                        className="mx-auto text-[#98a2b3]"
                        aria-hidden="true"
                        size={30}
                      />
                      <p className="mt-3 font-bold">Belum ada tahun ajaran</p>
                      <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                        Tambahkan satu periode menggunakan formulir di atas.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff7e8] text-[#9a5a00]">
                    <CalendarCheck2 aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">Semester</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                      {selectedAcademicYear
                        ? `Atur semester untuk ${selectedAcademicYear.name}.`
                        : "Pilih atau tambahkan tahun ajaran terlebih dahulu."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedAcademicYear
                    ? semesterNumbers.map((number) => {
                        const semester = selectedSemesters.find(
                          (item) => item.number === number,
                        )
                        const createAction = `create-semester-${number}`
                        const activateAction = semester
                          ? `activate-semester-${semester.id}`
                          : ""

                        return (
                          <article
                            className="rounded-2xl border border-[var(--rapotku-border)] p-4"
                            key={number}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`grid size-10 shrink-0 place-items-center rounded-xl font-bold ${
                                  semester?.is_active
                                    ? "bg-[#ecf8f2] text-[var(--rapotku-success)]"
                                    : "bg-[#f2f3f5] text-[var(--rapotku-muted)]"
                                }`}
                              >
                                {number}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold">Semester {number}</h3>
                                <p className="mt-0.5 text-xs text-[var(--rapotku-muted)]">
                                  {semester
                                    ? semester.is_active
                                      ? "Sedang aktif"
                                      : "Sudah tersedia"
                                    : "Belum ditambahkan"}
                                </p>
                              </div>
                              {semester?.is_active ? (
                                <span className="rounded-full bg-[#ecf8f2] px-2.5 py-1 text-xs font-bold text-[var(--rapotku-success)]">
                                  Aktif
                                </span>
                              ) : null}
                            </div>
                            {!semester ? (
                              <button
                                className="mt-3 min-h-11 w-full rounded-xl bg-[var(--rapotku-brand)] px-4 text-sm font-bold text-white disabled:opacity-60"
                                type="button"
                                disabled={Boolean(activeAction)}
                                onClick={() =>
                                  void handleCreateSemester(number)
                                }
                              >
                                {activeAction === createAction
                                  ? "Menambahkan..."
                                  : `Tambahkan Semester ${number}`}
                              </button>
                            ) : !semester.is_active ? (
                              <button
                                className="mt-3 min-h-11 w-full rounded-xl border border-[var(--rapotku-brand)] px-4 text-sm font-bold text-[var(--rapotku-brand)] disabled:opacity-60"
                                type="button"
                                disabled={Boolean(activeAction)}
                                onClick={() =>
                                  void handleActivateSemester(
                                    semester.id,
                                    semester.number,
                                  )
                                }
                              >
                                {activeAction === activateAction
                                  ? "Mengaktifkan..."
                                  : "Jadikan semester aktif"}
                              </button>
                            ) : null}
                          </article>
                        )
                      })
                    : null}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function FeedbackMessage({
  type,
  message,
}: Readonly<{ type: "error" | "success"; message: string }>) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle

  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${
        type === "success"
          ? "border-[#b9e3ce] bg-[#ecf8f2] font-semibold text-[var(--rapotku-success)]"
          : "border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand-strong)]"
      }`}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" size={19} />
      <span>{message}</span>
    </div>
  )
}
