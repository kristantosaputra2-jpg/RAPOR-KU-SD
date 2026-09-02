# Architecture.md — Aplikasi Rapor SD Kelas 1–6
**Versi:** 0.1  
**Status:** Arsitektur Sistem Awal  
**Acuan utama:** `prd_rapor_sd_kelas_1-6_v0.4.md` dan `AGENTS.md`

---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan arsitektur teknis aplikasi Rapor SD Kelas 1–6 agar developer manusia maupun AI agent memahami bagaimana sistem harus dibangun, bagaimana komponen saling berhubungan, dan batas tanggung jawab tiap layer.

Dokumen ini tidak menggantikan PRD.

Urutan acuan:

1. Requirement terbaru yang disetujui user
2. PRD terbaru
3. `AGENTS.md`
4. `Architecture.md`
5. Implementasi yang ada

---

# 2. Tujuan Arsitektur

Arsitektur harus mendukung:

- penggunaan dari HP dan laptop;
- koneksi internet yang tidak selalu stabil;
- satu sekolah per deployment;
- data sekolah yang terisolasi;
- role Admin, Wali Kelas, Guru Mapel;
- kelas 1–3 dan 4–6 dalam satu aplikasi;
- aturan penilaian yang dapat berbeda antar kelompok kelas;
- perubahan format rapor tanpa membangun ulang seluruh aplikasi;
- input nilai seluruh siswa dalam satu layar;
- CP/deskripsi otomatis tetapi editable;
- leger otomatis;
- import siswa Excel;
- print/PDF rapor;
- keamanan berbasis Supabase Auth + RLS.

---

# 3. Non-Goals MVP

Arsitektur awal tidak ditujukan untuk:

- multi-school SaaS dalam satu database;
- integrasi Dapodik;
- aplikasi Android native;
- full offline-first;
- portal orang tua;
- portal siswa;
- WhatsApp automation;
- LMS;
- payment;
- AI chatbot umum;
- analytics skala besar;
- event-driven microservices;
- distributed system kompleks.

MVP harus tetap sederhana.

---

# 4. Model Deployment

Model:

> 1 sekolah = 1 deployment = 1 Supabase project = 1 database

Setiap sekolah memiliki:

- repository GitHub;
- deployment Cloudflare;
- project Supabase;
- database;
- domain/subdomain;
- environment variables;
- konfigurasi sekolah sendiri.

Contoh konseptual:

```text
School A
├── GitHub Repo A
├── Supabase Project A
├── Cloudflare Deployment A
└── rapor.school-a.sch.id

School B
├── GitHub Repo B
├── Supabase Project B
├── Cloudflare Deployment B
└── rapor.school-b.sch.id
```

Keuntungan:

- isolasi data sederhana;
- keamanan lebih mudah;
- migrasi lebih terkontrol;
- konfigurasi sekolah tidak saling memengaruhi.

---

# 5. High-Level Architecture

```text
┌───────────────────────────────┐
│           USER                │
│ Admin / Wali / Guru Mapel     │
└───────────────┬───────────────┘
                │ HTTPS
                ▼
┌───────────────────────────────┐
│       FRONTEND WEB APP        │
│ Cloudflare Pages              │
│ Mobile-first UI               │
└───────────────┬───────────────┘
                │
                │ Supabase Client
                ▼
┌───────────────────────────────┐
│          SUPABASE             │
│ Auth                          │
│ PostgreSQL                    │
│ Row Level Security            │
│ Storage                       │
└───────────────┬───────────────┘
                │
                │ optional server-side tasks
                ▼
┌───────────────────────────────┐
│   CLOUDFLARE WORKERS          │
│ Only if needed                │
└───────────────────────────────┘
```

Cloudflare Workers tidak wajib pada tahap awal.

Gunakan hanya jika frontend tidak cukup aman atau tidak cocok untuk operasi tertentu.

---

# 6. Frontend Technology

Status:

**Final — disetujui 2 September 2026**

- React
- TypeScript
- Vite
- Tailwind CSS
- komponen UI ringan seperti shadcn/ui

Alasan:

- cocok untuk aplikasi form-heavy;
- ekosistem luas;
- ringan;
- cocok dengan Cloudflare Pages;
- mudah ditest;
- familiar untuk AI coding tools.

Arsitektur tidak boleh tergantung penuh pada framework tertentu.

---

# 7. Frontend Layer

Frontend memiliki tanggung jawab:

- render UI;
- form input;
- client validation;
- status loading;
- status save;
- responsive layout;
- navigation;
- report preview;
- user feedback.

Frontend **tidak boleh menjadi sumber utama security**.

Permission frontend hanya untuk UX.

Authorization sebenarnya harus tetap ada di database melalui RLS.

---

# 8. Application Layer

Application layer bertanggung jawab pada use case.

Contoh:

```text
createStudent
importStudents
assignTeacher
saveGrades
generateDescription
checkReportCompleteness
generateLeger
prepareReportPreview
```

Layer ini mengorkestrasi:

- business logic;
- validation;
- data access.

---

# 9. Domain / Business Logic Layer

Business logic harus dipisahkan dari UI.

Contoh module:

```text
grading
report-description
report-completeness
permissions
leger
report-view-model
```

Contoh function:

```ts
calculateFinalGrade()
calculatePredicate()
selectStrongestLearningOutcome()
selectWeakestLearningOutcome()
generateReportDescription()
calculateReportCompleteness()
buildLegerRows()
```

Business logic harus dapat diuji tanpa browser.

---

# 10. Data Access Layer

Frontend sebaiknya tidak memiliki Supabase query acak di banyak komponen.

Gunakan service layer.

Contoh:

```text
student.service.ts
teacher.service.ts
grade.service.ts
report.service.ts
leger.service.ts
```

Flow:

```text
UI
↓
Application / Feature
↓
Service
↓
Supabase
```

---

# 11. Struktur Modul Domain

Rekomendasi:

```text
features/
  auth/
  dashboard/
  schools/
  academic-years/
  semesters/
  teachers/
  classes/
  students/
  subjects/
  learning-outcomes/
  assessments/
  grades/
  attendance/
  extracurriculars/
  achievements/
  homeroom-notes/
  report-status/
  reports/
  leger/
  settings/
```

---

# 12. Lower Primary vs Upper Primary

Aplikasi memiliki satu core system.

Namun aturan rapor menggunakan dua template group:

```text
lower_primary
upper_primary
```

## lower_primary

Untuk:

- kelas 1;
- kelas 2;
- kelas 3.

Workflow cenderung lebih sederhana.

## upper_primary

Untuk:

- kelas 4;
- kelas 5;
- kelas 6.

Mendukung komponen lebih rinci.

Core domain tidak boleh diduplikasi.

Gunakan strategy/configuration pattern.

Contoh konsep:

```ts
getGradingStrategy(templateGroup)
getReportTemplate(templateGroup)
getLegerDefinition(templateGroup)
```

---

# 13. Template Strategy

Jangan membuat:

```text
ReportClass1.tsx
ReportClass2.tsx
ReportClass3.tsx
ReportClass4.tsx
ReportClass5.tsx
ReportClass6.tsx
```

jika sebagian besar logic sama.

Lebih baik:

```text
report core
+
template configuration
+
lower primary layout
+
upper primary layout
```

Tujuan:

- mengurangi duplikasi;
- memudahkan maintenance;
- format baru dapat ditambahkan.

---

# 14. Data Model Konseptual

Entitas utama:

```text
schools
users
teacher_profiles
academic_years
semesters
classes
class_members
students
subjects
teacher_assignments
learning_outcomes
assessment_components
grade_entries
report_descriptions
attendance
extracurriculars
student_extracurriculars
achievements
homeroom_notes
report_status
report_templates
```

Schema final masih TBD.

---

# 15. Data Ownership

Setiap data harus mempunyai konteks yang jelas.

Contoh nilai harus terkait ke:

- student;
- class;
- subject;
- teacher assignment;
- semester;
- academic year.

Jangan menyimpan nilai tanpa scope akademik yang jelas.

---

# 16. Authentication

Authentication menggunakan Supabase Auth.

User login dengan akun yang dibuat sekolah/admin.

Minimal:

- email/password;
- session persistence;
- logout;
- protected routes.

Future option:

- magic link;
- Google login.

Tidak wajib MVP.

---

# 17. Authorization

Authorization menggunakan dua layer.

## Layer 1 — Frontend

Untuk UX.

Contoh:

- hide menu;
- disable action;
- redirect unauthorized route.

## Layer 2 — Database

Untuk security sebenarnya.

Menggunakan Supabase RLS.

RLS harus memastikan:

- guru mapel tidak dapat update mapel lain;
- wali kelas tidak dapat update kelas lain;
- anonymous tidak dapat membaca data;
- admin memiliki akses sesuai kebutuhan.

---

# 18. Permission Model

Permission sebaiknya berdasarkan assignment, bukan hanya role.

Contoh:

Guru A adalah `subject_teacher`.

Tetapi akses aktual bergantung pada:

```text
teacher_assignments
```

yang menghubungkan:

- teacher;
- class;
- subject;
- academic year;
- semester.

---

# 19. Supabase RLS

Setiap tabel sensitif harus RLS enabled.

Contoh policy konseptual:

```text
Subject teacher can select grade entries
WHERE grade_entries.subject_id belongs to teacher assignment
AND class_id belongs to assignment
```

Jangan menggunakan:

```text
if (user.role === "teacher")
```

di frontend sebagai satu-satunya security.

---

# 20. Service Role

Supabase service role key:

- tidak boleh berada di frontend;
- tidak boleh masuk repository;
- hanya boleh digunakan di server-side trusted environment jika benar-benar diperlukan.

Untuk MVP, gunakan publishable key + RLS. Legacy anon key hanya untuk kompatibilitas proyek lama.

---

# 21. School Configuration

Identitas sekolah disimpan sebagai data.

Contoh:

```text
school_name
npsn
address
village
district
city
province
postal_code
email
principal_name
principal_nip
logo_url
```

Tidak boleh hardcoded.

---

# 22. Academic Context

Semua data nilai harus terkait dengan:

```text
academic_year
semester
class
student
subject
```

Historical data harus tetap terbaca.

Perubahan semester aktif tidak boleh menghapus data lama.

---

# 23. Learning Outcome Architecture

Gunakan istilah generik:

```text
learning_outcomes
```

Jangan hardcode sistem ke K13.

Learning outcome dapat menyimpan:

```text
id
subject_id
grade_level
semester_id
code
title
description
is_active
```

Implementasi final TBD.

---

# 24. Assessment Component Architecture

Untuk mendukung perubahan kurikulum:

```text
assessment_components
```

Contoh:

- knowledge;
- skills;
- project;
- daily score;
- final score.

Label dapat dikonfigurasi.

---

# 25. Grade Architecture

Nilai mentah sebaiknya disimpan sebagai entry.

Contoh:

```text
grade_entries
```

Kemudian nilai akhir adalah hasil calculation.

Hindari menyimpan terlalu banyak data derived jika bisa dihitung.

Namun derived value boleh disimpan jika:

- report generation berat;
- audit diperlukan;
- aturan harus dibekukan per semester.

Keputusan final dibuat di schema design.

---

# 26. Report Description Architecture

Deskripsi memiliki dua bagian:

```text
generated_description
final_description
```

atau mekanisme equivalent.

Tujuan:

- hasil sistem dapat disimpan;
- edit manual guru tidak hilang;
- regenerate tidak otomatis overwrite.

---

# 27. Description Flow

```text
grades
↓
learning outcomes
↓
identify strongest/weakest
↓
generate draft
↓
teacher review
↓
manual edit
↓
final description
```

---

# 28. Report Completeness Engine

Report completeness merupakan business rule.

Contoh per siswa:

```text
identity_complete
grades_complete
descriptions_complete
attendance_complete
extracurricular_complete
achievement_checked
homeroom_note_complete
```

Status:

```text
not_started
partial
complete
ready_to_print
```

---

# 29. Leger Architecture

Leger tidak diisi manual.

Leger dibentuk dari query + transformation.

Flow:

```text
students
+
subjects
+
grades
+
descriptions
+
report config
↓
leger view model
↓
table
↓
print/export
```

Lower primary dan upper primary dapat memiliki definisi kolom berbeda.

---

# 30. Report Generation Architecture

Gunakan pipeline:

```text
database data
↓
report query
↓
report view model
↓
template
↓
HTML print
↓
PDF if needed
```

Jangan gabungkan query database dan print markup dalam satu file besar.

---

# 31. Report View Model

Sebelum render, data dikonversi ke bentuk stabil.

Contoh:

```ts
type ReportViewModel = {
  school: SchoolInfo;
  student: StudentInfo;
  academicPeriod: AcademicPeriod;
  subjects: SubjectResult[];
  attendance: AttendanceSummary;
  extracurriculars: ExtracurricularResult[];
  achievements: Achievement[];
  homeroomNote?: string;
};
```

Template hanya menerima view model.

---

# 32. Print Architecture

Prioritas MVP:

- browser print;
- print CSS;
- A4;
- page-break control.

PDF engine:

**TBD**

Rekomendasi awal:

gunakan HTML print dahulu.

Tambahkan engine PDF server-side hanya jika browser print tidak cukup.

---

# 33. Excel Import Architecture

Pipeline:

```text
file upload
↓
parse locally/client
↓
column mapping
↓
validation
↓
preview
↓
confirm
↓
batch insert
```

Jangan insert langsung saat upload.

---

# 34. Excel Validation

Validasi:

- required fields;
- duplicate NIS;
- duplicate NISN;
- invalid dates;
- empty name;
- invalid gender value;
- duplicate student candidate.

Error harus per-row.

---

# 35. Transaction Strategy Import

Untuk batch import:

lebih baik:

```text
validate all
↓
confirm
↓
transaction/batch insert
```

Jika sebagian gagal, sistem harus menjelaskan row yang gagal.

---

# 36. Mobile Architecture

Mobile bukan versi tambahan.

Mobile adalah target utama.

UI harus:

- responsive;
- minimal horizontal scroll;
- usable dengan touch;
- tidak bergantung hover;
- mempertahankan input siswa banyak.

---

# 37. Grade Entry Mobile Pattern

Desktop:

```text
table
```

Mobile:

opsi:

```text
compact table
+
horizontal grouping
+
sticky student name
+
drawer detail
```

Jangan membuat guru masuk satu siswa satu halaman kecuali memang diperlukan.

---

# 38. Low-Bandwidth Strategy

Karena target termasuk sekolah pedalaman:

- bundle kecil;
- lazy load;
- selective data fetching;
- batching;
- image optimization;
- cache static asset;
- avoid polling;
- avoid realtime subscription kecuali diperlukan.

Realtime Supabase tidak perlu digunakan default.

---

# 39. Query Strategy

Gunakan:

- filter server-side;
- select field spesifik;
- batching;
- pagination jika data besar.

Hindari:

```text
select *
```

untuk list sederhana.

---

# 40. Caching Strategy

Static:

Cloudflare cache.

Application data:

gunakan query cache ringan jika framework mendukung.

Jangan cache nilai terlalu agresif hingga guru melihat data stale.

---

# 41. Offline Behavior

Full offline belum MVP.

Tetapi UX harus tahan koneksi buruk.

Minimum:

- loading indicator;
- save status;
- retry;
- failure message;
- prevent accidental data loss.

Future:

PWA + offline queue.

---

# 42. Error Handling Architecture

Error dibagi:

## Validation Error

Contoh:

```text
Nilai harus antara 0–100.
```

## Permission Error

```text
Anda tidak memiliki akses untuk mengubah nilai ini.
```

## Network Error

```text
Data belum tersimpan. Periksa koneksi internet.
```

## System Error

Pesan user-friendly.

Technical error tetap log internal.

---

# 43. Logging

Frontend:

log minimum.

Jangan log:

- password;
- token;
- data pribadi penuh.

Server-side logging hanya jika Workers digunakan.

---

# 44. Audit Trail

Minimal:

```text
updated_by
updated_at
```

Untuk data sensitif seperti nilai.

Future:

audit_events.

---

# 45. Storage

Supabase Storage digunakan jika diperlukan untuk:

- logo sekolah;
- foto siswa jika nanti dibutuhkan;
- attachment tertentu.

Jangan simpan file binary di PostgreSQL.

---

# 46. Cloudflare Pages

Frontend di-deploy ke Cloudflare Pages.

Pipeline:

```text
GitHub push
↓
CI
↓
build
↓
Cloudflare deployment
```

---

# 47. Cloudflare Workers

Gunakan hanya jika ada kebutuhan seperti:

- server-side PDF;
- protected admin task;
- signed export;
- proxy khusus;
- trusted service-role operation.

Jangan menggunakan Workers untuk semua logic secara default.

---

# 48. GitHub CI/CD

Rekomendasi pipeline:

```text
install
↓
typecheck
↓
lint
↓
unit test
↓
build
↓
deploy
```

E2E dapat berjalan pada PR atau staging.

---

# 49. Environment Strategy

Minimal:

```text
development
production
```

Lebih baik:

```text
development
staging
production
```

Jika biaya/complexity masih terlalu tinggi, staging dapat ditunda.

---

# 50. Environment Variables

Contoh frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Jangan commit `.env`.

Gunakan:

```text
.env.example
```

tanpa secret.

---

# 51. Database Migration

Semua schema change melalui migration.

Flow:

```text
create migration
↓
test local/dev
↓
review
↓
apply production
```

Jangan ubah schema production manual tanpa histori.

---

# 52. Migration Naming

Contoh:

```text
20260831_create_students_table.sql
20260831_add_teacher_assignments.sql
```

Gunakan format konsisten sesuai tool migration yang dipilih.

---

# 53. Schema Evolution

Karena format rapor berubah:

jangan hapus field historical terlalu cepat.

Gunakan:

- additive migrations;
- deprecation period;
- template versioning.

---

# 54. Report Template Versioning

Setiap template rapor sebaiknya dapat memiliki versi.

Contoh:

```text
lower_primary_v1
upper_primary_v1
```

Future:

```text
lower_primary_v2
```

Historical report dapat mempertahankan template lama.

---

# 55. Configuration Versioning

Aturan penilaian per tahun ajaran mungkin berubah.

Jangan selalu menggunakan config terbaru untuk data lama.

Pertimbangkan relasi:

```text
academic_year
→ report_template
→ grading_rule_version
```

---

# 56. Testing Architecture

Layer test:

```text
unit
integration
permission/RLS
E2E
print/report
```

---

# 57. Unit Test Focus

Prioritas:

- grade calculation;
- predicate;
- CP selection;
- description generation;
- completeness;
- leger transformation.

---

# 58. Integration Test Focus

Contoh:

```text
create student
→ assign class
→ save grades
→ generate description
→ completeness update
```

---

# 59. RLS Test

Wajib test:

- subject teacher cannot edit other subject;
- homeroom teacher cannot edit unrelated class;
- anonymous denied;
- admin allowed.

---

# 60. E2E Test

Critical path:

## Admin
```text
login
→ setup
→ class
→ student
→ teacher assignment
```

## Guru
```text
login
→ class
→ subject
→ grade entry
→ description
→ save
```

## Wali
```text
login
→ completeness
→ attendance
→ achievement
→ preview
→ print
```

---

# 61. Print Test

Gunakan snapshot/manual visual test untuk:

- A4;
- nama panjang;
- deskripsi panjang;
- empty values;
- page breaks;
- upper vs lower primary.

---

# 62. Failure Modes

Arsitektur harus mengantisipasi:

## Supabase unreachable

UI:

```text
connection error
retry
do not falsely show saved
```

## Import malformed Excel

Tidak insert.

Show row errors.

## Partial grade data

Status:

```text
partial
```

Jangan error.

## Permission misconfiguration

Test RLS sebelum production.

## Report template bug

Tidak merusak source academic data.

---

# 63. Backup Strategy

Minimal:

- Supabase backup sesuai plan;
- repository GitHub;
- migration history.

Future:

- scheduled logical export.

---

# 64. Recovery Principle

Jika deployment frontend rusak:

rollback GitHub/Cloudflare.

Jika schema migration rusak:

gunakan migration fix/rollback.

Jangan restore database penuh kecuali perlu.

---

# 65. Observability

MVP observability sederhana.

Minimum:

- build logs;
- Cloudflare deploy logs;
- Supabase logs;
- client error reporting optional.

Future:

Sentry atau equivalent.

Status:

**TBD**

---

# 66. Security Boundary

Trust boundary:

```text
Browser = untrusted
Supabase RLS = primary data authorization
Workers = trusted only if secrets stored there
```

Tidak boleh mempercayai:

- role dari localStorage;
- hidden buttons;
- route protection saja.

---

# 67. Personal Data

Data siswa adalah data sensitif.

Prinsip:

- minimal collection;
- minimum exposure;
- role restricted;
- no public endpoint;
- no debug dump production.

---

# 68. Performance Target

Tidak ditetapkan angka formal dulu.

Namun prinsip:

- dashboard load cepat;
- grade page tetap responsive;
- bulk student table usable;
- report preview tidak freeze;
- mobile 4G/weak network tetap usable.

---

# 69. Scalability Path

MVP fokus satu sekolah.

Jika nanti berkembang:

Phase 1:
```text
single school per deployment
```

Phase 2:
```text
shared codebase template
automated provisioning
```

Phase 3:
```text
optional multi-tenant SaaS
```

Jangan lompat ke Phase 3 sekarang.

---

# 70. Architecture Decision Records

Untuk keputusan besar, tambahkan ADR.

Contoh:

```text
docs/adr/
  001-single-school-deployment.md
  002-supabase-auth-rls.md
  003-report-template-strategy.md
```

Format:

```text
Context
Decision
Consequences
Alternatives
```

---

# 71. Current Architecture Decisions

## Final

- Supabase backend/database/auth;
- Cloudflare hosting;
- GitHub repository;
- one school per deployment;
- mobile-first;
- role-based access;
- RLS;
- lower/upper primary separation;
- report template separated from data;
- Excel import;
- CP editable auto-description;
- leger derived output.

---

# 72. Current TBD

Belum final:

- exact PDF engine;
- exact schema;
- exact grading formula;
- exact report layout;
- exact PWA strategy;
- observability tool.

Frontend foundation yang sudah final:

```text
React + TypeScript + Vite
Tailwind
shadcn/ui
pnpm
Vitest
Testing Library
Playwright
```

---

# 73. Recommended Initial Folder Structure

```text
/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── schools/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── students/
│   │   ├── subjects/
│   │   ├── learning-outcomes/
│   │   ├── grades/
│   │   ├── reports/
│   │   └── leger/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── permissions/
│   ├── config/
│   ├── types/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── permissions.md
│   ├── report-templates.md
│   └── adr/
│
├── AGENTS.md
├── README.md
└── prd_rapor_sd_kelas_1-6_v0.4.md
```

---

# 74. Implementation Order

Recommended sequence:

## Phase 1 — Foundation

1. frontend scaffold;
2. Supabase project;
3. Auth;
4. role model;
5. school settings;
6. academic year;
7. semester.

## Phase 2 — Master Data

8. teachers;
9. classes;
10. students;
11. subjects;
12. teacher assignments;
13. Excel import.

## Phase 3 — Academic Core

14. learning outcomes;
15. assessment components;
16. grade entry;
17. description generation;
18. completeness engine.

## Phase 4 — Homeroom

19. attendance;
20. extracurricular;
21. achievements;
22. homeroom notes.

## Phase 5 — Output

23. leger;
24. lower primary report;
25. upper primary report;
26. preview;
27. print/PDF.

## Phase 6 — Hardening

28. RLS review;
29. testing;
30. mobile polish;
31. performance;
32. production deployment.

---

# 75. Architectural Guardrails

Developer dan AI agent harus menjaga aturan:

1. Jangan hardcode sekolah.
2. Jangan hardcode kurikulum.
3. Jangan bypass RLS.
4. Jangan masukkan service role ke frontend.
5. Jangan campur business logic ke component besar.
6. Jangan duplikasi core lower/upper primary.
7. Jangan membuat leger manual.
8. Jangan overwrite deskripsi guru.
9. Jangan menambahkan Worker tanpa alasan.
10. Jangan menambah scope di luar PRD.

---

# 76. Prinsip Evaluasi Arsitektur

Setiap keputusan teknis harus diuji dengan tiga pertanyaan:

### A. Apakah mudah digunakan guru dari HP?

Jika tidak, sederhanakan.

### B. Apakah aman walau frontend dimanipulasi?

Jika tidak, perbaiki RLS/authorization.

### C. Apakah perubahan format rapor bisa dilakukan tanpa membangun ulang semua modul?

Jika tidak, arsitektur terlalu terikat template.

---

# 77. Kesimpulan

Arsitektur aplikasi mengikuti pola:

```text
Mobile-first Web App
→ Application Layer
→ Business Logic
→ Supabase Services
→ PostgreSQL + RLS
```

dengan:

```text
lower_primary
upper_primary
```

sebagai strategi/template berbeda di atas core system yang sama.

Deployment tetap sederhana:

```text
GitHub
→ Cloudflare Pages
→ Supabase
```

Cloudflare Workers hanya ditambahkan bila ada kebutuhan server-side khusus.

Fokus utama arsitektur adalah:

- sederhana;
- aman;
- mudah dipelihara;
- mudah dipakai guru;
- ringan untuk koneksi terbatas;
- fleksibel terhadap perubahan format rapor.
