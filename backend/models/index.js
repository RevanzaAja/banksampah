const { sequelize, connectDB } = require('../config/database');
const Setoran = require('./Setoran');
const PenjualanBSM = require('./PenjualanBSM');

const initModels = async () => {
  try {
    await connectDB();
    // This will create the table if it doesn't exist, and do nothing if it already exists
    // Using alter: true will modify tables to match the model if they are changed, but it can be dangerous in production
    // So we just use sync() to create tables if they don't exist.
    await sequelize.sync();
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ Failed to synchronize models:', error.message);
  }
};

module.exports = {
  sequelize,
  Setoran,
  PenjualanBSM,
  initModels
};
