# workflow.md — Development Workflow & AI Operating Rules
**Project:** Aplikasi Rapor SD Kelas 1–6  
**Last Updated:** 2026-08-31  
**Purpose:** Aturan kerja AI agent dan developer selama pengembangan proyek  
**References:** `PRD`, `AGENTS.md`, `Architecture.md`, `TODO.md`, `SKILL.md`

---

# 1. Tujuan File

File ini menentukan cara AI agent dan developer bekerja di proyek ini.

Tujuannya agar jelas:

- kapan AI boleh bekerja tanpa meminta izin;
- kapan AI wajib meminta konfirmasi;
- kapan AI harus berhenti;
- bagaimana perubahan dilakukan;
- bagaimana progres dilaporkan;
- kapan sebuah fitur dianggap selesai;
- bagaimana menjaga scope;
- bagaimana mencegah perubahan besar yang tidak disengaja.

File ini adalah aturan operasional harian proyek.

---

# 2. Prinsip Umum

1. Fokus pada hasil yang benar dan dapat diuji.
2. Jangan memperluas scope tanpa alasan.
3. Prioritaskan keamanan data siswa.
4. Prioritaskan pengalaman guru di HP.
5. Pertahankan arsitektur yang sederhana.
6. Jangan membuat perubahan besar hanya demi “rapi”.
7. Dokumentasikan keputusan penting.
8. Update `TODO.md` sesuai kondisi repository sebenarnya.
9. Jangan menyatakan selesai sebelum test relevan dilakukan.
10. Jika requirement penting tidak jelas, tanyakan.

---

# 3. Urutan Dokumen yang Harus Dibaca

Sebelum coding, AI agent harus membaca dokumen berikut sesuai kebutuhan:

1. `TODO.md`
2. `AGENTS.md`
3. PRD terbaru
4. `Architecture.md`
5. `SKILL.md` untuk pola kerja yang relevan

Jika task menyentuh laporan/rapor:
- baca bagian report architecture;
- baca template/rule yang terkait.

Jika task menyentuh database:
- baca database/permission docs jika sudah tersedia.

---

# 4. Kapan Wajib Minta Izin

AI/developer wajib meminta izin sebelum melakukan perubahan berikut.

## 4.1 Perubahan Scope Produk

Contoh:

- menambahkan portal orang tua;
- menambahkan WhatsApp;
- integrasi Dapodik;
- menambahkan AI chatbot;
- menambahkan fitur pembayaran;
- mengubah MVP.

Jika tidak ada di PRD:
**jangan langsung bangun.**

---

## 4.2 Mengubah Database Schema yang Signifikan

Minta izin sebelum:

- menghapus tabel;
- menghapus kolom;
- rename kolom yang digunakan luas;
- mengubah relasi utama;
- mengubah tipe data yang berpotensi merusak data;
- membuat migration destructive;
- mengubah struktur nilai yang sudah digunakan.

Perubahan additive kecil yang memang bagian task aktif boleh dilakukan sesuai migration workflow bila arsitektur sudah disetujui.

---

# 5. Menghapus Data atau File

Wajib minta izin sebelum:

- menghapus data production;
- bulk delete;
- truncate;
- menghapus migration;
- menghapus fitur;
- menghapus folder besar;
- menghapus file yang mungkin masih dipakai;
- reset database.

Jika belum yakin file tidak digunakan:
jangan hapus.

---

# 6. Dependency dan Framework

Minta izin sebelum:

- mengganti frontend framework;
- mengganti database;
- mengganti auth provider;
- mengganti hosting;
- mengganti UI library utama;
- mengganti test framework utama;
- menambah dependency besar yang mengubah architecture.

Dependency kecil boleh ditambah bila:

- benar-benar dibutuhkan;
- scope jelas;
- tidak ada alternatif sederhana;
- maintenance baik;
- security reasonable.

Tetap jelaskan pada laporan pekerjaan.

---

# 7. Deployment Production

Wajib minta izin sebelum:

- deploy pertama kali ke production;
- menjalankan migration production yang berisiko;
- mengubah domain;
- mengganti environment variable penting;
- mengubah RLS policy production secara besar;
- mengaktifkan fitur yang memengaruhi user nyata.

AI boleh:

- build;
- test;
- deploy preview/staging;

tanpa izin tambahan jika workflow proyek memang sudah mengizinkannya.

---

# 8. Security-Critical Changes

Wajib meminta review/izin sebelum:

- menggunakan service role key;
- membuat endpoint privileged;
- menonaktifkan RLS;
- membuat bucket public;
- membuka data siswa tanpa authorization;
- mengubah auth flow utama;
- menyimpan secret baru.

Jangan pernah menonaktifkan security untuk “sementara” di production.

---

# 9. Perubahan yang Berpotensi Merusak Data

Minta izin sebelum:

- bulk update;
- recalculation seluruh nilai;
- overwrite deskripsi manual;
- regenerate semua rapor;
- overwrite import besar;
- rollback schema;
- restore backup.

Jika perubahan bisa irreversible:
jelaskan risikonya terlebih dahulu.

---

# 10. Kapan AI Boleh Jalan Sendiri

AI boleh melanjutkan tanpa meminta izin untuk task yang jelas, kecil, dan sesuai scope.

Contoh:

- membuat file baru yang memang diminta;
- membuat component baru;
- membuat utility;
- menambah unit test;
- memperbaiki typo;
- memperbaiki bug terisolasi;
- memperbaiki error TypeScript;
- memperbaiki lint;
- memperbaiki styling minor;
- menambah loading state;
- menambah error handling;
- memperbarui dokumentasi;
- menambah test coverage;
- menjalankan build/test/lint;
- refactor kecil tanpa mengubah behavior;
- membuat migration additive yang sudah sesuai architecture dan task.

---

# 11. Refactor Rules

Refactor boleh dilakukan tanpa izin jika:

- scope kecil;
- behavior sama;
- test tetap lolos;
- tidak mengubah API public;
- tidak mengubah schema;
- tidak mengubah permission;
- tidak menyentuh area yang tidak terkait.

Jika refactor mulai melebar:
berhenti dan evaluasi ulang.

---

# 12. Bug Fix Rules

Untuk bug kecil dan jelas:

AI boleh:

1. reproduksi;
2. cari root cause;
3. buat minimal fix;
4. tambah regression test;
5. jalankan test;
6. update TODO.

Untuk bug production yang menyangkut data/security:
ikuti workflow khusus production bug dan minta review bila perlu.

---

# 13. Kapan Harus Berhenti dan Bertanya

Berhenti jika:

- requirement memiliki dua interpretasi penting;
- formula nilai belum final;
- struktur rapor belum jelas;
- perubahan akan mengubah data lama;
- ada conflict antara PRD dan implementation;
- ditemukan security risk besar;
- migration destructive;
- task membutuhkan credential yang tidak tersedia;
- test menunjukkan behavior yang tidak sesuai requirement;
- perubahan memengaruhi banyak modul di luar task.

Jangan mengarang keputusan produk.

---

# 14. Scope Control

Setiap task harus memiliki boundary.

Contoh task:

> Tambahkan import siswa dari Excel.

Scope:

- upload;
- parse;
- mapping;
- validation;
- preview;
- insert;
- test.

Tidak termasuk:

- redesign dashboard;
- refactor auth;
- menambah QR;
- mengubah report engine.

Jika menemukan improvement di luar scope:
tambahkan ke `TODO.md`, jangan langsung dikerjakan.

---

# 15. Workflow Memulai Task

Saat mulai task:

1. baca `TODO.md`;
2. cari task;
3. ubah status `[ ]` menjadi `[/]`;
4. baca requirement;
5. identifikasi file terkait;
6. cek implementation existing;
7. pilih skill dari `SKILL.md`;
8. buat rencana kecil;
9. implementasi.

---

# 16. Workflow Implementasi

Gunakan urutan:

```text
Requirement
↓
Existing Code Review
↓
Minimal Design
↓
Domain Logic
↓
Data Access
↓
UI
↓
Permission
↓
Validation
↓
Error / Loading
↓
Mobile Check
↓
Tests
↓
Documentation
↓
TODO Update
```

Tidak semua task membutuhkan semua layer, tetapi urutan ini menjadi panduan.

---

# 17. Development Rule: Small Patches

Prefer perubahan kecil.

Buruk:

> “Sekalian saya refactor seluruh project.”

Baik:

> “Saya hanya mengubah grade service, test, dan component yang menggunakan service tersebut.”

Keuntungan:

- mudah direview;
- mudah rollback;
- risiko kecil;
- AI lebih mudah menjaga konteks.

---

# 18. Satu Task Satu Tujuan

Satu task sebaiknya menyelesaikan satu tujuan utama.

Contoh bagus:

```text
feat: add student import preview
```

Contoh buruk:

```text
feat: import, redesign dashboard, refactor auth, change report layout
```

---

# 19. Status TODO

Gunakan:

```text
[ ] Todo
[/] In Progress
[x] Done
[*] Blocked
[-] Cancelled
```

Jangan gunakan `[x]` jika:

- test belum jalan;
- feature belum terintegrasi;
- permission belum benar;
- masih ada bug utama.

---

# 20. Blocked Task

Jika task blocked:

ubah:

```text
[ ] task
```

menjadi:

```text
[*] task
```

Tambahkan catatan singkat:

```text
Blocked: menunggu keputusan formula nilai final.
```

Jangan membuat asumsi hanya untuk membuka blocker.

---

# 21. Cancelled Task

Gunakan `[-]` jika:

- scope berubah;
- feature tidak jadi dibuat;
- diganti solusi lain.

Tambahkan alasan bila tidak obvious.

---

# 22. Definition of Done — Umum

Task dianggap selesai jika:

- requirement terpenuhi;
- code berjalan;
- typecheck lolos;
- lint lolos;
- test relevan lolos;
- permission benar;
- loading state ada jika perlu;
- error state ada;
- mobile diperiksa jika UI;
- tidak ada secret;
- migration ada jika schema berubah;
- docs diperbarui bila perlu;
- `TODO.md` diperbarui.

---

# 23. Definition of Done — UI Feature

UI selesai jika:

- desktop usable;
- HP usable;
- loading jelas;
- error jelas;
- empty state tersedia;
- form validation tersedia;
- keyboard/input mobile masuk akal;
- permission state benar;
- responsive.

Test viewport:

```text
360px
390px
768px
1280px
```

---

# 24. Definition of Done — Database Feature

Database feature selesai jika:

- migration ada;
- foreign key benar;
- constraint benar;
- RLS aktif;
- policy ditest;
- index dipertimbangkan;
- data historical aman;
- tidak ada service role leak.

---

# 25. Definition of Done — Grade Feature

Feature nilai selesai jika:

- nilai valid;
- empty state benar;
- range benar;
- formula sesuai requirement;
- permission guru benar;
- save status benar;
- error tidak menyebabkan kehilangan data;
- description flow benar;
- unit test tersedia.

---

# 26. Definition of Done — Report Feature

Report feature selesai jika:

- data benar;
- preview benar;
- template tidak mengandung business logic;
- A4 benar;
- page break benar;
- nama panjang ditest;
- deskripsi panjang ditest;
- data kosong ditest;
- lower/upper primary benar;
- print tested.

---

# 27. Definition of Done — Import Excel

Import selesai jika:

- upload bekerja;
- parse bekerja;
- mapping ada;
- validation ada;
- preview ada;
- duplicate detection ada;
- error per-row ada;
- confirmation ada;
- batch insert benar;
- partial failure tertangani;
- test file valid dan invalid.

---

# 28. Testing Workflow

Setelah implementasi:

1. unit test;
2. integration test;
3. permission test;
4. E2E jika critical flow;
5. manual smoke test;
6. mobile check jika UI;
7. print check jika report.

Jangan menjalankan test irrelevant hanya untuk terlihat lengkap.

---

# 29. Security Workflow

Jika feature menyentuh data:

1. cek authentication;
2. cek role;
3. cek assignment;
4. cek RLS;
5. cek validation;
6. cek data exposure;
7. cek log;
8. cek export.

Untuk file upload:
tambahkan file validation.

---

# 30. RLS Workflow

Setiap tabel baru:

1. buat tabel;
2. buat FK;
3. enable RLS;
4. buat policy;
5. test admin;
6. test wali;
7. test guru mapel;
8. test anonymous.

Jangan menunda RLS sampai akhir proyek.

---

# 31. Migration Workflow

Setiap schema change:

```text
design
↓
migration
↓
dev apply
↓
test
↓
review
↓
production approval
↓
production apply
```

Destructive migration:
selalu minta izin.

---

# 32. Import Data Workflow

Untuk import besar:

```text
upload
↓
parse
↓
validate
↓
preview
↓
user confirm
↓
insert
↓
result summary
```

Jangan auto-insert langsung.

---

# 33. Report Workflow

```text
source data
↓
query
↓
view model
↓
template
↓
preview
↓
print
```

Jika hasil salah:
debug dari source data ke atas.

Jangan memasukkan logic calculation ke template print.

---

# 34. Description Workflow

```text
grade
↓
learning outcome
↓
strongest/weakest
↓
generated description
↓
teacher edit
↓
final description
```

Rule:

manual edit tidak boleh tertimpa tanpa persetujuan.

---

# 35. Git Workflow

Branch recommendation:

```text
feature/*
fix/*
refactor/*
docs/*
test/*
```

Contoh:

```text
feature/student-import
fix/grade-save-error
docs/update-architecture
```

---

# 36. Commit Workflow

Gunakan commit kecil dan jelas.

Format rekomendasi:

```text
feat:
fix:
refactor:
test:
docs:
chore:
```

Contoh:

```text
feat: add report completeness status
```

---

# 37. Pull Request Workflow

PR harus berisi:

```text
What changed?
Why?
How tested?
Security impact?
Database migration?
Mobile impact?
Report impact?
```

PR jangan terlalu besar jika bisa dipisah.

---

# 38. Review Workflow

Reviewer fokus pada:

1. correctness;
2. security;
3. data integrity;
4. requirement;
5. mobile;
6. maintainability;
7. test;
8. performance.

Style minor tidak boleh mengalahkan bug logic/security.

---

# 39. Documentation Workflow

Update docs jika:

- architecture berubah;
- schema berubah;
- permission berubah;
- report rule berubah;
- deployment berubah;
- setup berubah.

Tidak perlu update docs untuk typo kecil.

---

# 40. TODO Workflow

Setelah task:

```text
[/] → [x]
```

Jika menemukan follow-up:

tambahkan task baru.

Contoh:

```text
[ ] Tambahkan pagination data siswa
```

Jangan menyembunyikan technical debt.

---

# 41. Progress Reporting

Setelah menyelesaikan pekerjaan, laporan harus singkat tapi jelas.

Format:

```text
Selesai:
- ...
- ...

Test:
- ...

Belum:
- ...

TODO diperbarui:
- ya/tidak
```

Jangan hanya mengatakan:

> selesai.

---

# 42. Assumption Reporting

Jika membuat asumsi kecil:

laporkan.

Contoh:

```text
Asumsi: nilai menggunakan rentang 0–100 karena requirement saat ini.
```

Jika asumsi memengaruhi produk besar:
jangan lanjut tanpa konfirmasi.

---

# 43. Dependency Reporting

Jika menambah dependency:

laporkan:

```text
Package:
Reason:
Alternative considered:
Impact:
```

Jangan menambah package tanpa alasan.

---

# 44. Error Reporting

Jika task gagal:

jangan menyembunyikan.

Laporkan:

```text
Error:
Root cause:
What was tried:
Current status:
Recommended next step:
```

---

# 45. Production Workflow

Sebelum production:

1. typecheck;
2. lint;
3. unit test;
4. integration;
5. RLS review;
6. migration review;
7. build;
8. mobile smoke;
9. report/print smoke;
10. environment check;
11. approval;
12. deploy.

---

# 46. Rollback Workflow

Sebelum perubahan berisiko:

tentukan rollback.

Frontend:

```text
previous Cloudflare deployment
```

Database:

```text
migration correction / rollback strategy
```

Jangan deploy destructive change tanpa recovery plan.

---

# 47. Hotfix Workflow

Untuk critical bug:

```text
identify
↓
contain
↓
minimal fix
↓
test
↓
deploy
↓
follow-up root-cause review
```

Jangan melakukan refactor besar dalam hotfix.

---

# 48. Technical Debt Workflow

Technical debt dicatat di `TODO.md`.

Gunakan prioritas.

Jangan diam-diam memperbaiki technical debt besar saat task lain kecuali memang blocker.

---

# 49. AI Agent — Before Work Checklist

```text
[ ] Baca TODO
[ ] Baca AGENTS
[ ] Baca requirement
[ ] Baca Architecture jika relevan
[ ] Pilih skill
[ ] Cek existing code
[ ] Scope jelas
[ ] Tidak ada blocker
```

---

# 50. AI Agent — During Work Checklist

```text
[ ] Patch tetap kecil
[ ] Tidak memperluas scope
[ ] Security tidak dibypass
[ ] Business logic tidak masuk UI tanpa alasan
[ ] Error ditangani
[ ] Loading ditangani
[ ] Mobile dipertimbangkan
[ ] Test dibuat bila perlu
```

---

# 51. AI Agent — Completion Checklist

```text
[ ] Requirement selesai
[ ] Typecheck
[ ] Lint
[ ] Test
[ ] Permission
[ ] Mobile
[ ] Error state
[ ] No secret
[ ] Migration
[ ] Docs
[ ] TODO
```

---

# 52. Kapan AI Tidak Perlu Bertanya

Tidak perlu bertanya untuk:

- naming internal yang konsisten;
- lokasi file berdasarkan architecture;
- format test sesuai project;
- penambahan error state standar;
- penambahan unit test;
- perbaikan TypeScript;
- dokumentasi kecil;
- lint;
- build;
- typo;
- safe refactor kecil.

Gunakan best judgement.

---

# 53. Kapan AI Harus Bertanya

Harus bertanya jika menentukan:

- formula nilai;
- struktur rapor baru;
- perubahan permission;
- perubahan schema besar;
- data yang wajib tampil di rapor;
- behavior bisnis yang belum ada di PRD;
- dependency/framework utama;
- production destructive operation.

---

# 54. Feature Approval Rule

Feature baru dianggap approved jika:

- terdapat di PRD;
- atau user secara eksplisit meminta;
- atau sudah ditambahkan sebagai requirement resmi.

Ide developer sendiri tidak otomatis menjadi requirement.

---

# 55. Product Principle

Setiap implementasi harus lolos pertanyaan:

> Apakah guru SD dengan skill IT terbatas bisa memahami ini tanpa tutorial teknis panjang?

Jika tidak:
sederhanakan UX.

---

# 56. Security Principle

Setiap implementasi harus lolos:

> Jika user memanipulasi frontend, apakah data tetap aman?

Jika tidak:
perbaiki backend/RLS.

---

# 57. Architecture Principle

Setiap implementasi harus lolos:

> Jika format rapor berubah tahun depan, apakah kita bisa menyesuaikan tanpa membangun ulang semua modul?

Jika tidak:
kurangi hardcode.

---

# 58. Performance Principle

Setiap UI penting harus lolos:

> Apakah halaman ini masih usable di HP dengan koneksi yang tidak stabil?

Jika tidak:
optimalkan.

---

# 59. Rule of Simplicity

Jika dua solusi sama-sama memenuhi requirement:

pilih yang:

- lebih sederhana;
- lebih mudah dites;
- lebih aman;
- lebih mudah dipelihara.

Jangan memilih solusi “canggih” tanpa manfaat nyata.

---

# 60. Final Rule

AI agent tidak dinilai dari seberapa banyak code yang dibuat.

AI agent dinilai dari:

- apakah requirement terpenuhi;
- apakah data aman;
- apakah code dapat dipelihara;
- apakah guru bisa menggunakannya;
- apakah task benar-benar selesai.

---

# Quick Reference

## Boleh Langsung

```text
✅ tambah test
✅ fix bug kecil
✅ buat file/component
✅ update docs
✅ lint/build/test
✅ safe refactor
✅ error/loading state
```

## Minta Izin

```text
⚠️ destructive migration
⚠️ hapus data
⚠️ ubah architecture utama
⚠️ ubah framework
⚠️ deploy production berisiko
⚠️ nonaktifkan security
⚠️ tambah scope produk
⚠️ overwrite data user
```

## Selesai Jika

```text
✅ requirement
✅ code
✅ test
✅ security
✅ mobile
✅ docs jika perlu
✅ TODO updated
```
