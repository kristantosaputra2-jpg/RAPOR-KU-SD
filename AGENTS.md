# AGENTS.md — Instruksi Developer & AI Agent
**Project:** Aplikasi Rapor SD Kelas 1–6  
**Status:** Instruksi proyek utama untuk AI agent dan developer manusia  
**Source of Truth:** `prd_rapor_sd_kelas_1-6_v0.4.md`

---

# 1. Tujuan File Ini

File ini menjelaskan cara memahami, mengembangkan, menguji, dan memelihara proyek Aplikasi Rapor SD Kelas 1–6.

Developer atau AI agent yang baru masuk ke proyek harus dapat memahami:

- apa yang sedang dibangun;
- masalah apa yang diselesaikan;
- siapa penggunanya;
- apa yang termasuk MVP;
- apa yang tidak boleh dibangun dulu;
- bagaimana struktur teknis sebaiknya dibuat;
- bagaimana menulis kode;
- bagaimana menguji perubahan;
- bagaimana menjaga keamanan dan kualitas;
- bagaimana memastikan perubahan tidak merusak workflow guru.

Jika instruksi di file ini bertentangan dengan PRD terbaru, **PRD terbaru menjadi acuan utama**.

---

# 2. Ringkasan Produk

Aplikasi ini adalah aplikasi web rapor SD kelas 1–6.

Tujuan utamanya:

- mempermudah guru mengisi rapor;
- bisa digunakan dari HP;
- tidak bergantung pada laptop Dapodik/server lokal;
- lebih ramah untuk guru dengan kemampuan IT terbatas;
- ringan untuk sekolah dengan koneksi internet terbatas;
- mengurangi ketergantungan pada workbook Excel yang kompleks;
- memisahkan data, aturan penilaian, dan template output agar mudah mengikuti perubahan format rapor.

Sekolah awal:

**SD Negeri Tumbang Kawei**

Namun data identitas sekolah **tidak boleh di-hardcode**.

---

# 3. Model Deployment

Satu sekolah = satu deployment terpisah.

Setiap sekolah menggunakan:

- 1 repository GitHub;
- 1 project Supabase;
- 1 database;
- 1 deployment Cloudflare;
- 1 domain/subdomain.

Jangan membangun multi-tenant SaaS dalam satu database pada MVP.

Jika sekolah lain menggunakan aplikasi ini, source code boleh digunakan ulang, tetapi:

- database berbeda;
- repository dapat berbeda;
- konfigurasi berbeda;
- domain berbeda.

---

# 4. Stack Utama

## Sudah diputuskan

### Backend / Database
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage bila diperlukan

### Hosting
- Cloudflare Pages
- Cloudflare Workers hanya jika diperlukan

### Repository
- GitHub

### Development
- VS Code
- Codex
- ChatGPT Work

---

# 5. Keputusan Teknis Frontend

Keputusan berikut disetujui pada 2 September 2026 dan dicatat pada `docs/decisions/0001-frontend-foundation.md`.

## Frontend Framework
**Final**

- React
- TypeScript
- Vite

Alasan:
- ringan;
- mudah di-deploy ke Cloudflare;
- ekosistem matang;
- cocok untuk aplikasi form-heavy;
- mudah dipelihara AI agent maupun developer manusia.

## UI Library
**Final**

- Tailwind CSS
- shadcn/ui

Jangan memakai library UI yang berat tanpa alasan kuat.

## Package Manager
**Final**

- `pnpm`

Jangan mencampur lockfile.

## Test Runner
**Final**

- Vitest untuk unit/integration test frontend
- Testing Library untuk komponen
- Playwright untuk end-to-end

## Print Strategy

**Final untuk MVP**

- HTML print + print CSS;
- engine PDF khusus hanya ditambahkan jika browser print tidak memadai;
- exact PDF engine masih TBD.

---

# 6. Struktur Produk

Aplikasi memiliki dua kelompok template.

## Lower Primary

Untuk:
- kelas 1;
- kelas 2;
- kelas 3.

Identifier konseptual:

`lower_primary`

## Upper Primary

Untuk:
- kelas 4;
- kelas 5;
- kelas 6.

Identifier konseptual:

`upper_primary`

Kedua kelompok menggunakan:

- autentikasi yang sama;
- master sekolah yang sama;
- master guru;
- siswa;
- kelas;
- mata pelajaran;
- tahun ajaran;
- semester.

Yang berbeda:

- aturan penilaian;
- struktur komponen;
- CP/learning outcome;
- deskripsi;
- leger;
- template rapor.

---

# 7. Role Pengguna

Role MVP:

- `admin`
- `homeroom_teacher`
- `subject_teacher`

Hindari string role yang tersebar di seluruh codebase.

Gunakan enum/constant terpusat.

---

# 8. Hak Akses Utama

## Admin

Boleh mengelola:

- identitas sekolah;
- akun;
- guru;
- kelas;
- siswa;
- mata pelajaran;
- tahun ajaran;
- semester;
- penugasan guru;
- wali kelas;
- import Excel;
- konfigurasi rapor;
- monitoring kelengkapan.

## Wali Kelas

Boleh:

- melihat kelas sendiri;
- melihat siswa kelas sendiri;
- melihat nilai semua mapel untuk kelas sendiri;
- mengisi absensi;
- ekstrakurikuler;
- prestasi;
- catatan wali kelas;
- preview rapor;
- cetak rapor;
- leger kelas sendiri.

## Guru Mata Pelajaran

Boleh:

- melihat kelas yang ditugaskan;
- melihat siswa pada kelas tersebut;
- mengisi nilai mapel sendiri;
- mengelola CP yang relevan;
- generate deskripsi;
- edit deskripsi.

Tidak boleh mengubah nilai mapel guru lain.

---

# 9. Prinsip Keamanan

Security bukan fitur tambahan. Security wajib sejak awal.

## Supabase RLS

Semua tabel yang menyimpan data sensitif harus memiliki Row Level Security.

Jangan pernah mengandalkan frontend untuk security.

Rule harus memastikan:

- guru hanya membaca data yang berhak dilihat;
- guru mapel hanya mengubah mapel yang ditugaskan;
- wali kelas hanya mengubah data kelasnya;
- admin memiliki akses sesuai scope sekolah;
- anonymous user tidak dapat membaca data sekolah.

## Jangan expose secret

Jangan pernah commit:

- service role key;
- private API key;
- database password;
- secret token;
- credential Cloudflare;
- credential GitHub.

Gunakan environment variable.

Contoh:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Gunakan publishable key untuk frontend baru. Legacy anon key hanya untuk kompatibilitas proyek lama.

Service role key atau secret key tidak boleh digunakan di frontend.

---

# 10. Prinsip Database

Jangan desain database berdasarkan tampilan PDF.

Pisahkan:

## Master Data
- schools
- users
- teachers
- students
- classes
- subjects

## Academic Data
- learning_outcomes
- assessment_components
- grade_entries
- report_descriptions
- attendance
- extracurriculars
- achievements
- homeroom_notes

## Configuration / Output
- report_templates
- grading_rules
- report_settings

---

# 11. Naming Convention Database

Gunakan:

- `snake_case`
- nama tabel plural
- primary key `id`
- foreign key `<entity>_id`

Contoh:

```text
students
classes
subjects
grade_entries
learning_outcomes
```

Contoh kolom:

```text
student_id
class_id
subject_id
academic_year_id
semester_id
created_at
updated_at
```

Gunakan UUID jika mengikuti default Supabase.

---

# 12. Jangan Hardcode

Dilarang hardcode:

- nama sekolah;
- NPSN;
- kepala sekolah;
- alamat;
- mata pelajaran;
- tahun ajaran;
- semester;
- nama kelas;
- CP;
- KKM;
- predikat;
- template rapor;
- nama kabupaten;
- nama kecamatan;
- format kurikulum.

Jika sesuatu bisa berubah antar sekolah atau antar tahun, jadikan data/configuration.

---

# 13. Kurikulum dan Istilah

Workbook referensi berasal dari format K13 lama.

Jangan mengikat arsitektur ke:

- KI;
- KD;
- pengetahuan;
- keterampilan;

sebagai struktur permanen.

Gunakan konsep generik:

- `learning_outcomes`
- `assessment_components`
- `grading_rules`

Istilah K13 boleh muncul sebagai label/template jika diperlukan.

---

# 14. Prinsip Coding

Prioritas:

1. correctness;
2. readability;
3. maintainability;
4. security;
5. performance;
6. simplicity.

Jangan memilih solusi kompleks jika solusi sederhana cukup.

---

# 15. TypeScript

Jika frontend memakai React, gunakan TypeScript.

Hindari:

```ts
any
```

kecuali benar-benar diperlukan.

Lebih baik:

```ts
type Student = {
  id: string;
  name: string;
  nisn?: string;
};
```

Gunakan type dari database bila tersedia.

---

# 16. Function Design

Function harus:

- kecil;
- punya satu tujuan;
- mudah dites;
- memiliki nama jelas.

Buruk:

```ts
handleEverything()
processData()
doThing()
```

Baik:

```ts
calculateFinalGrade()
generateReportDescription()
validateStudentImport()
getTeacherAssignments()
```

---

# 17. Naming Convention Code

## Variable / Function
`camelCase`

```ts
studentName
calculateFinalGrade()
```

## Component
`PascalCase`

```tsx
StudentGradeTable
ReportPreview
```

## Constants
Gunakan uppercase hanya untuk constant benar-benar global.

```ts
MAX_SCORE
DEFAULT_PAGE_SIZE
```

## Files

Gunakan konsisten.

Rekomendasi:

```text
student-grade-table.tsx
report-preview.tsx
grade.service.ts
report.types.ts
```

---

# 18. Struktur Folder Rekomendasi

Jika React + TypeScript digunakan:

```text
src/
  app/
  components/
  features/
    auth/
    dashboard/
    schools/
    teachers/
    students/
    classes/
    subjects/
    grades/
    learning-outcomes/
    reports/
    leger/
  lib/
    supabase/
    validation/
    permissions/
  hooks/
  types/
  utils/
  config/
```

Lebih baik menggunakan struktur berdasarkan feature daripada satu folder besar berdasarkan tipe file.

---

# 19. Service Layer

Jangan memanggil Supabase secara acak dari banyak komponen.

Contoh:

```text
features/students/student.service.ts
features/grades/grade.service.ts
features/reports/report.service.ts
```

UI sebaiknya memanggil service/helper yang jelas.

---

# 20. Business Logic

Business logic tidak boleh tersebar di UI.

Contoh logic berikut harus berada di module/service:

- menghitung nilai akhir;
- menentukan predikat;
- memilih CP terbaik;
- memilih CP yang perlu ditingkatkan;
- menghasilkan draft deskripsi;
- menentukan status rapor lengkap;
- membentuk data leger.

---

# 21. Deskripsi CP

Deskripsi otomatis adalah draft.

Flow:

```text
nilai/CP
→ calculate
→ generate draft
→ teacher review
→ teacher edit
→ save final description
```

Jangan overwrite deskripsi manual guru ketika sistem menghitung ulang tanpa warning.

Jika regeneration diperlukan, beri pilihan eksplisit.

---

# 22. Input Nilai

Requirement penting:

**seluruh siswa terlihat sekaligus.**

Desktop dapat menggunakan tabel.

Mobile:

- gunakan responsive layout;
- sticky student name jika perlu;
- drawer/modal untuk detail;
- hindari horizontal scroll ekstrem;
- field harus touch-friendly.

Jangan memaksa guru membuka satu siswa per halaman jika tidak diperlukan.

---

# 23. Mobile-First

Minimum requirement:

- usable pada layar HP;
- tidak bergantung hover;
- target tap cukup besar;
- font terbaca;
- form tidak terlalu padat;
- tombol utama mudah dijangkau.

Uji minimal pada viewport:

```text
360px
390px
768px
1280px
```

---

# 24. Low Bandwidth

Aplikasi ditujukan juga untuk sekolah pedalaman.

Karena itu:

- minimalkan bundle;
- lazy load fitur besar;
- kompres gambar;
- jangan load aset besar tanpa kebutuhan;
- gunakan pagination bila data besar;
- hindari animasi berat;
- hindari request database berulang.

Target UX:

guru dengan koneksi tidak stabil tetap memahami apakah data berhasil tersimpan.

---

# 25. Loading State

Setiap action asynchronous harus memiliki state.

Contoh:

- loading;
- success;
- error.

Jangan membuat user menebak apakah tombol berhasil ditekan.

---

# 26. Error Handling

Jangan tampilkan error teknis mentah.

Buruk:

```text
PostgrestError PGRST116
```

Baik:

```text
Data nilai belum dapat disimpan. Periksa koneksi internet lalu coba lagi.
```

Log teknis boleh disimpan untuk debugging.

---

# 27. Validasi

Gunakan validasi client + server/database constraint.

Contoh:

Nilai:

```text
0–100
```

NISN:

- format valid;
- uniqueness sesuai kebutuhan.

Required fields harus jelas.

---

# 28. Autosave

Autosave boleh digunakan, tetapi jangan membuat perilaku ambigu.

Jika autosave digunakan:

- tampilkan status `Menyimpan...`;
- tampilkan `Tersimpan`;
- tampilkan error jika gagal.

Jika belum stabil, lebih baik gunakan tombol Simpan eksplisit.

---

# 29. Import Excel

Flow:

```text
Upload
→ Parse
→ Map columns
→ Validate
→ Preview
→ Confirm
→ Insert
```

Jangan langsung insert setelah upload.

Sediakan:

- duplicate detection;
- invalid date detection;
- required field validation;
- preview sebelum commit.

---

# 30. Report Rendering

Pisahkan data dan template.

Jangan membuat satu component besar berisi:

- query database;
- business logic;
- HTML print;
- formatting nilai.

Gunakan layer:

```text
data
→ report view model
→ template
→ print/PDF
```

---

# 31. Leger

Leger adalah derived output.

Jangan menyimpan leger sebagai data manual kecuali ada alasan.

Leger dibentuk dari:

- siswa;
- nilai;
- mapel;
- deskripsi;
- komponen rapor.

---

# 32. Print dan PDF

Prioritas:

1. HTML print yang konsisten;
2. PDF bila diperlukan.

Template print harus diuji:

- A4;
- page break;
- long text;
- empty data;
- nama siswa panjang;
- deskripsi panjang.

---

# 33. Accessibility

Minimum:

- label form jelas;
- keyboard navigation;
- semantic HTML;
- contrast cukup;
- jangan mengandalkan warna saja untuk status;
- aria-label untuk tombol icon-only.

---

# 34. Gaya Komentar

Komentar menjelaskan **kenapa**, bukan mengulang apa yang dilakukan kode.

Buruk:

```ts
// loop students
students.forEach(...)
```

Baik:

```ts
// Preserve manual teacher edits when recalculating generated descriptions.
```

Jangan menulis komentar panjang untuk kode yang sudah jelas.

Jangan meninggalkan komentar seperti:

```ts
// TODO fix later
```

tanpa konteks.

Gunakan:

```ts
// TODO(report-template): support alternative lower-primary layout.
```

---

# 35. Docstring

Gunakan docstring hanya untuk:

- business rule kompleks;
- exported utility penting;
- algorithm yang tidak obvious.

Contoh:

```ts
/**
 * Builds a draft report description from the highest and lowest
 * learning-outcome scores. Manual teacher edits are handled elsewhere.
 */
```

---

# 36. Test Strategy

Testing harus fokus pada risiko terbesar.

Prioritas:

1. business logic;
2. permission;
3. grade calculation;
4. report completeness;
5. report output;
6. critical user flow.

---

# 37. Unit Test

Wajib untuk logic seperti:

```text
calculateFinalGrade
calculatePredicate
selectStrongestOutcome
selectWeakestOutcome
generateDescription
calculateReportCompleteness
```

Format test:

```ts
describe("calculateFinalGrade", () => {
  it("returns the correct average for valid scores", () => {
    // arrange
    // act
    // assert
  });
});
```

Nama test harus menjelaskan perilaku.

---

# 38. Permission Test

Test minimal:

- subject teacher tidak dapat edit mapel lain;
- homeroom teacher hanya edit kelas sendiri;
- anonymous user ditolak;
- admin dapat mengelola konfigurasi.

Jika logic bergantung RLS, test policy secara eksplisit.

---

# 39. Integration Test

Test flow:

```text
create student
→ assign class
→ enter grade
→ generate description
→ report completeness updates
```

---

# 40. End-to-End Test

Critical flow MVP:

## Admin Flow

```text
Login
→ Create school config
→ Create class
→ Add/import student
→ Assign teacher
```

## Subject Teacher Flow

```text
Login
→ Open class
→ Open subject
→ Enter grades
→ Generate description
→ Save
```

## Homeroom Flow

```text
Login
→ Review completeness
→ Enter attendance
→ Enter extracurricular
→ Enter achievement
→ Add note
→ Preview
→ Print
```

---

# 41. Test Data

Gunakan fixture yang jelas.

Contoh:

```text
School A
Class 1A
Class 4A
Teacher Math
Homeroom 1A
Student A
Student B
```

Jangan menggunakan data siswa nyata dalam repository.

---

# 42. Edge Cases

Selalu test:

- nilai kosong;
- nilai 0;
- nilai 100;
- siswa tanpa NISN;
- nama sangat panjang;
- deskripsi panjang;
- semua nilai sama;
- hanya satu CP;
- guru belum assigned;
- semester tidak aktif;
- koneksi gagal;
- import duplicate;
- report belum lengkap.

---

# 43. Logging

Jangan log:

- password;
- access token;
- personal data lengkap tanpa kebutuhan.

Audit minimal untuk perubahan penting:

- actor;
- entity;
- timestamp;
- action.

---

# 44. Git Workflow

Gunakan branch yang jelas.

Contoh:

```text
feature/student-import
feature/grade-entry
fix/report-print-layout
refactor/grade-service
```

Jangan membuat branch:

```text
test
new
update
final
```

---

# 45. Commit Message

Gunakan format ringkas dan jelas.

Rekomendasi Conventional Commits:

```text
feat: add student excel import preview
fix: preserve manual report description
refactor: move grade calculation to service
test: add teacher permission coverage
docs: update report template rules
```

---

# 46. Pull Request

Setiap PR harus menjawab:

```text
What changed?
Why?
How was it tested?
Any migration?
Any security impact?
Any UI/mobile impact?
```

PR kecil lebih baik daripada PR sangat besar.

---

# 47. Database Migration

Semua perubahan schema harus melalui migration.

Jangan mengubah production schema manual tanpa migration tercatat.

Migration harus:

- reversible jika memungkinkan;
- memiliki nama jelas;
- tidak merusak existing data;
- diuji sebelum production.

---

# 48. Backward Compatibility

Karena format rapor dapat berubah:

- jangan delete data lama hanya karena template berubah;
- data per tahun ajaran harus tetap dapat dibaca;
- template lama dapat tetap digunakan untuk historical report jika diperlukan.

---

# 49. Performance

Hindari N+1 query.

Gunakan:

- join/view bila tepat;
- batch query;
- pagination;
- selective columns.

Jangan gunakan:

```sql
select *
```

tanpa kebutuhan.

---

# 50. Query Rules

Ambil hanya field yang dibutuhkan.

Contoh:

Lebih baik:

```ts
.select("id,name,nisn")
```

daripada:

```ts
.select("*")
```

pada list sederhana.

---

# 51. Dependency Policy

Sebelum menambah dependency:

tanyakan:

1. apakah benar dibutuhkan?
2. apakah bisa dilakukan dengan built-in API?
3. ukuran library?
4. maintenance aktif?
5. security reputation?

Jangan menambah dependency hanya untuk helper kecil.

---

# 52. UI Rules

UI harus terlihat seperti aplikasi, bukan spreadsheet mentah.

Prinsip:

- sederhana;
- konsisten;
- jelas;
- sedikit langkah;
- form grouping;
- clear CTA;
- status visible.

Jangan menampilkan terlalu banyak informasi sekaligus.

---

# 53. Status dan Feedback

Gunakan label:

- Belum Diisi
- Sebagian
- Lengkap
- Siap Cetak

Jangan hanya gunakan warna.

Tambahkan icon/text.

---

# 54. Empty State

Setiap halaman list harus memiliki empty state yang menjelaskan tindakan.

Contoh:

```text
Belum ada siswa di kelas ini.
Tambahkan siswa atau import dari Excel.
```

---

# 55. Confirmation Dialog

Gunakan konfirmasi untuk destructive action:

- delete student;
- delete class;
- reset grades;
- regenerate description jika akan overwrite;
- remove teacher assignment.

Tidak perlu confirmation untuk setiap simpan biasa.

---

# 56. Scope Discipline

AI agent atau developer **dilarang memperluas scope sendiri**.

Jangan tiba-tiba menambahkan:

- chatbot;
- WhatsApp;
- analytics kompleks;
- LMS;
- QR attendance;
- parent portal;
- AI generatif umum;
- payment;
- Dapodik integration.

Jika fitur belum ada di PRD, tandai sebagai proposal.

---

# 57. MVP Out of Scope

Tidak termasuk MVP:

- Dapodik integration;
- Kemendikbud synchronization;
- native Android app;
- parent portal;
- student portal;
- WhatsApp automation;
- LMS;
- question bank;
- QR attendance;
- face recognition;
- payment;
- general AI chatbot;
- multi-school SaaS one database;
- full student master-book;
- health data;
- full offline mode.

---

# 58. AI Agent Rules

Sebelum mengubah kode:

1. baca `AGENTS.md`;
2. baca PRD terbaru;
3. pahami feature yang sedang dikerjakan;
4. cari code existing sebelum membuat module baru;
5. pertahankan naming convention;
6. jangan refactor area tidak terkait tanpa alasan.

---

# 59. Patch Size

Prefer small focused patches.

Jika request hanya memperbaiki report preview:

jangan sekalian:

- refactor auth;
- ganti UI library;
- ubah schema;
- upgrade seluruh dependencies.

---

# 60. Jangan Menghapus Fitur Diam-diam

Jika code existing terlihat tidak digunakan:

jangan langsung hapus.

Periksa:

- route;
- import;
- config;
- database;
- feature flag;
- report template.

---

# 61. Tidak Boleh Mengarang Requirement

Jika requirement belum jelas:

- gunakan PRD;
- gunakan current implementation;
- tandai `TBD`;
- gunakan rekomendasi paling konservatif.

Jangan membuat aturan rapor baru berdasarkan asumsi.

---

# 62. AI Generated Code

Kode yang dihasilkan AI harus tetap:

- readable;
- typed;
- tested;
- lintable;
- mengikuti architecture.

Jangan menerima generated code hanya karena "works".

---

# 63. Definition of Done per Feature

Feature selesai jika:

- requirement terpenuhi;
- TypeScript tidak error;
- lint lolos;
- test terkait lolos;
- permission benar;
- mobile layout diperiksa;
- error state ada;
- loading state ada;
- empty state ada jika relevan;
- tidak ada secret;
- dokumentasi diperbarui jika behavior berubah.

---

# 64. Definition of Done MVP

MVP selesai jika minimal:

- admin setup sekolah;
- kelas 1–6;
- import siswa Excel;
- teacher assignment;
- role & permission;
- nilai seluruh siswa satu layar;
- lower-primary workflow;
- upper-primary workflow;
- CP/learning outcome;
- auto editable description;
- attendance;
- extracurricular;
- achievement;
- homeroom note;
- completeness checker;
- preview;
- print/PDF;
- lower-primary leger;
- upper-primary leger;
- mobile usable;
- no local Dapodik server dependency;
- data stored securely in Supabase.

---

# 65. Checklist Sebelum Merge

```text
[ ] Scope sesuai PRD
[ ] Tidak ada hardcoded school data
[ ] TypeScript clean
[ ] Lint clean
[ ] Test relevant passed
[ ] RLS/security checked
[ ] Mobile checked
[ ] Error state handled
[ ] Loading state handled
[ ] No secrets committed
[ ] Migration added if schema changed
[ ] Report output checked if affected
[ ] No unrelated refactor
```

---

# 66. Checklist Sebelum Production Deploy

```text
[ ] Environment variables configured
[ ] Supabase RLS enabled
[ ] Database migration applied
[ ] Admin account verified
[ ] School configuration verified
[ ] Academic year verified
[ ] Semester verified
[ ] Teacher permissions verified
[ ] Student data verified
[ ] Report preview verified
[ ] PDF/print verified
[ ] Mobile smoke test
[ ] Production URL verified
```

---

# 67. Dokumentasi

File minimum:

```text
README.md
AGENTS.md
prd_rapor_sd_kelas_1-6_v0.4.md
```

Tambahkan bila dibutuhkan:

```text
docs/
  architecture.md
  database.md
  permissions.md
  report-templates.md
  deployment.md
```

Jangan memasukkan semua detail ke README.

---

# 68. Source of Truth Hierarchy

Jika terjadi konflik:

1. requirement terbaru yang disetujui user;
2. PRD terbaru;
3. `AGENTS.md`;
4. technical docs;
5. implementation lama.

Jangan mempertahankan kode lama jika bertentangan dengan requirement terbaru.

---

# 69. Prinsip Utama Proyek

Saat mengambil keputusan teknis, selalu gunakan pertanyaan:

> Apakah guru SD dengan kemampuan IT terbatas dapat menggunakan fitur ini dari HP tanpa memahami sistem di belakangnya?

Jika jawabannya tidak, desain perlu disederhanakan.

Dan:

> Apakah perubahan format rapor dapat dilakukan tanpa membangun ulang seluruh aplikasi?

Jika jawabannya tidak, arsitektur terlalu kaku.

---

# 70. Status Keputusan

## Sudah final

- satu sekolah per deployment;
- Supabase;
- Cloudflare;
- GitHub;
- kelas 1–3 satu kelompok;
- kelas 4–6 satu kelompok;
- admin + wali kelas + guru mapel;
- seluruh siswa terlihat saat input nilai;
- CP/deskripsi otomatis editable;
- prestasi;
- leger;
- import Excel;
- no health data MVP;
- mobile-first;
- no Dapodik local-server dependency.
- React + TypeScript + Vite;
- Tailwind CSS + shadcn/ui;
- pnpm;
- Vitest + Testing Library + Playwright;
- HTML print sebagai strategi cetak MVP.

## Masih TBD

- exact PDF engine;
- exact offline/PWA strategy;
- exact grading formula berdasarkan format rapor final;
- exact report template terbaru.

---

# 71. Instruksi Singkat untuk AI Agent

Jika hanya membaca satu bagian file ini, ikuti aturan berikut:

1. Jangan memperluas scope.
2. Jangan hardcode data sekolah atau kurikulum.
3. Gunakan Supabase + RLS dengan benar.
4. Pisahkan business logic dari UI.
5. Utamakan mobile dan koneksi lambat.
6. Tampilkan seluruh siswa pada workflow input nilai.
7. Deskripsi otomatis harus tetap editable.
8. Lower primary dan upper primary berbagi core system tetapi boleh memiliki aturan/template berbeda.
9. Test business rule dan permission.
10. Buat perubahan kecil, jelas, dan dapat direview.
11. Baca PRD terbaru sebelum coding.
12. Jika requirement belum jelas, jangan mengarang.
