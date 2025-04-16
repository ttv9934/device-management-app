const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('device_management', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function createDevicesTable() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS Devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip VARCHAR(255) NOT NULL UNIQUE,
        department VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        type VARCHAR(255) NOT NULL,
        status VARCHAR(255) NOT NULL,
        notes TEXT,
        factory VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    await sequelize.query(createTableSQL);

    console.log('Devices table created or already exists.');
    await sequelize.close();
  } catch (error) {
    console.error('Unable to create the table:', error);
  }
}

createDevicesTable();
