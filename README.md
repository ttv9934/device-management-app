# Device Management System

A comprehensive web application for managing IT devices with the following features:
- CRUD operations for devices
- Excel import/export
- Statistics visualization
- Search and filtering
- Pagination

## Features
- Add, edit, delete devices
- Filter by device type (Computer, Monitor, Switch, Printer, Server)
- Search by device name or IP address
- View device statistics with interactive charts
- Import/export data to Excel format
- Responsive design works on all devices

## Technologies
- Backend: Node.js, Express, Sequelize
- Frontend: HTML5, CSS3, JavaScript, Chart.js, Bootstrap
- Database: MySQL

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Git (optional)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/device-management-app.git
   cd device-management-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Database configuration:
   - Create a MySQL database named `device_management`
   - Update credentials in `config/database.js` if needed:
     ```javascript
     const sequelize = new Sequelize('device_management', 'your_username', 'your_password', {
       host: 'localhost',
       dialect: 'mysql'
     });
     ```

4. Start the application:
   ```bash
   npm start
   ```
   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. Access the application at:
   ```
   http://localhost:5000
   ```

## Usage Guide

### Adding a Device
1. Fill in all required fields in the form
2. Click "Save" button
3. The new device will appear in the device list

### Editing a Device
1. Click "Edit" button on the device row
2. Modify the fields in the form
3. Click "Save" to update

### Deleting a Device
1. Click "Delete" button on the device row
2. Confirm the deletion in the popup

### Importing Devices
1. Prepare an Excel file with device data
2. Click "Choose File" and select your Excel file
3. Click "Import" button

### Exporting Devices
1. Click "Export to Excel" button
2. The system will generate and download an Excel file

### Viewing Statistics
- The statistics chart automatically shows device distribution by type
- Updates in real-time when devices are added/removed

## Configuration Options

Environment variables (optional):
- `DB_NAME`: Database name (default: device_management)
- `DB_USER`: Database username (default: root)
- `DB_PASSWORD`: Database password (default: '')
- `DB_HOST`: Database host (default: localhost)
- `PORT`: Server port (default: 5000)

## Troubleshooting

### Database Connection Issues
- Verify MySQL service is running
- Check database credentials in config/database.js
- Ensure the database exists

### Excel Import/Export Problems
- Make sure the Excel file follows the required format
- Check file permissions

### Server Not Starting
- Check for port conflicts (default: 5000)
- Verify all dependencies are installed

## License
MIT License
