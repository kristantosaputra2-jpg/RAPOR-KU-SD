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
- [x] Finalisasi formula nilai
  - Pengetahuan dan Keterampilan masing-masing memakai rata-rata nilai CP pada skala 0–100, predikat A–D, dan deskripsi terpisah. KKM dapat berupa satu angka seluruh mapel atau angka berbeda per mapel. Predikat memakai panjang interval `ceil((100 - KKM) / 3)`.
- [x] Finalisasi aturan CP/deskripsi otomatis
  - CP bernilai tertinggi menjadi capaian sangat baik dan CP bernilai terendah menjadi bagian yang perlu ditingkatkan. Draft dapat diedit dan tidak menimpa edit manual tanpa konfirmasi.
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
- [x] Buat auth flow
  - Service email/password, UI login responsif, pemulihan session, logout lokal, loading, dan pesan error aman sudah tersedia serta terverifikasi dengan akun Admin nyata.
- [x] Buat role pengguna
  - Identifier/label TypeScript dan enum database menggunakan `admin`, `homeroom_teacher`, dan `subject_teacher`.
- [/] Aktifkan Row Level Security
  - RLS aktif pada `profiles`; setiap tabel baru tetap wajib memiliki policy sendiri.
- [x] Buat migration dasar
- [ ] Buat seed development
- [x] Buat data sekolah
  - Konfigurasi satu sekolah per deployment tersedia dengan audit, migration tercatat, dan RLS Admin.
- [x] Buat tahun ajaran
  - Admin dapat menambah periode berformat `YYYY/YYYY`, melihat riwayat, dan memilih satu tahun ajaran aktif tanpa menghapus data lama.
- [x] Buat semester
  - Semester 1 dan 2 dapat ditambahkan per tahun ajaran; aktivasi semester sekaligus menyelaraskan tahun ajaran aktif secara atomik.
- [x] Test login/logout
  - Unit dan UI test lulus; login dan logout nyata terverifikasi pada preview lokal dengan Supabase cloud.
- [x] Test session persistence
  - Unit test lulus; sesi Admin tetap aktif setelah preview dimulai ulang dan halaman dimuat ulang.

## Security

- [/] Buat RLS untuk Admin
  - Policy Admin telah diterapkan pada `schools`, `academic_years`, dan `semesters`; tabel berikutnya tetap harus memiliki policy masing-masing.
- [ ] Buat RLS untuk Wali Kelas
- [ ] Buat RLS untuk Guru Mapel
- [/] Pastikan anonymous user tidak dapat mengakses data
  - Anonymous tidak memiliki akses pada tabel internal termasuk master data dan `teacher_assignments`. Hanya nama/logo dari tabel branding terpisah yang sengaja dapat dibaca pada login; audit harus diulang untuk setiap tabel baru.
- [x] Nonaktifkan public email signup pada konfigurasi Auth cloud
- [x] Pastikan service role key tidak digunakan di frontend
- [/] Tambahkan test permission
  - Uji database langsung sudah membuktikan Admin aktif dapat mengelola data, guru hanya melihat penugasan aktif miliknya, dan Guru Mapel yang ditugaskan dapat mengelola CP sesuai mapel, jenjang kelas, serta semester. Permission nilai dan rapor masih menyusul.
- [ ] Audit seluruh query Supabase sebelum production

---

# 🟡 Medium Priority

## Dashboard

- [x] Buat dashboard Admin
  - Dashboard mobile-first memiliki sidebar/drawer, status akun, ringkasan tanpa data rekaan, panduan pengaturan awal, dan empty state aktivitas.
- [ ] Buat dashboard Wali Kelas
- [ ] Buat dashboard Guru Mapel
- [x] Tampilkan tahun ajaran aktif
- [x] Tampilkan semester aktif
- [ ] Tampilkan jumlah siswa
- [ ] Tampilkan jumlah kelas
- [ ] Tampilkan status kelengkapan nilai
- [ ] Tampilkan jumlah rapor siap cetak
- [ ] Tambahkan warning data belum lengkap

## Data Sekolah

- [x] Buat halaman Pengaturan Sekolah
  - Form mobile-first terhubung ke Dashboard Admin dan Supabase, dengan loading, success, error aman, serta tombol simpan yang mudah dijangkau.
- [x] Nama sekolah editable
- [x] NPSN editable
- [x] Alamat editable
- [x] Desa/Kelurahan editable
- [x] Kecamatan editable
- [x] Kabupaten/Kota editable
- [x] Provinsi editable
- [x] Kode pos editable
- [x] Email editable
- [x] Kepala sekolah editable
- [x] NIP kepala sekolah editable
- [ ] Logo sekolah upload
  - Ditunda sebagai tahap Storage terpisah; `logo_url` sudah disiapkan tanpa memaksa upload pada tahap ini.
- [x] Pastikan tidak ada data sekolah yang hardcoded

## Guru

- [x] Buat halaman Data Guru
  - Daftar berupa tabel pada desktop dan kartu pada HP, dilengkapi pencarian, filter status, loading, retry, serta empty state.
- [x] Tambah guru
  - Form menyimpan nama, email, NIP/NUPTK opsional, dan peran utama tanpa membuat akun login otomatis.
- [x] Edit guru
- [x] Nonaktifkan guru
  - Data tidak dihapus dan dapat diaktifkan kembali; nonaktifkan memakai dialog konfirmasi.
- [x] Assign role
  - Peran utama dibatasi menjadi `homeroom_teacher` atau `subject_teacher`; akses aktual tetap menunggu assignment.
- [x] Assign mata pelajaran
- [x] Assign kelas
  - Halaman Penugasan Guru menghubungkan guru, mapel, kelas, tahun ajaran, dan semester dalam satu scope yang tervalidasi.
- [x] Assign wali kelas
  - Penetapan wali kelas tersedia melalui form Data Kelas; aktivasi hak akses akun menunggu tahap assignment.
- [/] Validasi permission guru
  - Penugasan hanya dikelola Admin; guru terhubung hanya dapat membaca assignment, kelas, dan mapel aktif miliknya. Permission nilai diuji saat grade entry tersedia.

## Kelas

- [x] Buat halaman Data Kelas
  - Daftar kelas berupa kartu responsif dengan pencarian, filter periode, loading, retry, dan empty state.
- [x] Tambah kelas 1–6
- [x] Tambah rombel
- [x] Assign wali kelas
  - Wali kelas boleh ditentukan saat tambah/edit kelas atau dibiarkan kosong sampai guru tersedia.
- [x] Assign template `lower_primary`
- [x] Assign template `upper_primary`
  - Template diturunkan otomatis dan dikunci database: kelas 1–3 `lower_primary`, kelas 4–6 `upper_primary`.
- [x] Hubungkan tahun ajaran
- [x] Hubungkan semester
  - Foreign key gabungan memastikan semester selalu berasal dari tahun ajaran yang dipilih.

## Siswa

- [x] Buat halaman Data Siswa
  - Daftar responsif menampilkan identitas ringkas, kelas semester aktif, status, loading, retry, serta empty state.
- [x] Tambah siswa
- [x] Edit siswa
- [x] Nonaktifkan siswa
  - Data tidak dihapus dan dapat diaktifkan kembali.
- [x] Assign siswa ke kelas
  - Penempatan dipisahkan dalam `class_members` agar riwayat kelas per semester tetap tersimpan.
- [x] Validasi NIS
  - NIS wajib, unik, maksimal 30 karakter, dan tetap disimpan sebagai teks agar angka nol di depan tidak hilang.
- [x] Validasi NISN
  - NISN opsional sesuai edge case PRD; bila diisi wajib unik dan terdiri dari 10 angka.
- [x] Tambahkan pencarian siswa
- [x] Tambahkan filter kelas

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

- [x] Buat master mata pelajaran
- [x] Mata pelajaran configurable
- [x] Tambah muatan lokal
- [x] Assign mata pelajaran ke kelas
- [x] Assign guru ke mapel
- [x] Jangan hardcode daftar mapel

## Learning Outcomes / CP

- [x] Buat master CP
- [x] Tambah CP
- [x] Edit CP
- [x] Nonaktifkan CP
- [x] Hubungkan CP ke mata pelajaran
- [x] Hubungkan CP ke kelas
- [x] Hubungkan CP ke semester
- [x] Pastikan struktur tidak hardcode KI/KD

---

# 🟢 Feature Development

## Input Nilai Kelas 1–3

- [/] Pisahkan nilai Pengetahuan dan Keterampilan per CP sesuai keputusan terbaru sekolah
- [/] Dukung Single KKM seluruh mapel atau Multi KKM per mapel
- [x] Buat halaman input nilai `lower_primary`
- [x] Tampilkan seluruh siswa dalam satu layar
- [x] Buat tabel responsif desktop
- [x] Buat tampilan mobile
- [x] Input nilai per siswa
- [x] Pilih CP
- [x] Generate deskripsi CP
- [x] Edit deskripsi manual
- [x] Simpan nilai
- [x] Tampilkan status `Menyimpan...`
- [x] Tampilkan status `Tersimpan`
- [x] Warning jika penyimpanan gagal
- [x] Validasi nilai 0–100
- [x] Test nilai kosong
- [x] Test nilai 0
- [x] Test nilai 100

## Input Nilai Kelas 4–6

- [x] Siapkan fondasi komponen Pengetahuan/Keterampilan dan konfigurasi Single/Multi KKM
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

- [x] Buat `generateReportDescription()`
- [x] Buat strongest outcome selector
- [x] Buat weakest outcome selector
- [x] Simpan generated description
- [x] Simpan final description
- [x] Jangan overwrite edit manual guru
- [x] Tambahkan aksi regenerate dengan konfirmasi
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
- [x] Jadikan nama sekolah sebagai identitas utama aplikasi
  - `SD Negeri Tumbang Kawei` tersimpan sebagai konfigurasi Supabase dan tampil pada login, dashboard, pengaturan, serta judul browser tanpa hardcode pada source code.
- [x] Gunakan ilustrasi sekolah pada login dan hero Dashboard Admin
- [x] Pastikan ilustrasi login tampil utuh pada HP

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

- [x] Unit test grade calculation
- [x] Unit test predicate
- [x] Unit test CP selector
- [x] Unit test description
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
- [x] Admin account verified
- [/] Identitas sekolah verified
  - Nama sekolah `SD Negeri Tumbang Kawei` sudah tersimpan dan terverifikasi; NPSN, alamat, dan identitas kepala sekolah belum diberikan.
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

| Area                | Status      | Progress | Catatan                                                                                                                                                |
| ------------------- | ----------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discovery           | Done        |     100% | Referensi kelas 1 & 4 sudah dibedah                                                                                                                    |
| PRD                 | Done        |     100% | PRD gabungan kelas 1–6 tersedia                                                                                                                        |
| AGENTS              | Done        |     100% | Instruksi developer/AI tersedia                                                                                                                        |
| Architecture        | Done        |     100% | Arsitektur awal tersedia                                                                                                                               |
| Database Design     | In Progress |      45% | Komponen Pengetahuan/Keterampilan dan konfigurasi Single/Multi KKM sudah tersedia; pemisahan entry nilai dan output rapor menyusul                     |
| Permissions         | In Progress |      65% | RLS nilai membatasi perubahan ke Admin atau guru yang ditugaskan; wali kelas hanya dapat memantau kelasnya                                             |
| Frontend Foundation | Done        |     100% | Scaffold, quality tools, repository GitHub, dan fondasi Playwright siap                                                                                |
| Supabase            | In Progress |      99% | Auth, seluruh master data, penugasan guru, master CP, audit, explicit grants, dan RLS terkait sudah tersedia                                           |
| Master Data         | Done        |     100% | Identitas sekolah, periode akademik, guru, kelas, siswa, mata pelajaran, penugasan, dan master CP selesai                                              |
| Grade Engine        | In Progress |      70% | Input nilai kelas 1–3, rata-rata 0–100, predikat A–D berdasarkan KKM, serta deskripsi CP otomatis yang dapat diedit sudah tersedia; kelas 4–6 menyusul |
| Report Engine       | Todo        |       0% | Menunggu template final                                                                                                                                |
| Leger               | Todo        |       0% | Struktur awal sudah diketahui                                                                                                                          |
| Testing             | In Progress |      60% | 141 unit/integration test dan 42 E2E responsif lulus termasuk resolver Single/Multi KKM                                                                |
| Cloudflare          | Todo        |       0% | Belum deployment                                                                                                                                       |
| Production          | Todo        |       0% | Belum siap                                                                                                                                             |

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
- Pengetahuan dan Keterampilan dinilai per CP, lalu rata-rata, predikat, dan deskripsinya ditampilkan terpisah.
- Jumlah CP mengikuti CP aktif pada semester dan tidak dibatasi lima.
- KKM dapat memakai mode `single` untuk semua mapel atau `multi` per mapel; satu KKM yang terpilih berlaku untuk Pengetahuan dan Keterampilan.
- CP/deskripsi dibuat otomatis tetapi dapat diedit.
- Prestasi disertakan.
- Leger wajib.
- Import siswa dari Excel wajib.
- Data kesehatan tidak masuk MVP.
- Mobile-first.
- Tidak bergantung laptop Dapodik/server lokal.

## Keputusan yang Masih TBD

- PDF engine.
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
- [x] Buat UI login merah-dominan untuk desktop/mobile dengan loading, error, tampil/sembunyikan kata sandi, dan tanpa public signup.
- [x] Verifikasi UI pada viewport 360px, 390px, 768px, dan 1280px tanpa horizontal overflow.
- [x] Tambahkan 7 UI/integration test Auth; total seluruh test saat ini 20 dan lulus.
- [x] Buat dan aktifkan akun Admin awal untuk Kristanto Saputra menggunakan akun Supabase Auth yang dikonfirmasi.
- [x] Nonaktifkan public signup pada Auth cloud dan verifikasi pengaturan tetap nonaktif setelah halaman dimuat ulang.
- [x] Verifikasi login dan logout nyata dengan akun Admin pada preview lokal yang terhubung ke Supabase cloud.
- [x] Verifikasi session persistence: akun Admin tetap masuk setelah server preview dimulai ulang dan halaman dimuat ulang.
- [x] Buat Dashboard Admin mobile-first dengan navigasi responsif dan empty state tanpa data rekaan.
- [x] Tambahkan konfigurasi Playwright dan verifikasi Dashboard Admin pada viewport 360px, 390px, 768px, dan 1280px tanpa horizontal overflow.
- [x] Buat migration `schools` untuk satu sekolah per deployment dengan audit perubahan dan RLS khusus Admin.
- [x] Verifikasi anonymous tidak memiliki akses ke `schools` serta Admin aktif memiliki izin baca/tambah/ubah tanpa izin hapus dari frontend.
- [x] Buat halaman Pengaturan Sekolah berisi seluruh field identitas wajib MVP selain upload logo yang ditunda sebagai tahap Storage terpisah.
- [x] Hubungkan Pengaturan Sekolah ke navigasi Dashboard Admin tanpa menambah dependency routing.
- [x] Verifikasi form Pengaturan Sekolah pada preview nyata yang sudah login tanpa mengisi atau mengarang data sekolah.
- [x] Tambahkan unit/integration dan E2E responsif; total 35 test unit/integration dan 8 test E2E lulus.
- [x] Simpan `SD Negeri Tumbang Kawei` sebagai nama sekolah awal di Supabase tanpa menanamkannya di source code.
- [x] Tampilkan nama sekolah sebagai identitas utama pada login, dashboard, halaman pengaturan, dan judul browser.
- [x] Tambahkan tabel branding publik terbatas yang hanya membuka nama/logo; tabel `schools` tetap tidak dapat dibaca anonymous.
- [x] Perbaiki hasil audit keamanan dengan mengganti security-definer view menjadi tabel branding ber-RLS dan sinkronisasi internal.
- [x] Gunakan gambar referensi sekolah sebagai ilustrasi login dan hero Dashboard Admin.
- [x] Verifikasi ilustrasi login tidak terpotong pada viewport HP 360px dan 390px.
- [x] Verifikasi 39 unit/integration test dan 10 E2E responsif lulus untuk dua tahap identitas serta visual baru.
- [x] Buat tabel `academic_years` dan `semesters` yang historical-safe, memakai audit, constraint, indeks periode aktif tunggal, dan RLS.
- [x] Tambahkan operasi database atomik untuk mengganti tahun ajaran atau semester aktif tanpa kondisi periode ganda.
- [x] Tambahkan validasi database agar tahun ajaran selalu berurutan dan semester aktif selalu berada pada tahun ajaran aktif, termasuk saat frontend dimanipulasi.
- [x] Verifikasi Admin dapat membuat serta mengaktifkan periode dalam transaksi uji, Guru Mapel ditolak RLS, anonymous tidak memiliki grant, dan seluruh data uji berhasil di-rollback.
- [x] Buat halaman Tahun Ajaran & Semester yang mobile-first dengan loading, retry, validasi, empty state, success/error feedback, dan navigasi Dashboard Admin.
- [x] Tampilkan ringkasan periode aktif pada Dashboard Admin tanpa mengarang tahun ajaran atau semester sekolah.
- [x] Verifikasi 53 unit/integration test dan 14 E2E responsif lulus setelah tahap Tahun Ajaran dan Semester.
- [x] Buat tabel `teacher_profiles` dengan audit, identitas opsional, status aktif, tautan akun Auth opsional, constraint, explicit grants, dan RLS.
- [x] Verifikasi Admin aktif dapat menambah guru, Guru Mapel ditolak, anonymous tidak memiliki akses, dan data uji keamanan dibersihkan.
- [x] Buat halaman Data Guru mobile-first dengan pencarian, filter, tambah, edit, nonaktifkan/aktifkan kembali, loading, error, success, dan empty state.
- [x] Pisahkan data guru dari pembuatan akun login; akun Auth dan password/invitasi tidak dibuat atau dikarang pada tahap ini.
- [x] Verifikasi 66 unit/integration test dan 18 E2E responsif lulus setelah tahap Data Guru.
- [x] Buat tabel `classes` yang terikat ke tahun ajaran dan semester, mendukung kelas 1–6, rombel, wali kelas opsional, audit, constraint, indeks, explicit grants, dan RLS.
- [x] Otomatiskan `lower_primary` untuk kelas 1–3 dan `upper_primary` untuk kelas 4–6 melalui kolom database yang dihasilkan otomatis.
- [x] Verifikasi Admin dapat menambah kelas, Guru Mapel ditolak, anonymous tidak memiliki akses, dan seluruh data uji di-rollback.
- [x] Buat halaman Data Kelas mobile-first dengan pencarian, filter periode, tambah/edit, assignment wali kelas, loading, error, success, dan empty state.
- [x] Verifikasi 78 unit/integration test dan 22 E2E responsif lulus setelah tahap Data Kelas.
- [x] Buat tabel `students` dan `class_members` terpisah agar identitas siswa serta riwayat kelas per semester aman dan tidak saling menimpa.
- [x] Tambahkan validasi NIS/NISN, audit, indeks, explicit grants, dan RLS Admin; anonymous tidak memperoleh akses data siswa.
- [x] Buat halaman Data Siswa mobile-first dengan pencarian, filter kelas/status, tambah/edit, penempatan kelas, nonaktifkan/aktifkan kembali, loading, error, success, dan empty state.
- [x] Verifikasi 89 unit/integration test dan 26 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Data Siswa.
- [x] Buat tabel `subjects` tanpa data mapel bawaan, dengan nama/kode configurable, penanda muatan lokal, urutan tampilan, status aktif, audit, constraint, explicit grants, dan RLS.
- [x] Buat halaman Mata Pelajaran mobile-first dengan pencarian, filter jenis/status, tambah/edit, nonaktifkan/aktifkan kembali, loading, retry, error, success, dan empty state.
- [x] Pertahankan assignment mata pelajaran ke kelas dan guru sebagai tahap berikutnya agar scope tahap ini tetap fokus.
- [x] Verifikasi 100 unit/integration test dan 30 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Mata Pelajaran.
- [x] Buat tabel `teacher_assignments` yang menghubungkan guru, kelas, mapel, tahun ajaran, dan semester dengan audit, status aktif, constraint satu guru per mapel/kelas, explicit grants, dan indeks lengkap.
- [x] Buat RLS agar hanya Admin aktif yang mengelola assignment, sedangkan guru dengan akun terhubung hanya membaca assignment, kelas, dan mapel aktif miliknya.
- [x] Verifikasi transaksi database bahwa Admin dapat membuat assignment dan Guru Mapel hanya melihat assignment, kelas, serta mapel yang ditugaskan; seluruh fixture uji di-rollback.
- [x] Buat halaman Penugasan Guru mobile-first dengan pencarian, filter kelas/status, tambah, ganti guru, nonaktifkan/aktifkan kembali, validasi prasyarat, loading, retry, error, success, dan empty state.
- [x] Verifikasi 108 unit/integration test dan 34 E2E responsif lulus pada 360px, 390px, 768px, dan 1280px setelah tahap Penugasan Guru.
- [x] Buat tabel `learning_outcomes` generik yang terhubung ke mata pelajaran, jenjang kelas 1–6, dan semester tanpa hardcode KI/KD.
- [x] Tambahkan audit, constraint, indeks, explicit grants, serta RLS agar Admin mengelola seluruh CP dan guru yang ditugaskan hanya mengelola CP relevan.
- [x] Verifikasi transaksi database bahwa guru yang ditugaskan dapat membaca dan mengubah CP sesuai scope; anonymous tidak memiliki akses dan fixture uji di-rollback.
- [x] Buat halaman CP / Deskripsi mobile-first dengan pencarian, filter, tambah, edit, aktif/nonaktif, validasi prasyarat, loading, retry, error, success, dan empty state.
- [x] Tunda generator deskripsi sampai workflow nilai dan formula penilaian disetujui agar aplikasi tidak mengarang aturan akademik.
- [x] Verifikasi 116 unit/integration test serta 38 E2E responsif lulus pada 360px, 390px, 768px, dan 1280px setelah tahap Master CP.
- [x] Tetapkan nilai akhir sebagai rata-rata seluruh nilai CP yang terisi pada skala 0–100.
- [x] Terapkan predikat A–D secara dinamis dari KKM dengan panjang interval `ceil((100 - KKM) / 3)` tanpa ambang nilai yang di-hardcode.
- [x] Buat tabel `grading_rules` untuk KKM per kelas, mapel, dan semester serta tabel `grade_entries` untuk nilai mentah per siswa dan CP.
- [x] Tambahkan constraint database agar nilai hanya 0–100 dan relasi siswa, kelas, CP, mapel, jenjang, serta semester selalu konsisten.
- [x] Tambahkan RLS: Admin dan guru yang ditugaskan dapat mengubah nilai; wali kelas hanya membaca nilai kelasnya; anonymous tidak memiliki akses.
- [x] Verifikasi langsung di database bahwa guru yang ditugaskan dapat membaca KKM dan menyimpan nilai 88; seluruh fixture uji berhasil di-rollback.
- [x] Verifikasi 126 unit/integration test lulus termasuk nilai kosong, 0, 100, rata-rata, input tidak valid, dan batas predikat contoh.
- [x] Buat halaman Input Nilai kelas 1–3 yang menampilkan seluruh siswa sekaligus, memilih kelas/mapel/CP, dan menyimpan nilai secara massal.
- [x] Gunakan kartu siswa pada HP dan tabel pada desktop agar nama siswa serta kolom nilai tetap mudah dibaca tanpa horizontal scroll ekstrem.
- [x] Tampilkan rata-rata dan predikat langsung saat angka diubah, serta status `Menyimpan...`, sukses, dan error yang mudah dipahami.
- [x] Hubungkan Guru Mata Pelajaran langsung ke layar Input Nilai sesuai penugasan yang dibatasi RLS.
- [x] Verifikasi 130 unit/integration test dan 42 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Input Nilai kelas 1–3.
- [x] Buat tabel `report_descriptions` yang menyimpan draft sistem dan deskripsi final guru secara terpisah dengan relasi, audit, indeks, explicit grants, dan RLS; foreign key memastikan CP sumber berasal dari mapel, jenjang, dan semester yang sama.
- [x] Gunakan CP dengan nilai tertinggi dan terendah untuk membuat draft: “Menunjukkan capaian sangat baik dalam [CP tertinggi] dan perlu meningkatkan [CP terendah].”
- [x] Pertahankan deskripsi final hasil edit guru; pembuatan ulang draft yang berbeda memerlukan konfirmasi eksplisit.
- [x] Sediakan editor deskripsi per siswa dalam modal desktop atau drawer HP dari halaman Input Nilai.
- [x] Verifikasi 136 unit/integration test dan 42 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap deskripsi CP editable.
- [x] Finalisasi keputusan bahwa seluruh kelas 1–6 menilai Pengetahuan dan Keterampilan per CP dengan rata-rata, predikat, dan deskripsi terpisah.
- [x] Finalisasi mode `single` untuk satu KKM seluruh mapel atau `multi` untuk KKM per mapel; KKM yang sama digunakan oleh kedua komponen.
- [x] Tambahkan `assessment_components`, `grading_settings`, dan `subject_kkm_rules` sebagai fondasi configurable dengan RLS dan explicit grants; anonymous tidak memiliki akses.
- [x] Tambahkan resolver KKM dan kalkulasi hasil per komponen serta verifikasi 141 unit/integration test lulus.

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
