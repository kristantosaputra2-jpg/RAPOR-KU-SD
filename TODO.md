# TODO.md — Aplikasi Rapor SD Kelas 1–6

**Last Updated:** 2026-09-02  
**Project:** Aplikasi Rapor SD  
**Status Legend:** `[ ]` Todo · `[/]` In Progress · `[x]` Done · `[*]` Blocked · `[-]` Cancelled

---

## Tujuan File Ini

File ini adalah **pelacak progres utama proyek** berbasis Markdown.

Fungsinya:

- menjadi task backlog lokal;
- mencatat status setiap pekerjaan;
- membantu AI/developer melanjutkan pekerjaan tanpa kehilangan konteks;
- menjadi “memori proyek” singkat;
- mencegah pekerjaan yang sama diulang;
- mencatat task yang tertunda, selesai, diblokir, atau dibatalkan;
- menjaga implementasi tetap sesuai `PRD`, `AGENTS.md`, dan `Architecture.md`.

### Aturan Penggunaan

1. Update file ini setiap kali task mulai dikerjakan atau selesai.
2. Jangan mengubah status menjadi `[x]` jika belum benar-benar selesai dan diuji.
3. Jika task terhambat keputusan atau dependency, gunakan `[*]`.
4. Jangan menghapus task lama yang sudah selesai; biarkan sebagai histori.
5. Tambahkan task baru ke prioritas yang sesuai.
6. Jika scope berubah, sesuaikan task dan catat alasan singkat.
7. AI agent wajib membaca file ini sebelum memulai pekerjaan baru.
8. Progress harus mencerminkan kondisi repository yang sebenarnya.
9. Task besar harus dipecah menjadi task kecil yang dapat diverifikasi.
10. Gunakan komentar singkat bila ada dependency atau catatan penting.

---

# 🔥 High Priority

## Dokumentasi & Requirement

- [x] Buat `prd_rapor_sd_kelas_1-6_v0.4.md`
- [x] Buat `AGENTS.md`
- [x] Buat `Architecture.md`
- [x] Bedah referensi Excel rapor kelas 1–3
- [x] Bedah referensi Excel rapor kelas 4–6
- [ ] Finalisasi perbedaan rule kelas 1–3 dan 4–6
- [ ] Finalisasi field rapor terbaru yang benar-benar dipakai
- [ ] Finalisasi struktur output rapor
- [ ] Finalisasi struktur leger
- [ ] Finalisasi formula nilai
- [ ] Finalisasi aturan CP/deskripsi otomatis
- [ ] Buat `database.md`
- [ ] Buat `permissions.md`
- [ ] Buat `report-templates.md`
- [x] Buat ADR untuk keputusan arsitektur utama

## Project Foundation

- [x] Tentukan frontend framework final
- [x] Tentukan UI library final
- [x] Tentukan package manager
- [x] Tentukan test runner
- [x] Tentukan PDF/print strategy final
- [x] Buat repository GitHub
- [x] Inisialisasi project frontend
- [x] Konfigurasi TypeScript
- [x] Konfigurasi linting
- [x] Konfigurasi formatting
- [x] Tambahkan `.env.example`
- [x] Tambahkan `.gitignore`
- [x] Tambahkan README awal
- [x] Pastikan `AGENTS.md` berada di root repository
- [x] Pastikan PRD dan Architecture tersedia di repository

## Supabase Foundation

- [x] Buat project Supabase
- [x] Konfigurasi environment development
- [x] Konfigurasi Supabase client
- [/] Buat auth flow
  - Service email/password, pemulihan session, logout lokal, dan pesan error aman sudah tersedia; UI serta pengujian akun nyata belum dibuat.
- [x] Buat role pengguna
  - Identifier/label TypeScript dan enum database menggunakan `admin`, `homeroom_teacher`, dan `subject_teacher`.
- [/] Aktifkan Row Level Security
  - RLS aktif pada `profiles`; setiap tabel baru tetap wajib memiliki policy sendiri.
- [x] Buat migration dasar
- [ ] Buat seed development
- [ ] Buat data sekolah
- [ ] Buat tahun ajaran
- [ ] Buat semester
- [/] Test login/logout
  - Unit test service lulus; pengujian dengan akun nyata menunggu admin awal.
- [/] Test session persistence
  - Unit test pemulihan session lulus; pengujian browser nyata menunggu admin awal.

## Security

- [ ] Buat RLS untuk Admin
- [ ] Buat RLS untuk Wali Kelas
- [ ] Buat RLS untuk Guru Mapel
- [/] Pastikan anonymous user tidak dapat mengakses data
  - Anonymous tidak memiliki SELECT pada `profiles`; audit harus diulang untuk setiap tabel baru.
- [ ] Nonaktifkan public email signup pada konfigurasi Auth cloud
- [x] Pastikan service role key tidak digunakan di frontend
- [ ] Tambahkan test permission
- [ ] Audit seluruh query Supabase sebelum production

---

# 🟡 Medium Priority

## Dashboard

- [ ] Buat dashboard Admin
- [ ] Buat dashboard Wali Kelas
- [ ] Buat dashboard Guru Mapel
- [ ] Tampilkan tahun ajaran aktif
- [ ] Tampilkan semester aktif
- [ ] Tampilkan jumlah siswa
- [ ] Tampilkan jumlah kelas
- [ ] Tampilkan status kelengkapan nilai
- [ ] Tampilkan jumlah rapor siap cetak
- [ ] Tambahkan warning data belum lengkap

## Data Sekolah

- [ ] Buat halaman Pengaturan Sekolah
- [ ] Nama sekolah editable
- [ ] NPSN editable
- [ ] Alamat editable
- [ ] Desa/Kelurahan editable
- [ ] Kecamatan editable
- [ ] Kabupaten/Kota editable
- [ ] Provinsi editable
- [ ] Kode pos editable
- [ ] Email editable
- [ ] Kepala sekolah editable
- [ ] NIP kepala sekolah editable
- [ ] Logo sekolah upload
- [ ] Pastikan tidak ada data sekolah yang hardcoded

## Guru

- [ ] Buat halaman Data Guru
- [ ] Tambah guru
- [ ] Edit guru
- [ ] Nonaktifkan guru
- [ ] Assign role
- [ ] Assign mata pelajaran
- [ ] Assign kelas
- [ ] Assign wali kelas
- [ ] Validasi permission guru

## Kelas

- [ ] Buat halaman Data Kelas
- [ ] Tambah kelas 1–6
- [ ] Tambah rombel
- [ ] Assign wali kelas
- [ ] Assign template `lower_primary`
- [ ] Assign template `upper_primary`
- [ ] Hubungkan tahun ajaran
- [ ] Hubungkan semester

## Siswa

- [ ] Buat halaman Data Siswa
- [ ] Tambah siswa
- [ ] Edit siswa
- [ ] Nonaktifkan siswa
- [ ] Assign siswa ke kelas
- [ ] Validasi NIS
- [ ] Validasi NISN
- [ ] Tambahkan pencarian siswa
- [ ] Tambahkan filter kelas

## Import Excel

- [ ] Buat upload file Excel
- [ ] Parse data Excel
- [ ] Mapping kolom
- [ ] Preview data
- [ ] Validasi baris
- [ ] Deteksi duplicate NIS
- [ ] Deteksi duplicate NISN
- [ ] Validasi format tanggal
- [ ] Tampilkan error per baris
- [ ] Konfirmasi sebelum insert
- [ ] Batch insert
- [ ] Test file Excel valid
- [ ] Test file Excel rusak
- [ ] Test data duplicate

## Mata Pelajaran

- [ ] Buat master mata pelajaran
- [ ] Mata pelajaran configurable
- [ ] Tambah muatan lokal
- [ ] Assign mata pelajaran ke kelas
- [ ] Assign guru ke mapel
- [ ] Jangan hardcode daftar mapel

## Learning Outcomes / CP

- [ ] Buat master CP
- [ ] Tambah CP
- [ ] Edit CP
- [ ] Nonaktifkan CP
- [ ] Hubungkan CP ke mata pelajaran
- [ ] Hubungkan CP ke kelas
- [ ] Hubungkan CP ke semester
- [ ] Pastikan struktur tidak hardcode KI/KD

---

# 🟢 Feature Development

## Input Nilai Kelas 1–3

- [ ] Buat halaman input nilai `lower_primary`
- [ ] Tampilkan seluruh siswa dalam satu layar
- [ ] Buat tabel responsif desktop
- [ ] Buat tampilan mobile
- [ ] Input nilai per siswa
- [ ] Pilih CP
- [ ] Generate deskripsi CP
- [ ] Edit deskripsi manual
- [ ] Simpan nilai
- [ ] Tampilkan status `Menyimpan...`
- [ ] Tampilkan status `Tersimpan`
- [ ] Warning jika penyimpanan gagal
- [ ] Validasi nilai 0–100
- [ ] Test nilai kosong
- [ ] Test nilai 0
- [ ] Test nilai 100

## Input Nilai Kelas 4–6

- [ ] Buat halaman input nilai `upper_primary`
- [ ] Tampilkan seluruh siswa
- [ ] Buat struktur komponen nilai
- [ ] Dukungan pengetahuan bila template membutuhkan
- [ ] Dukungan keterampilan bila template membutuhkan
- [ ] Input nilai per CP/kompetensi
- [ ] Hitung nilai akhir
- [ ] Hitung predikat jika digunakan
- [ ] Identifikasi capaian terbaik
- [ ] Identifikasi capaian yang perlu ditingkatkan
- [ ] Generate deskripsi
- [ ] Edit deskripsi manual
- [ ] Test workflow kelas 4
- [ ] Test workflow kelas 5
- [ ] Test workflow kelas 6

## Description Engine

- [ ] Buat `generateReportDescription()`
- [ ] Buat strongest outcome selector
- [ ] Buat weakest outcome selector
- [ ] Simpan generated description
- [ ] Simpan final description
- [ ] Jangan overwrite edit manual guru
- [ ] Tambahkan aksi regenerate dengan konfirmasi
- [ ] Unit test description engine

## Absensi

- [ ] Buat form sakit
- [ ] Buat form izin
- [ ] Buat form tanpa keterangan
- [ ] Hubungkan dengan siswa
- [ ] Hubungkan dengan semester
- [ ] Validasi nilai tidak negatif

## Ekstrakurikuler

- [ ] Master ekstrakurikuler
- [ ] Assign siswa
- [ ] Predikat/capaian
- [ ] Deskripsi
- [ ] Tampil di rapor

## Prestasi

- [ ] Tambah prestasi
- [ ] Jenis prestasi
- [ ] Tingkat prestasi
- [ ] Keterangan
- [ ] Tahun/tanggal
- [ ] Tampil di rapor

## Catatan Wali Kelas

- [ ] Buat field catatan
- [ ] Tambahkan batas karakter
- [ ] Preview hasil di rapor
- [ ] Test teks panjang

---

# 🟦 Report & Output

## Report Completeness

- [ ] Buat completeness engine
- [ ] Status `Belum Diisi`
- [ ] Status `Sebagian`
- [ ] Status `Lengkap`
- [ ] Status `Siap Cetak`
- [ ] Check identitas
- [ ] Check nilai
- [ ] Check deskripsi
- [ ] Check absensi
- [ ] Check ekstrakurikuler
- [ ] Check prestasi
- [ ] Check catatan wali kelas

## Report Preview

- [ ] Buat report view model
- [ ] Preview lower primary
- [ ] Preview upper primary
- [ ] Preview identitas sekolah
- [ ] Preview identitas siswa
- [ ] Preview nilai
- [ ] Preview deskripsi
- [ ] Preview ekskul
- [ ] Preview prestasi
- [ ] Preview absensi
- [ ] Preview catatan wali kelas
- [ ] Test nama siswa panjang
- [ ] Test deskripsi panjang
- [ ] Test field kosong

## Print / PDF

- [ ] Buat print CSS
- [ ] Format A4
- [ ] Page break
- [ ] Test browser print
- [ ] Test Chrome desktop
- [ ] Test browser Android
- [ ] Finalisasi PDF engine
- [ ] Print satu siswa
- [ ] Batch print satu kelas
- [ ] Pastikan hasil preview = hasil cetak

## Leger Kelas 1–3

- [ ] Buat query leger lower primary
- [ ] Buat view model
- [ ] Buat tabel leger
- [ ] Print
- [ ] Export
- [ ] Test semua mapel

## Leger Kelas 4–6

- [ ] Buat query leger upper primary
- [ ] Support komponen nilai
- [ ] Support nilai akhir
- [ ] Support predikat bila aktif
- [ ] Support deskripsi
- [ ] Print
- [ ] Export
- [ ] Test tabel lebar

---

# 🎨 UI/UX

## General

- [-] Buat desain Figma MVP untuk layar utama desktop dan mobile
  - Diganti dengan prototipe visual lokal setelah user menyetujui alternatif tanpa Figma karena batas Figma MCP paket Starter.
- [x] Buat prototipe visual tahap 1: Login dan dashboard role dalam versi desktop/mobile
- [x] Buat prototipe visual tahap 2: Data Siswa, Guru, Kelas, dan Mata Pelajaran
- [x] Buat prototipe visual tahap 3: Input Nilai, CP/Deskripsi, dan workflow Wali Kelas
- [x] Buat prototipe visual tahap 4: Leger dan Preview Rapor
- [x] Buat design system sederhana
- [x] Standardisasi spacing
- [x] Standardisasi typography
- [x] Standardisasi button
- [x] Standardisasi form
- [x] Standardisasi table
- [x] Standardisasi modal
- [x] Standardisasi empty state
- [x] Standardisasi toast/feedback

## Mobile

- [x] Test viewport 360px
- [x] Test viewport 390px
- [x] Test viewport 768px
- [x] Hindari hover-only interaction
- [x] Pastikan tombol mudah disentuh
- [x] Hindari horizontal scroll ekstrem
- [x] Tambahkan sticky student name jika diperlukan
  - Tidak diperlukan pada pola mobile karena satu CP aktif ditampilkan untuk seluruh daftar siswa; tabel tablet memakai scroll terkontrol.
- [x] Pastikan input nilai nyaman di HP

## Accessibility

- [x] Label form lengkap
- [x] Semantic HTML
- [x] Keyboard navigation
- [x] ARIA untuk icon button
- [x] Status tidak hanya menggunakan warna
- [x] Periksa contrast

---

# ⚙️ Technical

## Code Quality

- [x] TypeScript strict
- [ ] Hindari `any`
- [ ] Business logic terpisah dari UI
- [ ] Query terpusat pada service layer
- [ ] Tidak ada file component terlalu besar
- [ ] Naming convention konsisten
- [ ] Komentar menjelaskan “why”
- [ ] Hapus `console.log` tidak perlu
- [ ] Hapus dead code
- [ ] Jangan refactor area tidak terkait

## Testing

- [ ] Unit test grade calculation
- [ ] Unit test predicate
- [ ] Unit test CP selector
- [ ] Unit test description
- [ ] Unit test completeness
- [ ] Integration test student-to-report flow
- [ ] Permission/RLS test
- [ ] E2E Admin flow
- [ ] E2E Guru Mapel flow
- [ ] E2E Wali Kelas flow
- [ ] Report visual test

## Performance

- [ ] Hindari N+1 query
- [ ] Select kolom yang diperlukan
- [ ] Lazy load module besar
- [ ] Compress image
- [ ] Cache static assets
- [ ] Hindari realtime yang tidak perlu
- [ ] Test koneksi lambat
- [ ] Test halaman nilai banyak siswa

## Error Handling

- [ ] Loading state semua async action
- [ ] Success feedback
- [ ] Network error
- [ ] Permission error
- [ ] Validation error
- [ ] System error
- [ ] Jangan tampilkan raw Supabase error ke user

---

# 🚀 Deployment

## GitHub

- [x] Buat repository
- [ ] Buat branch strategy
- [ ] Gunakan Conventional Commits
- [ ] Buat PR template
- [ ] Lindungi branch utama
- [ ] Tambahkan CI

## CI

- [ ] Install dependencies
- [ ] Typecheck
- [ ] Lint
- [ ] Unit test
- [ ] Build
- [ ] Deploy

## Cloudflare

- [ ] Buat Cloudflare Pages project
- [ ] Hubungkan GitHub
- [ ] Setup environment variables
- [ ] Setup domain
- [ ] Test production build
- [ ] Test mobile production

## Production Readiness

- [ ] Supabase production ready
- [ ] Migration applied
- [ ] RLS verified
- [ ] Admin account verified
- [ ] Identitas sekolah verified
- [ ] Tahun ajaran verified
- [ ] Semester verified
- [ ] Teacher assignment verified
- [ ] Report preview verified
- [ ] Print verified
- [ ] Backup verified

---

# 🟣 Low Priority / Future

- [ ] PWA
- [ ] Offline queue
- [ ] Backup manual
- [ ] Restore utility
- [ ] Template manager visual
- [ ] Historical report template versioning UI
- [ ] Automated provisioning sekolah baru
- [ ] Portal orang tua
- [ ] Portal siswa
- [ ] WhatsApp integration
- [ ] Dapodik integration
- [ ] LMS
- [ ] QR attendance
- [ ] Multi-tenant SaaS
- [ ] Advanced analytics
- [ ] Native Android app

---

# 🚫 Out of Scope MVP

Task di bawah ini tidak boleh dikerjakan sebelum MVP selesai kecuali ada perubahan PRD:

- [-] Integrasi Dapodik
- [-] Portal orang tua
- [-] Portal siswa
- [-] WhatsApp otomatis
- [-] LMS
- [-] Bank soal
- [-] Absensi QR
- [-] Face recognition
- [-] Payment
- [-] General AI chatbot
- [-] Multi-school satu database
- [-] Data kesehatan
- [-] Full offline

---

# 📊 Progress Tracker

| Area | Status | Progress | Catatan |
|---|---|---:|---|
| Discovery | Done | 100% | Referensi kelas 1 & 4 sudah dibedah |
| PRD | Done | 100% | PRD gabungan kelas 1–6 tersedia |
| AGENTS | Done | 100% | Instruksi developer/AI tersedia |
| Architecture | Done | 100% | Arsitektur awal tersedia |
| Database Design | Todo | 0% | Menunggu finalisasi rule |
| Permissions | Todo | 0% | Perlu dokumen khusus |
| Frontend Foundation | Done | 100% | Scaffold, quality tools, dan repository GitHub siap |
| Supabase | In Progress | 45% | Project, client, migration Auth/role, RLS profil, dan service Auth siap; admin awal serta UI login belum dibuat |
| Master Data | Todo | 0% | Belum coding |
| Grade Engine | Todo | 0% | Menunggu formula final |
| Report Engine | Todo | 0% | Menunggu template final |
| Leger | Todo | 0% | Struktur awal sudah diketahui |
| Testing | In Progress | 5% | Vitest, Testing Library, dan Playwright sudah dikonfigurasi |
| Cloudflare | Todo | 0% | Belum deployment |
| Production | Todo | 0% | Belum siap |

---

# 🧠 Project Memory

## Keputusan yang Sudah Final

- Satu sekolah per deployment.
- Supabase sebagai database/backend/auth.
- Cloudflare sebagai hosting.
- GitHub sebagai repository.
- Admin + Wali Kelas + Guru Mapel.
- Kelas 1–3 menggunakan `lower_primary`.
- Kelas 4–6 menggunakan `upper_primary`.
- Input nilai menampilkan seluruh siswa.
- CP/deskripsi dibuat otomatis tetapi dapat diedit.
- Prestasi disertakan.
- Leger wajib.
- Import siswa dari Excel wajib.
- Data kesehatan tidak masuk MVP.
- Mobile-first.
- Tidak bergantung laptop Dapodik/server lokal.

## Keputusan yang Masih TBD

- PDF engine.
- Formula nilai final.
- Layout rapor terbaru final.
- Schema database final.
- PWA/offline strategy.

---

# 📝 Update Log

## 2026-08-31

- [x] Analisis workbook kelas 1–3 selesai.
- [x] Analisis workbook kelas 4–6 selesai.
- [x] PRD gabungan kelas 1–6 dibuat.
- [x] `AGENTS.md` dibuat.
- [x] `Architecture.md` dibuat.
- [x] `TODO.md` dibuat sebagai local issue tracker dan project memory.

## 2026-09-02

- [x] Buat project Supabase Free `rapotku-sdn-tumbang-kawei` terpisah di region Singapore.
- [x] Verifikasi project `ACTIVE_HEALTHY`, database PostgreSQL 17.6 merespons, dan schema `public` masih kosong.
- [x] Hubungkan environment development lokal menggunakan publishable key; `.env.local` tetap diabaikan Git.
- [x] Buat repository GitHub private `kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei`.
- [x] Tambahkan `@supabase/supabase-js` dan konfigurasi client yang dibuat secara lazy.
- [x] Gunakan publishable key untuk frontend baru dengan kompatibilitas legacy anon key.
- [x] Tambahkan validasi URL serta penolakan secret key dan service-role key di frontend.
- [x] Pusatkan identifier dan label tiga role MVP pada modul autentikasi.
- [x] Tambahkan unit test konfigurasi Supabase dan role pengguna.
- [x] Tambahkan Supabase CLI 2.116.0 dan migration dasar Auth/role yang sinkron dengan project cloud.
- [x] Buat `profiles`, tiga role MVP, trigger profil gagal-aman, dan RLS baca profil sendiri.
- [x] Verifikasi anonymous tidak dapat membaca `profiles` serta security/performance advisor tidak menemukan masalah.
- [x] Tambahkan database types dan service login, logout lokal, serta session persistence dengan 6 unit test.
- [ ] Akun admin awal, UI login, dan pengujian autentikasi nyata belum dibuat.

---

# Instruksi untuk AI Agent

Sebelum memulai task:

1. Baca `TODO.md`.
2. Baca `AGENTS.md`.
3. Baca PRD terbaru.
4. Baca `Architecture.md` jika perubahan menyentuh struktur sistem.
5. Pilih task dengan prioritas tertinggi yang belum selesai.
6. Ubah status task menjadi `[/]` saat mulai.
7. Jangan mengerjakan task lain yang tidak terkait tanpa alasan.
8. Jalankan test yang relevan.
9. Setelah selesai, ubah menjadi `[x]`.
10. Tambahkan task baru jika ditemukan requirement teknis baru.
11. Jangan menghapus histori pekerjaan.
12. Jangan menandai task selesai hanya karena kode sudah ditulis; harus diuji.

---

> **Prinsip utama:** `TODO.md` harus selalu mencerminkan keadaan repository yang sebenarnya. Jika status di file berbeda dengan kondisi kode, perbaiki file ini.
