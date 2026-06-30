const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initModels, sequelize } = require('./models');
const setoranRoutes = require('./routes/setoran');
const penjualanRoutes = require('./routes/penjualan');
const backupRoutes = require('./routes/backup');
const errorHandler = require('./middleware/errorHandler');

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

// Initialize DB Connection (Only authenticate, skip sync in serverless)
sequelize.authenticate().then(() => console.log('DB Connected')).catch(err => console.error('DB Error', err));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    status: 'online',
    timestamp: new Date(),
    database: dbStatus
  });
});

// API Routes
app.use('/api/setoran', setoranRoutes);
app.use('/api/penjualan', penjualanRoutes);
app.use('/api/backup', backupRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start Server locally (Vercel uses the exported app)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
module.exports = app;
