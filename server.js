const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/database');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Database connection
sequelize.authenticate()
  .then(async () => {
    console.log('Database connected...');
    // Verify Device table exists
    try {
      await sequelize.getQueryInterface().describeTable('Devices');
      console.log('Devices table exists');
    } catch (err) {
      console.error('Devices table does not exist or error:', err);
    }
  })
  .catch(err => console.log('Error: ' + err));

// Routes
app.use('/api/devices', require('./routes/devices'));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
