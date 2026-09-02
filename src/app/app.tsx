import { useEffect, useState } from "react"

import {
  getCurrentAuthenticatedUser,
  signInWithPassword,
  signOut,
  type AuthenticatedUser,
  type LoginCredentials,
} from "@/features/auth/auth.service"
import { LoginPage } from "@/features/auth/login-page"
import { USER_ROLE_LABELS } from "@/features/auth/auth.types"
import { AcademicPeriodsPage } from "@/features/academic-periods/academic-periods-page"
import { AdminDashboard } from "@/features/dashboard/admin-dashboard"
import {
  getPublicSchoolIdentity,
  type SchoolIdentity,
} from "@/features/schools/school-identity.service"
import { SchoolSettingsPage } from "@/features/schools/school-settings-page"
import { TeacherPage } from "@/features/teachers/teacher-page"

type AppState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; account: AuthenticatedUser }

export function App() {
  const [appState, setAppState] = useState<AppState>({ status: "loading" })
  const [adminView, setAdminView] = useState<
    "dashboard" | "school-settings" | "academic-periods" | "teachers"
  >("dashboard")
  const [schoolIdentity, setSchoolIdentity] = useState<SchoolIdentity | null>(
    null,
  )

  useEffect(() => {
    let isMounted = true

    void getCurrentAuthenticatedUser()
      .then((account) => {
        if (isMounted) {
          setAppState(
            account
              ? { status: "signed_in", account }
              : { status: "signed_out" },
          )
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppState({ status: "signed_out" })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void getPublicSchoolIdentity()
      .then((identity) => {
        if (isMounted) {
          setSchoolIdentity(identity)
        }
      })
      .catch(() => {
        // Authentication stays usable when public branding cannot be loaded.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    document.title = schoolIdentity
      ? `RapotKu - ${schoolIdentity.schoolName}`
      : "RapotKu"
  }, [schoolIdentity])

  async function handleLogin(credentials: LoginCredentials) {
    const account = await signInWithPassword(credentials)
    setAppState({ status: "signed_in", account })
  }

  async function handleLogout() {
    await signOut()
    setAdminView("dashboard")
    setAppState({ status: "signed_out" })
  }

  if (appState.status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--rapotku-canvas)] p-6">
        <div className="text-center" role="status" aria-live="polite">
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-4 border-[var(--rapotku-brand-soft)] border-t-[var(--rapotku-brand)]" />
          <p className="font-medium text-[var(--rapotku-text)]">
            Menyiapkan aplikasi...
          </p>
        </div>
      </main>
    )
  }

  if (appState.status === "signed_out") {
    return (
      <LoginPage
        schoolName={schoolIdentity?.schoolName}
        onLogin={handleLogin}
      />
    )
  }

  const { profile } = appState.account

  if (profile.role === "admin") {
    if (adminView === "teachers") {
      return (
        <TeacherPage
          userId={appState.account.user.id}
          userName={profile.full_name}
          schoolName={schoolIdentity?.schoolName}
          onBack={() => setAdminView("dashboard")}
          onLogout={handleLogout}
        />
      )
    }

    if (adminView === "academic-periods") {
      return (
        <AcademicPeriodsPage
          userId={appState.account.user.id}
          userName={profile.full_name}
          schoolName={schoolIdentity?.schoolName}
          onBack={() => setAdminView("dashboard")}
          onLogout={handleLogout}
        />
      )
    }

    if (adminView === "school-settings") {
      return (
        <SchoolSettingsPage
          userId={appState.account.user.id}
          userName={profile.full_name}
          schoolName={schoolIdentity?.schoolName}
          onBack={() => setAdminView("dashboard")}
          onLogout={handleLogout}
          onSchoolNameChange={(schoolName) =>
            setSchoolIdentity((current) => ({
              schoolName,
              logoUrl: current?.logoUrl ?? null,
            }))
          }
        />
      )
    }

    return (
      <AdminDashboard
        userName={profile.full_name}
        schoolName={schoolIdentity?.schoolName}
        onLogout={handleLogout}
        onOpenSchoolSettings={() => setAdminView("school-settings")}
        onOpenAcademicPeriods={() => setAdminView("academic-periods")}
        onOpenTeachers={() => setAdminView("teachers")}
      />
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--rapotku-canvas)] p-4 text-[var(--rapotku-text)]">
      <section className="w-full max-w-lg rounded-3xl border border-[var(--rapotku-border)] bg-white p-6 shadow-[0_24px_64px_rgba(66,20,23,0.09)] sm:p-8">
        {schoolIdentity ? (
          <p className="mb-4 text-sm font-bold text-[var(--rapotku-muted)]">
            RapotKu - {schoolIdentity.schoolName}
          </p>
        ) : null}
        <p className="mb-2 text-sm font-semibold text-[var(--rapotku-brand)]">
          Berhasil masuk
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Selamat datang, {profile.full_name}
        </h1>
        <p className="mt-3 text-[var(--rapotku-muted)]">
          Anda masuk sebagai {USER_ROLE_LABELS[profile.role]}. Dashboard untuk
          peran Anda akan dibangun pada tahap berikutnya.
        </p>
        <button
          className="mt-8 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 font-semibold transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
          type="button"
          onClick={() => void handleLogout()}
        >
          Keluar
        </button>
      </section>
    </main>
  )
}
