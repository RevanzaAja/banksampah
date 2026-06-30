const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;
let useMock = false;

// Mock Database Store
const mockStore = {
  setoran: [
    { id: 1, nama_penyetor: 'Budi', rt: 1, tanggal_setor: '2026-06-20', jenis_sampah: 'Plastik', berat: 3.0, harga_per_kg: 4000.0, keterangan: 'Botol mineral' },
    { id: 2, nama_penyetor: 'Budi', rt: 1, tanggal_setor: '2026-06-20', jenis_sampah: 'Kertas', berat: 1.0, harga_per_kg: 2000.0, keterangan: 'Koran bekas' },
    { id: 3, nama_penyetor: 'Siti', rt: 1, tanggal_setor: '2026-06-20', jenis_sampah: 'Plastik', berat: 5.0, harga_per_kg: 4000.0, keterangan: 'Plastik keras' },
    { id: 4, nama_penyetor: 'Agus', rt: 3, tanggal_setor: '2026-06-20', jenis_sampah: 'Kardus', berat: 20.0, harga_per_kg: 3000.0, keterangan: 'Kardus mie instan' },
    { id: 5, nama_penyetor: 'Aminah', rt: 3, tanggal_setor: '2026-06-20', jenis_sampah: 'Kaleng', berat: 15.0, harga_per_kg: 8000.0, keterangan: 'Kaleng soda' },
    { id: 6, nama_penyetor: 'Joko', rt: 3, tanggal_setor: '2026-06-20', jenis_sampah: 'Botol', berat: 40.0, harga_per_kg: 5000.0, keterangan: 'Botol kecap kaca' },
    { id: 7, nama_penyetor: 'Lani', rt: 5, tanggal_setor: '2026-06-21', jenis_sampah: 'Lainnya', berat: 10.0, harga_per_kg: 1000.0, keterangan: 'Sampah daun kering' },
    { id: 8, nama_penyetor: 'Budi', rt: 1, tanggal_setor: '2026-06-15', jenis_sampah: 'Plastik', berat: 4.0, harga_per_kg: 4000.0, keterangan: 'Plastik kemasan' }
  ],
  penjualan_bsm: [
    { id: 1, tanggal_penjualan: '2026-06-22', total_berat: 98.0, total_hasil_penjualan: 1000000.0, kas_bank_sampah: 200000.0, dana_warga: 500000.0, jasa_pengelola: 300000.0, created_at: new Date().toISOString() }
  ]
};

// Initialize database
async function initDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'banksampah_user',
      password: process.env.DB_PASSWORD || 'banksampah_password',
      database: process.env.DB_NAME || 'bank_sampah_digital',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    // Test connection
    const conn = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');
    conn.release();
    useMock = false;
  } catch (error) {
    console.warn('MySQL connection failed! Falling back to in-memory database store.', error.message);
    useMock = true;
  }
}

// Intercept queries for in-memory mockup
function executeMockQuery(sql, params = []) {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT * FROM setoran
  if (normalizedSql.startsWith('select * from setoran') || normalizedSql.includes('from setoran')) {
    // If we have filters, we could do basic filtering here, but we will filter in Express route handlers for maximum safety in mock mode.
    // However, let's implement basic queries:
    return [mockStore.setoran];
  }

  // 2. INSERT INTO setoran
  if (normalizedSql.startsWith('insert into setoran')) {
    // INSERT INTO setoran (nama_penyetor, rt, tanggal_setor, jenis_sampah, berat, harga_per_kg, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)
    const [nama, rt, tanggal, jenis, berat, harga, keterangan] = params;
    const newId = mockStore.setoran.length > 0 ? Math.max(...mockStore.setoran.map(s => s.id)) + 1 : 1;
    const newRecord = {
      id: newId,
      nama_penyetor: nama,
      rt: Number(rt),
      tanggal_setor: tanggal,
      jenis_sampah: jenis,
      berat: Number(berat),
      harga_per_kg: Number(harga),
      keterangan: keterangan || '',
      created_at: new Date().toISOString()
    };
    mockStore.setoran.push(newRecord);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // 3. UPDATE setoran
  if (normalizedSql.startsWith('update setoran')) {
    // UPDATE setoran SET nama_penyetor=?, rt=?, tanggal_setor=?, jenis_sampah=?, berat=?, harga_per_kg=?, keterangan=? WHERE id=?
    const [nama, rt, tanggal, jenis, berat, harga, keterangan, id] = params;
    const record = mockStore.setoran.find(s => s.id === Number(id));
    if (record) {
      record.nama_penyetor = nama;
      record.rt = Number(rt);
      record.tanggal_setor = tanggal;
      record.jenis_sampah = jenis;
      record.berat = Number(berat);
      record.harga_per_kg = Number(harga);
      record.keterangan = keterangan;
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 4. DELETE FROM setoran
  if (normalizedSql.startsWith('delete from setoran')) {
    const id = Number(params[0]);
    const index = mockStore.setoran.findIndex(s => s.id === id);
    if (index !== -1) {
      mockStore.setoran.splice(index, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 5. SELECT * FROM penjualan_bsm
  if (normalizedSql.startsWith('select * from penjualan_bsm') || normalizedSql.includes('from penjualan_bsm')) {
    return [mockStore.penjualan_bsm];
  }

  // 6. INSERT INTO penjualan_bsm
  if (normalizedSql.startsWith('insert into penjualan_bsm')) {
    // INSERT INTO penjualan_bsm (tanggal_penjualan, total_berat, total_hasil_penjualan, kas_bank_sampah, dana_warga, jasa_pengelola) VALUES (?, ?, ?, ?, ?, ?)
    const [tanggal, berat, hasil, kas, warga, jasa] = params;
    const newId = mockStore.penjualan_bsm.length > 0 ? Math.max(...mockStore.penjualan_bsm.map(p => p.id)) + 1 : 1;
    const newRecord = {
      id: newId,
      tanggal_penjualan: tanggal,
      total_berat: Number(berat),
      total_hasil_penjualan: Number(hasil),
      kas_bank_sampah: Number(kas),
      dana_warga: Number(warga),
      jasa_pengelola: Number(jasa),
      created_at: new Date().toISOString()
    };
    mockStore.penjualan_bsm.push(newRecord);
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // 7. DELETE FROM penjualan_bsm
  if (normalizedSql.startsWith('delete from penjualan_bsm')) {
    const id = Number(params[0]);
    const index = mockStore.penjualan_bsm.findIndex(p => p.id === id);
    if (index !== -1) {
      mockStore.penjualan_bsm.splice(index, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  return [[]];
}

// Main query helper
async function query(sql, params = []) {
  if (!pool) {
    await initDb();
  }

  if (useMock) {
    return executeMockQuery(sql, params);
  }

  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error('MySQL database error, switching to mock database operations.', err.message);
    useMock = true;
    return executeMockQuery(sql, params);
  }
}

module.exports = {
  query,
  initDb,
  getPool: () => pool,
  isMock: () => useMock,
  getMockStore: () => mockStore
};
