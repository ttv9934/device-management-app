const db = require('../models');
const Device = db.Device;
const ExcelJS = require('exceljs');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Helper function for pagination and filtering
const getPaginatedDevices = async (query) => {
  const { page = 1, limit = 15, search = '', type = '', model = '', factory = '' } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { ip: { [Op.like]: `%${search}%` } }
    ];
  }
  if (type) where.type = type;
  if (model) where.model = { [Op.like]: `%${model}%` };
  if (factory) where.factory = { [Op.like]: `%${factory}%` };

  const { count, rows } = await Device.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return {
    total: count,
    pages: Math.ceil(count / limit),
    currentPage: page,
    devices: rows
  };
};

// Get all devices with filtering and pagination
exports.getAllDevices = async (req, res) => {
  try {
    const result = await getPaginatedDevices(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new device
exports.createDevice = async (req, res) => {
  try {
    // Check if device with same name or IP exists
    const existingDevice = await Device.findOne({
      where: {
        [Op.or]: [
          { name: req.body.name },
          { ip: req.body.ip }
        ]
      }
    });

    if (existingDevice) {
      const errors = [];
      if (existingDevice.name === req.body.name) {
        errors.push('Device with this name already exists');
      }
      if (existingDevice.ip === req.body.ip) {
        errors.push('Device with this IP already exists');
      }
      return res.status(400).json({ error: errors.join(' and ') });
    }

    // Validate date is not in the future
    const currentDate = new Date();
    const inputDate = new Date(req.body.year, req.body.month || 0, req.body.day || 1);
    if (inputDate > currentDate) {
      return res.status(400).json({
        error: `Date cannot be in the future (max ${currentDate.toLocaleDateString()})`
      });
    }

    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if another device with same name or IP exists
    if (req.body.name || req.body.ip) {
      const where = {
        id: { [Op.ne]: req.params.id } // Exclude current device
      };

      if (req.body.name && req.body.name !== device.name) {
        where.name = req.body.name;
      }
      if (req.body.ip && req.body.ip !== device.ip) {
        where.ip = req.body.ip;
      }

      const existingDevice = await Device.findOne({ where });

      if (existingDevice) {
        const errors = [];
        if (existingDevice.name === req.body.name) {
          errors.push('Another device with this name already exists');
        }
        if (existingDevice.ip === req.body.ip) {
          errors.push('Another device with this IP already exists');
        }
        return res.status(400).json({ error: errors.join(' and ') });
      }
    }

    // Validate date is not in the future
    const currentDate = new Date();
    const inputDate = new Date(req.body.year, req.body.month || 0, req.body.day || 1);
    if (inputDate > currentDate) {
      return res.status(400).json({
        error: `Date cannot be in the future (max ${currentDate.toLocaleDateString()})`
      });
    }

    await device.update(req.body);
    res.json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    await device.destroy();
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Import from Excel
exports.importDevices = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const devices = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        devices.push({
          name: row.getCell(1).value,
          ip: row.getCell(2).value,
          department: row.getCell(3).value,
          model: row.getCell(4).value,
          year: row.getCell(5).value,
          type: row.getCell(6).value,
          status: row.getCell(7).value,
          notes: row.getCell(8).value,
          factory: row.getCell(9).value // Assuming factory is in the 9th column
        });
      }
    });

    // Check for duplicate names or IPs in import data
    const names = devices.map(d => d.name);
    const ips = devices.map(d => d.ip);

    // Check for duplicates within the import file
    const nameDuplicates = names.filter((name, index) => names.indexOf(name) !== index);
    const ipDuplicates = ips.filter((ip, index) => ips.indexOf(ip) !== index);

    if (nameDuplicates.length > 0 || ipDuplicates.length > 0) {
      const errors = [];
      if (nameDuplicates.length > 0) {
        errors.push(`Duplicate names: ${[...new Set(nameDuplicates)].join(', ')}`);
      }
      if (ipDuplicates.length > 0) {
        errors.push(`Duplicate IPs: ${[...new Set(ipDuplicates)].join(', ')}`);
      }
      return res.status(400).json({
        error: errors.join(' and ')
      });
    }

    // Validate dates are not in the future
    const currentDate = new Date();
    const futureDevices = devices.filter(d => {
      const deviceDate = new Date(d.year, d.month || 0, d.day || 1);
      return deviceDate > currentDate;
    });
    if (futureDevices.length > 0) {
      return res.status(400).json({
        error: `Dates cannot be in the future (max ${currentDate.toLocaleDateString()})`
      });
    }

    // Check for conflicts with existing devices
    const existingDevices = await Device.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.in]: names } },
          { ip: { [Op.in]: ips } }
        ]
      }
    });

    if (existingDevices.length > 0) {
      const existingNames = existingDevices.map(d => d.name);
      const existingIPs = existingDevices.map(d => d.ip);
      const errors = [];

      if (existingNames.length > 0) {
        errors.push(`Existing names: ${existingNames.join(', ')}`);
      }
      if (existingIPs.length > 0) {
        errors.push(`Existing IPs: ${existingIPs.join(', ')}`);
      }

      return res.status(400).json({
        error: errors.join(' and ')
      });
    }

    await Device.bulkCreate(devices);
    res.json({ message: `${devices.length} devices imported successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export to Excel
exports.exportDevices = async (req, res) => {
  try {
    const devices = await Device.findAll();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Devices');

    // Add headers
    worksheet.addRow(['Name', 'IP', 'Department', 'Model', 'Year', 'Type', 'Status', 'Notes', 'Factory']);

    // Add data
    devices.forEach(device => {
      worksheet.addRow([
        device.name,
        device.ip,
        device.department,
        device.model,
        device.year,
        device.type,
        device.status,
        device.notes,
        device.factory
      ]);
    });

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=devices.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get statistics
exports.getDeviceStats = async (req, res) => {
  try {
    const [typeStats, factoryStats] = await Promise.all([
      Device.findAll({
        attributes: ['factory', 'type', [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('MAX', sequelize.col('year')), 'newest'],
          [sequelize.fn('MIN', sequelize.col('year')), 'oldest']],
        group: ['factory', 'type']
      }),
      Device.findAll({
        attributes: [
          'factory',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['factory']
      })
    ]);

    const stats = {
      byType: typeStats,
      byFactory: factoryStats
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
