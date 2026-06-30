const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PenjualanBSM = sequelize.define('PenjualanBSM', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tanggal_penjualan: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total_berat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_hasil_penjualan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  kas_bank_sampah: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  jasa_pengelola: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  dana_warga: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  tableName: 'penjualan_bsm',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PenjualanBSM;
