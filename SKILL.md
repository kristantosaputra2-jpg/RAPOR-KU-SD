# SKILL.md — Reusable AI Developer Prompt Library
**Project:** Aplikasi Rapor SD Kelas 1–6  
**Last Updated:** 2026-08-31  
**Purpose:** Kumpulan pola prompt/instruksi berulang untuk AI agent dan developer  
**Primary References:** `AGENTS.md`, `Architecture.md`, `TODO.md`, `prd_rapor_sd_kelas_1-6_v0.4.md`

---

# 1. Tujuan File

File ini menyimpan pola instruksi yang sering digunakan berulang kali saat mengembangkan proyek.

Gunakan file ini agar developer atau AI agent tidak perlu menulis ulang prompt untuk:

- testing;
- security review;
- refactor;
- performance review;
- database review;
- Supabase RLS review;
- report engine review;
- mobile UX review;
- low-bandwidth review;
- documentation;
- code quality;
- deployment review;
- debugging;
- migration review.

---

# 2. Cara Menggunakan

AI agent harus:

1. Baca `AGENTS.md`.
2. Baca `TODO.md`.
3. Baca PRD terbaru.
4. Pilih skill yang relevan dari file ini.
5. Isi placeholder yang diperlukan.
6. Jangan menjalankan scope di luar task aktif.
7. Update `TODO.md` setelah pekerjaan selesai.

Placeholder menggunakan format:

```text
{{PLACEHOLDER}}
```

Contoh:

```text
{{FILE}}
{{FUNCTION}}
{{FEATURE}}
{{ROUTE}}
{{TABLE}}
{{ROLE}}
```

---

# 3. Categories

- [Testing](#testing)
- [Security Review](#security-review)
- [Supabase & RLS](#supabase--rls)
- [Refactor](#refactor)
- [Performance](#performance)
- [Mobile & Low Bandwidth](#mobile--low-bandwidth)
- [Database](#database)
- [Report Engine](#report-engine)
- [Import Excel](#import-excel)
- [Debugging](#debugging)
- [Code Quality](#code-quality)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Migration Review](#migration-review)
- [Accessibility](#accessibility)
- [AI Agent Review](#ai-agent-review)

---

# Testing

## Unit Test Generator

```md
Buat unit test untuk fungsi berikut.

File:
{{FILE}}

Function:
{{FUNCTION}}

Periksa:
- happy path
- nilai kosong
- nilai minimum
- nilai maksimum
- invalid input
- edge case
- regression case

Gunakan test runner proyek.
Jangan mengubah business logic hanya agar test lolos.

Output:
1. daftar kasus yang diuji
2. test code
3. risiko yang belum tercakup
```

---

## Grade Calculation Test

```md
Review dan buat test untuk logic perhitungan nilai berikut:

{{FUNCTION_OR_FILE}}

Pastikan mencakup:
- nilai 0
- nilai 100
- satu nilai
- beberapa nilai
- semua nilai sama
- nilai kosong
- nilai invalid
- pembulatan
- hasil akhir
- predikat bila aktif

Bandingkan implementasi dengan requirement terbaru di PRD.
Jangan mengasumsikan formula baru jika belum didefinisikan.
```

---

## Description Engine Test

```md
Test fungsi pembuatan deskripsi CP.

Target:
{{FILE_OR_FUNCTION}}

Pastikan:
- strongest outcome dipilih benar
- weakest outcome dipilih benar
- hanya satu CP
- semua nilai sama
- CP kosong
- deskripsi generated tersimpan
- final description manual tidak tertimpa
- regenerate membutuhkan aksi eksplisit

Buat unit test dan jelaskan edge case yang masih belum tertangani.
```

---

## Integration Test Checklist

```md
Buat integration test untuk feature:

{{FEATURE}}

Periksa alur:
- authentication
- authorization
- database interaction
- validation
- error handling
- success state
- loading state
- audit/update timestamp

Jika feature berkaitan dengan nilai:
- create/read/update grade
- teacher assignment
- report completeness
- description generation

Jangan mock security rule yang justru perlu diuji.
```

---

## E2E Admin Flow

```md
Buat atau review E2E test untuk flow Admin:

Login
→ Pengaturan Sekolah
→ Tahun Ajaran
→ Semester
→ Guru
→ Kelas
→ Siswa
→ Mata Pelajaran
→ Teacher Assignment

Pastikan:
- halaman terlindungi
- validasi bekerja
- data tersimpan
- error tampil ramah
- mobile viewport tidak rusak

Gunakan Playwright bila stack final menggunakannya.
```

---

## E2E Subject Teacher Flow

```md
Buat E2E test untuk Guru Mata Pelajaran:

Login
→ Kelas yang ditugaskan
→ Mata pelajaran
→ Daftar seluruh siswa
→ Input nilai
→ Generate deskripsi
→ Edit deskripsi
→ Simpan

Test juga:
- tidak dapat membuka mapel lain
- tidak dapat mengedit kelas yang tidak ditugaskan
- nilai invalid ditolak
- save gagal ketika network error
```

---

## E2E Homeroom Flow

```md
Buat E2E test untuk Wali Kelas:

Login
→ Kelas Saya
→ Review kelengkapan
→ Absensi
→ Ekstrakurikuler
→ Prestasi
→ Catatan
→ Preview
→ Print

Pastikan semua status kelengkapan berubah sesuai data.
```

---

# Security Review

## Security Audit Prompt

```md
Lakukan security review pada:

{{TARGET}}

Periksa minimal:
- OWASP Top 10 yang relevan
- authentication
- authorization
- session management
- input validation
- sensitive data exposure
- insecure direct object reference
- privilege escalation
- unsafe file upload
- secret exposure
- XSS
- CSRF jika relevan
- SQL/database abuse
- client-side trust

Khusus proyek ini:
- jangan percaya role dari localStorage
- jangan bypass Supabase RLS
- service role key tidak boleh di frontend
- data siswa tidak boleh publicly accessible

Output:
1. Critical
2. High
3. Medium
4. Low
5. Recommended fixes
```

---

## Sensitive Data Review

```md
Review feature berikut dari perspektif data siswa:

{{FEATURE}}

Periksa:
- data apa yang dikumpulkan
- apakah semua field diperlukan
- siapa yang dapat melihat
- siapa yang dapat mengubah
- apakah data tampil di log
- apakah data tampil di URL
- apakah export aman
- apakah Storage bucket public
- apakah query terlalu luas

Prinsip:
collect minimum, expose minimum, authorize explicitly.
```

---

# Supabase & RLS

## RLS Policy Review

```md
Review RLS policy untuk tabel:

{{TABLE}}

Role terkait:
{{ROLE}}

Periksa:
- SELECT
- INSERT
- UPDATE
- DELETE
- teacher assignment
- class ownership
- subject ownership
- academic year
- semester

Pastikan frontend manipulation tidak dapat melewati policy.

Buat test matrix:

| Role | Select | Insert | Update | Delete |
|---|---|---|---|---|

Jelaskan potensi privilege escalation.
```

---

## Subject Teacher RLS

```md
Pastikan Guru Mata Pelajaran hanya dapat mengakses grade entry jika:

- user terhubung ke teacher profile
- teacher memiliki assignment aktif
- assignment sesuai class_id
- assignment sesuai subject_id
- assignment sesuai academic_year_id
- assignment sesuai semester_id

Review query dan policy yang ada.

Jangan hanya memeriksa role = subject_teacher.
```

---

## Homeroom RLS

```md
Review akses Wali Kelas.

Wali kelas boleh:
- melihat siswa kelas sendiri
- melihat nilai mapel kelas sendiri untuk monitoring
- mengisi attendance
- extracurricular
- achievement
- homeroom note
- report status

Tidak boleh:
- mengubah nilai mapel guru lain
- mengubah kelas lain

Pastikan RLS mencerminkan rule tersebut.
```

---

# Refactor

## Safe Refactor Prompt

```md
Refactor:

{{TARGET}}

Tujuan:
{{GOAL}}

Aturan:
- jangan ubah behavior
- jangan ubah API public tanpa kebutuhan
- jangan mengubah schema
- jangan memperluas scope
- pertahankan test
- tambahkan test jika behavior belum terlindungi
- hindari refactor file tidak terkait

Output:
1. masalah saat ini
2. refactor plan
3. patch
4. test yang dijalankan
5. risiko
```

---

## Large Component Refactor

```md
Review component:

{{FILE}}

Pisahkan bila component mencampur:
- query database
- business logic
- form state
- rendering
- report formatting
- permission checking

Target architecture:

UI
→ hook/application logic
→ service
→ domain utility

Jangan membuat abstraction baru jika tidak mengurangi kompleksitas.
```

---

## Business Logic Extraction

```md
Cari business logic di file:

{{FILE}}

Ekstrak logic seperti:
- grade calculation
- predicate
- description
- completeness
- report transformation
- permission

ke module yang:
- pure jika memungkinkan
- typed
- testable
- reusable

Jangan pindahkan code hanya demi folder structure.
```

---

# Performance

## Performance Review

```md
Lakukan performance review pada:

{{PAGE_OR_FEATURE}}

Periksa:
- bundle size
- repeated render
- N+1 query
- select *
- duplicate network request
- oversized image
- unnecessary realtime subscription
- blocking calculation
- large table rendering
- report rendering
- mobile performance

Prioritaskan koneksi lambat dan HP kelas menengah/rendah.

Output:
- bottleneck
- severity
- recommended fix
- estimated impact
```

---

## Supabase Query Review

```md
Review query Supabase:

{{QUERY_OR_FILE}}

Periksa:
- select hanya field yang dibutuhkan
- filter server-side
- index yang diperlukan
- N+1 pattern
- pagination
- batch operation
- duplicated request
- unnecessary join
- RLS impact

Jangan optimasi prematur jika dataset kecil dan code sudah jelas.
```

---

# Mobile & Low Bandwidth

## Mobile UX Review

```md
Review halaman:

{{PAGE}}

Viewport:
- 360px
- 390px
- 768px
- 1280px

Periksa:
- touch target
- text readability
- table overflow
- sticky element
- input usability
- modal/drawer
- keyboard mobile
- button position
- no hover dependency
- long student names

Prioritaskan flow guru mengisi nilai dari HP.
```

---

## Grade Table Mobile Review

```md
Review tabel input nilai.

Requirement:
- seluruh siswa tetap terlihat
- tidak membuka satu siswa per halaman
- horizontal scroll tidak berlebihan
- nama siswa mudah dilacak
- save status jelas

Pertimbangkan:
- sticky nama siswa
- compact columns
- grouped fields
- drawer detail
- responsive table

Jangan mengurangi usability desktop hanya demi mobile.
```

---

## Slow Network Review

```md
Simulasikan koneksi lambat pada feature:

{{FEATURE}}

Periksa:
- loading
- duplicate submit
- save indicator
- timeout
- retry
- stale UI
- optimistic update
- data loss
- error message

User tidak boleh melihat status "tersimpan" sebelum server benar-benar menerima data.
```

---

# Database

## Schema Review

```md
Review schema untuk domain:

{{DOMAIN}}

Periksa:
- normalization
- foreign key
- unique constraint
- nullable field
- audit field
- academic year scope
- semester scope
- historical data
- indexing
- RLS compatibility

Jangan desain tabel berdasarkan layout PDF.
```

---

## Table Design Prompt

```md
Buat rancangan tabel untuk:

{{FEATURE}}

Gunakan prinsip:
- snake_case
- UUID
- created_at
- updated_at
- explicit FK
- no school hardcode
- no curriculum hardcode
- historical-safe
- RLS-friendly

Output:
1. table
2. columns
3. constraints
4. indexes
5. relationships
6. RLS notes
7. open questions
```

---

# Report Engine

## Report View Model Review

```md
Review report pipeline:

database
→ query
→ view model
→ template
→ print/PDF

Target:
{{REPORT_TYPE}}

Pastikan template tidak melakukan:
- query database
- grade calculation
- permission logic
- description generation

Template hanya menerima data siap render.
```

---

## Lower Primary Report Review

```md
Review template rapor `lower_primary`.

Target:
kelas 1–3

Periksa:
- school identity
- student identity
- mapel
- nilai
- CP/deskripsi
- extracurricular
- achievement
- attendance
- homeroom note
- signature
- page break
- long text
- empty value

Bandingkan dengan PRD terbaru.
```

---

## Upper Primary Report Review

```md
Review template rapor `upper_primary`.

Target:
kelas 4–6

Periksa:
- support assessment components
- final grade
- predicate bila aktif
- CP
- generated/final description
- leger consistency
- print layout
- long table

Jangan hardcode istilah Pengetahuan/Keterampilan jika template tidak membutuhkannya.
```

---

## Report Completeness Review

```md
Review `report completeness`.

Pastikan status dihitung dari rule, bukan disimpan manual tanpa alasan.

Check:
- identity
- grades
- description
- attendance
- extracurricular
- achievement
- homeroom note

Status:
- not_started
- partial
- complete
- ready_to_print
```

---

# Import Excel

## Excel Import Review

```md
Review import Excel siswa.

Pipeline wajib:

Upload
→ Parse
→ Map Column
→ Validate
→ Preview
→ Confirm
→ Insert

Periksa:
- duplicate NIS
- duplicate NISN
- invalid date
- empty name
- wrong column mapping
- malformed workbook
- duplicate candidate
- partial insert

Jangan insert data sebelum preview + confirmation.
```

---

## Excel Error UX

```md
Review UX error import Excel.

Error harus:
- menunjuk nomor baris
- menunjuk kolom
- menjelaskan masalah
- memberi saran perbaikan

Contoh:

Baris 12 — NISN sudah digunakan oleh siswa lain.

Jangan hanya menampilkan "Import failed".
```

---

# Debugging

## Bug Investigation Prompt

```md
Investigasi bug:

{{BUG}}

Langkah:
1. reproduksi
2. identifikasi expected behavior
3. identifikasi actual behavior
4. cari root cause
5. cek regression
6. buat minimal fix
7. tambah test
8. update TODO jika relevan

Jangan menebak root cause sebelum memeriksa code.
```

---

## Production Bug Review

```md
Ada bug production:

{{BUG}}

Prioritas:
1. data integrity
2. security
3. user impact
4. rollback possibility

Jangan langsung refactor besar.

Buat:
- containment
- fix
- test
- migration jika perlu
- rollback plan
```

---

# Code Quality

## Code Review Prompt

```md
Review perubahan code berikut:

{{TARGET}}

Periksa:
- correctness
- readability
- TypeScript
- naming
- duplication
- business logic placement
- error handling
- loading state
- validation
- security
- tests
- mobile impact
- performance

Kelompokkan temuan:
- Must Fix
- Should Fix
- Nice to Have
```

---

## TypeScript Review

```md
Review TypeScript:

{{FILE}}

Periksa:
- any
- unsafe cast
- nullable handling
- duplicated types
- missing return types
- API response typing
- database type mismatch

Jangan menambah type abstraction yang tidak memberi nilai.
```

---

## Comment Review

```md
Review komentar di:

{{FILE}}

Hapus komentar yang hanya mengulang kode.

Pertahankan komentar yang menjelaskan:
- business rule
- security reason
- workaround
- unusual decision
- why manual teacher edit must be preserved

Gunakan komentar singkat dan actionable.
```

---

# Documentation

## README Update

```md
Update README untuk perubahan:

{{CHANGE}}

README hanya memuat:
- project overview
- prerequisites
- setup
- environment
- dev commands
- test commands
- deployment reference

Detail architecture jangan dipindahkan seluruhnya ke README.
```

---

## Architecture Update

```md
Perubahan ini memengaruhi architecture:

{{CHANGE}}

Review `Architecture.md`.

Update hanya bagian yang benar-benar berubah.

Jika keputusan signifikan dan sulit dibalik, buat ADR.
```

---

## ADR Generator

```md
Buat Architecture Decision Record untuk:

{{DECISION}}

Format:

# ADR-XXX — Title

## Status

Proposed / Accepted / Deprecated

## Context

## Decision

## Alternatives Considered

## Consequences

## Migration / Rollback

Jelaskan trade-off, bukan hanya keputusan akhir.
```

---

# Deployment

## Pre-Deploy Review

```md
Review sebelum production deploy.

Periksa:
- build
- typecheck
- lint
- tests
- migrations
- RLS
- environment variables
- secrets
- school config
- academic year
- semester
- teacher assignment
- mobile smoke test
- report preview
- print

Jangan deploy jika migration atau RLS belum diverifikasi.
```

---

## Cloudflare Deployment Review

```md
Review Cloudflare deployment.

Periksa:
- build command
- output directory
- environment variables
- domain
- HTTPS
- cache behavior
- SPA routing
- production build
- rollback path

Cloudflare Worker hanya digunakan jika benar-benar dibutuhkan.
```

---

# Migration Review

## Database Migration Review

```md
Review migration:

{{MIGRATION}}

Periksa:
- destructive change
- data loss
- nullable transition
- default
- foreign key
- index
- RLS
- historical report impact
- rollback

Prefer additive migration.

Jangan hapus historical data karena template berubah.
```

---

# Accessibility

## Accessibility Review

```md
Review accessibility halaman:

{{PAGE}}

Periksa:
- semantic HTML
- label form
- keyboard
- focus state
- aria
- icon-only button
- color contrast
- status tidak hanya warna
- table accessibility

Prioritaskan flow utama pengguna.
```

---

# AI Agent Review

## Before Coding Prompt

```md
Sebelum coding feature:

{{FEATURE}}

Lakukan:
1. baca PRD
2. baca AGENTS.md
3. baca Architecture.md
4. baca TODO.md
5. cari implementation existing
6. identifikasi scope
7. identifikasi dependency
8. identifikasi open question

Jangan coding jika requirement penting masih ambigu.
```

---

## Scope Guard Prompt

```md
Review task berikut:

{{TASK}}

Tentukan:
- in scope
- out of scope
- dependency
- TBD
- risiko

Jangan menambahkan feature baru hanya karena terlihat berguna.
```

---

## Completion Review

```md
Sebelum menandai task selesai:

{{TASK}}

Periksa:
- requirement terpenuhi
- code selesai
- typecheck
- lint
- test
- permission
- loading
- error
- mobile
- no secret
- migration bila perlu
- TODO.md updated
- documentation updated bila behavior berubah

Task belum done jika hanya "kode sudah ditulis".
```

---

# Reusable Project-Specific Skills

## Build New Feature

```md
Implement feature:

{{FEATURE}}

Ikuti:
- PRD terbaru
- AGENTS.md
- Architecture.md
- TODO.md

Workflow:
1. pahami requirement
2. cek existing code
3. desain minimal patch
4. implement domain logic
5. implement data access
6. implement UI
7. permission
8. validation
9. loading/error state
10. mobile
11. tests
12. update TODO

Jangan memperluas scope.
```

---

## Review Existing Feature

```md
Audit feature:

{{FEATURE}}

Bandingkan:
- requirement PRD
- implementation
- permission
- UX
- mobile
- test
- error handling
- performance

Output:
1. compliant
2. missing
3. bug
4. technical debt
5. recommended next task
```

---

## Prepare Feature for Production

```md
Persiapkan feature untuk production:

{{FEATURE}}

Checklist:
- functional
- edge cases
- auth
- RLS
- error state
- loading state
- mobile
- slow network
- audit
- test
- accessibility
- print/export bila relevan
- docs
- TODO

Jangan menyatakan production-ready jika ada critical/high issue.
```

---

# Quick Commands

## Quick Security Review

```md
Gunakan skill Security Audit pada {{TARGET}}.
Fokus hanya temuan Critical dan High.
```

## Quick Test Review

```md
Gunakan skill Unit Test Generator pada {{FUNCTION}}.
Fokus edge case dan regression.
```

## Quick Refactor

```md
Gunakan Safe Refactor pada {{TARGET}}.
Behavior harus tetap sama.
```

## Quick Performance

```md
Gunakan Performance Review pada {{PAGE_OR_FEATURE}}.
Prioritaskan mobile dan koneksi lambat.
```

## Quick RLS Review

```md
Gunakan RLS Policy Review pada {{TABLE}} untuk role {{ROLE}}.
```

## Quick Report Review

```md
Gunakan Report View Model Review pada {{REPORT_TYPE}}.
```

---

# Skill Maintenance Rules

1. Tambahkan skill hanya jika pola instruksi benar-benar berulang.
2. Jangan menambahkan prompt sekali pakai.
3. Hindari skill yang tumpang tindih.
4. Jika dua skill hampir sama, gabungkan.
5. Gunakan placeholder agar reusable.
6. Update skill jika architecture berubah.
7. Jangan menyimpan secret, credential, atau data siswa nyata.
8. Skill harus tetap konsisten dengan `AGENTS.md`.
9. Skill tidak boleh mengubah requirement produk.
10. Jika skill bertentangan dengan PRD terbaru, PRD terbaru menang.

---

# Current Skill Inventory

| Category | Skill | Purpose |
|---|---|---|
| Testing | Unit Test Generator | Membuat unit test |
| Testing | Grade Calculation Test | Menguji formula nilai |
| Testing | Description Engine Test | Menguji CP/deskripsi |
| Testing | Integration Test Checklist | Menguji integrasi |
| Testing | E2E Admin Flow | Flow admin |
| Testing | E2E Subject Teacher Flow | Flow guru mapel |
| Testing | E2E Homeroom Flow | Flow wali kelas |
| Security | Security Audit Prompt | Audit security umum |
| Security | Sensitive Data Review | Review data siswa |
| Supabase | RLS Policy Review | Audit policy |
| Supabase | Subject Teacher RLS | Akses guru mapel |
| Supabase | Homeroom RLS | Akses wali kelas |
| Refactor | Safe Refactor | Refactor aman |
| Refactor | Large Component Refactor | Pecah component besar |
| Refactor | Business Logic Extraction | Pisahkan business logic |
| Performance | Performance Review | Audit performa |
| Performance | Supabase Query Review | Optimasi query |
| Mobile | Mobile UX Review | Review UI mobile |
| Mobile | Grade Table Mobile Review | Input nilai di HP |
| Mobile | Slow Network Review | Koneksi lemah |
| Database | Schema Review | Audit schema |
| Database | Table Design Prompt | Desain tabel |
| Report | Report View Model Review | Arsitektur report |
| Report | Lower Primary Report Review | Review kelas 1–3 |
| Report | Upper Primary Report Review | Review kelas 4–6 |
| Report | Report Completeness Review | Kelengkapan rapor |
| Import | Excel Import Review | Import siswa |
| Import | Excel Error UX | Error import |
| Debugging | Bug Investigation Prompt | Investigasi bug |
| Debugging | Production Bug Review | Bug production |
| Code Quality | Code Review Prompt | Review code |
| Code Quality | TypeScript Review | Review type |
| Code Quality | Comment Review | Review komentar |
| Documentation | README Update | Update README |
| Documentation | Architecture Update | Update architecture |
| Documentation | ADR Generator | Buat ADR |
| Deployment | Pre-Deploy Review | Checklist deploy |
| Deployment | Cloudflare Deployment Review | Review Cloudflare |
| Migration | Database Migration Review | Review migration |
| Accessibility | Accessibility Review | Audit accessibility |
| AI Agent | Before Coding Prompt | Persiapan coding |
| AI Agent | Scope Guard Prompt | Jaga scope |
| AI Agent | Completion Review | Validasi selesai |
| Project | Build New Feature | Implementasi feature |
| Project | Review Existing Feature | Audit feature |
| Project | Prepare Feature for Production | Production readiness |

---

# Project Principle

Gunakan skill ini dengan satu pertanyaan utama:

> Apakah perubahan ini membuat aplikasi lebih aman, lebih mudah dipakai guru dari HP, dan tetap fleksibel terhadap perubahan format rapor?

Jika tidak, evaluasi kembali pendekatannya.
