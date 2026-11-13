/* =========================================================================
   MOCHI.OLED // Konfigurasi Cloud Database (Firebase & Google Sheets) & Keamanan Admin
   File ini digunakan bersama oleh:
   - index.html
   - wireframe_penjualan_ganci_mochi_oled (1).html
   - admin/index.html
   - admin/dashboard.html

   PETUNJUK DEPLOY / HOSTING:
   Isi URL Firebase Realtime Database dan/atau URL Google Apps Script Web App
   di bawah ini (atau export otomatis dari Dashboard Admin -> Tab Cloud & Keamanan)
   agar seluruh pembeli & admin sinkron antar perangkat secara real-time.
   ========================================================================= */

window.MOCHI_CLOUD_CONFIG = {
    // 1. Firebase Realtime Database URL (Contoh: 'https://mochi-oled-default-rtdb.asia-southeast1.firebasedatabase.app')
    firebaseDatabaseUrl: '',
    // Token auth opsional jika rules Firebase tidak publik
    firebaseAuthToken: '',

    // 2. Google Sheets Apps Script Web App URL (Contoh: 'https://script.google.com/macros/s/.../exec')
    googleSheetsWebAppUrl: 'https://script.google.com/macros/s/AKfycbxd1jZEycyodGOsA0kJpmEr5ZQHDdKvi2rVzdYledcOsYCpbrgMs7Dsbr49ykxCDqfx/exec',

    // Interval sinkronisasi otomatis antar device (milidetik)
    syncIntervalMs: 8000,

    // Kredensial Admin terenkripsi SHA-256 + PIN 6-Digit (Tidak menyimpan plaintext di kode publik)
    adminAccounts: [
        {
            id: 'adm-01',
            username: 'admin',
            email: 'admin@mochi.id',
            name: 'Super Admin Mochi',
            role: 'SUPER ADMIN',
            passwordHash: 'ccd98432c2df8a97bc8899dc1d582ad839c1467edeebeb0a9088d049ea1dde9e',
            pinHash: '4f566a72c1d733cd1e45972f7696113d617bf40631812bb0d8449199125cfd1f'
        },
        {
            id: 'adm-02',
            username: 'gudang',
            email: 'gudang@mochi.id',
            name: 'Rizky (Staff Gudang)',
            role: 'INVENTORY STAFF',
            passwordHash: 'a10fdfcd3980b99a93362cf99860e77473cf15501f224f4669a17a16164460c8',
            pinHash: 'a6e9b949744a94a72fa74a4a075b5f22c7cf6d13b28a82f9b06b40ec5887f6ac'
        }
    ]
};

