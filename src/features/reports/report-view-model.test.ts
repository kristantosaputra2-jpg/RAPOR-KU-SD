import { describe, expect, it } from "vitest"

import type {
  AcademicYear,
  Semester,
} from "@/features/academic-periods/academic-periods.service"
import type { SchoolClass } from "@/features/classes/class.service"
import type { Student } from "@/features/students/student.service"

import {
  buildReportViewModel,
  type ReportSourceData,
} from "./report-view-model"

const schoolClass: SchoolClass = {
  id: "class-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  grade_level: 2,
  name: "2A",
  homeroom_teacher_id: null,
  template_group: "lower_primary",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const student: Student = {
  id: "student-1",
  full_name:
    "Nama Peserta Didik Sangat Panjang yang Tetap Harus Terlihat Lengkap",
  nis: "001",
  nisn: null,
  gender: "female",
  birth_place: "Tumbang Kawei",
  birth_date: "2018-01-02",
  religion: null,
  address: null,
  father_name: null,
  mother_name: null,
  guardian_name: null,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const academicYear: AcademicYear = {
  id: "year-1",
  school_id: "school-1",
  name: "2026/2027",
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const semester: Semester = {
  id: "semester-1",
  academic_year_id: "year-1",
  number: 1,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

function createSource(): ReportSourceData {
  return {
    school: null,
    assignedSubjectIds: ["subject-1"],
    subjects: [
      {
        id: "subject-1",
        name: "Matematika",
        code: null,
        is_local_content: false,
        display_order: 1,
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    assessmentComponents: [
      {
        id: "knowledge",
        code: "knowledge",
        name: "Pengetahuan",
        display_order: 1,
        is_active: true,
      },
      {
        id: "skills",
        code: "skills",
        name: "Keterampilan",
        display_order: 2,
        is_active: true,
      },
    ],
    gradeEntries: [
      {
        id: "grade-1",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        learning_outcome_id: "cp-1",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        score: 80,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      {
        id: "grade-2",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        learning_outcome_id: "cp-2",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        score: 90,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    descriptions: [
      {
        id: "description-1",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        strongest_outcome_id: "cp-2",
        weakest_outcome_id: "cp-1",
        generated_description: "Draft",
        final_description:
          "Deskripsi hasil belajar yang panjang tetap dipertahankan seluruhnya agar dapat diperiksa guru sebelum rapor dicetak.",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    gradingSetting: {
      semester_id: "semester-1",
      kkm_mode: "single",
      single_kkm: 70,
    },
    subjectKkmRules: [],
    attendance: null,
    extracurricularCatalog: [],
    extracurricularEntries: [],
    achievements: [],
    homeroomNote: null,
  }
}

describe("buildReportViewModel", () => {
  it("menyusun rapor kelas rendah, rata-rata, predikat, dan deskripsi final", () => {
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: createSource(),
    })

    expect(report.templateGroup).toBe("lower_primary")
    expect(report.student.name).toBe(student.full_name)
    expect(report.subjects[0]?.components[0]).toMatchObject({
      componentName: "Pengetahuan",
      average: 85,
      predicate: "B",
      description: expect.stringContaining("dipertahankan seluruhnya"),
    })
    expect(report.subjects[0]?.components[1]).toMatchObject({
      componentName: "Keterampilan",
      average: null,
      predicate: null,
      description: null,
    })
  })

  it("memakai template kelas tinggi dan KKM per mata pelajaran", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass: {
        ...schoolClass,
        grade_level: 5,
        template_group: "upper_primary",
      },
      student,
      academicYear,
      semester,
      source: {
        ...source,
        gradingSetting: {
          semester_id: "semester-1",
          kkm_mode: "multi",
          single_kkm: null,
        },
        subjectKkmRules: [
          {
            semester_id: "semester-1",
            subject_id: "subject-1",
            minimum_mastery_score: 75,
          },
        ],
      },
    })

    expect(report.templateGroup).toBe("upper_primary")
    expect(report.subjects[0]?.kkm).toBe(75)
    expect(report.subjects[0]?.components[0]?.predicate).toBe("B")
  })

  it("menandai field opsional kosong tanpa mengarang isinya", () => {
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: createSource(),
    })

    expect(report.school.name).toBe("Identitas sekolah belum diisi")
    expect(report.student.nisn).toBeNull()
    expect(report.student.address).toBeNull()
    expect(report.attendance.sickDays).toBeNull()
    expect(report.homeroomNote).toBeNull()
    expect(report.extracurriculars).toEqual([])
    expect(report.achievements).toEqual([])
  })
})
