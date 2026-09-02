# RapotKu — Aplikasi Rapor SD

RapotKu adalah aplikasi web rapor SD kelas 1–6 yang dirancang agar mudah digunakan guru dari HP dan tetap ringan pada koneksi internet terbatas.

Repository GitHub: [kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei](https://github.com/kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei)

## Status

Project Foundation telah disiapkan. Fitur bisnis belum dibangun dan akan dikerjakan bertahap berdasarkan `prd.md`, `AGENTS.md`, `Architecture.md`, `TODO.md`, `SKILL.md`, dan `workflow.md`.

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
pnpm build
```

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi URL project dan publishable key dari Supabase.

```env
VITE_SUPABASE_URL=https://project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Legacy `VITE_SUPABASE_ANON_KEY` masih dibaca sementara untuk kompatibilitas proyek lama. Jangan pernah menaruh secret key atau service-role key Supabase di frontend.

Project Supabase cloud terpisah sudah dibuat pada paket Free di region Singapore. Fondasi Auth kini memiliki tabel `profiles`, tiga role MVP, RLS profil, UI login responsif, serta akun Admin awal yang aktif. Pendaftaran umum pada Auth cloud sudah dinonaktifkan; tabel akademik belum dibuat.

Migration database disimpan di `supabase/migrations/`. Supabase CLI dipasang sebagai development dependency agar setiap perubahan schema tetap tercatat di repository.
