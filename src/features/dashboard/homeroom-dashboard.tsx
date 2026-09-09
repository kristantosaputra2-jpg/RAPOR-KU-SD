import { useEffect, useState } from "react"
import {
  Award,
  BookHeart,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { MotionHeroImage } from "@/components/motion-hero-image"

import {
  getHomeroomDashboardData,
  type HomeroomDashboardData,
} from "./homeroom-dashboard.service"

type HomeroomAction =
  | "attendance"
  | "extracurriculars"
  | "achievements"
  | "homeroom-notes"
  | "report-completeness"
  | "leger"
  | "reports"

type Props = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onLogout: () => Promise<void>
  onOpenAttendance: () => void
  onOpenExtracurriculars: () => void
  onOpenAchievements: () => void
  onOpenHomeroomNotes: () => void
  onOpenReportCompleteness: () => void
  onOpenLeger: () => void
  onOpenReports: () => void
}>

type WorkItem = Readonly<{
  label: string
  description: string
  icon: LucideIcon
  action: HomeroomAction
}>

const workItems: ReadonlyArray<WorkItem> = [
  {
    label: "Pantau Kelengkapan",
    description: "Lihat bagian rapor yang masih perlu dilengkapi.",
    icon: ClipboardCheck,
    action: "report-completeness",
  },
  {
    label: "Absensi",
    description: "Isi sakit, izin, dan tanpa keterangan.",
    icon: CalendarCheck,
    action: "attendance",
  },
  {
    label: "Ekstrakurikuler",
    description: "Catat kegiatan dan capaian setiap siswa.",
    icon: GraduationCap,
    action: "extracurriculars",
  },
  {
    label: "Prestasi",
    description: "Tambahkan prestasi siswa pada semester aktif.",
    icon: Award,
    action: "achievements",
  },
  {
    label: "Catatan Wali Kelas",
    description: "Tulis pesan perkembangan untuk setiap siswa.",
    icon: BookHeart,
    action: "homeroom-notes",
  },
  {
    label: "Preview dan Cetak Rapor",
    description: "Periksa hasil akhir sebelum rapor dicetak.",
    icon: FileText,
    action: "reports",
  },
  {
    label: "Leger Kelas",
    description: "Lihat, cetak, atau ekspor ringkasan nilai kelas.",
    icon: ClipboardList,
    action: "leger",
  },
]

const emptyDashboard: HomeroomDashboardData = {
  academicYear: null,
  semester: null,
  classes: [],
  studentCount: 0,
}

export function HomeroomDashboard({
  userId,
  userName,
  schoolName,
  onLogout,
  onOpenAttendance,
  onOpenExtracurriculars,
  onOpenAchievements,
  onOpenHomeroomNotes,
  onOpenReportCompleteness,
  onOpenLeger,
  onOpenReports,
}: Props) {
  const [data, setData] = useState(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [revision, setRevision] = useState(0)

  const actions: Record<HomeroomAction, () => void> = {
    attendance: onOpenAttendance,
    extracurriculars: onOpenExtracurriculars,
    achievements: onOpenAchievements,
    "homeroom-notes": onOpenHomeroomNotes,
    "report-completeness": onOpenReportCompleteness,
    leger: onOpenLeger,
    reports: onOpenReports,
  }

  useEffect(() => {
    let active = true
    void getHomeroomDashboardData(userId)
      .then((result) => active && setData(result))
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Dashboard belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [revision, userId])

  async function handleLogout() {
    setIsLoggingOut(true)
    setError("")
    try {
      await onLogout()
    } catch {
      setError("Belum dapat keluar. Periksa koneksi internet lalu coba lagi.")
      setIsLoggingOut(false)
    }
  }

  function openAction(action: HomeroomAction) {
    setIsMenuOpen(false)
    actions[action]()
  }

  const navigation = (
    <nav className="mt-6 grid gap-2" aria-label="Menu Wali Kelas">
      <button
        className="flex min-h-12 items-center gap-3 rounded-xl bg-[var(--rapotku-brand-soft)] px-3 text-left font-bold text-[var(--rapotku-brand)]"
        type="button"
      >
        <LayoutDashboard aria-hidden="true" size={19} />
        Dashboard
      </button>
      {workItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            className="app-nav-item flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-semibold text-[var(--rapotku-muted)]"
            key={item.action}
            onClick={() => openAction(item.action)}
            type="button"
          >
            <Icon aria-hidden="true" size={19} />
            <span className="app-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="app-sidebar hidden max-h-screen flex-col overflow-hidden border-r border-[var(--rapotku-border)] bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div>
          <p className="text-xl font-extrabold text-[var(--rapotku-brand)]">
            RapotKu
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--rapotku-muted)]">
            {schoolName ?? "Identitas sekolah"}
          </p>
        </div>
        <div className="app-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          {navigation}
        </div>
        <button
          className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white font-bold"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--rapotku-border)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div>
            <p className="font-extrabold text-[var(--rapotku-brand)] lg:hidden">
              RapotKu
            </p>
            <p className="hidden text-sm text-[var(--rapotku-muted)] lg:block">
              Ruang kerja Wali Kelas
            </p>
          </div>
          <button
            aria-expanded={isMenuOpen}
            aria-label="Buka menu"
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white lg:hidden"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={21} />
          </button>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-sm font-bold text-[var(--rapotku-brand)]">
              {userName.trim().charAt(0).toUpperCase() || "W"}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">{userName}</p>
              <p className="text-xs text-[var(--rapotku-muted)]">Wali Kelas</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {error ? (
            <div
              className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
              role="alert"
            >
              <span>{error}</span>
              <button
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3 font-bold"
                onClick={() => {
                  setError("")
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

          <section className="dashboard-motion-hero relative overflow-hidden rounded-3xl bg-[var(--rapotku-brand-strong)] text-white shadow-[0_16px_40px_rgba(130,18,23,0.16)]">
            <MotionHeroImage
              className="w-full sm:absolute sm:inset-0 sm:size-full"
              imageClassName="h-auto w-full sm:size-full sm:object-cover sm:object-center"
              alt="Ilustrasi siswa sekolah dasar di halaman sekolah"
            />
            <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(72,7,11,0.94)_0%,rgba(101,10,15,0.76)_48%,rgba(94,8,13,0.08)_100%)] sm:block" />
            <div className="relative bg-[linear-gradient(135deg,#9f151b_0%,#c91d24_100%)] p-5 sm:flex sm:min-h-64 sm:max-w-[62%] sm:flex-col sm:justify-center sm:bg-none sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                {schoolName
                  ? `RapotKu - ${schoolName}`
                  : "Dashboard Wali Kelas"}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Selamat datang, {userName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                Pantau kelas, lengkapi data siswa, lalu periksa rapor sebelum
                dicetak.
              </p>
            </div>
          </section>

          <section className="relative z-10 mx-2 -mt-5 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(112,43,48,0.12)] backdrop-blur-md sm:mx-5 sm:-mt-8">
            <h2 className="sr-only">Ringkasan kelas</h2>
            {isLoading ? (
              <div className="grid min-h-28 place-items-center" role="status">
                <p className="font-semibold text-[var(--rapotku-muted)]">
                  Memuat kelas Anda...
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--rapotku-muted)]">
                        Kelas Anda
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {data.classes.length
                          ? data.classes.map((item) => item.name).join(", ")
                          : "Belum ditugaskan"}
                      </p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                      <GraduationCap aria-hidden="true" size={20} />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--rapotku-muted)]">
                    {data.academicYear && data.semester
                      ? `${data.academicYear}, Semester ${data.semester}`
                      : "Periode aktif belum tersedia"}
                  </p>
                </article>
                <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--rapotku-muted)]">
                        Siswa aktif
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums">
                        {data.studentCount}
                      </p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-xl bg-[#fff5e6] text-[#8a5900]">
                      <Users aria-hidden="true" size={20} />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--rapotku-muted)]">
                    Berdasarkan kelas pada semester aktif
                  </p>
                </article>
              </div>
            )}
          </section>

          {!isLoading && data.classes.length === 0 ? (
            <section className="mt-7 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-6 text-center sm:p-8">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                <GraduationCap aria-hidden="true" size={25} />
              </span>
              <h2 className="mt-4 text-lg font-bold">Kelas belum ditugaskan</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--rapotku-muted)]">
                Hubungi Admin agar akun Anda dihubungkan sebagai wali kelas pada
                semester aktif.
              </p>
            </section>
          ) : null}

          <section className="mt-8" aria-labelledby="homeroom-work-title">
            <div>
              <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
                Pekerjaan utama
              </p>
              <h2
                id="homeroom-work-title"
                className="mt-1 text-xl font-bold sm:text-2xl"
              >
                Selesaikan rapor dalam urutan yang mudah
              </h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    className={`app-interactive-card group min-h-36 rounded-2xl border border-[var(--rapotku-border)] bg-white p-5 text-left shadow-[0_8px_24px_rgba(24,31,45,0.04)] ${index === 0 ? "md:col-span-2 xl:col-span-1" : ""}`}
                    key={item.action}
                    onClick={() => openAction(item.action)}
                    type="button"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)] transition group-hover:-translate-y-0.5">
                      <Icon aria-hidden="true" size={21} />
                    </span>
                    <span className="mt-4 block font-bold">{item.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--rapotku-muted)]">
                      {item.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section
            className="mt-8 rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 sm:p-6"
            aria-labelledby="workflow-title"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                <Sparkles aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 id="workflow-title" className="text-lg font-bold">
                  Urutan kerja yang disarankan
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                  Pantau kelengkapan, isi bagian yang kurang, preview rapor,
                  lalu cetak jika status sudah siap.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#1d222b]/45"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          />
          <aside
            className="app-mobile-menu relative flex h-full w-[min(88vw,320px)] flex-col overflow-hidden bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-[var(--rapotku-brand)]">
                  RapotKu
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--rapotku-muted)]">
                  Menu Wali Kelas
                </p>
              </div>
              <button
                aria-label="Tutup menu"
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                onClick={() => setIsMenuOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="app-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              {navigation}
            </div>
            <button
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white font-bold"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
