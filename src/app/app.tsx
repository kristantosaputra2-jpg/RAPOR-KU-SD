import { lazy, Suspense, useEffect, useState } from "react"

import {
  getCurrentAuthenticatedUser,
  signInWithPassword,
  signOut,
  type AuthenticatedUser,
  type LoginCredentials,
} from "@/features/auth/auth.service"
import { LoginPage } from "@/features/auth/login-page"
import { USER_ROLE_LABELS } from "@/features/auth/auth.types"
import { AdminDashboard } from "@/features/dashboard/admin-dashboard"
import {
  getPublicSchoolIdentity,
  type SchoolIdentity,
} from "@/features/schools/school-identity.service"

const AcademicPeriodsPage = lazy(() =>
  import("@/features/academic-periods/academic-periods-page").then(
    (module) => ({
      default: module.AcademicPeriodsPage,
    }),
  ),
)
const ClassPage = lazy(() =>
  import("@/features/classes/class-page").then((module) => ({
    default: module.ClassPage,
  })),
)
const SchoolSettingsPage = lazy(() =>
  import("@/features/schools/school-settings-page").then((module) => ({
    default: module.SchoolSettingsPage,
  })),
)
const TeacherPage = lazy(() =>
  import("@/features/teachers/teacher-page").then((module) => ({
    default: module.TeacherPage,
  })),
)
const StudentPage = lazy(() =>
  import("@/features/students/student-page").then((module) => ({
    default: module.StudentPage,
  })),
)
const SubjectPage = lazy(() =>
  import("@/features/subjects/subject-page").then((module) => ({
    default: module.SubjectPage,
  })),
)
const AssignmentPage = lazy(() =>
  import("@/features/assignments/assignment-page").then((module) => ({
    default: module.AssignmentPage,
  })),
)
const LearningOutcomePage = lazy(() =>
  import("@/features/learning-outcomes/learning-outcome-page").then(
    (module) => ({ default: module.LearningOutcomePage }),
  ),
)
const GradeEntryPage = lazy(() =>
  import("@/features/grades/grade-entry-page").then((module) => ({
    default: module.GradeEntryPage,
  })),
)
const AttendancePage = lazy(() =>
  import("@/features/attendance/attendance-page").then((module) => ({
    default: module.AttendancePage,
  })),
)
const ExtracurricularPage = lazy(() =>
  import("@/features/extracurriculars/extracurricular-page").then((module) => ({
    default: module.ExtracurricularPage,
  })),
)
const AchievementPage = lazy(() =>
  import("@/features/achievements/achievement-page").then((module) => ({
    default: module.AchievementPage,
  })),
)
const HomeroomNotePage = lazy(() =>
  import("@/features/homeroom-notes/homeroom-note-page").then((module) => ({
    default: module.HomeroomNotePage,
  })),
)
const ReportCompletenessPage = lazy(() =>
  import("@/features/report-status/report-completeness-page").then(
    (module) => ({ default: module.ReportCompletenessPage }),
  ),
)
const ReportPreviewPage = lazy(() =>
  import("@/features/reports/report-preview-page").then((module) => ({
    default: module.ReportPreviewPage,
  })),
)
const LegerPage = lazy(() =>
  import("@/features/leger/leger-page").then((module) => ({
    default: module.LegerPage,
  })),
)
const HomeroomDashboard = lazy(() =>
  import("@/features/dashboard/homeroom-dashboard").then((module) => ({
    default: module.HomeroomDashboard,
  })),
)

type AppState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; account: AuthenticatedUser }

function PageLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--rapotku-canvas)] p-6">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-4 border-[var(--rapotku-brand-soft)] border-t-[var(--rapotku-brand)]" />
        <p className="font-medium text-[var(--rapotku-text)]">
          Membuka halaman...
        </p>
      </div>
    </main>
  )
}

export function App() {
  const [appState, setAppState] = useState<AppState>({ status: "loading" })
  const [adminView, setAdminView] = useState<
    | "dashboard"
    | "school-settings"
    | "academic-periods"
    | "teachers"
    | "classes"
    | "students"
    | "subjects"
    | "assignments"
    | "learning-outcomes"
    | "grades"
    | "attendance"
    | "extracurriculars"
    | "achievements"
    | "homeroom-notes"
    | "report-completeness"
    | "leger"
    | "reports"
  >("dashboard")
  const [homeroomView, setHomeroomView] = useState<
    | "dashboard"
    | "attendance"
    | "extracurriculars"
    | "achievements"
    | "homeroom-notes"
    | "report-completeness"
    | "leger"
    | "reports"
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
    setHomeroomView("dashboard")
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
    if (adminView === "leger") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <LegerPage
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "reports") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ReportPreviewPage
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "report-completeness") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ReportCompletenessPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "homeroom-notes") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <HomeroomNotePage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "achievements") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AchievementPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "extracurriculars") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ExtracurricularPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            userRole={profile.role}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "attendance") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AttendancePage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "grades") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <GradeEntryPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            userRole={profile.role}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "learning-outcomes") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <LearningOutcomePage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "assignments") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AssignmentPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "subjects") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <SubjectPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "students") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <StudentPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
            onOpenAcademicPeriods={() => setAdminView("academic-periods")}
          />
        </Suspense>
      )
    }

    if (adminView === "classes") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ClassPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
            onOpenAcademicPeriods={() => setAdminView("academic-periods")}
          />
        </Suspense>
      )
    }

    if (adminView === "teachers") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <TeacherPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "academic-periods") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AcademicPeriodsPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setAdminView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (adminView === "school-settings") {
      return (
        <Suspense fallback={<PageLoadingState />}>
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
        </Suspense>
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
        onOpenClasses={() => setAdminView("classes")}
        onOpenStudents={() => setAdminView("students")}
        onOpenSubjects={() => setAdminView("subjects")}
        onOpenAssignments={() => setAdminView("assignments")}
        onOpenLearningOutcomes={() => setAdminView("learning-outcomes")}
        onOpenGrades={() => setAdminView("grades")}
        onOpenAttendance={() => setAdminView("attendance")}
        onOpenExtracurriculars={() => setAdminView("extracurriculars")}
        onOpenAchievements={() => setAdminView("achievements")}
        onOpenHomeroomNotes={() => setAdminView("homeroom-notes")}
        onOpenReportCompleteness={() => setAdminView("report-completeness")}
        onOpenLeger={() => setAdminView("leger")}
        onOpenReports={() => setAdminView("reports")}
      />
    )
  }

  if (profile.role === "subject_teacher") {
    return (
      <Suspense fallback={<PageLoadingState />}>
        <GradeEntryPage
          userId={appState.account.user.id}
          userName={profile.full_name}
          userRole={profile.role}
          schoolName={schoolIdentity?.schoolName}
          onLogout={handleLogout}
        />
      </Suspense>
    )
  }

  if (profile.role === "homeroom_teacher") {
    if (homeroomView === "attendance") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AttendancePage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "extracurriculars") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ExtracurricularPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            userRole={profile.role}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "achievements") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <AchievementPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "homeroom-notes") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <HomeroomNotePage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "report-completeness") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ReportCompletenessPage
            userId={appState.account.user.id}
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "leger") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <LegerPage
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    if (homeroomView === "reports") {
      return (
        <Suspense fallback={<PageLoadingState />}>
          <ReportPreviewPage
            userName={profile.full_name}
            schoolName={schoolIdentity?.schoolName}
            onBack={() => setHomeroomView("dashboard")}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    }

    return (
      <Suspense fallback={<PageLoadingState />}>
        <HomeroomDashboard
          userId={appState.account.user.id}
          userName={profile.full_name}
          schoolName={schoolIdentity?.schoolName}
          onLogout={handleLogout}
          onOpenAttendance={() => setHomeroomView("attendance")}
          onOpenExtracurriculars={() => setHomeroomView("extracurriculars")}
          onOpenAchievements={() => setHomeroomView("achievements")}
          onOpenHomeroomNotes={() => setHomeroomView("homeroom-notes")}
          onOpenReportCompleteness={() =>
            setHomeroomView("report-completeness")
          }
          onOpenLeger={() => setHomeroomView("leger")}
          onOpenReports={() => setHomeroomView("reports")}
        />
      </Suspense>
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
