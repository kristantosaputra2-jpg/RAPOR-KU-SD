import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
  LoaderCircle,
  LogOut,
  Save,
  Sparkles,
  X,
} from "lucide-react"

import { getTeacherAssignments } from "@/features/assignments/assignment.service"
import type { UserRole } from "@/features/auth/auth.types"
import { getClasses } from "@/features/classes/class.service"
import {
  generateDescriptionDraft,
  type OutcomeScore,
} from "@/features/grades/description-generation"
import {
  getReportDescriptions,
  saveReportDescription,
  type ReportDescription,
} from "@/features/grades/description.service"
import {
  calculateFinalGrade,
  calculatePredicate,
  calculatePredicateRanges,
} from "@/features/grades/grade-calculation"
import {
  getGradeEntries,
  getGradingRule,
  parseScoreInput,
  saveGradingRule,
  saveLearningOutcomeScores,
  type GradeEntry,
  type GradingRule,
} from "@/features/grades/grade.service"
import { getLearningOutcomes } from "@/features/learning-outcomes/learning-outcome.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import { getSubjects } from "@/features/subjects/subject.service"

type GradeEntryPageProps = Readonly<{
  userId: string
  userName: string
  userRole: UserRole
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

type References = Awaited<ReturnType<typeof loadReferences>>

async function loadReferences() {
  const [assignments, classes, subjects, outcomes, students, memberships] =
    await Promise.all([
      getTeacherAssignments(),
      getClasses(),
      getSubjects(),
      getLearningOutcomes(),
      getStudents(),
      getClassMemberships(),
    ])
  return { assignments, classes, subjects, outcomes, students, memberships }
}

const selectClassName =
  "min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"
const scoreClassName =
  "min-h-12 w-24 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-center text-base font-bold focus:border-[var(--rapotku-brand)] focus:outline-none"

export function GradeEntryPage({
  userId,
  userName,
  userRole,
  schoolName,
  onBack,
  onLogout,
}: GradeEntryPageProps) {
  const [references, setReferences] = useState<References | null>(null)
  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [outcomeId, setOutcomeId] = useState("")
  const [entries, setEntries] = useState<ReadonlyArray<GradeEntry>>([])
  const [descriptions, setDescriptions] = useState<
    ReadonlyArray<ReportDescription>
  >([])
  const [rule, setRule] = useState<GradingRule | null>(null)
  const [kkmDraft, setKkmDraft] = useState("")
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [generatedDraft, setGeneratedDraft] = useState("")
  const [finalDraft, setFinalDraft] = useState("")
  const [strongestOutcomeId, setStrongestOutcomeId] = useState("")
  const [weakestOutcomeId, setWeakestOutcomeId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void loadReferences()
      .then((data) => {
        if (!mounted) return
        setReferences(data)
        const firstAssignment = data.assignments.find(
          (assignment) =>
            assignment.is_active &&
            data.classes.some(
              (item) =>
                item.id === assignment.class_id && item.grade_level <= 3,
            ),
        )
        if (firstAssignment) {
          setClassId(firstAssignment.class_id)
          setSubjectId(firstAssignment.subject_id)
        }
      })
      .catch(() => setError("Data input nilai belum dapat dimuat. Coba lagi."))
      .finally(() => setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const selectedClass = references?.classes.find((item) => item.id === classId)
  const classOptions = useMemo(() => {
    if (!references) return []
    const assignedIds = new Set(
      references.assignments
        .filter((item) => item.is_active)
        .map((item) => item.class_id),
    )
    return references.classes.filter(
      (item) => item.grade_level <= 3 && assignedIds.has(item.id),
    )
  }, [references])
  const subjectOptions = useMemo(() => {
    if (!references || !classId) return []
    const assignedIds = new Set(
      references.assignments
        .filter((item) => item.is_active && item.class_id === classId)
        .map((item) => item.subject_id),
    )
    return references.subjects.filter(
      (item) => item.is_active && assignedIds.has(item.id),
    )
  }, [classId, references])
  const outcomeOptions = useMemo(() => {
    if (!references || !selectedClass || !subjectId) return []
    return references.outcomes.filter(
      (item) =>
        item.is_active &&
        item.subject_id === subjectId &&
        item.semester_id === selectedClass.semester_id &&
        item.grade_level === selectedClass.grade_level,
    )
  }, [references, selectedClass, subjectId])
  const students = useMemo(() => {
    if (!references || !selectedClass) return []
    const studentIds = new Set(
      references.memberships
        .filter(
          (item) =>
            item.class_id === selectedClass.id &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return references.students.filter(
      (item) => item.is_active && studentIds.has(item.id),
    )
  }, [references, selectedClass])

  const activeOutcomeId = outcomeOptions.some((item) => item.id === outcomeId)
    ? outcomeId
    : (outcomeOptions[0]?.id ?? "")

  useEffect(() => {
    if (!selectedClass || !subjectId) {
      return
    }
    let mounted = true
    const scope = {
      classId: selectedClass.id,
      subjectId,
      semesterId: selectedClass.semester_id,
    }
    void Promise.all([
      getGradeEntries(scope),
      getGradingRule(scope),
      getReportDescriptions(scope),
    ])
      .then(([gradeEntries, gradingRule, reportDescriptions]) => {
        if (!mounted) return
        setEntries(gradeEntries)
        setRule(gradingRule)
        setDescriptions(reportDescriptions)
        setKkmDraft(gradingRule?.minimum_mastery_score.toString() ?? "")
        const next: Record<string, string> = {}
        students.forEach((student) => {
          const entry = gradeEntries.find(
            (item) =>
              item.student_id === student.id &&
              item.learning_outcome_id === activeOutcomeId,
          )
          next[student.id] = entry?.score.toString() ?? ""
        })
        setScoreDrafts(next)
      })
      .catch(() => setError("Nilai atau KKM belum dapat dimuat. Coba lagi."))
      .finally(() => mounted && setIsLoadingGrades(false))
    return () => {
      mounted = false
    }
  }, [activeOutcomeId, selectedClass, students, subjectId])

  function summaryForStudent(studentId: string) {
    const otherScores = entries
      .filter(
        (item) =>
          item.student_id === studentId &&
          item.learning_outcome_id !== activeOutcomeId,
      )
      .map((item) => item.score)
    try {
      const current = parseScoreInput(scoreDrafts[studentId] ?? "")
      const finalGrade = calculateFinalGrade(
        current === null ? otherScores : [...otherScores, current],
      )
      const predicate =
        finalGrade !== null && rule
          ? calculatePredicate(finalGrade, rule.minimum_mastery_score)
          : null
      return { finalGrade, predicate }
    } catch {
      return { finalGrade: null, predicate: null }
    }
  }

  async function handleSaveKkm() {
    if (!selectedClass || !subjectId) return
    setError("")
    setMessage("")
    setIsSaving(true)
    try {
      const saved = await saveGradingRule(
        userId,
        {
          classId: selectedClass.id,
          subjectId,
          semesterId: selectedClass.semester_id,
        },
        Number(kkmDraft),
      )
      setRule(saved)
      setMessage("KKM tersimpan.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "KKM belum tersimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveScores() {
    if (!selectedClass || !subjectId || !activeOutcomeId) return
    setError("")
    setMessage("")
    setIsSaving(true)
    try {
      const scores = students.map((student) => ({
        studentId: student.id,
        score: parseScoreInput(scoreDrafts[student.id] ?? ""),
        existingEntryId: entries.find(
          (item) =>
            item.student_id === student.id &&
            item.learning_outcome_id === activeOutcomeId,
        )?.id,
      }))
      const scope = {
        classId: selectedClass.id,
        subjectId,
        semesterId: selectedClass.semester_id,
        gradeLevel: selectedClass.grade_level,
      }
      await saveLearningOutcomeScores(userId, scope, activeOutcomeId, scores)
      setEntries(await getGradeEntries(scope))
      setMessage("Nilai seluruh siswa berhasil disimpan.")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nilai belum tersimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  function outcomeScoresForStudent(studentId: string): OutcomeScore[] {
    return entries
      .filter((entry) => entry.student_id === studentId)
      .map((entry) => {
        const outcome = outcomeOptions.find(
          (item) => item.id === entry.learning_outcome_id,
        )
        return outcome
          ? {
              outcomeId: outcome.id,
              description: outcome.description,
              score: entry.score,
            }
          : null
      })
      .filter((item): item is OutcomeScore => item !== null)
  }

  function generateForStudent(studentId: string, requireConfirmation: boolean) {
    const existing = descriptions.find((item) => item.student_id === studentId)
    if (
      requireConfirmation &&
      existing &&
      existing.final_description !== existing.generated_description &&
      !window.confirm(
        "Deskripsi sudah diedit manual. Buat ulang akan mengganti isi editor. Lanjutkan?",
      )
    ) {
      return
    }
    try {
      const draft = generateDescriptionDraft(outcomeScoresForStudent(studentId))
      setGeneratedDraft(draft.text)
      setFinalDraft(draft.text)
      setStrongestOutcomeId(draft.strongestOutcomeId)
      setWeakestOutcomeId(draft.weakestOutcomeId)
      setEditingStudentId(studentId)
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Deskripsi belum dapat dibuat.",
      )
    }
  }

  function openDescription(studentId: string) {
    const existing = descriptions.find((item) => item.student_id === studentId)
    if (!existing) {
      generateForStudent(studentId, false)
      return
    }
    setGeneratedDraft(existing.generated_description)
    setFinalDraft(existing.final_description)
    setStrongestOutcomeId(existing.strongest_outcome_id ?? "")
    setWeakestOutcomeId(existing.weakest_outcome_id)
    setEditingStudentId(studentId)
  }

  async function handleSaveDescription() {
    if (
      !editingStudentId ||
      !selectedClass ||
      !subjectId ||
      !strongestOutcomeId
    )
      return
    setIsSaving(true)
    setError("")
    try {
      const saved = await saveReportDescription(userId, {
        studentId: editingStudentId,
        classId: selectedClass.id,
        subjectId,
        semesterId: selectedClass.semester_id,
        gradeLevel: selectedClass.grade_level,
        strongestOutcomeId,
        weakestOutcomeId,
        generatedDescription: generatedDraft,
        finalDescription: finalDraft,
      })
      setDescriptions((current) => [
        ...current.filter((item) => item.student_id !== editingStudentId),
        saved,
      ])
      setEditingStudentId(null)
      setMessage("Deskripsi final berhasil disimpan.")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Deskripsi belum tersimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const ranges = rule
    ? calculatePredicateRanges(rule.minimum_mastery_score)
    : []

  return (
    <div className="min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Kembali"
                onClick={onBack}
              >
                <ArrowLeft aria-hidden="true" size={20} />
              </button>
            ) : null}
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--rapotku-brand)] text-white">
              <BookOpenCheck aria-hidden="true" size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Input Nilai</p>
              <p className="truncate text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? userName}
              </p>
            </div>
          </div>
          <button
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white"
            type="button"
            aria-label="Keluar"
            onClick={() => void onLogout()}
          >
            <LogOut aria-hidden="true" size={19} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
          Kelas 1–3
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Nilai seluruh siswa
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
          Pilih kelas, mapel, dan CP. Semua siswa tetap terlihat dan dapat
          disimpan sekaligus.
        </p>

        {error ? (
          <div
            className="mt-4 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            className="mt-4 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm text-[var(--rapotku-success)]"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <section
          className="mt-6 grid gap-4 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-3"
          aria-label="Pilihan input nilai"
        >
          <label className="text-sm font-bold">
            Kelas
            <select
              className={`${selectClassName} mt-2`}
              value={classId}
              onChange={(event) => {
                setIsLoadingGrades(true)
                setClassId(event.target.value)
                setSubjectId("")
              }}
            >
              <option value="">Pilih kelas</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Kelas {item.grade_level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Mata pelajaran
            <select
              className={`${selectClassName} mt-2`}
              value={subjectId}
              onChange={(event) => {
                setIsLoadingGrades(true)
                setSubjectId(event.target.value)
              }}
              disabled={!classId}
            >
              <option value="">Pilih mapel</option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Capaian Pembelajaran
            <select
              className={`${selectClassName} mt-2`}
              value={activeOutcomeId}
              onChange={(event) => {
                const nextOutcomeId = event.target.value
                setOutcomeId(nextOutcomeId)
                const next: Record<string, string> = {}
                students.forEach((student) => {
                  const entry = entries.find(
                    (item) =>
                      item.student_id === student.id &&
                      item.learning_outcome_id === nextOutcomeId,
                  )
                  next[student.id] = entry?.score.toString() ?? ""
                })
                setScoreDrafts(next)
              }}
              disabled={!subjectId}
            >
              <option value="">Pilih CP</option>
              {outcomeOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} · ` : ""}
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-3" role="status">
            <LoaderCircle className="animate-spin" aria-hidden="true" />{" "}
            Menyiapkan data...
          </div>
        ) : classOptions.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-[var(--rapotku-border)] bg-white p-8 text-center">
            <h2 className="font-bold">Belum ada kelas yang siap dinilai</h2>
            <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
              Lengkapi kelas 1–3, siswa, mapel, penugasan guru, dan CP terlebih
              dahulu.
            </p>
          </div>
        ) : null}

        {selectedClass && subjectId ? (
          <section className="mt-5 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">KKM dan predikat</h2>
                <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                  Batas A–D dihitung otomatis dari KKM.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <label className="text-sm font-bold">
                  KKM
                  <input
                    className={`${scoreClassName} mt-2 block`}
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    value={kkmDraft}
                    disabled={userRole !== "admin"}
                    onChange={(event) => setKkmDraft(event.target.value)}
                  />
                </label>
                {userRole === "admin" ? (
                  <button
                    className="min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-60"
                    type="button"
                    disabled={isSaving || !kkmDraft}
                    onClick={() => void handleSaveKkm()}
                  >
                    Simpan KKM
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ranges.length ? (
                ranges.map((range) => (
                  <span
                    className="rounded-full bg-[#f4f5f7] px-3 py-2 text-xs font-bold"
                    key={range.predicate}
                  >
                    {range.predicate}: {range.minimum}–{range.maximum}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--rapotku-muted)]">
                  KKM belum diatur oleh Admin.
                </span>
              )}
            </div>
          </section>
        ) : null}

        {activeOutcomeId ? (
          <section className="mt-5 overflow-hidden rounded-3xl border border-[var(--rapotku-border)] bg-white">
            <div className="border-b border-[var(--rapotku-border)] p-4 sm:p-6">
              <h2 className="text-lg font-bold">Daftar siswa</h2>
              <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                Kosongkan kolom jika nilai belum tersedia.
              </p>
            </div>
            {isLoadingGrades ? (
              <div className="p-8 text-center" role="status">
                Memuat nilai...
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-bold">Belum ada siswa di kelas ini</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[var(--rapotku-border)] md:hidden">
                  {students.map((student, index) => {
                    const summary = summaryForStudent(student.id)
                    return (
                      <article className="p-4" key={student.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-[var(--rapotku-muted)]">
                              {index + 1}
                            </p>
                            <h3 className="font-bold">{student.full_name}</h3>
                            <p className="text-xs text-[var(--rapotku-muted)]">
                              NIS {student.nis}
                            </p>
                          </div>
                          <input
                            aria-label={`Nilai ${student.full_name}`}
                            className={scoreClassName}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            inputMode="decimal"
                            value={scoreDrafts[student.id] ?? ""}
                            onChange={(event) =>
                              setScoreDrafts((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[#f4f5f7] px-3 py-2 font-bold">
                            Rata-rata: {summary.finalGrade ?? "—"}
                          </span>
                          <span className="rounded-full bg-[var(--rapotku-brand-soft)] px-3 py-2 font-bold text-[var(--rapotku-brand)]">
                            Predikat: {summary.predicate ?? "—"}
                          </span>
                          <button
                            className="min-h-9 rounded-full border border-[var(--rapotku-border)] px-3 font-bold"
                            type="button"
                            onClick={() => openDescription(student.id)}
                          >
                            {descriptions.some(
                              (item) => item.student_id === student.id,
                            )
                              ? "Edit deskripsi"
                              : "Buat deskripsi"}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="bg-[#f7f8fa] text-xs uppercase text-[var(--rapotku-muted)]">
                      <tr>
                        <th className="px-5 py-4">No</th>
                        <th className="px-5 py-4">Siswa</th>
                        <th className="px-5 py-4 text-center">Nilai CP</th>
                        <th className="px-5 py-4 text-center">Rata-rata</th>
                        <th className="px-5 py-4 text-center">Predikat</th>
                        <th className="px-5 py-4 text-center">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rapotku-border)]">
                      {students.map((student, index) => {
                        const summary = summaryForStudent(student.id)
                        return (
                          <tr key={student.id}>
                            <td className="px-5 py-4">{index + 1}</td>
                            <td className="px-5 py-4">
                              <p className="font-bold">{student.full_name}</p>
                              <p className="text-xs text-[var(--rapotku-muted)]">
                                NIS {student.nis}
                              </p>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <input
                                aria-label={`Nilai ${student.full_name}`}
                                className={scoreClassName}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={scoreDrafts[student.id] ?? ""}
                                onChange={(event) =>
                                  setScoreDrafts((current) => ({
                                    ...current,
                                    [student.id]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="px-5 py-4 text-center font-bold">
                              {summary.finalGrade ?? "—"}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-[var(--rapotku-brand)]">
                              {summary.predicate ?? "—"}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                className="min-h-10 rounded-xl border border-[var(--rapotku-border)] px-3 text-sm font-bold"
                                type="button"
                                onClick={() => openDescription(student.id)}
                              >
                                {descriptions.some(
                                  (item) => item.student_id === student.id,
                                )
                                  ? "Edit"
                                  : "Buat"}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sticky bottom-0 border-t border-[var(--rapotku-border)] bg-white/95 p-4 backdrop-blur sm:flex sm:items-center sm:justify-between">
                  <p className="mb-3 text-sm text-[var(--rapotku-muted)] sm:mb-0">
                    {students.length} siswa · Simpan setelah selesai mengisi.
                  </p>
                  <button
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:w-auto"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSaveScores()}
                  >
                    {isSaving ? (
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                        size={18}
                      />
                    ) : (
                      <Save aria-hidden="true" size={18} />
                    )}
                    {isSaving ? "Menyimpan..." : "Simpan nilai"}
                  </button>
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>
      {editingStudentId ? (
        <div className="fixed inset-0 z-50 grid items-end bg-[#1d222b]/45 sm:place-items-center sm:p-4">
          <section
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="description-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
                  Draft otomatis
                </p>
                <h2 id="description-title" className="text-xl font-bold">
                  Deskripsi{" "}
                  {
                    students.find((item) => item.id === editingStudentId)
                      ?.full_name
                  }
                </h2>
              </div>
              <button
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup deskripsi"
                onClick={() => setEditingStudentId(null)}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-xs font-bold uppercase text-[var(--rapotku-muted)]">
                Hasil sistem
              </p>
              <p className="mt-2 text-sm leading-6">{generatedDraft}</p>
            </div>
            <label className="mt-5 block text-sm font-bold">
              Deskripsi final
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border border-[var(--rapotku-border)] p-4 text-sm leading-6 focus:border-[var(--rapotku-brand)] focus:outline-none"
                maxLength={2000}
                value={finalDraft}
                onChange={(event) => setFinalDraft(event.target.value)}
              />
            </label>
            <p className="mt-2 text-xs text-[var(--rapotku-muted)]">
              Guru boleh memperbaiki kalimat sebelum menyimpan. Draft sistem
              tetap disimpan terpisah.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] px-4 font-bold"
                type="button"
                onClick={() => generateForStudent(editingStudentId, true)}
              >
                <Sparkles aria-hidden="true" size={18} />
                Buat ulang draft
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60"
                type="button"
                disabled={isSaving || !finalDraft.trim()}
                onClick={() => void handleSaveDescription()}
              >
                <Save aria-hidden="true" size={18} />
                {isSaving ? "Menyimpan..." : "Simpan deskripsi"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
