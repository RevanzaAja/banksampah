const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET export database as SQL script
router.get('/export', async (req, res) => {
  try {
    let sqlDump = `-- Bank Sampah Database Backup\n`;
    sqlDump += `-- Generated on ${new Date().toISOString()}\n\n`;
    
    // Setoran schema & data
    sqlDump += `DROP TABLE IF EXISTS \`setoran\`;\n`;
    sqlDump += `CREATE TABLE \`setoran\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nama_penyetor\` VARCHAR(150) NOT NULL,
  \`rt\` INT NOT NULL,
  \`tanggal_setor\` DATE NOT NULL,
  \`jenis_sampah\` ENUM('Plastik', 'Kertas', 'Kardus', 'Kaleng', 'Botol', 'Lainnya') NOT NULL,
  \`berat\` DECIMAL(10,2) NOT NULL,
  \`harga_per_kg\` DECIMAL(10,2) NOT NULL,
  \`keterangan\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    const [setoranRows] = await db.query('SELECT * FROM setoran');
    if (setoranRows.length > 0) {
      sqlDump += `INSERT INTO \`setoran\` (\`id\`, \`nama_penyetor\`, \`rt\`, \`tanggal_setor\`, \`jenis_sampah\`, \`berat\`, \`harga_per_kg\`, \`keterangan\`, \`created_at\`) VALUES\n`;
      const inserts = setoranRows.map(row => {
        const id = row.id;
        const nama = row.nama_penyetor.replace(/'/g, "\\'");
        const rt = row.rt;
        
        let dateStr = row.tanggal_setor;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().split('T')[0];
        } else if (typeof dateStr === 'string') {
          dateStr = dateStr.split('T')[0];
        }
        
        const jenis = row.jenis_sampah;
        const berat = row.berat;
        const harga = row.harga_per_kg;
        const ket = row.keterangan ? row.keterangan.replace(/'/g, "\\'") : '';
        const created = row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at || new Date().toISOString());
        
        return `(${id}, '${nama}', ${rt}, '${dateStr}', '${jenis}', ${berat}, ${harga}, '${ket}', '${created}')`;
      });
      sqlDump += inserts.join(',\n') + ';\n\n';
    }

    // Penjualan schema & data
    sqlDump += `DROP TABLE IF EXISTS \`penjualan_bsm\`;\n`;
    sqlDump += `CREATE TABLE \`penjualan_bsm\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tanggal_penjualan\` DATE NOT NULL,
  \`total_berat\` DECIMAL(10,2) NOT NULL,
  \`total_hasil_penjualan\` DECIMAL(10,2) NOT NULL,
  \`kas_bank_sampah\` DECIMAL(10,2) NOT NULL,
  \`dana_warga\` DECIMAL(10,2) NOT NULL,
  \`jasa_pengelola\` DECIMAL(10,2) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

    const [penjualanRows] = await db.query('SELECT * FROM penjualan_bsm');
    if (penjualanRows.length > 0) {
      sqlDump += `INSERT INTO \`penjualan_bsm\` (\`id\`, \`tanggal_penjualan\`, \`total_berat\`, \`total_hasil_penjualan\`, \`kas_bank_sampah\`, \`dana_warga\`, \`jasa_pengelola\`, \`created_at\`) VALUES\n`;
      const inserts = penjualanRows.map(row => {
        const id = row.id;
        
        let dateStr = row.tanggal_penjualan;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().split('T')[0];
        } else if (typeof dateStr === 'string') {
          dateStr = dateStr.split('T')[0];
        }
        
        const berat = row.total_berat;
        const hasil = row.total_hasil_penjualan;
        const kas = row.kas_bank_sampah;
        const warga = row.dana_warga;
        const jasa = row.jasa_pengelola;
        const created = row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at || new Date().toISOString());
        
        return `(${id}, '${dateStr}', ${berat}, ${hasil}, ${kas}, ${warga}, ${jasa}, '${created}')`;
      });
      sqlDump += inserts.join(',\n') + ';\n\n';
    }

    res.setHeader('Content-Type', 'text/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup-banksampah-${new Date().toISOString().split('T')[0]}.sql`);
    res.send(sqlDump);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. POST import / restore database
router.post('/restore', async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ message: 'SQL script is empty or missing.' });
    }
    
    if (db.isMock()) {
      const store = db.getMockStore();
      
      // Clear data
      store.setoran = [];
      store.penjualan_bsm = [];

      // Parse Setoran Rows
      const setoranMatches = sql.match(/INSERT INTO `setoran`[\s\S]*?VALUES\s*([\s\S]*?);/i);
      if (setoranMatches && setoranMatches[1]) {
        const rowsText = setoranMatches[1].trim();
        const rowRegex = /\(([^)]+)\)/g;
        let match;
        while ((match = rowRegex.exec(rowsText)) !== null) {
          const parts = match[1].split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(s => s.trim().replace(/^'|'$/g, ''));
          store.setoran.push({
            id: Number(parts[0]),
            nama_penyetor: parts[1],
            rt: Number(parts[2]),
            tanggal_setor: parts[3],
            jenis_sampah: parts[4],
            berat: Number(parts[5]),
            harga_per_kg: Number(parts[6]),
            keterangan: parts[7] === 'NULL' ? '' : parts[7],
            created_at: parts[8]
          });
        }
      }

      // Parse Penjualan Rows
      const penjualanMatches = sql.match(/INSERT INTO `penjualan_bsm`[\s\S]*?VALUES\s*([\s\S]*?);/i);
      if (penjualanMatches && penjualanMatches[1]) {
        const rowsText = penjualanMatches[1].trim();
        const rowRegex = /\(([^)]+)\)/g;
        let match;
        while ((match = rowRegex.exec(rowsText)) !== null) {
          const parts = match[1].split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(s => s.trim().replace(/^'|'$/g, ''));
          store.penjualan_bsm.push({
            id: Number(parts[0]),
            tanggal_penjualan: parts[1],
            total_berat: Number(parts[2]),
            total_hasil_penjualan: Number(parts[3]),
            kas_bank_sampah: Number(parts[4]),
            dana_warga: Number(parts[5]),
            jasa_pengelola: Number(parts[6]),
            created_at: parts[7]
          });
        }
      }
      return res.json({ message: 'Database successfully restored in-memory.' });
    } else {
      const pool = db.getPool();
      // Split by semicolon, filtering out empty queries
      const queries = sql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (const q of queries) {
        await pool.query(q);
      }
      return res.json({ message: 'Database successfully restored to MySQL.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
