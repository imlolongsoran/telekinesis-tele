# Auto Upload Telegram

Aplikasi untuk menjadwalkan dan mengirim post ke channel Telegram secara otomatis.

## Cara Menjalankan Aplikasi

### Metode 1: Double-click Script (Mudah)

1. Double-click pada file `start_app.vbs` untuk menjalankan aplikasi secara otomatis.
2. Browser akan terbuka dengan aplikasi pada alamat http://localhost:3000

### Metode 2: Manual via Terminal

1. Buka terminal pada folder aplikasi
2. Jalankan perintah:
   ```
   npm run dev
   ```
3. Buka browser dan akses http://localhost:3000

## Fitur Utama

- Manajemen token bot Telegram
- Manajemen channel Telegram
- Penjadwalan post dengan timezone Asia/Jakarta
- Pengiriman post secara otomatis pada waktu yang ditentukan
- Dashboard monitoring status post

## Troubleshooting

### Jika Aplikasi Tidak Berjalan dengan start_app.vbs

1. Coba jalankan langsung file `start_app.bat` dengan double-click
2. Periksa apakah Node.js terinstal dengan menjalankan `node --version` di terminal
3. Jika port 3000 sudah digunakan, edit file `app.js` dan ubah nilai PORT dengan port lain

### Jika Browser Tidak Terbuka Otomatis

Buka browser secara manual dan akses http://localhost:3000

## Fitur

- Manajemen token bot Telegram
- Manajemen channel Telegram
- Pembuatan jadwal posting dengan atau tanpa gambar
- Penjadwalan waktu posting
- Tampilan dark mode yang elegan dan responsif

## Persyaratan

- Node.js 14+ dan npm
- Bot Telegram (dapatkan token dari [@BotFather](https://t.me/botfather))
- Channel Telegram (pastikan bot Anda sudah menjadi admin di channel)

## Instalasi

1. Clone repositori atau download source code
2. Install dependensi

```bash
npm install
```

3. Jalankan aplikasi

```bash
npm start
```

Atau untuk pengembangan:

```bash
npm run dev
```

4. Buka aplikasi di browser: http://localhost:3000

## Cara Penggunaan

1. **Tambahkan Token Bot**
   - Kunjungi halaman "Token"
   - Masukkan nama dan token bot Telegram Anda
   - Token bisa didapatkan dari [@BotFather](https://t.me/botfather)

2. **Tambahkan Channel**
   - Kunjungi halaman "Channel"
   - Masukkan nama dan ID channel
   - ID channel bisa berupa username (@channelname) atau ID numerik
   - Pastikan bot telah menjadi admin di channel tersebut

3. **Buat Jadwal Posting**
   - Kunjungi halaman "Posting"
   - Pilih bot dan channel yang akan digunakan
   - Masukkan pesan yang akan dikirim
   - Upload gambar (opsional)
   - Atur jadwal pengiriman (tanggal dan waktu)
   - Klik "Jadwalkan Post"

4. **Pantau Jadwal**
   - Lihat daftar jadwal posting di halaman "Dashboard" atau "Posting"
   - Lihat status posting (Menunggu, Terkirim, atau Gagal)

## Struktur Data

Aplikasi ini menyimpan data dalam file JSON di direktori `data/`:

- `token.json` - Daftar token bot Telegram
- `channel.json` - Daftar channel Telegram
- `config.json` - Daftar jadwal posting

## Penting untuk Diketahui

- Bot harus memiliki izin admin di channel untuk bisa mengirim pesan
- Pastikan server berjalan agar posting terjadwal dapat terkirim
- Timezone yang digunakan adalah timezone dari server tempat aplikasi dijalankan

## Lisensi

MIT 