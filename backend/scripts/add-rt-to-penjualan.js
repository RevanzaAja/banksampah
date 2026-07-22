const { sequelize } = require('../config/database');

const addRtColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='penjualan_bsm' and column_name='rt';
    `);

    if (results.length === 0) {
      console.log('Adding rt column to penjualan_bsm table...');
      await sequelize.query('ALTER TABLE penjualan_bsm ADD COLUMN rt INTEGER;');
      console.log('Column rt added successfully.');
    } else {
      console.log('Column rt already exists.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

addRtColumn();
