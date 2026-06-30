const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setoran = sequelize.define('Setoran', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nama_penyetor: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rt: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tanggal_setor: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  jenis_sampah: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  berat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  harga_per_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'setoran',
  timestamps: true, // Will add createdAt and updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Setoran;
