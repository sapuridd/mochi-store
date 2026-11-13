-- ============================================================================
-- DATABASE: MOCHI.OLED SMART KEYCHAIN STORE
-- Modul: Database Login & Pembuatan Akun Pembeli + Admin Backoffice
-- ============================================================================

CREATE DATABASE IF NOT EXISTS db_mochi_oled
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_mochi_oled;

-- ----------------------------------------------------------------------------
-- 1. TABEL AKUN PEMBELI (USERS / BUYERS)
-- Menyimpan data registrasi akun baru & kredensial login pembeli dari index.html
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pembeli (
    id_pembeli VARCHAR(25) PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    no_whatsapp VARCHAR(25) NOT NULL UNIQUE,
    alamat_pengiriman TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status_akun ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL
);

INSERT INTO pembeli (id_pembeli, nama_lengkap, email, no_whatsapp, alamat_pengiriman, password_hash, status_akun, created_at, last_login)
VALUES
(
    'usr-001',
    'Budi Santoso',
    'budi@pembeli.com',
    '081234567890',
    'Jl. Sudirman No. 45, Kec. Kebayoran Baru, Jakarta Selatan 12190 (Pagar Hitam)',
    'pembeli123',
    'aktif',
    '2026-11-01 09:30:00',
    '2026-11-02 19:15:00'
),
(
    'usr-002',
    'Siti Rahmawati',
    'siti@pembeli.com',
    '085712349876',
    'Jl. Dago Asri No. 18, Kec. Coblong, Kota Bandung 40135',
    'pembeli123',
    'aktif',
    '2026-11-01 14:20:00',
    '2026-11-02 20:05:00'
);

-- ----------------------------------------------------------------------------
-- 2. TABEL AKUN ADMIN (FOLDER KHUSUS /admin/index.html)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id_admin VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    nama_admin VARCHAR(100) NOT NULL,
    role_admin ENUM('SUPER ADMIN', 'INVENTORY STAFF') DEFAULT 'INVENTORY STAFF',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_users (id_admin, username, email, nama_admin, role_admin, password_hash)
VALUES
('adm-01', 'admin', 'admin@mochi.id', 'Super Admin Mochi', 'SUPER ADMIN', 'admin123'),
('adm-02', 'gudang', 'gudang@mochi.id', 'Rizky (Staff Gudang)', 'INVENTORY STAFF', 'gudang123');

-- ----------------------------------------------------------------------------
-- 3. TABEL KONFIGURASI REKENING OWNER & PAYMENT GATEWAY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS konfigurasi_rekening (
    id_config INT PRIMARY KEY DEFAULT 1,
    nama_pemilik VARCHAR(100) NOT NULL,
    nama_bank VARCHAR(50) NOT NULL,
    no_rekening VARCHAR(50) NOT NULL,
    nama_bank_sekunder VARCHAR(50) DEFAULT NULL,
    no_rekening_sekunder VARCHAR(50) DEFAULT NULL,
    no_ewallet VARCHAR(30) NOT NULL,
    merchant_qris VARCHAR(100) NOT NULL,
    nmid_qris VARCHAR(50) NOT NULL,
    whatsapp_admin VARCHAR(30) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO konfigurasi_rekening (
    id_config, nama_pemilik, nama_bank, no_rekening,
    nama_bank_sekunder, no_rekening_sekunder, no_ewallet,
    merchant_qris, nmid_qris, whatsapp_admin
) VALUES (
    1,
    'Dede Sapuriyandika',
    'SeaBank',
    '901768637410',
    'SeaBank (Transfer Instan)',
    '901768637410',
    '083871535128',
    'DS Store',
    'ID1026590649467',
    '6283871535128'
);

-- ----------------------------------------------------------------------------
-- 4. TABEL TRANSAKSI PESANAN (MOCHI.PAY PAYMENT GATEWAY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaksi_pesanan (
    id_pesanan VARCHAR(35) PRIMARY KEY,
    id_pembeli VARCHAR(25) DEFAULT NULL,
    nama_pembeli VARCHAR(100) NOT NULL,
    no_whatsapp VARCHAR(25) NOT NULL,
    alamat_pengiriman TEXT NOT NULL,
    kurir VARCHAR(50) NOT NULL,
    metode_pembayaran VARCHAR(100) NOT NULL,
    rekening_tujuan VARCHAR(150) NOT NULL,
    subtotal INT NOT NULL,
    ongkir INT NOT NULL,
    kode_unik INT NOT NULL DEFAULT 0,
    total_bayar INT NOT NULL,
    status_pembayaran ENUM('MENUNGGU VERIFIKASI', 'LUNAS', 'DIBATALKAN') DEFAULT 'MENUNGGU VERIFIKASI',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


