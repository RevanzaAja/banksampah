const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/penjualanController');

router.get('/', penjualanController.getAllSales);
router.post('/', penjualanController.createSale);
router.delete('/:id', penjualanController.deleteSale);
router.get('/:id/pembagian', penjualanController.getSharingCalculations);

module.exports = router;
