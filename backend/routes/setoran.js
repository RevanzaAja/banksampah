const express = require('express');
const router = express.Router();
const setoranController = require('../controllers/setoranController');

router.get('/', setoranController.getAllSetoran);
router.get('/rekap-rt', setoranController.getRekapRT);
router.post('/', setoranController.createSetoran);
router.put('/:id', setoranController.updateSetoran);
router.delete('/:id', setoranController.deleteSetoran);

module.exports = router;
