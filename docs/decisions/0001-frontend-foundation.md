# ADR 0001 — Frontend Foundation

## Status

Disetujui pada 2 September 2026.

## Konteks

RapotKu membutuhkan frontend yang ringan, mudah dipelihara, nyaman untuk aplikasi dengan banyak form, dan dapat di-deploy ke Cloudflare.

## Keputusan

- React + TypeScript + Vite sebagai fondasi frontend.
- Tailwind CSS dan komponen ringan shadcn/ui sebagai fondasi UI.
- pnpm sebagai package manager tunggal.
- Vitest dan Testing Library untuk unit/component test.
- Playwright untuk end-to-end test.
- HTML print dengan print CSS sebagai strategi cetak MVP. Engine PDF khusus hanya ditambahkan jika browser print terbukti tidak memadai.

## Konsekuensi

- Gunakan TypeScript strict dan hindari `any`.
- Jangan mencampur lockfile dari package manager lain.
- Komponen shadcn/ui disimpan sebagai source code proyek sehingga dapat disesuaikan tanpa membawa UI framework berat.
- Exact PDF engine tetap belum dipilih dan bukan dependency Project Foundation.
