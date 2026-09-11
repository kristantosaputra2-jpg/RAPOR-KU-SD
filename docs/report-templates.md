# Template Rapor RaporKu

**Status:** Disetujui untuk MVP  
**Tanggal persetujuan:** 11 September 2026  
**Acuan:** PRD, `AGENTS.md`, `Architecture.md`, contoh rapor sekolah, dan koreksi langsung pengguna

## 1. Prinsip

- Template menerima data siap tampil dari report view model.
- Template tidak melakukan query, menghitung nilai, menentukan predikat, atau membuat deskripsi.
- Identitas sekolah, periode, siswa, guru, KKM, nilai, dan isi rapor berasal dari data/configuration, bukan hardcode.
- Preview dan hasil cetak memakai komponen presentasi yang sama.
- Jalur cetak MVP menggunakan HTML print dan print CSS pada kertas A4 portrait.
- Data kosong ditampilkan sebagai tanda `-`, tidak diisi dengan data rekaan.

## 2. Urutan Halaman

### 2.1 Sampul

Urutan vertikal yang disetujui:

1. Judul utama `LAPORAN HASIL CAPAIAN KOMPETENSI PESERTA DIDIK SEKOLAH DASAR`.
2. Lambang Tut Wuri Handayani berukuran besar tepat di tengah, di bawah judul.
3. Nama peserta didik.
4. NIS dan NISN.
5. Nama dan alamat sekolah.
6. Nama kementerian dan Republik Indonesia di bagian bawah halaman.

Judul merupakan satu headline utama walaupun dapat dibagi menjadi beberapa baris agar tetap terbaca.

### 2.2 Identitas Peserta Didik

Memuat:

- nama peserta didik;
- NIS dan NISN;
- tempat dan tanggal lahir;
- jenis kelamin;
- agama;
- alamat;
- nomor telepon bila tersedia;
- biodata ayah, ibu, dan wali: nama, pendidikan, pekerjaan, alamat, serta nomor telepon.

Foto siswa menggunakan rasio 3×4. Bingkai foto ditempatkan di bagian bawah dan berdampingan dekat dengan tanda tangan kepala sekolah agar foto dan tanda tangan dapat terkena satu cap/stempel yang sama.

### 2.3 Rapor dan Profil Peserta Didik

Bagian identitas ringkas memuat:

- nama peserta didik;
- kelas;
- NIS/NISN;
- semester;
- tahun pelajaran;
- kelompok rapor kelas rendah atau kelas tinggi.

Tabel hasil belajar memuat setiap mata pelajaran dengan struktur:

| Data umum                  | Pengetahuan                          | Keterampilan                         |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| nomor, mata pelajaran, KKM | nilai 0–100, predikat A–D, deskripsi | nilai 0–100, predikat A–D, deskripsi |

Jika tabel berlanjut ke halaman berikutnya, kepala tabel harus tampil kembali. Baris dan deskripsi tidak boleh terpotong secara tidak terbaca.

### 2.4 Ringkasan Akhir

Memuat:

- ekstrakurikuler;
- saran atau catatan wali kelas;
- prestasi;
- ketidakhadiran: sakit, izin, dan tanpa keterangan;
- tanda tangan orang tua/wali;
- tanda tangan wali kelas beserta NIP bila tersedia;
- tanda tangan kepala sekolah beserta NIP bila tersedia.

## 3. Perbedaan Kelompok Kelas

Kelas 1–3 memakai `lower_primary` dan kelas 4–6 memakai `upper_primary`. Keduanya menggunakan struktur halaman resmi yang sama dan core data yang sama. Perbedaan aturan akademik atau komponen tambahan harus berasal dari konfigurasi/template group dan tidak boleh dibuat langsung di komponen cetak.

## 4. Data yang Tidak Ditampilkan

Sesuai keputusan produk terbaru, template MVP tidak memuat:

- tinggi badan;
- berat badan;
- kondisi pendengaran;
- kondisi penglihatan;
- kondisi gigi;
- data kesehatan lain.

## 5. Aturan Cetak

- Ukuran kertas A4 portrait.
- Sampul, identitas, hasil belajar, dan ringkasan memiliki pemisah halaman yang jelas.
- Tabel boleh melanjutkan ke halaman baru ketika deskripsi panjang.
- Nama siswa panjang harus membungkus tanpa terpotong.
- Foto memakai `object-fit: cover` agar rasio 3×4 tetap rapi.
- Kontrol aplikasi tidak ikut tercetak.
- Cetak satu siswa dan satu kelas menggunakan template yang sama.
- Jalur PDF MVP menggunakan fitur `Save as PDF` dari Chrome tanpa engine atau layanan berbayar tambahan.
- Pengujian otomatis dilakukan pada Google Chrome desktop dan simulasi Chrome Android Pixel 5; pemeriksaan singkat pada HP fisik tetap dilakukan sebelum penggunaan produksi.

## 6. Sumber Data

Alur data yang wajib dipertahankan:

```text
Supabase
→ report service
→ report view model
→ template rapor
→ preview / browser print / Save as PDF
```

Perubahan layout berikutnya tidak boleh mengubah formula nilai, predikat, isi deskripsi final guru, atau data historis.

## 7. Pemeriksaan Minimum

Setiap perubahan template wajib memeriksa:

- kelas 1–3 dan kelas 4–6;
- field kosong;
- nama siswa panjang;
- deskripsi panjang;
- foto tersedia dan foto kosong;
- tabel lintas halaman;
- ukuran A4;
- hasil preview dan hasil cetak;
- tidak muncul data kesehatan.
