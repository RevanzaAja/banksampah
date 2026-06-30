const { Setoran } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getAllSetoran = async (req, res, next) => {
  try {
    const { rt, search, tanggal, bulan, tahun } = req.query;
    const whereClause = {};

    if (rt) whereClause.rt = Number(rt);
    if (search) whereClause.nama_penyetor = { [Op.iLike]: `%${search}%` }; // postgres uses iLike for case-insensitive
    
    // For dates, it's easier to use raw SQL functions or specific clauses depending on dialect, 
    // but we can extract date parts in postgres
    if (tanggal) {
      whereClause.tanggal_setor = tanggal;
    }
    
    // For month and year, we can use Op.and with sequelize.where if needed, 
    // but if both are provided we can just construct a date range
    if (bulan && tahun) {
      const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
      const endDate = new Date(Number(tahun), Number(bulan), 0).toISOString().split('T')[0]; // Last day of month
      whereClause.tanggal_setor = { [Op.between]: [startDate, endDate] };
    } else if (bulan) {
      // Find all in that month (ignoring year is trickier in pure Sequelize without raw queries, 
      // but usually users query by month AND year). 
      // Assuming they mean current year if year is not provided.
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${String(bulan).padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, Number(bulan), 0).toISOString().split('T')[0];
      whereClause.tanggal_setor = { [Op.between]: [startDate, endDate] };
    } else if (tahun) {
      const startDate = `${tahun}-01-01`;
      const endDate = `${tahun}-12-31`;
      whereClause.tanggal_setor = { [Op.between]: [startDate, endDate] };
    }

    const rows = await Setoran.findAll({
      where: whereClause,
      order: [['tanggal_setor', 'DESC'], ['id', 'DESC']]
    });

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getRekapRT = async (req, res, next) => {
  try {
    const rows = await Setoran.findAll();
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
    next(error);
  }
};

exports.createSetoran = async (req, res, next) => {
  try {
    const { nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan } = req.body;
    
    if (!nama_penyetor || !rt || !tanggal_setor || !jenis_sampah || berat === undefined || harga_per_kg === undefined) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    await Setoran.create({
      nama_penyetor: nama_penyetor.trim(),
      rt: Number(rt),
      tanggal_setor,
      jenis_sampah,
      berat: Number(berat),
      harga_per_kg: Number(harga_per_kg),
      keterangan: keterangan || ''
    });

    res.status(201).json({ message: 'Data berhasil disimpan.' });
  } catch (error) {
    next(error);
  }
};

exports.updateSetoran = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan } = req.body;
    
    const setoran = await Setoran.findByPk(id);
    if (!setoran) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await setoran.update({
      nama_penyetor: nama_penyetor.trim(),
      rt: Number(rt),
      tanggal_setor,
      jenis_sampah,
      berat: Number(berat),
      harga_per_kg: Number(harga_per_kg),
      keterangan: keterangan || ''
    });

    res.json({ message: 'Data berhasil diubah.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteSetoran = async (req, res, next) => {
  try {
    const { id } = req.params;
    const setoran = await Setoran.findByPk(id);
    if (!setoran) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await setoran.destroy();
    res.json({ message: 'Data berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};
