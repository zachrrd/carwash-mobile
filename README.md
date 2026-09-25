# 📱 Car Wash Mobile App (Floor & Field Operations)

[![React Native](https://img.shields.io/badge/React_Native-0.86-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Expo Router](https://img.shields.io/badge/Expo_Router-v5-000000?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind_Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO_Client-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

> **Modern cross-platform mobile application** designed specifically for car wash frontline operators, field technicians, and cashiers. Empowers on-the-ground staff to manage live vehicle queues, assign multiple technicians, update wash stages in real-time, collect payments, and print/share digital PDF invoices.

---

## 🎯 Purpose & Real-World Use Case

Dalam operasional bisnis cuci mobil, efisiensi waktu dan koordinasi fisik di area pencucian sangat krusial. Aplikasi mobile ini dirancang untuk:
1. **Penerimaan & Check-In Cepat**: Staf di gerbang masuk dapat langsung mendaftarkan plat nomor mobil customer, memilih jenis paket cuci, dan mencatat waktu check-in tanpa perlu menghampiri meja kasir utama.
2. **Monitoring Antrean Real-Time**: Antrean kendaraan yang sedang dicuci ditampilkan secara *real-time* via koneksi WebSocket (`Socket.IO`), otomatis memperbarui tampilan saat ada mobil baru masuk.
3. **Multi-Staff Assignment**: Supervisi dapat menugaskan teknisi cuci mobil secara spesifik ke antrean tertentu untuk akuntabilitas kerja.
4. **Pembayaran & Kasir Mobile**: Menerima pembayaran langsung di tempat melalui uang tunai (*cash with automated change calculation*), QRIS, atau Transfer Bank.
5. **Cetak & Bagikan Invoice Digital**: Menggunakan integrasi modul `expo-print` dan `expo-sharing` untuk mencetak invoice ke printer struk atau membagikan file PDF ke WhatsApp pelanggan.

---

## 🌟 Key Application Features

### 1. File-Based Navigation (Expo Router)
- Arsitektur routing modern menggunakan struktur direktori berbasis filesystem:
  - `(auth)`: Halaman login staf & kasir dengan validasi token dan penyimpanan aman.
  - `(tabs)`: Bottom navigation terintegrasi (`Orders`, `Customers`, `Vehicles`, `History`, `Profile`).
  - `order/`: Stack navigasi dinamis untuk alur pembuatan order, detail status, update status, dan pelunasan pembayaran.
  - `invoice/`: Viewer faktur digital resolusi tinggi dengan aksi cetak dan berbagi.

### 2. Live Synchronization via Socket.IO
- Terhubung langsung ke WebSocket server backend:
  - Otomatis bergabung ke room `orders` saat staf login.
  - Mendengarkan event real-time seperti `new-order`, `order-status-updated`, dan `order-paid`.
  - Mengeliminasi kebutuhan *pull-to-refresh* manual demi responsivitas maksimal di lapangan.

### 3. Secure Token Storage
- Menggunakan `expo-secure-store` untuk mengenkripsi dan menyimpan JWT token di hardware keychain perangkat (Android Keystore / iOS Keychain).
- Dilengkapi interceptor otomatis Axios (`apiClient.ts`):
  - Menyematkan header `Authorization: Bearer <token>` pada setiap request HTTP.
  - Melakukan auto-logout dan pembersihan session jika menerima kode HTTP `401 Unauthorized`.

### 4. Portable PDF Invoicing
- Mengunduh invoice PDF beresolusi tinggi langsung dari backend.
- Fitur `expo-print` memungkinkan pencetakan langsung melalui protokol AirPrint (iOS) atau Android Print Spooler / Bluetooth Printer.
- Fitur `expo-sharing` memungkinkan staf mengirim bukti struk langsung via aplikasi pesan instan (WhatsApp, Telegram, atau Email).

---

## 📱 Mobile Architecture & Folder Structure

```text
mobile/
├── app/                              # Expo Router File-Based Routing
│   ├── (auth)/                       # Authentication Route Group
│   │   ├── _layout.tsx
│   │   └── login.tsx                 # Staff / Cashier Login Screen
│   ├── (tabs)/                       # Bottom Tab Navigation
│   │   ├── _layout.tsx               # Tab bar configuration & Lucide icons
│   │   ├── orders.tsx                # Active live queue board
│   │   ├── customers.tsx             # Customer directory lookup
│   │   ├── vehicles.tsx              # Vehicle database by plate number
│   │   ├── history.tsx               # Completed transactions archive
│   │   └── profile.tsx               # Operator profile & logout
│   ├── order/                        # Order Management Flow
│   │   ├── [id].tsx                  # Real-time order progress & technician board
│   │   ├── create.tsx                # New order creation wizard
│   │   ├── update.tsx                # Status transition & staff assignment
│   │   ├── payment.tsx               # Payment settlement (Cash / QRIS / Transfer)
│   │   └── success.tsx               # Completion summary screen
│   ├── invoice/
│   │   └── [id].tsx                  # Digital invoice preview & print/share actions
│   └── _layout.tsx                   # Global root layout with Toast & SafeArea
│
├── components/                       # Reusable mobile UI components
├── services/                         # API & Network Services
│   ├── apiClient.ts                  # Axios instance with SecureStore interceptors
│   ├── socket.ts                     # Socket.io client setup & auth handshake
│   ├── auth.service.ts               # Login & profile operations
│   ├── order.service.ts              # Order CRUD & status transitions
│   ├── payment.service.ts            # Cash & payment records
│   ├── invoice.service.ts            # PDF fetching & parsing
│   ├── customer.service.ts           # Customer search & creation
│   ├── vehicle.service.ts            # Vehicle management
│   └── staff.service.ts              # Operational staff assignment
│
├── types/                            # TypeScript interfaces (Order, Payment, Staff, etc.)
├── utils/                            # Currency formatters & Toast notification helpers
├── global.css                        # NativeWind Tailwind entry stylesheet
├── tailwind.config.js                # Tailwind CSS theme configuration
├── metro.config.js                   # Metro bundler config with NativeWind
├── app.json                          # Expo configuration metadata
└── package.json
```

---

## ⚙️ Configuration & Environment Variables

Buat berkas `.env` pada root direktori `mobile` (atau salin dari `.env.example`):

```bash
cp .env.example .env
```

Isi variabel konfigurasi:

```env
# Ganti dengan IP lokal komputer Anda pada jaringan Wi-Fi lokal
# PENTING: Jangan gunakan "localhost" jika menguji menggunakan perangkat fisik HP!
EXPO_PUBLIC_API_URL="http://192.168.1.100:5000/api"
EXPO_PUBLIC_SOCKET_URL="http://192.168.1.100:5000"
```

> **Catatan Jaringan**: Pastikan smartphone dan komputer yang menjalankan server backend berada dalam satu jaringan Wi-Fi yang sama agar koneksi API dan WebSockets berjalan lancar.

---

## 🚀 Running the App Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```

### 3. Open on Device or Emulator
- **Physical Device (Rekomendasi)**:
  - Pasang aplikasi **Expo Go** dari Google Play Store (Android) atau App Store (iOS).
  - Buka kamera ponsel atau aplikasi Expo Go, kemudian pindai QR code yang tampil di terminal Anda.
- **Android Emulator**:
  - Tekan `a` pada keyboard di terminal.
- **iOS Simulator (macOS)**:
  - Tekan `i` pada keyboard di terminal.
- **Web Preview**:
  - Tekan `w` untuk menjalankan versi web.

---

## 💡 Key Workflows in the Mobile App

1. **Memulai Shift (Login)**:
   - Staf memasukkan email dan password akun terdaftar.
   - Token disimpan secara aman di `Expo SecureStore`, dan koneksi WebSocket otomatis dibuat dengan payload token autentikasi.
2. **Membuat Antrean Baru (New Order)**:
   - Pilih pelanggan atau daftarkan pelanggan baru.
   - Masukkan nomor plat kendaraan (misal: `B 1234 ABC`).
   - Pilih paket cuci (misal: *Express Wash*, *Full Detailing*).
   - Simpan: Pesanan otomatis masuk ke antrean dengan status `WAITING`.
3. **Mengerjakan Pesanan (Work in Progress)**:
   - Di tab `Orders`, pilih antrean mobil.
   - Tambahkan staf teknisi yang bertugas mencuci.
   - Ubah status pengerjaan menjadi `IN_PROGRESS`.
   - Customer dan Admin langsung melihat pembaruan status secara instan tanpa delay.
4. **Penyelesaian & Pembayaran**:
   - Setelah selesai, ubah status menjadi `COMPLETED`.
   - Buka halaman pembayaran, masukkan nominal pembayaran tunai (aplikasi otomatis menghitung kembalian) atau pilih QRIS/Transfer.
   - Setelah sukses, struk invoice langsung dibuat dan siap dicetak ke printer struk atau dibagikan ke WhatsApp pelanggan.

---

## 👨‍💻 Maintainer
**Zacharia** - [@zachrrd](https://github.com/zachrrd)
Repository: [carwash-mobile](https://github.com/zachrrd/carwash-mobile)
