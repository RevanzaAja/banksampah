const { Setoran, PenjualanBSM } = require('../models');

exports.exportBackup = async (req, res, next) => {
  try {
    const setoran = await Setoran.findAll();
    const penjualan = await PenjualanBSM.findAll();

    const backupData = {
      timestamp: new Date().toISOString(),
      setoran,
      penjualan
    };

    res.setHeader('Content-disposition', `attachment; filename=backup-banksampah-${new Date().toISOString().split('T')[0]}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(backupData));
  } catch (error) {
    next(error);
  }
};

exports.restoreBackup = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: 'Tidak ada data JSON yang diunggah.' });
    }

    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      return res.status(400).json({ message: 'Format file JSON tidak valid.' });
    }

    if (!parsedData.setoran || !parsedData.penjualan) {
      return res.status(400).json({ message: 'Struktur data JSON tidak sesuai untuk backup aplikasi ini.' });
    }

    // Clean tables
    await Setoran.destroy({ where: {}, truncate: true, cascade: true });
    await PenjualanBSM.destroy({ where: {}, truncate: true, cascade: true });

    // Insert new data
    if (parsedData.setoran.length > 0) {
      await Setoran.bulkCreate(parsedData.setoran);
    }
    if (parsedData.penjualan.length > 0) {
      await PenjualanBSM.bulkCreate(parsedData.penjualan);
    }

    res.json({ message: 'Database berhasil dipulihkan dari file JSON.' });
  } catch (error) {
    next(error);
  }
};
