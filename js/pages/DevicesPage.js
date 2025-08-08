/**
 * Devices Page - Trang quản lý thiết bị IoT
 */
class DevicesPage extends BasePage {
  constructor() {
    super();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.devices = [];
  }
  
  /**
   * Lấy nội dung HTML của trang
   */
  async getContent() {
    return `
      <div class="devices-page">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Devices</h1>
            <p class="page-subtitle">Quản lý và giám sát các thiết bị IoT</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" id="refreshBtn">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
            <button class="btn btn-primary" id="addDeviceBtn">
              <i class="fas fa-plus"></i>
              Add Device
            </button>
          </div>
        </div>
        
        <!-- Filters and Search -->
        <div class="devices-filters">
          <div class="filter-group">
            <label>Filter by Status:</label>
            <div class="filter-buttons">
              <button class="filter-btn active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="online">Online</button>
              <button class="filter-btn" data-filter="offline">Offline</button>
              <button class="filter-btn" data-filter="warning">Warning</button>
            </div>
          </div>
          
          <div class="search-group">
            <div class="input-group">
              <i class="fas fa-search"></i>
              <input type="text" id="deviceSearch" placeholder="Search devices..." />
            </div>
          </div>
          
          <div class="view-toggle">
            <button class="view-btn active" data-view="grid">
              <i class="fas fa-th"></i>
            </button>
            <button class="view-btn" data-view="list">
              <i class="fas fa-list"></i>
            </button>
          </div>
        </div>
        
        <!-- Device Stats -->
        <div class="device-stats">
          <div class="stat-item">
            <div class="stat-icon online">
              <i class="fas fa-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="onlineCount">0</span>
              <span class="stat-label">Online</span>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon offline">
              <i class="fas fa-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="offlineCount">0</span>
              <span class="stat-label">Offline</span>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon warning">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="warningCount">0</span>
              <span class="stat-label">Warning</span>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="totalCount">0</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
        
        <!-- Devices Grid/List -->
        <div class="devices-container">
          <div class="devices-grid" id="devicesContainer">
            <!-- Devices will be populated here -->
          </div>
        </div>
        
        <!-- Device Details Modal -->
        <div id="deviceModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modalDeviceName">Device Details</h3>
              <button class="modal-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
              <!-- Device details will be populated here -->
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="modalCloseFooterBtn">Close</button>
              <button class="btn btn-primary" id="modalEditBtn">Edit Device</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup các sự kiện của trang
   */
  async setupEvents() {
    // Load devices data
    this.loadDevices();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    this.addEventListenerTracked(refreshBtn, 'click', () => this.refreshDevices());
    
    // Setup add device button
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    this.addEventListenerTracked(addDeviceBtn, 'click', () => this.addNewDevice());
    
    // Setup modal events
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCloseFooterBtn = document.getElementById('modalCloseFooterBtn');
    const modalEditBtn = document.getElementById('modalEditBtn');
    
    this.addEventListenerTracked(modalCloseBtn, 'click', () => this.closeModal());
    this.addEventListenerTracked(modalCloseFooterBtn, 'click', () => this.closeModal());
    this.addEventListenerTracked(modalEditBtn, 'click', () => this.editDevice());
    
    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      this.addEventListenerTracked(btn, 'click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.filterDevices();
      });
    });
    
    // Setup search
    const searchInput = document.getElementById('deviceSearch');
    this.addEventListenerTracked(searchInput, 'input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterDevices();
    });
    
    // Setup view toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      this.addEventListenerTracked(btn, 'click', (e) => {
        viewButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.toggleView(e.target.dataset.view);
      });
    });
    
    // Setup device action event delegation
    const devicesContainer = document.getElementById('devicesContainer');
    this.addEventListenerTracked(devicesContainer, 'click', (e) => {
      const deviceAction = e.target.closest('.device-action');
      const menuAction = e.target.closest('.device-menu-action');
      const menuToggle = e.target.closest('.device-menu-toggle');
      
      if (deviceAction) {
        e.preventDefault();
        const action = deviceAction.dataset.action;
        const deviceId = deviceAction.dataset.deviceId;
        this.handleDeviceAction(action, deviceId);
      } else if (menuAction) {
        e.preventDefault();
        const action = menuAction.dataset.action;
        const deviceId = menuAction.dataset.deviceId;
        this.handleDeviceAction(action, deviceId);
      } else if (menuToggle) {
        e.preventDefault();
        const deviceId = menuToggle.dataset.deviceId;
        this.toggleDeviceMenu(deviceId);
      }
    });
  }
  
  /**
   * Load devices data
   */
  loadDevices() {
    this.devices = this.getMockDevices();
    this.renderDevices();
    this.updateStats();
  }
  
  /**
   * Render devices
   */
  renderDevices() {
    const container = document.getElementById('devicesContainer');
    if (!container) return;
    
    const filteredDevices = this.getFilteredDevices();
    
    if (filteredDevices.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-microchip"></i>
          <h3>No devices found</h3>
          <p>No devices match your current filter criteria.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filteredDevices.map(device => this.renderDeviceCard(device)).join('');
  }
  
  /**
   * Render device card
   */
  renderDeviceCard(device) {
    const statusClass = device.status;
    const statusIcon = this.getStatusIcon(device.status);
    
    return `
      <div class="device-card ${statusClass}" data-device-id="${device.id}">
        <div class="device-header">
          <div class="device-info">
            <h3>${device.name}</h3>
            <p class="device-type">${device.type}</p>
            <p class="device-location">
              <i class="fas fa-map-marker-alt"></i>
              ${device.location}
            </p>
          </div>
          <div class="device-status">
            <div class="status-indicator ${statusClass}">
              <i class="fas ${statusIcon}"></i>
              <span>${device.status.charAt(0).toUpperCase() + device.status.slice(1)}</span>
            </div>
          </div>
        </div>
        
        <div class="device-body">
          <div class="device-metrics">
            ${device.metrics.map(metric => `
              <div class="metric-item">
                <span class="metric-label">${metric.label}:</span>
                <span class="metric-value ${metric.status || ''}">${metric.value}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="device-info-grid">
            <div class="info-item">
              <label>Last Update:</label>
              <span>${device.lastUpdate}</span>
            </div>
            <div class="info-item">
              <label>Firmware:</label>
              <span>${device.firmware}</span>
            </div>
            <div class="info-item">
              <label>IP Address:</label>
              <span>${device.ipAddress}</span>
            </div>
            <div class="info-item">
              <label>Uptime:</label>
              <span>${device.uptime}</span>
            </div>
          </div>
        </div>
        
        <div class="device-actions">
          <button class="btn btn-sm btn-outline device-action" data-action="view" data-device-id="${device.id}" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline device-action" data-action="configure" data-device-id="${device.id}" title="Configure">
            <i class="fas fa-cog"></i>
          </button>
          <button class="btn btn-sm btn-outline device-action" data-action="restart" data-device-id="${device.id}" title="Restart">
            <i class="fas fa-redo"></i>
          </button>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline dropdown-toggle device-menu-toggle" data-device-id="${device.id}">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="dropdown-menu" id="menu-${device.id}">
              <a href="#" class="device-menu-action" data-action="edit" data-device-id="${device.id}">
                <i class="fas fa-edit"></i> Edit
              </a>
              <a href="#" class="device-menu-action" data-action="duplicate" data-device-id="${device.id}">
                <i class="fas fa-copy"></i> Duplicate
              </a>
              <div class="dropdown-divider"></div>
              <a href="#" class="device-menu-action text-danger" data-action="delete" data-device-id="${device.id}">
                <i class="fas fa-trash"></i> Delete
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get filtered devices
   */
  getFilteredDevices() {
    let filtered = this.devices;
    
    // Filter by status
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(device => device.status === this.currentFilter);
    }
    
    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(this.searchQuery) ||
        device.type.toLowerCase().includes(this.searchQuery) ||
        device.location.toLowerCase().includes(this.searchQuery)
      );
    }
    
    return filtered;
  }
  
  /**
   * Update statistics
   */
  updateStats() {
    const stats = {
      online: this.devices.filter(d => d.status === 'online').length,
      offline: this.devices.filter(d => d.status === 'offline').length,
      warning: this.devices.filter(d => d.status === 'warning').length,
      total: this.devices.length
    };
    
    document.getElementById('onlineCount').textContent = stats.online;
    document.getElementById('offlineCount').textContent = stats.offline;
    document.getElementById('warningCount').textContent = stats.warning;
    document.getElementById('totalCount').textContent = stats.total;
  }
  
  /**
   * Filter devices
   */
  filterDevices() {
    this.renderDevices();
  }
  
  /**
   * Toggle view (grid/list)
   */
  toggleView(view) {
    const container = document.getElementById('devicesContainer');
    if (view === 'list') {
      container.classList.add('list-view');
    } else {
      container.classList.remove('list-view');
    }
  }
  
  /**
   * Get status icon
   */
  getStatusIcon(status) {
    const icons = {
      online: 'fa-circle',
      offline: 'fa-circle',
      warning: 'fa-exclamation-triangle'
    };
    return icons[status] || 'fa-circle';
  }
  
  /**
   * Get mock devices data
   */
  getMockDevices() {
    return [
      {
        id: 'dev-001',
        name: 'Smart Thermostat Pro',
        type: 'Temperature Controller',
        location: 'Living Room',
        status: 'online',
        lastUpdate: '2 minutes ago',
        firmware: 'v2.1.3',
        ipAddress: '192.168.1.101',
        uptime: '15 days',
        metrics: [
          { label: 'Temperature', value: '22.5°C', status: 'normal' },
          { label: 'Humidity', value: '45%', status: 'normal' },
          { label: 'Battery', value: '98%', status: 'good' }
        ]
      },
      {
        id: 'dev-002',
        name: 'Security Camera HD',
        type: 'Surveillance Camera',
        location: 'Front Door',
        status: 'online',
        lastUpdate: '1 minute ago',
        firmware: 'v1.8.2',
        ipAddress: '192.168.1.102',
        uptime: '7 days',
        metrics: [
          { label: 'Resolution', value: '1080p', status: 'normal' },
          { label: 'FPS', value: '30', status: 'normal' },
          { label: 'Storage', value: '85%', status: 'warning' }
        ]
      },
      {
        id: 'dev-003',
        name: 'Smart Light Strip',
        type: 'LED Controller',
        location: 'Bedroom',
        status: 'offline',
        lastUpdate: '25 minutes ago',
        firmware: 'v1.2.1',
        ipAddress: '192.168.1.103',
        uptime: '0 minutes',
        metrics: [
          { label: 'Brightness', value: '0%', status: 'offline' },
          { label: 'Color', value: 'Off', status: 'offline' },
          { label: 'Power', value: 'Off', status: 'offline' }
        ]
      },
      {
        id: 'dev-004',
        name: 'Motion Sensor V2',
        type: 'PIR Motion Detector',
        location: 'Hallway',
        status: 'online',
        lastUpdate: '30 seconds ago',
        firmware: 'v3.0.1',
        ipAddress: '192.168.1.104',
        uptime: '22 days',
        metrics: [
          { label: 'Motion', value: 'None', status: 'normal' },
          { label: 'Sensitivity', value: 'High', status: 'normal' },
          { label: 'Battery', value: '76%', status: 'normal' }
        ]
      },
      {
        id: 'dev-005',
        name: 'Smart Door Lock',
        type: 'Access Control',
        location: 'Main Entrance',
        status: 'warning',
        lastUpdate: '5 minutes ago',
        firmware: 'v2.3.0',
        ipAddress: '192.168.1.105',
        uptime: '45 days',
        metrics: [
          { label: 'Status', value: 'Locked', status: 'normal' },
          { label: 'Battery', value: '15%', status: 'warning' },
          { label: 'Signal', value: 'Weak', status: 'warning' }
        ]
      },
      {
        id: 'dev-006',
        name: 'Air Quality Monitor',
        type: 'Environmental Sensor',
        location: 'Kitchen',
        status: 'online',
        lastUpdate: '1 minute ago',
        firmware: 'v1.4.2',
        ipAddress: '192.168.1.106',
        uptime: '12 days',
        metrics: [
          { label: 'AQI', value: '75', status: 'warning' },
          { label: 'CO2', value: '420ppm', status: 'normal' },
          { label: 'Temp', value: '24.1°C', status: 'normal' }
        ]
      },
      {
        id: 'dev-007',
        name: 'Smart Outlet',
        type: 'Power Control',
        location: 'Office',
        status: 'online',
        lastUpdate: '3 minutes ago',
        firmware: 'v1.1.0',
        ipAddress: '192.168.1.107',
        uptime: '8 days',
        metrics: [
          { label: 'Power', value: '125W', status: 'normal' },
          { label: 'Voltage', value: '220V', status: 'normal' },
          { label: 'Status', value: 'On', status: 'normal' }
        ]
      },
      {
        id: 'dev-008',
        name: 'Window Sensor',
        type: 'Contact Sensor',
        location: 'Living Room Window',
        status: 'online',
        lastUpdate: '10 minutes ago',
        firmware: 'v2.0.3',
        ipAddress: '192.168.1.108',
        uptime: '18 days',
        metrics: [
          { label: 'Status', value: 'Closed', status: 'normal' },
          { label: 'Battery', value: '89%', status: 'good' },
          { label: 'Signal', value: 'Strong', status: 'good' }
        ]
      }
    ];
  }
  
  // Action methods
  
  handleDeviceAction(action, deviceId) {
    switch (action) {
      case 'view':
        this.viewDevice(deviceId);
        break;
      case 'configure':
        this.configureDevice(deviceId);
        break;
      case 'restart':
        this.restartDevice(deviceId);
        break;
      case 'edit':
        this.editDevice(deviceId);
        break;
      case 'duplicate':
        this.duplicateDevice(deviceId);
        break;
      case 'delete':
        this.deleteDevice(deviceId);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
  
  refreshDevices() {
    ToastManager.info('Refreshing devices...');
    this.loadDevices();
  }
  
  addNewDevice() {
    ToastManager.info('Add new device feature will be implemented soon');
  }
  
  viewDevice(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return;
    
    const modal = document.getElementById('deviceModal');
    const modalName = document.getElementById('modalDeviceName');
    const modalBody = document.getElementById('modalBody');
    
    modalName.textContent = device.name;
    modalBody.innerHTML = `
      <div class="device-details">
        <div class="detail-section">
          <h4>Device Information</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Type:</label>
              <span>${device.type}</span>
            </div>
            <div class="detail-item">
              <label>Location:</label>
              <span>${device.location}</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span class="status-badge ${device.status}">${device.status}</span>
            </div>
            <div class="detail-item">
              <label>Firmware:</label>
              <span>${device.firmware}</span>
            </div>
            <div class="detail-item">
              <label>IP Address:</label>
              <span>${device.ipAddress}</span>
            </div>
            <div class="detail-item">
              <label>Uptime:</label>
              <span>${device.uptime}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>Current Metrics</h4>
          <div class="metrics-list">
            ${device.metrics.map(metric => `
              <div class="metric-detail">
                <span class="metric-name">${metric.label}</span>
                <span class="metric-val ${metric.status}">${metric.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'block';
  }
  
  closeModal() {
    const modal = document.getElementById('deviceModal');
    modal.style.display = 'none';
  }
  
  configureDevice(deviceId) {
    ToastManager.info(`Opening configuration for device ${deviceId}`);
  }
  
  editDevice(deviceId) {
    ToastManager.info(`Editing device ${deviceId}`);
  }
  
  restartDevice(deviceId) {
    ToastManager.info(`Restarting device ${deviceId}...`);
  }
  
  duplicateDevice(deviceId) {
    ToastManager.info(`Duplicating device ${deviceId}`);
  }
  
  deleteDevice(deviceId) {
    if (confirm('Are you sure you want to delete this device?')) {
      ToastManager.success('Device deleted successfully');
      this.devices = this.devices.filter(d => d.id !== deviceId);
      this.renderDevices();
      this.updateStats();
    }
  }
  
  toggleDeviceMenu(deviceId) {
    const menu = document.getElementById(`menu-${deviceId}`);
    menu.classList.toggle('show');
  }
}

// Export for use
window.DevicesPage = DevicesPage;
