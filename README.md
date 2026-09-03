# RapotKu — Aplikasi Rapor SD

RapotKu adalah aplikasi web rapor SD kelas 1–6 yang dirancang agar mudah digunakan guru dari HP dan tetap ringan pada koneksi internet terbatas.

Repository GitHub: [kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei](https://github.com/kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei)

## Status

Project Foundation, autentikasi, Dashboard Admin awal, seluruh master data utama, penugasan guru, master CP, serta Input Nilai kelas 1–6 telah disiapkan. Input Nilai menampilkan seluruh CP aktif dengan tab Pengetahuan dan Keterampilan, serta mendukung satu KKM seluruh mapel atau KKM berbeda per mapel. Rata-rata, predikat, dan deskripsi dihitung terpisah; guru dapat mengedit deskripsi dan edit manual tidak ditimpa tanpa konfirmasi. Nama sekolah menjadi identitas utama pada seluruh layar, sedangkan ilustrasi sekolah digunakan pada login dan hero dashboard. Fitur berikutnya akan dikerjakan bertahap berdasarkan `prd.md`, `AGENTS.md`, `Architecture.md`, `TODO.md`, `SKILL.md`, dan `workflow.md`.

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

Project Supabase cloud terpisah sudah dibuat pada paket Free di region Singapore. Auth memiliki tiga role MVP, RLS, UI login responsif, serta akun Admin awal. Seluruh master sekolah, periode, guru, kelas, siswa, mapel, penugasan, dan CP tersimpan sebagai data configurable. `assessment_components` menyediakan Pengetahuan dan Keterampilan; `grading_settings` memilih Single/Multi KKM; dan `subject_kkm_rules` menyimpan KKM per mapel saat mode Multi aktif. `grade_entries` menyimpan nilai mentah 0–100 per siswa, CP, dan komponen, sedangkan `report_descriptions` memisahkan draft otomatis dari hasil final guru untuk setiap komponen. Seluruh tabel sensitif dilindungi RLS dan pendaftaran Auth umum dinonaktifkan.

Migration database disimpan di `supabase/migrations/`. Supabase CLI dipasang sebagai development dependency agar setiap perubahan schema tetap tercatat di repository.
