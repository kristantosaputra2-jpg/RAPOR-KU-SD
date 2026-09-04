import { BookOpenCheck } from "lucide-react"

import type { ReportViewModel } from "./report-view-model"

type Props = Readonly<{ report: ReportViewModel }>

function Value({ children }: Readonly<{ children: string | number | null }>) {
  return children === null || children === "" ? (
    <span className="text-slate-400">Belum diisi</span>
  ) : (
    <>{children}</>
  )
}

function ReportPageHeader({ report }: Props) {
  return (
    <header className="report-page-header flex items-center gap-3 border-b-2 border-[var(--rapotku-brand)] pb-4">
      {report.school.logoUrl ? (
        <img
          className="size-14 object-contain"
          src={report.school.logoUrl}
          alt={`Logo ${report.school.name}`}
        />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
          <BookOpenCheck aria-hidden="true" size={28} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
          RapotKu
        </p>
        <h2 className="truncate text-lg font-bold sm:text-xl">
          {report.school.name}
        </h2>
        <p className="text-xs text-slate-500">
          {report.school.npsn
            ? `NPSN ${report.school.npsn}`
            : "NPSN belum diisi"}
        </p>
      </div>
    </header>
  )
}

const identityRows = (report: ReportViewModel) =>
  [
    ["Nama lengkap", report.student.name],
    [
      "NIS / NISN",
      `${report.student.nis} / ${report.student.nisn ?? "Belum diisi"}`,
    ],
    ["Jenis kelamin", report.student.gender],
    ["Tempat, tanggal lahir", report.student.birth],
    ["Agama", report.student.religion],
    ["Alamat", report.student.address],
    ["Nama ayah", report.student.fatherName],
    ["Nama ibu", report.student.motherName],
    ["Nama wali", report.student.guardianName],
  ] as const

export function ReportPreviewTemplate({ report }: Props) {
  return (
    <div className="space-y-6" data-template-group={report.templateGroup}>
      <article className="report-sheet report-cover grid min-h-[580px] place-items-center overflow-hidden rounded-2xl border bg-white p-7 text-center sm:min-h-[720px] sm:p-12">
        <div className="max-w-xl">
          <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[var(--rapotku-brand)] text-white shadow-[0_16px_36px_rgba(198,31,39,0.22)]">
            <BookOpenCheck aria-hidden="true" size={40} />
          </span>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-[var(--rapotku-brand)]">
            Laporan Hasil Belajar
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Rapor Siswa</h2>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {report.templateLabel}
          </p>
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-red-100 bg-red-50/70 px-5 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Nama Siswa
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-[var(--rapotku-brand-strong)]">
              {report.student.name}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {report.academicPeriod.className} ·{" "}
              {report.academicPeriod.academicYear} ·{" "}
              {report.academicPeriod.semester}
            </p>
          </div>
          <p className="mt-12 text-xl font-bold">{report.school.name}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            <Value>{report.school.address}</Value>
          </p>
        </div>
      </article>

      <article className="report-sheet min-h-[580px] rounded-2xl border bg-white p-5 sm:min-h-[720px] sm:p-10">
        <ReportPageHeader report={report} />
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
            Halaman Identitas
          </p>
          <h2 className="mt-1 text-2xl font-bold">Identitas peserta didik</h2>
          <dl className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-4 sm:px-6">
            {identityRows(report).map(([label, value]) => (
              <div
                className="grid gap-1 py-3 sm:grid-cols-[190px_1fr] sm:gap-5"
                key={label}
              >
                <dt className="text-sm font-semibold text-slate-500">
                  {label}
                </dt>
                <dd className="break-words text-sm font-medium">
                  <Value>{value}</Value>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </article>

      <article className="report-sheet min-h-[580px] rounded-2xl border bg-white p-5 sm:min-h-[720px] sm:p-10">
        <ReportPageHeader report={report} />
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
              Hasil Belajar
            </p>
            <h2 className="mt-1 text-2xl font-bold">Nilai dan deskripsi</h2>
          </div>
          <p className="text-sm text-slate-500">
            Kelas {report.academicPeriod.gradeLevel} ·{" "}
            {report.academicPeriod.semester}
          </p>
        </div>

        {report.subjects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Mata pelajaran yang ditugaskan belum tersedia.
          </div>
        ) : (
          <>
            <div className="report-mobile-results mt-6 space-y-4 md:hidden">
              {report.subjects.map((subject) => (
                <section
                  className="rounded-2xl border border-slate-200 p-4"
                  key={subject.subjectId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold">{subject.subjectName}</h3>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      KKM <Value>{subject.kkm}</Value>
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {subject.components.map((component) => (
                      <div
                        className="border-t border-slate-200 pt-3"
                        key={component.componentId}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">
                            {component.componentName}
                          </p>
                          <p className="text-sm">
                            <span className="font-bold text-[var(--rapotku-brand)]">
                              <Value>{component.predicate}</Value>
                            </span>
                            <span className="ml-2 text-slate-400">
                              (<Value>{component.average}</Value>)
                            </span>
                          </p>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                          <Value>{component.description}</Value>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="report-table-results mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-red-50 text-slate-700">
                  <tr>
                    <th className="p-3">Mata pelajaran</th>
                    <th className="p-3">KKM</th>
                    <th className="p-3">Komponen</th>
                    <th className="p-3">Rata-rata</th>
                    <th className="p-3">Predikat</th>
                    <th className="p-3">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.subjects.flatMap((subject) =>
                    subject.components.map((component, index) => (
                      <tr key={`${subject.subjectId}:${component.componentId}`}>
                        <td className="p-3 font-semibold">
                          {index === 0 ? subject.subjectName : ""}
                        </td>
                        <td className="p-3">
                          {index === 0 ? <Value>{subject.kkm}</Value> : null}
                        </td>
                        <td className="p-3">{component.componentName}</td>
                        <td className="p-3">
                          <Value>{component.average}</Value>
                        </td>
                        <td className="p-3 font-bold text-[var(--rapotku-brand)]">
                          <Value>{component.predicate}</Value>
                        </td>
                        <td className="max-w-sm break-words p-3 leading-6">
                          <Value>{component.description}</Value>
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>

      <article className="report-sheet min-h-[580px] rounded-2xl border bg-white p-5 sm:min-h-[720px] sm:p-10">
        <ReportPageHeader report={report} />
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-bold">Ekstrakurikuler</h2>
            {report.extracurriculars.length ? (
              <div className="mt-3 space-y-3">
                {report.extracurriculars.map((item, index) => (
                  <div
                    className="rounded-xl border border-slate-200 p-4"
                    key={`${item.name}:${index}`}
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold">{item.name}</p>
                      <span className="text-sm font-bold text-[var(--rapotku-brand)]">
                        {item.achievement}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Belum ada data ekstrakurikuler.
              </p>
            )}
          </section>
          <section>
            <h2 className="text-xl font-bold">Prestasi</h2>
            {report.achievements.length ? (
              <div className="mt-3 space-y-3">
                {report.achievements.map((item, index) => (
                  <div
                    className="rounded-xl border border-slate-200 p-4"
                    key={`${item.type}:${index}`}
                  >
                    <p className="font-semibold">
                      {item.type} · {item.level}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tahun {item.year}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Belum ada data prestasi.
              </p>
            )}
          </section>
          <section>
            <h2 className="text-xl font-bold">Ketidakhadiran</h2>
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ["Sakit", report.attendance.sickDays],
                  ["Izin", report.attendance.permittedDays],
                  ["Tanpa keterangan", report.attendance.absentDays],
                ] as const
              ).map(([label, value]) => (
                <div
                  className="rounded-xl bg-slate-50 p-3 text-center"
                  key={label}
                >
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 font-bold">
                    <Value>{value}</Value>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="text-xl font-bold">Catatan wali kelas</h2>
            <p className="mt-3 min-h-28 break-words rounded-xl bg-red-50/70 p-4 text-sm leading-6 text-slate-700">
              <Value>{report.homeroomNote}</Value>
            </p>
          </section>
        </div>
        <div className="mt-10 grid gap-8 text-center text-sm sm:grid-cols-2">
          <div>
            <p>Orang tua / Wali</p>
            <div className="h-20" />
            <p className="font-semibold">
              ....................................
            </p>
          </div>
          <div>
            <p>Kepala Sekolah</p>
            <div className="h-20" />
            <p className="font-semibold">
              <Value>{report.school.principalName}</Value>
            </p>
            <p className="text-xs text-slate-500">
              NIP <Value>{report.school.principalNip}</Value>
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}
