const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET all sales records
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM penjualan_bsm ORDER BY tanggal_penjualan DESC, id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. POST new sales record
router.post('/', async (req, res) => {
  try {
    const { tanggal_penjualan, total_berat, total_hasil_penjualan } = req.body;
    
    // Validation
    if (!tanggal_penjualan || total_berat === undefined || total_hasil_penjualan === undefined) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    
    const beratNum = Number(total_berat);
    const hasilNum = Number(total_hasil_penjualan);
    
    if (isNaN(beratNum) || beratNum <= 0) {
      return res.status(400).json({ message: 'Total berat harus lebih besar dari 0.' });
    }
    if (isNaN(hasilNum) || hasilNum < 0) {
      return res.status(400).json({ message: 'Total hasil penjualan tidak boleh negatif.' });
    }

    // Proportional calculations (20% Kas, 50% Warga, 30% Jasa)
    const kas = hasilNum * 0.20;
    const warga = hasilNum * 0.50;
    const jasa = hasilNum * 0.30;

    const sql = 'INSERT INTO penjualan_bsm (tanggal_penjualan, total_berat, total_hasil_penjualan, kas_bank_sampah, dana_warga, jasa_pengelola) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [tanggal_penjualan, beratNum, hasilNum, kas, warga, jasa];
    
    await db.query(sql, params);
    res.status(201).json({ message: 'Data penjualan berhasil disimpan.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. DELETE sales record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM penjualan_bsm WHERE id = ?', [Number(id)]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data penjualan tidak ditemukan.' });
    }
    res.json({ message: 'Data penjualan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. GET sharing calculations for a specific sale
router.get('/:id/pembagian', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the sale
    const [sales] = await db.query('SELECT * FROM penjualan_bsm');
    const sale = sales.find(s => s.id === Number(id));
    if (!sale) {
      return res.status(404).json({ message: 'Data penjualan tidak ditemukan.' });
    }

    // Fetch all deposits to distribute shares based on total weight
    const [deposits] = await db.query('SELECT * FROM setoran');
    
    // Sum total weight of all deposits in the database
    const totalBeratAll = deposits.reduce((acc, item) => acc + Number(item.berat), 0);
    
    const danaWarga = Number(sale.dana_warga);
    const nilaiPerKg = totalBeratAll > 0 ? (danaWarga / totalBeratAll) : 0;
    
    // Group deposits by resident name and RT
    const wargaMap = {};
    
    deposits.forEach(dep => {
      // Create a unique key for grouping (name + RT)
      const key = `${dep.nama_penyetor.trim().toLowerCase()}_rt_${dep.rt}`;
      if (!wargaMap[key]) {
        wargaMap[key] = {
          nama: dep.nama_penyetor.trim(),
          rt: Number(dep.rt),
          total_berat: 0
        };
      }
      wargaMap[key].total_berat += Number(dep.berat);
    });

    // Calculate individual sharing shares
    const pembagian = Object.values(wargaMap).map(w => {
      const hakUang = w.total_berat * nilaiPerKg;
      return {
        nama: w.nama,
        rt: w.rt,
        total_berat: Number(w.total_berat.toFixed(2)),
        hak_uang: Math.round(hakUang)
      };
    });

    // Sort by name ascending
    pembagian.sort((a, b) => a.nama.localeCompare(b.nama));

    res.json({
      salesDetail: {
        id: sale.id,
        tanggal_penjualan: sale.tanggal_penjualan,
        total_berat: Number(sale.total_berat),
        total_hasil_penjualan: Number(sale.total_hasil_penjualan),
        kas_bank_sampah: Number(sale.kas_bank_sampah),
        dana_warga: danaWarga,
        jasa_pengelola: Number(sale.jasa_pengelola),
        total_berat_deposit: Number(totalBeratAll.toFixed(2)),
        nilai_per_kg: Number(nilaiPerKg.toFixed(2))
      },
      pembagian
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
