import { useEffect, useState, type FormEvent } from "react"
import { Camera, LoaderCircle, UserRound, X } from "lucide-react"

import {
  emptyStudentBiodataInput,
  getStudentBiodata,
  getStudentPhotoUrl,
  inputFromStudentBiodata,
  saveStudentBiodata,
  uploadStudentPhoto,
  validateStudentPhoto,
  type StudentBiodataInput,
} from "./student-biodata.service"
import type { Student } from "./student.service"

type Props = Readonly<{
  student: Student
  userId: string
  onClose: () => void
  onSaved: (message: string) => void
}>

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"

type Field = Readonly<{
  key: keyof StudentBiodataInput
  label: string
  area?: boolean
  type?: "tel"
}>

const familyGroups: ReadonlyArray<
  Readonly<{ title: string; fields: ReadonlyArray<Field> }>
> = [
  {
    title: "Data Ayah",
    fields: [
      { key: "fatherName", label: "Nama ayah" },
      { key: "fatherEducation", label: "Pendidikan ayah" },
      { key: "fatherOccupation", label: "Pekerjaan ayah" },
      { key: "fatherPhone", label: "Nomor telepon ayah", type: "tel" },
      { key: "fatherAddress", label: "Alamat ayah", area: true },
    ],
  },
  {
    title: "Data Ibu",
    fields: [
      { key: "motherName", label: "Nama ibu" },
      { key: "motherEducation", label: "Pendidikan ibu" },
      { key: "motherOccupation", label: "Pekerjaan ibu" },
      { key: "motherPhone", label: "Nomor telepon ibu", type: "tel" },
      { key: "motherAddress", label: "Alamat ibu", area: true },
    ],
  },
  {
    title: "Data Wali (opsional)",
    fields: [
      { key: "guardianName", label: "Nama wali" },
      { key: "guardianEducation", label: "Pendidikan wali" },
      { key: "guardianOccupation", label: "Pekerjaan wali" },
      { key: "guardianPhone", label: "Nomor telepon wali", type: "tel" },
      { key: "guardianAddress", label: "Alamat wali", area: true },
    ],
  },
]

export function StudentBiodataDialog({
  student,
  userId,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState(emptyStudentBiodataInput)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void getStudentBiodata(student.id)
      .then(async (biodata) => {
        if (!active) return
        const loadedForm = inputFromStudentBiodata(biodata, {
          fatherName: student.father_name,
          motherName: student.mother_name,
          guardianName: student.guardian_name,
        })
        setForm(loadedForm)
        if (loadedForm.photoPath) {
          const signedUrl = await getStudentPhotoUrl(loadedForm.photoPath)
          if (active) setPhotoUrl(signedUrl)
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Biodata keluarga belum dapat dimuat.",
          )
        }
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [student])

  useEffect(
    () => () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl)
    },
    [photoUrl],
  )

  function updateField(key: keyof StudentBiodataInput, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectPhoto(file: File | undefined) {
    if (!file) return
    try {
      validateStudentPhoto(file)
      setPhotoFile(file)
      setPhotoUrl(URL.createObjectURL(file))
      setError("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Foto tidak valid.")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      const photoPath = photoFile
        ? await uploadStudentPhoto(student.id, photoFile)
        : form.photoPath
      await saveStudentBiodata(userId, student.id, { ...form, photoPath })
      onSaved(`Biodata ${student.full_name} berhasil disimpan.`)
      onClose()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Biodata keluarga belum dapat disimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-[#1d222b]/50 sm:items-center sm:p-5">
      <button
        aria-label="Tutup biodata"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="biodata-title"
        aria-modal="true"
        className="relative mx-auto flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-[var(--rapotku-border)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--rapotku-brand)]">
              Data Siswa
            </p>
            <h2 className="mt-1 text-xl font-bold" id="biodata-title">
              Foto & Biodata Keluarga
            </h2>
            <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
              {student.full_name}
            </p>
          </div>
          <button
            aria-label="Tutup biodata"
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="grid min-h-80 place-items-center" role="status">
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin text-[var(--rapotku-brand)]"
              size={30}
            />
            <span className="sr-only">Memuat biodata...</span>
          </div>
        ) : (
          <form
            className="min-h-0 flex-1 overflow-y-auto"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside>
                <p className="font-bold">Foto siswa</p>
                <div className="mt-3 aspect-[3/4] w-36 overflow-hidden rounded-2xl border-2 border-dashed border-[var(--rapotku-border)] bg-[#f8f9fb] sm:w-44">
                  {photoUrl ? (
                    <img
                      alt={`Foto ${student.full_name}`}
                      className="h-full w-full object-cover"
                      src={photoUrl}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[var(--rapotku-muted)]">
                      <UserRound aria-hidden="true" size={44} />
                    </span>
                  )}
                </div>
                <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--rapotku-brand)] px-4 text-sm font-bold text-[var(--rapotku-brand)]">
                  <Camera aria-hidden="true" size={18} />
                  Pilih Foto 3×4
                  <input
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => selectPhoto(event.target.files?.[0])}
                    type="file"
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-[var(--rapotku-muted)]">
                  JPG/PNG, maksimal 2 MB. Foto disimpan pribadi.
                </p>
              </aside>

              <div className="space-y-5">
                <label className="block text-sm font-semibold">
                  Nomor telepon siswa (opsional)
                  <input
                    className={inputClassName}
                    inputMode="tel"
                    maxLength={30}
                    onChange={(event) =>
                      updateField("studentPhone", event.target.value)
                    }
                    type="tel"
                    value={form.studentPhone}
                  />
                </label>
                {familyGroups.map((group) => (
                  <fieldset
                    className="rounded-2xl border border-[var(--rapotku-border)] p-4 sm:p-5"
                    key={group.title}
                  >
                    <legend className="px-2 font-bold">{group.title}</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {group.fields.map((field) => (
                        <label
                          className={`block text-sm font-semibold ${field.area ? "sm:col-span-2" : ""}`}
                          key={field.key}
                        >
                          {field.label}
                          {field.area ? (
                            <textarea
                              className={`${inputClassName} min-h-24 py-3`}
                              maxLength={500}
                              onChange={(event) =>
                                updateField(field.key, event.target.value)
                              }
                              value={form[field.key]}
                            />
                          ) : (
                            <input
                              className={inputClassName}
                              inputMode={
                                field.type === "tel" ? "tel" : undefined
                              }
                              maxLength={field.type === "tel" ? 30 : 160}
                              onChange={(event) =>
                                updateField(field.key, event.target.value)
                              }
                              type={field.type ?? "text"}
                              value={form[field.key]}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                {error ? (
                  <p
                    className="rounded-xl bg-[var(--rapotku-brand-soft)] p-3 text-sm font-semibold text-[var(--rapotku-brand-strong)]"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="sticky bottom-0 flex gap-3 border-t border-[var(--rapotku-border)] bg-white px-5 py-4 sm:justify-end sm:px-6">
              <button
                className="min-h-12 flex-1 rounded-xl border border-[var(--rapotku-border)] px-5 font-bold sm:flex-none"
                disabled={isSaving}
                onClick={onClose}
                type="button"
              >
                Batal
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:flex-none"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={19}
                  />
                ) : null}
                {isSaving ? "Menyimpan..." : "Simpan Biodata"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
