-- Database creation script for Bank Sampah App
-- To import: mysql -u username -p < database.sql

CREATE DATABASE IF NOT EXISTS bank_sampah_digital;
USE bank_sampah_digital;

-- 1. Table `setoran`
CREATE TABLE IF NOT EXISTS `setoran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_penyetor` VARCHAR(150) NOT NULL,
  `rt` INT NOT NULL CHECK (`rt` BETWEEN 1 AND 9),
  `tanggal_setor` DATE NOT NULL,
  `jenis_sampah` ENUM('Plastik', 'Kertas', 'Kardus', 'Kaleng', 'Botol', 'Lainnya') NOT NULL,
  `berat` DECIMAL(10,2) NOT NULL,
  `harga_per_kg` DECIMAL(10,2) NOT NULL,
  `keterangan` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table `penjualan_bsm`
CREATE TABLE IF NOT EXISTS `penjualan_bsm` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal_penjualan` DATE NOT NULL,
  `total_berat` DECIMAL(10,2) NOT NULL,
  `total_hasil_penjualan` DECIMAL(10,2) NOT NULL,
  `kas_bank_sampah` DECIMAL(10,2) NOT NULL,
  `dana_warga` DECIMAL(10,2) NOT NULL,
  `jasa_pengelola` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data for Setoran
INSERT INTO `setoran` (`nama_penyetor`, `rt`, `tanggal_setor`, `jenis_sampah`, `berat`, `harga_per_kg`, `keterangan`) VALUES
('Budi', 1, '2026-06-20', 'Plastik', 3.00, 4000.00, 'Botol mineral'),
('Budi', 1, '2026-06-20', 'Kertas', 1.00, 2000.00, 'Koran bekas'),
('Siti', 1, '2026-06-20', 'Plastik', 5.00, 4000.00, 'Plastik keras'),
('Agus', 3, '2026-06-20', 'Kardus', 20.00, 3000.00, 'Kardus mie instan'),
('Aminah', 3, '2026-06-20', 'Kaleng', 15.00, 8000.00, 'Kaleng soda'),
('Joko', 3, '2026-06-20', 'Botol', 40.00, 5000.00, 'Botol kecap kaca'),
('Lani', 5, '2026-06-21', 'Lainnya', 10.00, 1000.00, 'Sampah daun kering'),
('Budi', 1, '2026-06-15', 'Plastik', 4.00, 4000.00, 'Plastik kemasan');

-- Seed Data for Penjualan BSM
INSERT INTO `penjualan_bsm` (`tanggal_penjualan`, `total_berat`, `total_hasil_penjualan`, `kas_bank_sampah`, `dana_warga`, `jasa_pengelola`) VALUES
('2026-06-22', 98.00, 1000000.00, 200000.00, 500000.00, 300000.00);
