# RapotKu — Aplikasi Rapor SD

RapotKu adalah aplikasi web rapor SD kelas 1–6 yang dirancang agar mudah digunakan guru dari HP dan tetap ringan pada koneksi internet terbatas.

Repository GitHub: [kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei](https://github.com/kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei)

## Status

Project Foundation, autentikasi, Dashboard Admin awal, Pengaturan Sekolah, Tahun Ajaran dan Semester, Data Guru, Data Kelas, Data Siswa, Mata Pelajaran, serta Penugasan Guru telah disiapkan. Nama sekolah kini menjadi identitas utama pada seluruh layar, sedangkan ilustrasi sekolah digunakan pada login dan hero dashboard. Fitur berikutnya akan dikerjakan bertahap berdasarkan `prd.md`, `AGENTS.md`, `Architecture.md`, `TODO.md`, `SKILL.md`, dan `workflow.md`.

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- pnpm
- Vitest + Testing Library
- Playwright
- Supabase JavaScript client (fondasi koneksi lokal)
- Cloudflare pada tahap berikutnya

## Menjalankan proyek

```bash
pnpm install
pnpm dev
```

## Pengecekan

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
```

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi URL project dan publishable key dari Supabase.

```env
VITE_SUPABASE_URL=https://project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Legacy `VITE_SUPABASE_ANON_KEY` masih dibaca sementara untuk kompatibilitas proyek lama. Jangan pernah menaruh secret key atau service-role key Supabase di frontend.

Project Supabase cloud terpisah sudah dibuat pada paket Free di region Singapore. Fondasi Auth kini memiliki tabel `profiles`, tiga role MVP, RLS profil, UI login responsif, serta akun Admin awal yang aktif. Tabel `schools` menyimpan konfigurasi sekolah dan halaman Pengaturan Sekolah tersedia dengan RLS Admin. Login hanya membaca nama/logo dari tabel branding publik yang terpisah; data sekolah lainnya tetap terlindungi. Tabel `academic_years` dan `semesters` menyimpan riwayat periode dengan satu semester aktif serta RLS. Tabel `teacher_profiles` dan halaman Data Guru menyediakan pencarian, tambah, edit, peran utama, serta nonaktifkan/aktifkan kembali; pembuatan akun login guru sengaja dipisahkan dari master data. Tabel `classes` dan halaman Data Kelas mendukung rombel kelas 1–6, periode, wali kelas, serta pemilihan template bawah/atas secara otomatis. Tabel `students` menyimpan identitas siswa, sedangkan `class_members` menjaga riwayat kelas setiap semester; halaman Data Siswa menyediakan pencarian, filter, tambah, edit, penempatan kelas, dan status aktif. Tabel `subjects` dan halaman Mata Pelajaran menyediakan daftar mapel configurable, kode opsional, muatan lokal, urutan tampilan, serta status aktif tanpa menanam daftar mapel bawaan. Tabel `teacher_assignments` dan halaman Penugasan Guru menghubungkan satu guru dengan mapel, kelas, dan periode; RLS membatasi guru ke penugasan aktif miliknya. Tabel `learning_outcomes` dan halaman CP / Deskripsi menyediakan CP generik per mapel, jenjang kelas, dan semester; guru yang ditugaskan hanya dapat mengelola CP yang relevan. Generator deskripsi belum diaktifkan karena menunggu workflow nilai dan formula penilaian yang disetujui. Pendaftaran umum pada Auth cloud sudah dinonaktifkan.

Migration database disimpan di `supabase/migrations/`. Supabase CLI dipasang sebagai development dependency agar setiap perubahan schema tetap tercatat di repository.
