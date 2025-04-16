const express = require('express');
const router = express.Router();
const devicesController = require('../controllers/devicesController');
const multer = require('multer');
const upload = multer();

// Device CRUD routes
router.get('/', devicesController.getAllDevices);
router.post('/', devicesController.createDevice);
router.put('/:id', devicesController.updateDevice);
router.delete('/:id', devicesController.deleteDevice);

// Excel import/export routes
router.post('/import', upload.single('file'), devicesController.importDevices);
router.get('/export', devicesController.exportDevices);

// Statistics route
router.get('/stats', devicesController.getDeviceStats);

module.exports = router;
