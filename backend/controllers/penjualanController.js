const { PenjualanBSM, Setoran } = require('../models');

exports.getAllSales = async (req, res, next) => {
  try {
    const rows = await PenjualanBSM.findAll({
      order: [['tanggal_penjualan', 'DESC'], ['id', 'DESC']]
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.createSale = async (req, res, next) => {
  try {
    const { tanggal_penjualan, total_berat, total_hasil_penjualan } = req.body;
    
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

    const kas = hasilNum * 0.20;
    const warga = hasilNum * 0.50;
    const jasa = hasilNum * 0.30;

    await PenjualanBSM.create({
      tanggal_penjualan,
      total_berat: beratNum,
      total_hasil_penjualan: hasilNum,
      kas_bank_sampah: kas,
      dana_warga: warga,
      jasa_pengelola: jasa
    });

    res.status(201).json({ message: 'Data penjualan berhasil disimpan.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await PenjualanBSM.findByPk(id);
    if (!sale) {
      return res.status(404).json({ message: 'Data penjualan tidak ditemukan.' });
    }

    await sale.destroy();
    res.json({ message: 'Data penjualan berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

exports.getSharingCalculations = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sale = await PenjualanBSM.findByPk(id);
    if (!sale) {
      return res.status(404).json({ message: 'Data penjualan tidak ditemukan.' });
    }

    const deposits = await Setoran.findAll();
    
    const totalBeratAll = deposits.reduce((acc, item) => acc + Number(item.berat), 0);
    const danaWarga = Number(sale.dana_warga);
    const nilaiPerKg = totalBeratAll > 0 ? (danaWarga / totalBeratAll) : 0;
    
    const wargaMap = {};
    
    deposits.forEach(dep => {
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

    const pembagian = Object.values(wargaMap).map(w => {
      const hakUang = w.total_berat * nilaiPerKg;
      return {
        nama: w.nama,
        rt: w.rt,
        total_berat: Number(w.total_berat.toFixed(2)),
        hak_uang: Math.round(hakUang)
      };
    });

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
    next(error);
  }
};
