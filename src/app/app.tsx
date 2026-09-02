import { BookOpenCheck, CheckCircle2 } from "lucide-react"

export function App() {
  return (
    <main className="min-h-screen bg-[var(--rapotku-canvas)] px-4 py-10 text-[var(--rapotku-text)] sm:px-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--rapotku-border)] bg-[var(--rapotku-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <BookOpenCheck aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="font-semibold">RapotKu</p>
            <p className="text-sm text-[var(--rapotku-muted)]">
              Aplikasi rapor sekolah dasar
            </p>
          </div>
        </div>

        <p className="mb-2 font-medium text-[var(--rapotku-brand)]">
          Project Foundation
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">
          Fondasi aplikasi sudah siap.
        </h1>
        <p className="max-w-2xl text-[var(--rapotku-muted)]">
          Kerangka ini baru menyiapkan alat pengembangan. Fitur rapor akan
          dibangun bertahap sesuai PRD dan hak akses pengguna.
        </p>

        <div
          className="mt-8 flex items-start gap-3 rounded-xl bg-[var(--rapotku-brand-soft)] p-4 text-[var(--rapotku-brand-strong)]"
          role="status"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={20}
          />
          <div>
            <p className="font-medium">Fondasi terverifikasi</p>
            <p className="mt-1 text-sm">
              React, TypeScript, Vite, Tailwind CSS, dan alat pengujian telah
              disiapkan.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
