document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const deviceForm = document.getElementById('deviceForm');
    const resetBtn = document.getElementById('resetBtn');
    const importForm = document.getElementById('importForm');
    const exportBtn = document.getElementById('exportBtn');
    const deviceTableBody = document.getElementById('deviceTableBody');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const factoryFilter = document.getElementById('factoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const typeStatsChartCtx = document.getElementById('typeStatsChart').getContext('2d');
    const factoryStatsChartCtx = document.getElementById('factoryStatsChart').getContext('2d');
    
    let currentPage = 1;
    let totalPages = 1;
    let typeStatsChart = null;
    let factoryStatsChart = null;
    
    // Initialize the application
    init();
    
    function init() {
        loadDevices();
        loadStats();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Device form submission
        deviceForm.addEventListener('submit', handleDeviceSubmit);
        
        // Reset form
        resetBtn.addEventListener('click', resetForm);
        
        // Import form submission
        importForm.addEventListener('submit', handleImport);
        
        // Export button click
        exportBtn.addEventListener('click', handleExport);
        
        // Search and filter
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    factoryFilter.addEventListener('change', handleFilter);
    typeFilter.addEventListener('change', handleFilter);
    }
    
    // Device CRUD Operations
    async function loadDevices(page = 1, search = '', type = '', factory = '') {
        try {
            let url = `/api/devices?page=${page}`;
            if (search) url += `&search=${search}`;
            if (type) url += `&type=${type}`;
            if (factory) url += `&factory=${factory}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            currentPage = data.currentPage;
            totalPages = data.pages;
            
            renderDevices(data.devices);
            renderPagination();
        } catch (error) {
            console.error('Error loading devices:', error);
            showAlert('Error loading devices', 'danger');
        }
    }
    
    async function handleDeviceSubmit(e) {
        e.preventDefault();
        
        const deviceId = document.getElementById('deviceId').value;
        const deviceData = {
            name: document.getElementById('deviceName').value,
            ip: document.getElementById('ipAddress').value,
            department: document.getElementById('department').value,
            model: document.getElementById('model').value,
            year: parseInt(document.getElementById('year').value),
            type: document.getElementById('type').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value,
            factory: document.getElementById('factory').value
        };
        
        try {
            let response;
            if (deviceId) {
                // Update existing device
                response = await fetch(`/api/devices/${deviceId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deviceData)
                });
            } else {
                // Create new device
                response = await fetch('/api/devices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deviceData)
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                showAlert(`Device ${deviceId ? 'updated' : 'added'} successfully`, 'success');
                resetForm();
                loadDevices(currentPage, searchInput.value, typeFilter.value);
                loadStats();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            console.error('Error saving device:', error);
            showAlert(error.message || 'Error saving device', 'danger');
        }
    }
    
    async function deleteDevice(id) {
        if (!confirm('Are you sure you want to delete this device?')) return;
        
        try {
            const response = await fetch(`/api/devices/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('Device deleted successfully', 'success');
                loadDevices(currentPage, searchInput.value, typeFilter.value);
                loadStats(); // Reload statistics after deletion
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            console.error('Error deleting device:', error);
            showAlert(error.message || 'Error deleting device', 'danger');
        }
    }
    
    function editDevice(device) {
        document.getElementById('deviceId').value = device.id;
        document.getElementById('deviceName').value = device.name;
        document.getElementById('ipAddress').value = device.ip;
        document.getElementById('department').value = device.department;
        document.getElementById('model').value = device.model;
        document.getElementById('year').value = device.year;
        document.getElementById('type').value = device.type;
        document.getElementById('status').value = device.status;
        document.getElementById('notes').value = device.notes || '';
        document.getElementById('factory').value = device.factory;
        
        // Scroll to form
        document.querySelector('#deviceForm').scrollIntoView({
            behavior: 'smooth'
        });
    }
    
    function resetForm() {
        deviceForm.reset();
        document.getElementById('deviceId').value = '';
    }
    
    // Import/Export
    async function handleImport(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('excelFile');
        if (!fileInput.files.length) {
            showAlert('Please select a file', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            const response = await fetch('/api/devices/import', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                showAlert(result.message, 'success');
                fileInput.value = '';
                loadDevices();
                loadStats();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            console.error('Error importing devices:', error);
            showAlert(error.message || 'Error importing devices', 'danger');
        }
    }
    
    function handleExport() {
        window.location.href = '/api/devices/export';
    }
    
    // Search and Filter
    function handleSearch() {
        loadDevices(1, searchInput.value, typeFilter.value);
    }
    
    function handleFilter() {
        loadDevices(1, searchInput.value, typeFilter.value, factoryFilter.value);
    }
    
    
    // Rendering Functions
    function renderDevices(devices) {
        deviceTableBody.innerHTML = '';
        
        if (devices.length === 0) {
            deviceTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No devices found</td></tr>';
            return;
        }
        
        devices.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${device.name}</td>
                <td>${device.ip}</td>
                <td>${device.department}</td>
                <td>${device.model}</td>
                <td>${device.year}</td>
                <td>${device.type}</td>
                <td><span class="badge ${getStatusBadgeClass(device.status)}">${device.status}</span></td>
                <td>${device.notes || ''}</td>
                <td>${device.factory || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1 edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDevice(${device.id})">Delete</button>
                </td>
            `;
            // gán device vào data attribute của nút edit
            const editButton = row.querySelector('.edit-btn');
            editButton.dataset.device = JSON.stringify(device);

            // gán sự kiện onclick
            editButton.addEventListener('click', function() {
                const deviceData = JSON.parse(this.dataset.device);
                editDevice(deviceData);
            });
            deviceTableBody.appendChild(row);
        });
    }
    
    function renderPagination() {
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = '<a class="page-link" href="#">Previous</a>';
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) loadDevices(currentPage - 1, searchInput.value, typeFilter.value);
        });
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active bg-primary text-white' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                loadDevices(i, searchInput.value, typeFilter.value);
            });
            pagination.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = '<a class="page-link" href="#">Next</a>';
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) loadDevices(currentPage + 1, searchInput.value, typeFilter.value);
        });
        pagination.appendChild(nextLi);
    }
    // Statistics
    async function loadStats() {
        try {
            const response = await fetch('/api/devices/stats');
            const stats = await response.json();
            
            renderTypeStatsChart(stats.byType);
            renderFactoryStatsChart(stats.byFactory);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    function renderTypeStatsChart(stats) {
        if (typeStatsChart) {
            typeStatsChart.destroy();
        }

        const factories = [...new Set(stats.map(item => item.factory))];
        const types = [...new Set(stats.map(item => item.type))];
        const datasets = types.map((type, index) => {
            return {
                label: type,
                data: factories.map(factory => {
                    const found = stats.find(item => item.factory === factory && item.type === type);
                    return found ? found.count : 0;
                }),
                backgroundColor: `hsl(${index * 30}, 70%, 60%)`,
                borderWidth: 1,
            };
        });

        typeStatsChart = new Chart(typeStatsChartCtx, {
            type: 'bar',
            data: {
                labels: factories,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        }
                    }
                }
            }
        });
    }
    function renderFactoryStatsChart(stats) {
        if (factoryStatsChart) {
            factoryStatsChart.destroy();
        }
        
        const labels = stats.map(item => item.factory);
        const data = stats.map(item => item.count);
        
        factoryStatsChart = new Chart(factoryStatsChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Devices',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(75, 192, 192, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        }
                    }
                }
            }
        });
    }
    
    // Helper Functions
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.style.zIndex = '1000';
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
    
    function getStatusBadgeClass(status) {
        switch (status) {
            case 'In-use': return 'bg-success';
            case 'Not in-use': return 'bg-secondary';
            default: return 'bg-info';
        }
    }
    
    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }
    
    // Make functions available globally for inline event handlers
    window.editDevice = editDevice;
    window.deleteDevice = deleteDevice;
});
