/**
 * Device Control Page - Trang điều khiển thiết bị IoT thực tế
 */
class DeviceControlPage extends BasePage {
  constructor() {
    super();
    this.devices = [];
    this.selectedDevice = null;
    this.mqttSubscriptions = [];
    this.sensorChart = null;
    this.refreshInterval = null;
  }

  /**
   * Lấy nội dung HTML của trang
   */
  async getContent() {
    return `
      <div class="device-control-page">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">
              <i class="fas fa-cogs"></i>
              Device Control
            </h1>
            <p class="page-subtitle">Điều khiển và giám sát thiết bị IoT thời gian thực</p>
          </div>
          <div class="page-actions">
            <div class="connection-status" id="mqttStatus">
              <div class="status-indicator offline">
                <i class="fas fa-circle"></i>
                <span>Disconnected</span>
              </div>
            </div>
            <button class="btn btn-outline" id="refreshBtn">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-card">
            <div class="stat-icon online">
              <i class="fas fa-wifi"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="onlineDevices">0</span>
              <span class="stat-label">Online Devices</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-thermometer-half"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="currentTemp">--</span>
              <span class="stat-label">Temperature</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-tint"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="currentHumidity">--</span>
              <span class="stat-label">Humidity</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="stat-content">
              <span class="stat-number" id="currentLight">--</span>
              <span class="stat-label">Light Level</span>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="control-layout">
          <!-- Device List -->
          <div class="devices-panel">
            <div class="panel-header">
              <h3>Connected Devices</h3>
              <button class="btn btn-sm btn-primary" id="scanDevicesBtn">
                <i class="fas fa-search"></i>
                Scan
              </button>
            </div>
            <div class="devices-list" id="devicesList">
              <!-- Devices will be populated here -->
            </div>
          </div>

          <!-- Device Control Panel -->
          <div class="control-panel">
            <div class="panel-header">
              <h3 id="selectedDeviceName">Select a Device</h3>
              <div class="device-status" id="selectedDeviceStatus">
                <span class="status-badge offline">Offline</span>
              </div>
            </div>
            
            <div class="control-content" id="controlContent">
              <div class="empty-state">
                <i class="fas fa-mouse-pointer"></i>
                <p>Select a device from the list to control it</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sensor Data Chart -->
        <div class="chart-section">
          <div class="chart-header">
            <h3>Real-time Sensor Data</h3>
            <div class="chart-controls">
              <button class="btn btn-sm btn-outline" id="pauseChartBtn">
                <i class="fas fa-pause"></i>
                Pause
              </button>
              <button class="btn btn-sm btn-outline" id="clearChartBtn">
                <i class="fas fa-trash"></i>
                Clear
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="sensorChart"></canvas>
          </div>
        </div>

        <!-- Control Modal -->
        <div id="controlModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modalTitle">Device Control</h3>
              <button class="modal-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
              <!-- Control options will be populated here -->
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
              <button class="btn btn-primary" id="modalConfirmBtn">Send Command</button>
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
    // Subscribe to MQTT events
    this.setupMqttSubscriptions();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    this.addEventListenerTracked(refreshBtn, 'click', () => this.refreshDevices());

    // Setup scan devices button
    const scanBtn = document.getElementById('scanDevicesBtn');
    this.addEventListenerTracked(scanBtn, 'click', () => this.scanForDevices());

    // Setup chart controls
    this.setupChartControls();
    
    // Setup modal events
    this.setupModalEvents();

    // Initialize chart
    this.initializeSensorChart();

    // Load initial data
    this.loadDevices();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  /**
   * Setup MQTT subscriptions
   */
  setupMqttSubscriptions() {
    // Subscribe to connection status
    const unsubConnection = window.MqttService.subscribe('connection', (data) => {
      this.updateConnectionStatus(data.status);
    });
    this.mqttSubscriptions.push(unsubConnection);

    // Subscribe to sensor data
    const unsubSensorData = window.MqttService.subscribe('sensorData', (data) => {
      this.updateSensorData(data.deviceId, data.data);
    });
    this.mqttSubscriptions.push(unsubSensorData);

    // Subscribe to individual sensor values
    const unsubSensorValue = window.MqttService.subscribe('sensorValue', (data) => {
      this.updateIndividualSensor(data.deviceId, data.type, data.value);
    });
    this.mqttSubscriptions.push(unsubSensorValue);

    // Subscribe to device status updates
    const unsubDeviceStatus = window.MqttService.subscribe('deviceStatus', (data) => {
      this.updateDeviceStatus(data.deviceId, data.type, data.status);
    });
    this.mqttSubscriptions.push(unsubDeviceStatus);

    // Subscribe to heartbeat
    const unsubHeartbeat = window.MqttService.subscribe('heartbeat', (data) => {
      this.updateDeviceHeartbeat(data.deviceId);
    });
    this.mqttSubscriptions.push(unsubHeartbeat);
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(status) {
    const statusElement = document.getElementById('mqttStatus');
    const indicator = statusElement.querySelector('.status-indicator');
    const span = statusElement.querySelector('span');
    
    if (status === 'connected') {
      indicator.className = 'status-indicator online';
      span.textContent = 'Connected';
    } else {
      indicator.className = 'status-indicator offline';
      span.textContent = 'Disconnected';
    }
  }

  /**
   * Update sensor data
   */
  updateSensorData(deviceId, data) {
    // Update quick stats
    if (data.temperature !== undefined) {
      document.getElementById('currentTemp').textContent = `${data.temperature}°C`;
    }
    if (data.humidity !== undefined) {
      document.getElementById('currentHumidity').textContent = `${data.humidity}%`;
    }
    if (data.lightLevel !== undefined) {
      document.getElementById('currentLight').textContent = `${data.lightLevel}%`;
    }

    // Update chart
    this.updateChart(data);
    
    // Update device in list
    this.updateDeviceInList(deviceId);
  }

  /**
   * Update individual sensor value
   */
  updateIndividualSensor(deviceId, type, value) {
    const device = window.MqttService.getDeviceData(deviceId);
    if (device && device.data) {
      // Update quick stats based on sensor type
      switch (type) {
        case 'temperature':
          document.getElementById('currentTemp').textContent = `${value}°C`;
          break;
        case 'humidity':
          document.getElementById('currentHumidity').textContent = `${value}%`;
          break;
        case 'light':
          document.getElementById('currentLight').textContent = `${value}%`;
          break;
      }

      // Update chart with individual value
      const chartData = {};
      chartData[type] = parseFloat(value);
      this.updateChart(chartData);
    }
  }

  /**
   * Update device status
   */
  updateDeviceStatus(deviceId, type, status) {
    ToastManager.info(`Device ${deviceId} ${type}: ${status}`);
    
    // Update device in list
    this.updateDeviceInList(deviceId);
    
    // Update selected device if it matches
    if (this.selectedDevice && this.selectedDevice.id === deviceId) {
      this.refreshSelectedDeviceControls();
    }
  }

  /**
   * Update device heartbeat
   */
  updateDeviceHeartbeat(deviceId) {
    this.updateDeviceInList(deviceId);
  }

  /**
   * Load devices
   */
  loadDevices() {
    this.devices = window.MqttService.getAllDevices();
    this.renderDevicesList();
    this.updateStats();
  }

  /**
   * Render devices list
   */
  renderDevicesList() {
    const container = document.getElementById('devicesList');
    const devices = window.MqttService.getAllDevices();
    
    if (devices.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <p>No devices found</p>
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('scanDevicesBtn').click()">
            Scan for Devices
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = devices.map(device => this.renderDeviceCard(device)).join('');
    
    // Add click events to device cards
    container.querySelectorAll('.device-card').forEach(card => {
      this.addEventListenerTracked(card, 'click', () => {
        const deviceId = card.dataset.deviceId;
        this.selectDevice(deviceId);
      });
    });
  }

  /**
   * Render device card
   */
  renderDeviceCard(device) {
    const isOnline = this.isDeviceOnline(device);
    const lastUpdate = this.getTimeAgo(device.lastUpdate);
    
    return `
      <div class="device-card ${isOnline ? 'online' : 'offline'} ${this.selectedDevice?.id === device.id ? 'selected' : ''}" 
           data-device-id="${device.id}">
        <div class="device-info">
          <div class="device-name">${device.id}</div>
          <div class="device-status">
            <i class="fas fa-circle"></i>
            <span>${isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div class="device-update">Last: ${lastUpdate}</div>
        </div>
        <div class="device-data">
          ${device.data.temperature ? `<span>🌡️ ${device.data.temperature}°C</span>` : ''}
          ${device.data.humidity ? `<span>💧 ${device.data.humidity}%</span>` : ''}
          ${device.data.lightLevel ? `<span>💡 ${device.data.lightLevel}%</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(device) {
    const now = new Date();
    const lastUpdate = new Date(device.lastUpdate);
    const timeDiff = now - lastUpdate;
    
    // Consider device offline if no update for more than 30 seconds
    return timeDiff < 30000;
  }

  /**
   * Get time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  /**
   * Select device for control
   */
  selectDevice(deviceId) {
    const device = window.MqttService.getDeviceData(deviceId);
    if (!device) return;

    this.selectedDevice = device;
    
    // Update UI
    document.getElementById('selectedDeviceName').textContent = device.id;
    this.updateSelectedDeviceStatus();
    this.renderDeviceControls();
    
    // Update device list selection
    document.querySelectorAll('.device-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-device-id="${deviceId}"]`)?.classList.add('selected');
  }

  /**
   * Update selected device status
   */
  updateSelectedDeviceStatus() {
    if (!this.selectedDevice) return;
    
    const statusElement = document.getElementById('selectedDeviceStatus');
    const badge = statusElement.querySelector('.status-badge');
    const isOnline = this.isDeviceOnline(this.selectedDevice);
    
    badge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
    badge.textContent = isOnline ? 'Online' : 'Offline';
  }

  /**
   * Render device controls
   */
  renderDeviceControls() {
    if (!this.selectedDevice) return;
    
    const container = document.getElementById('controlContent');
    
    container.innerHTML = `
      <div class="device-controls">
        <!-- Buzzer Controls -->
        <div class="control-group">
          <h4>
            <i class="fas fa-volume-up"></i>
            Buzzer Control
          </h4>
          <div class="control-buttons">
            <button class="btn btn-success control-btn" data-action="buzzer-on">
              <i class="fas fa-play"></i>
              Turn ON
            </button>
            <button class="btn btn-secondary control-btn" data-action="buzzer-off">
              <i class="fas fa-stop"></i>
              Turn OFF
            </button>
            <button class="btn btn-warning control-btn" data-action="buzzer-beep">
              <i class="fas fa-bell"></i>
              Beep Once
            </button>
            <button class="btn btn-danger control-btn" data-action="buzzer-alarm">
              <i class="fas fa-exclamation-triangle"></i>
              Alarm
            </button>
          </div>
          
          <!-- Custom Tone -->
          <div class="tone-controls">
            <label>Custom Tone:</label>
            <div class="tone-inputs">
              <input type="number" id="toneFreq" placeholder="Frequency (Hz)" value="1000" min="100" max="5000">
              <input type="number" id="toneDuration" placeholder="Duration (ms)" value="500" min="100" max="5000">
              <button class="btn btn-primary control-btn" data-action="custom-tone">
                <i class="fas fa-music"></i>
                Play Tone
              </button>
            </div>
          </div>
        </div>

        <!-- Device Info -->
        <div class="control-group">
          <h4>
            <i class="fas fa-info-circle"></i>
            Device Information
          </h4>
          <div class="device-info-grid">
            <div class="info-item">
              <label>Device ID:</label>
              <span>${this.selectedDevice.id}</span>
            </div>
            <div class="info-item">
              <label>Status:</label>
              <span class="status-badge ${this.isDeviceOnline(this.selectedDevice) ? 'online' : 'offline'}">
                ${this.isDeviceOnline(this.selectedDevice) ? 'Online' : 'Offline'}
              </span>
            </div>
            <div class="info-item">
              <label>Last Update:</label>
              <span>${this.getTimeAgo(this.selectedDevice.lastUpdate)}</span>
            </div>
            <div class="info-item">
              <label>Temperature:</label>
              <span>${this.selectedDevice.data.temperature || '--'}°C</span>
            </div>
            <div class="info-item">
              <label>Humidity:</label>
              <span>${this.selectedDevice.data.humidity || '--'}%</span>
            </div>
            <div class="info-item">
              <label>Light Level:</label>
              <span>${this.selectedDevice.data.lightLevel || '--'}%</span>
            </div>
            <div class="info-item">
              <label>Gas Level:</label>
              <span>${this.selectedDevice.data.gasLevel || '--'}%</span>
            </div>
            <div class="info-item">
              <label>Buzzer Status:</label>
              <span>${this.selectedDevice.data.buzzerStatus || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="control-group">
          <h4>
            <i class="fas fa-bolt"></i>
            Quick Actions
          </h4>
          <div class="control-buttons">
            <button class="btn btn-outline control-btn" data-action="request-status">
              <i class="fas fa-sync"></i>
              Request Status
            </button>
            <button class="btn btn-outline control-btn" data-action="ping-device">
              <i class="fas fa-satellite-dish"></i>
              Ping Device
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners to control buttons
    container.querySelectorAll('.control-btn').forEach(btn => {
      this.addEventListenerTracked(btn, 'click', (e) => {
        const action = e.target.closest('.control-btn').dataset.action;
        this.handleControlAction(action);
      });
    });
  }

  /**
   * Handle control actions
   */
  handleControlAction(action) {
    if (!this.selectedDevice) return;
    
    const deviceId = this.selectedDevice.id;
    
    switch (action) {
      case 'buzzer-on':
        window.MqttService.controlBuzzer(deviceId, 'ON');
        break;
      case 'buzzer-off':
        window.MqttService.controlBuzzer(deviceId, 'OFF');
        break;
      case 'buzzer-beep':
        window.MqttService.controlBuzzer(deviceId, 'BEEP');
        break;
      case 'buzzer-alarm':
        window.MqttService.controlBuzzer(deviceId, 'ALARM');
        break;
      case 'custom-tone':
        this.sendCustomTone();
        break;
      case 'request-status':
        window.MqttService.requestStatus(deviceId);
        break;
      case 'ping-device':
        this.pingDevice();
        break;
    }
  }

  /**
   * Send custom tone
   */
  sendCustomTone() {
    const freq = document.getElementById('toneFreq').value;
    const duration = document.getElementById('toneDuration').value;
    
    if (!freq || !duration) {
      ToastManager.warning('Please enter frequency and duration');
      return;
    }
    
    window.MqttService.sendTone(this.selectedDevice.id, parseInt(freq), parseInt(duration));
  }

  /**
   * Ping device
   */
  pingDevice() {
    // Send a beep as ping
    window.MqttService.controlBuzzer(this.selectedDevice.id, 'BEEP');
    ToastManager.info('Ping sent to device');
  }

  /**
   * Initialize sensor chart
   */
  initializeSensorChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    
    this.sensorChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Temperature (°C)',
            data: [],
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.4
          },
          {
            label: 'Humidity (%)',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4
          },
          {
            label: 'Light (%)',
            data: [],
            borderColor: '#f39c12',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            tension: 0.4
          },
          {
            label: 'Gas (%)',
            data: [],
            borderColor: '#9b59b6',
            backgroundColor: 'rgba(155, 89, 182, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                minute: 'HH:mm'
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  /**
   * Update chart with new data
   */
  updateChart(data) {
    if (!this.sensorChart || this.chartPaused) return;
    
    const now = new Date();
    
    // Add new data point
    this.sensorChart.data.labels.push(now);
    
    const datasets = this.sensorChart.data.datasets;
    
    // Update temperature
    if (data.temperature !== undefined) {
      datasets[0].data.push(data.temperature);
    } else {
      datasets[0].data.push(null);
    }
    
    // Update humidity  
    if (data.humidity !== undefined) {
      datasets[1].data.push(data.humidity);
    } else {
      datasets[1].data.push(null);
    }
    
    // Update light
    if (data.lightLevel !== undefined) {
      datasets[2].data.push(data.lightLevel);
    } else {
      datasets[2].data.push(null);
    }
    
    // Update gas
    if (data.gasLevel !== undefined) {
      datasets[3].data.push(data.gasLevel);
    } else {
      datasets[3].data.push(null);
    }
    
    // Keep only last 20 data points
    const maxPoints = 20;
    if (this.sensorChart.data.labels.length > maxPoints) {
      this.sensorChart.data.labels = this.sensorChart.data.labels.slice(-maxPoints);
      datasets.forEach(dataset => {
        dataset.data = dataset.data.slice(-maxPoints);
      });
    }
    
    this.sensorChart.update('none');
  }

  /**
   * Setup chart controls
   */
  setupChartControls() {
    this.chartPaused = false;
    
    const pauseBtn = document.getElementById('pauseChartBtn');
    this.addEventListenerTracked(pauseBtn, 'click', () => {
      this.chartPaused = !this.chartPaused;
      const icon = pauseBtn.querySelector('i');
      const text = pauseBtn.querySelector('span') || pauseBtn;
      
      if (this.chartPaused) {
        icon.className = 'fas fa-play';
        text.textContent = ' Resume';
      } else {
        icon.className = 'fas fa-pause';
        text.textContent = ' Pause';
      }
    });
    
    const clearBtn = document.getElementById('clearChartBtn');
    this.addEventListenerTracked(clearBtn, 'click', () => {
      this.clearChart();
    });
  }

  /**
   * Clear chart data
   */
  clearChart() {
    if (this.sensorChart) {
      this.sensorChart.data.labels = [];
      this.sensorChart.data.datasets.forEach(dataset => {
        dataset.data = [];
      });
      this.sensorChart.update();
    }
  }

  /**
   * Setup modal events
   */
  setupModalEvents() {
    const modal = document.getElementById('controlModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    
    this.addEventListenerTracked(closeBtn, 'click', () => this.closeModal());
    this.addEventListenerTracked(cancelBtn, 'click', () => this.closeModal());
    
    // Close modal when clicking outside
    this.addEventListenerTracked(modal, 'click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('controlModal');
    modal.style.display = 'none';
  }

  /**
   * Update device in list
   */
  updateDeviceInList(deviceId) {
    const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
    if (deviceCard) {
      const device = window.MqttService.getDeviceData(deviceId);
      if (device) {
        // Update the card content
        const newCard = document.createElement('div');
        newCard.innerHTML = this.renderDeviceCard(device);
        deviceCard.outerHTML = newCard.innerHTML;
        
        // Re-add event listener
        const newCardElement = document.querySelector(`[data-device-id="${deviceId}"]`);
        if (newCardElement) {
          this.addEventListenerTracked(newCardElement, 'click', () => {
            this.selectDevice(deviceId);
          });
        }
      }
    }
  }

  /**
   * Refresh selected device controls
   */
  refreshSelectedDeviceControls() {
    if (this.selectedDevice) {
      this.selectedDevice = window.MqttService.getDeviceData(this.selectedDevice.id);
      this.updateSelectedDeviceStatus();
      this.renderDeviceControls();
    }
  }

  /**
   * Update stats
   */
  updateStats() {
    const devices = window.MqttService.getAllDevices();
    const onlineDevices = devices.filter(d => this.isDeviceOnline(d)).length;
    
    document.getElementById('onlineDevices').textContent = onlineDevices;
  }

  /**
   * Refresh devices
   */
  refreshDevices() {
    ToastManager.info('Refreshing devices...');
    this.loadDevices();
    this.updateStats();
  }

  /**
   * Scan for devices
   */
  scanForDevices() {
    ToastManager.info('Scanning for devices...');
    
    // Request status from all known devices
    const knownDevices = ['ESP32_001']; // Add more device IDs as needed
    
    knownDevices.forEach(deviceId => {
      window.MqttService.requestStatus(deviceId);
    });
    
    // Refresh after a delay
    setTimeout(() => {
      this.loadDevices();
      this.updateStats();
    }, 2000);
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    this.refreshInterval = setInterval(() => {
      this.updateStats();
      if (this.selectedDevice) {
        this.updateSelectedDeviceStatus();
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Cleanup when leaving page
   */
  async hide() {
    // Clear interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Unsubscribe from MQTT events
    this.mqttSubscriptions.forEach(unsubscribe => unsubscribe());
    this.mqttSubscriptions = [];
    
    // Destroy chart
    if (this.sensorChart) {
      this.sensorChart.destroy();
      this.sensorChart = null;
    }
    
    await super.hide();
  }
}

// Export for use
window.DeviceControlPage = DeviceControlPage;
