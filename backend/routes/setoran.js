const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. GET all setoran with filters
router.get('/', async (req, res) => {
  try {
    const { rt, search, tanggal, bulan, tahun } = req.query;
    
    // Fetch all to support easy mock and consistent in-memory filtering
    const [rows] = await db.query('SELECT * FROM setoran');
    
    let filtered = [...rows];
    
    // Apply filters
    if (rt) {
      filtered = filtered.filter(item => Number(item.rt) === Number(rt));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => item.nama_penyetor.toLowerCase().includes(q));
    }
    if (tanggal) {
      filtered = filtered.filter(item => {
        const itemDateStr = new Date(item.tanggal_setor).toISOString().split('T')[0];
        return itemDateStr === tanggal;
      });
    }
    if (bulan) {
      filtered = filtered.filter(item => {
        const d = new Date(item.tanggal_setor);
        return (d.getMonth() + 1) === Number(bulan);
      });
    }
    if (tahun) {
      filtered = filtered.filter(item => {
        const d = new Date(item.tanggal_setor);
        return d.getFullYear() === Number(tahun);
      });
    }
    
    // Sort descending by tanggal_setor and then id
    filtered.sort((a, b) => {
      const dateA = new Date(a.tanggal_setor);
      const dateB = new Date(b.tanggal_setor);
      if (dateB - dateA !== 0) return dateB - dateA;
      return b.id - a.id;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET rekap RT
router.get('/rekap-rt', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM setoran');
    const rekap = [];
    
    for (let rt = 1; rt <= 9; rt++) {
      const rtRows = rows.filter(item => Number(item.rt) === rt);
      const uniqueWarga = new Set(rtRows.map(item => item.nama_penyetor.trim().toLowerCase()));
      const totalBerat = rtRows.reduce((acc, item) => acc + Number(item.berat), 0);
      const totalUang = rtRows.reduce((acc, item) => acc + (Number(item.berat) * Number(item.harga_per_kg)), 0);
      
      rekap.push({
        rt: rt,
        jumlah_warga: uniqueWarga.size,
        total_berat: Number(totalBerat.toFixed(2)),
        total_uang: Math.round(totalUang)
      });
    }
    res.json(rekap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST new setoran
router.post('/', async (req, res) => {
  try {
    const { nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan } = req.body;
    
    // Basic validation
    if (!nama_penyetor || !rt || !tanggal_setor || !jenis_sampah || berat === undefined || harga_per_kg === undefined) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    
    const rtNum = Number(rt);
    if (rtNum < 1 || rtNum > 9) {
      return res.status(400).json({ message: 'RT harus bernilai 1 sampai 9.' });
    }
    
    const beratNum = Number(berat);
    const hargaNum = Number(harga_per_kg);
    if (isNaN(beratNum) || beratNum <= 0) {
      return res.status(400).json({ message: 'Berat harus lebih besar dari 0.' });
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      return res.status(400).json({ message: 'Harga per Kg tidak boleh negatif.' });
    }

    const sql = 'INSERT INTO setoran (nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [nama_penyetor.trim(), rtNum, tanggal_setor, jenis_sampah, beratNum, hargaNum, keterangan || ''];
    
    await db.query(sql, params);
    res.status(201).json({ message: 'Data berhasil disimpan.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. PUT update setoran
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan } = req.body;
    
    // Basic validation
    if (!nama_penyetor || !rt || !tanggal_setor || !jenis_sampah || berat === undefined || harga_per_kg === undefined) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    
    const rtNum = Number(rt);
    if (rtNum < 1 || rtNum > 9) {
      return res.status(400).json({ message: 'RT harus bernilai 1 sampai 9.' });
    }
    
    const beratNum = Number(berat);
    const hargaNum = Number(harga_per_kg);
    if (isNaN(beratNum) || beratNum <= 0) {
      return res.status(400).json({ message: 'Berat harus lebih besar dari 0.' });
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      return res.status(400).json({ message: 'Harga per Kg tidak boleh negatif.' });
    }

    const sql = 'UPDATE setoran SET nama_penyetor=?, rt=?, tanggal_setor=?, jenis_sampah=?, berat=?, harga_per_kg=?, keterangan=? WHERE id=?';
    const params = [nama_penyetor.trim(), rtNum, tanggal_setor, jenis_sampah, beratNum, hargaNum, keterangan || '', Number(id)];
    
    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }
    res.json({ message: 'Data berhasil diubah.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. DELETE setoran
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM setoran WHERE id = ?', [Number(id)]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }
    res.json({ message: 'Data berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
