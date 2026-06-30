const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const setoranRoutes = require('./routes/setoran');
const penjualanRoutes = require('./routes/penjualan');
const backupRoutes = require('./routes/backup');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parser configuration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize DB Connection
db.initDb();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    databaseMode: db.isMock() ? 'mock-in-memory' : 'mysql'
  });
});

// API Routes
app.use('/api/setoran', setoranRoutes);
app.use('/api/penjualan', penjualanRoutes);
app.use('/api/backup', backupRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan sistem internal.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = app;
