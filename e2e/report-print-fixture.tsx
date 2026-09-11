import React from "react"
import { createRoot } from "react-dom/client"

import { ReportPreviewTemplate } from "@/features/reports/report-preview-template"
import type { ReportViewModel } from "@/features/reports/report-view-model"
import "@/styles/globals.css"

const longDescription =
  "Menunjukkan capaian sangat baik dalam memahami konsep, menjelaskan hubungan antargagasan, dan menerapkan pengetahuan pada kegiatan sehari-hari; teruslah berlatih agar hasil belajar semakin mantap."

const subjects = [
  "Pendidikan Agama",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "Ilmu Pengetahuan Alam dan Sosial",
  "Seni Budaya",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  "Bahasa Daerah",
].map((subjectName, index) => ({
  subjectId: `subject-${index}`,
  subjectName,
  kkm: 70,
  components: [
    {
      componentId: `knowledge-${index}`,
      componentName: "Pengetahuan",
      average: 82 + (index % 6),
      predicate: "B" as const,
      description: longDescription,
    },
    {
      componentId: `skills-${index}`,
      componentName: "Keterampilan",
      average: 84 + (index % 5),
      predicate: "B" as const,
      description: longDescription,
    },
  ],
}))

const report: ReportViewModel = {
  templateGroup: "lower_primary",
  templateLabel: "Rapor Kelas Rendah",
  school: {
    name: "SD Uji RaporKu",
    npsn: "12345678",
    address: "Jalan Pendidikan Nomor 1, Desa Contoh, Kecamatan Uji",
    principalName: "Kepala Sekolah Uji, S.Pd.",
    principalNip: "198001012000011001",
    logoUrl: null,
  },
  student: {
    id: "student-a",
    name: "SISWA DENGAN NAMA SANGAT PANJANG UNTUK PENGUJIAN CETAK",
    nis: "001",
    nisn: "0012345678",
    gender: "Perempuan",
    birth: "Desa Contoh, 2 Januari 2018",
    religion: "Kristen",
    address: "Jalan Keluarga Nomor 10, Desa Contoh",
    fatherName: "Ayah Siswa Uji",
    motherName: "Ibu Siswa Uji",
    guardianName: null,
    phone: "081200000001",
    photoUrl: null,
    father: {
      name: "Ayah Siswa Uji",
      education: "SMA",
      occupation: "Petani",
      address: "Desa Contoh",
      phone: "081200000002",
    },
    mother: {
      name: "Ibu Siswa Uji",
      education: "SMA",
      occupation: "Wiraswasta",
      address: "Desa Contoh",
      phone: "081200000003",
    },
    guardian: {
      name: null,
      education: null,
      occupation: null,
      address: null,
      phone: null,
    },
  },
  academicPeriod: {
    className: "2A",
    gradeLevel: 2,
    academicYear: "2026/2027",
    semester: "Semester 1",
  },
  subjects,
  attendance: { sickDays: 2, permittedDays: 1, absentDays: 0 },
  extracurriculars: [
    {
      name: "Pramuka",
      achievement: "B",
      description: "Aktif mengikuti kegiatan dan bekerja sama dengan baik.",
    },
  ],
  achievements: [
    {
      type: "Lomba Membaca",
      level: "Kecamatan",
      description: "Juara 2",
      year: 2026,
    },
  ],
  homeroomNote:
    "Ananda telah menunjukkan perkembangan yang baik selama satu semester. Pertahankan semangat belajar dan kebiasaan baik di sekolah maupun di rumah.",
  homeroomTeacher: { name: "Wali Kelas Uji, S.Pd.", nip: "198101012001012001" },
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReportPreviewTemplate report={report} />
  </React.StrictMode>,
)
