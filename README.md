---

# Pi Network Bot (CLI Wallet)

Skrip *command-line* (CLI) sederhana untuk berinteraksi dengan Pi Network. Skrip ini memungkinkan Anda untuk membuat dompet baru, memulihkan dompet dari frasa mnemonik, memeriksa saldo, melihat riwayat transaksi, dan mengirim koin Pi, termasuk pengiriman massal (*batch send*).

## ✨ Fitur

-   🔐 **Buat Dompet Baru**: Menghasilkan dompet Pi baru yang aman dengan 24 kata frasa mnemonik.
-   🔑 **Pulihkan Dompet**: Memulihkan akses ke dompet Anda menggunakan frasa mnemonik.
-   💰 **Cek Saldo**: Melihat saldo Pi yang tersedia di alamat dompet mana pun.
-   📜 **Riwayat Transaksi**: Menampilkan riwayat transaksi terakhir dari sebuah akun.
-   💸 **Kirim Pi**: Melakukan transfer Pi ke satu alamat tujuan.
-   🚀 **Kirim Massal (Batch Send)**: Mengirim Pi ke banyak alamat sekaligus dalam satu transaksi dari sebuah file JSON.
-   📄 **Simpan Otomatis**: Detail dompet yang baru dibuat atau dipulihkan akan disimpan secara otomatis ke dalam file `.json` untuk referensi.

---

## ⚠️ **PERINGATAN KEAMANAN** ⚠️

> **Kunci Rahasia (`Secret Key`) dan Frasa Mnemonik (`Mnemonic Phrase`) adalah akses penuh ke dompet Anda.**
>
> -   **JANGAN PERNAH** membagikan Kunci Rahasia atau Frasa Mnemonik Anda kepada siapa pun.
> -   **JANGAN PERNAH** menjalankan skrip ini di komputer yang tidak Anda percayai atau yang mungkin terinfeksi malware.
> -   Simpan file `.json` yang dihasilkan di tempat yang sangat aman dan terenkripsi.
> -   **Developer tidak bertanggung jawab atas kehilangan dana apa pun.** Gunakan dengan risiko Anda sendiri.

---

## ⚙️ Instalasi

### Prasyarat

-   Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 14 atau lebih tinggi).
-   Pastikan Anda telah menginstal [Git](https://git-scm.com/).

### Langkah-langkah

1.  **Clone Repositori**
    Buka terminal atau Command Prompt Anda dan jalankan perintah berikut untuk mengunduh kode dari GitHub:
    ```bash
    git clone https://github.com/zendshost/pi-tools.git
    ```

2.  **Masuk ke Direktori Proyek**
    Setelah proses clone selesai, masuk ke dalam direktori proyek:
    ```bash
    cd pi-tools
    ```

3.  **Instal Dependensi**
    Jalankan perintah berikut untuk menginstal semua library yang diperlukan:
    ```bash
    npm install
    ```
    Setelah selesai, Anda siap untuk menggunakan skrip ini.

---

## 📖 Cara Penggunaan

Semua perintah dijalankan melalui terminal dari dalam direktori `pi-tools` dengan format dasar:

```bash
node pi_bot.js <perintah> [argumen...]
```

### 1. Membuat Dompet Baru (`generate`)

Perintah ini akan membuat dompet Pi Network baru dan menyimpannya dalam sebuah file `pi-wallet-....json`.

**Perintah:**
```bash
node pi_bot.js generate
```

**Contoh Output:**
```
--- Pi Network Bot ---
Membuat dompet Pi baru...
✅ Dompet berhasil dibuat!
✅ Detail dompet tersimpan di file: pi-wallet-GDRW4F4Y-1678886400000.json

--- HASIL PEMBUATAN DOMPET ---
Frasa Mnemonik (simpan di tempat aman!): word1 word2 ... word24
Public Key (Alamat Dompet): G.......................................................
Secret Key (JANGAN DIBAGIKAN!): S.......................................................
```

### 2. Memulihkan Dompet (`restore`)

Gunakan 24 kata frasa mnemonik Anda untuk memulihkan akses ke dompet yang sudah ada.

**Perintah:**
```bash
node pi_bot.js restore <24_kata_frasa_mnemonik>
```

**Contoh:**
```bash
node pi_bot.js restore word1 word2 word3 ... word24
```

### 3. Memeriksa Saldo (`balance`)

Melihat saldo Pi dari alamat dompet (Public Key) mana pun.

**Perintah:**
```bash
node pi_bot.js balance <public_key>
```

**Contoh:**
```bash
node pi_bot.js balance GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF
```

### 4. Melihat Riwayat Transaksi (`history`)

Menampilkan daftar transaksi terakhir dari sebuah alamat dompet. Secara default, akan menampilkan 10 transaksi terakhir.

**Perintah:**
```bash
node pi_bot.js history <public_key> [limit]
```

**Contoh (10 transaksi terakhir):**
```bash
node pi_bot.js history GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF
```

**Contoh (5 transaksi terakhir):**
```bash
node pi_bot.js history GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF 5
```

### 5. Mengirim Pi (`send`)

Mengirim sejumlah Pi dari dompet Anda ke alamat lain. Anda memerlukan Kunci Rahasia (`Secret Key`) dari dompet pengirim.

**Perintah:**
```bash
node pi_bot.js send <secret_key_anda> <alamat_tujuan> <jumlah> [memo_opsional]
```

**Contoh (tanpa memo):**
```bash
node pi_bot.js send S................... G................... 1.5
```

**Contoh (dengan memo):**
```bash
node pi_bot.js send S................... G................... 10 "Pembayaran untuk barang"
```

### 6. Mengirim Pi Secara Massal (`batchSend`)

Mengirim Pi ke banyak alamat sekaligus. Anda perlu membuat file JSON yang berisi daftar alamat tujuan dan jumlahnya.

**Perintah:**
```bash
node pi_bot.js batchSend <secret_key_anda> <path_ke_file.json> [memo_opsional]
```

**Langkah-langkah:**

1.  Buat sebuah file, misalnya `penerima.json`, di dalam direktori `pi-tools`.
2.  Isi file tersebut dengan format berikut:

    ```json
    [
      {
        "destination": "G.................................................1",
        "amount": "10.5"
      },
      {
        "destination": "G.................................................2",
        "amount": "5"
      },
      {
        "destination": "G.................................................3",
        "amount": "20.1234567"
      }
    ]
    ```

3.  Jalankan perintah di terminal.

**Contoh:**
```bash
node pi_bot.js batchSend S................... penerima.json "Gaji bulanan"
```

---

## 📞 Kontak Developer

Jika Anda memiliki pertanyaan, saran, atau menemukan bug, silakan hubungi developer:

-   **Nama**: zendshost
-   **Telegram**: [https://t.me/zendshost](https://t.me/zendshost)

---

## 📜 Lisensi

Skrip ini disediakan "sebagaimana adanya", tanpa jaminan apa pun. Pengguna bertanggung jawab penuh atas penggunaan skrip ini dan keamanan dana mereka sendiri.
