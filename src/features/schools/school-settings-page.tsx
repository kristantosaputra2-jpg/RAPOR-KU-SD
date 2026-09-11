import { useEffect, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Image,
  LoaderCircle,
  LogOut,
  Save,
  School,
} from "lucide-react"

import {
  getSchoolSettings,
  saveSchoolSettings,
  type SchoolSettings,
  type SchoolSettingsInput,
} from "@/features/schools/school-settings.service"

type SchoolSettingsPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
  onSchoolNameChange: (schoolName: string) => void
}>

const emptyForm: SchoolSettingsInput = {
  schoolName: "",
  npsn: "",
  address: "",
  village: "",
  district: "",
  city: "",
  province: "",
  postalCode: "",
  email: "",
  principalName: "",
  principalNip: "",
  logoUrl: null,
}

function formFromSettings(
  settings: SchoolSettings | null,
): SchoolSettingsInput {
  if (!settings) {
    return emptyForm
  }

  return {
    schoolName: settings.school_name,
    npsn: settings.npsn ?? "",
    address: settings.address ?? "",
    village: settings.village ?? "",
    district: settings.district ?? "",
    city: settings.city ?? "",
    province: settings.province ?? "",
    postalCode: settings.postal_code ?? "",
    email: settings.email ?? "",
    principalName: settings.principal_name ?? "",
    principalNip: settings.principal_nip ?? "",
    logoUrl: settings.logo_url,
  }
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition placeholder:text-[#a4aab4] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  maxLength,
  type = "text",
  inputMode,
  placeholder,
  hint,
}: Readonly<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  maxLength: number
  type?: "text" | "email"
  inputMode?: "numeric"
  placeholder?: string
  hint?: string
}>) {
  return (
    <div>
      <label className="text-sm font-bold" htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-1 text-[var(--rapotku-brand)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        className={inputClassName}
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint ? (
        <p
          className="mt-1.5 text-xs leading-5 text-[var(--rapotku-muted)]"
          id={`${id}-hint`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function SchoolSettingsPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
  onSchoolNameChange,
}: SchoolSettingsPageProps) {
  const [form, setForm] = useState<SchoolSettingsInput>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [logoutError, setLogoutError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    void getSchoolSettings()
      .then((settings) => {
        if (isMounted) {
          setForm(formFromSettings(settings))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Pengaturan sekolah belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  function updateField<Key extends keyof SchoolSettingsInput>(
    key: Key,
    value: SchoolSettingsInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaveError("")
    setSuccessMessage("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const savedSettings = await saveSchoolSettings(userId, form)
      setForm(formFromSettings(savedSettings))
      onSchoolNameChange(savedSettings.school_name)
      setSuccessMessage("Pengaturan sekolah tersimpan.")
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Pengaturan sekolah belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    setLogoutError("")
    setIsLoggingOut(true)

    try {
      await onLogout()
    } catch {
      setLogoutError(
        "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1120px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <School aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {schoolName ? `RaporKu - ${schoolName}` : "RaporKu"}
            </p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {userName} · Admin
            </p>
          </div>
          <button
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-semibold transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:opacity-60 sm:flex"
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? "Sedang keluar..." : "Keluar"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[var(--rapotku-brand)]">
            Pengaturan awal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Pengaturan Sekolah
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
            Isi identitas yang akan dipakai pada data dan rapor sekolah. Kolom
            bertanda bintang wajib diisi.
          </p>
        </div>

        {logoutError ? (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm leading-6 text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 shrink-0"
              aria-hidden="true"
              size={19}
            />
            <span>{logoutError}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div
            className="mt-6 flex min-h-56 items-center justify-center rounded-3xl border border-[var(--rapotku-border)] bg-white p-6"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                aria-hidden="true"
                size={32}
              />
              <p className="mt-3 font-semibold">Memuat pengaturan sekolah...</p>
            </div>
          </div>
        ) : loadError ? (
          <section
            className="mt-6 rounded-3xl border border-[#f5b7ba] bg-white p-6 text-center"
            role="alert"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <AlertCircle aria-hidden="true" size={24} />
            </span>
            <h2 className="mt-4 text-lg font-bold">Data belum dapat dimuat</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--rapotku-muted)]">
              {loadError}
            </p>
            <button
              className="mt-5 min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_18px_rgba(201,29,36,0.2)] transition hover:bg-[var(--rapotku-brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError("")
                setLoadAttempt((attempt) => attempt + 1)
              }}
            >
              Coba lagi
            </button>
          </section>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {saveError ? (
              <div
                className="flex items-start gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm leading-6 text-[var(--rapotku-brand-strong)]"
                role="alert"
              >
                <AlertCircle
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  size={19}
                />
                <span>{saveError}</span>
              </div>
            ) : null}

            {successMessage ? (
              <div
                className="flex items-start gap-3 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[var(--rapotku-success)]"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 aria-hidden="true" size={19} />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                  <Building2 aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Identitas sekolah</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                    Data dasar sekolah untuk digunakan di seluruh aplikasi.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    id="school-name"
                    label="Nama sekolah"
                    value={form.schoolName}
                    onChange={(value) => updateField("schoolName", value)}
                    required
                    maxLength={160}
                    placeholder="Contoh: SD Negeri ..."
                  />
                </div>
                <TextField
                  id="npsn"
                  label="NPSN"
                  value={form.npsn}
                  onChange={(value) => updateField("npsn", value)}
                  maxLength={20}
                  inputMode="numeric"
                  placeholder="Masukkan NPSN"
                />
                <TextField
                  id="school-email"
                  label="Email sekolah"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  maxLength={254}
                  type="email"
                  placeholder="sekolah@contoh.sch.id"
                />
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold" htmlFor="address">
                    Alamat
                  </label>
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y py-3`}
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    maxLength={500}
                    placeholder="Jalan, nomor, atau keterangan lokasi"
                  />
                </div>
                <TextField
                  id="village"
                  label="Desa/Kelurahan"
                  value={form.village}
                  onChange={(value) => updateField("village", value)}
                  maxLength={120}
                />
                <TextField
                  id="district"
                  label="Kecamatan"
                  value={form.district}
                  onChange={(value) => updateField("district", value)}
                  maxLength={120}
                />
                <TextField
                  id="city"
                  label="Kabupaten/Kota"
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                  maxLength={120}
                />
                <TextField
                  id="province"
                  label="Provinsi"
                  value={form.province}
                  onChange={(value) => updateField("province", value)}
                  maxLength={120}
                />
                <TextField
                  id="postal-code"
                  label="Kode pos"
                  value={form.postalCode}
                  onChange={(value) => updateField("postalCode", value)}
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff7e8] text-[#9a5a00]">
                  <School aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Kepala sekolah</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                    Identitas penanggung jawab yang akan tampil pada rapor.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField
                  id="principal-name"
                  label="Nama kepala sekolah"
                  value={form.principalName}
                  onChange={(value) => updateField("principalName", value)}
                  maxLength={160}
                />
                <TextField
                  id="principal-nip"
                  label="NIP kepala sekolah"
                  value={form.principalNip}
                  onChange={(value) => updateField("principalNip", value)}
                  maxLength={30}
                  inputMode="numeric"
                  hint="Boleh dikosongkan jika belum tersedia."
                />
              </div>
            </section>

            <section className="rounded-3xl border border-dashed border-[#d7dae0] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0f1f3] text-[var(--rapotku-muted)]">
                  <Image aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2 className="font-bold">Logo sekolah</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--rapotku-muted)]">
                    Upload logo belum tersedia pada tahap ini. Fitur ini akan
                    dibuat terpisah agar file tersimpan dengan aman.
                  </p>
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 -mx-4 border-t border-[var(--rapotku-border)] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <button
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-6 font-bold text-white shadow-[0_10px_24px_rgba(201,29,36,0.22)] transition hover:bg-[var(--rapotku-brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                    size={19}
                  />
                ) : (
                  <Save aria-hidden="true" size={19} />
                )}
                {isSaving ? "Menyimpan..." : "Simpan pengaturan"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
