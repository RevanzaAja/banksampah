const { sequelize } = require('../config/database');

const addPeriodColumns = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='penjualan_bsm' and column_name='periode_mulai';
    `);

    if (results.length === 0) {
      console.log('Adding period columns to penjualan_bsm table...');
      await sequelize.query('ALTER TABLE penjualan_bsm ADD COLUMN periode_mulai DATE;');
      await sequelize.query('ALTER TABLE penjualan_bsm ADD COLUMN periode_selesai DATE;');
      console.log('Columns added successfully.');
    } else {
      console.log('Columns already exist.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

addPeriodColumns();
