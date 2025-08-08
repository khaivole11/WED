/**
 * Dashboard Page - Trang tổng quan hệ thống IoT
 */
class DashboardPage extends BasePage {
  constructor() {
    super();
    this.charts = {};
    this.updateInterval = null;
  }
  
  /**
   * Lấy nội dung HTML của trang
   */
  async getContent() {
    return `
      <div class="dashboard-page">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Tổng quan hệ thống IoT của bạn</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="this.refreshData()">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
            <button class="btn btn-primary" onclick="this.addDevice()">
              <i class="fas fa-plus"></i>
              Add Device
            </button>
          </div>
        </div>
        
        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <div class="metric-content">
              <h3 id="totalDevices">24</h3>
              <p>Total Devices</p>
              <div class="metric-trend up">
                <i class="fas fa-arrow-up"></i> +2 this week
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-wifi"></i>
            </div>
            <div class="metric-content">
              <h3 id="onlineDevices">18</h3>
              <p>Online Devices</p>
              <div class="metric-trend up">
                <i class="fas fa-arrow-up"></i> 75% uptime
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="metric-content">
              <h3 id="activeAlerts">3</h3>
              <p>Active Alerts</p>
              <div class="metric-trend down">
                <i class="fas fa-arrow-down"></i> -2 from yesterday
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="metric-content">
              <h3 id="powerConsumption">1.2kW</h3>
              <p>Power Usage</p>
              <div class="metric-trend up">
                <i class="fas fa-arrow-up"></i> +5% today
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Device Activity (24h)</h3>
              <div class="chart-actions">
                <select class="btn btn-sm" id="activityTimeRange">
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
            <div style="position: relative; height: 300px;">
              <canvas id="activityChart"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Recent Alerts</h3>
              <div class="chart-actions">
                <button class="btn btn-sm" onclick="this.viewAllAlerts()">
                  View All
                </button>
              </div>
            </div>
            <div class="alerts-container" id="recentAlerts">
              <!-- Alerts will be populated here -->
            </div>
          </div>
        </div>
        
        <!-- Devices Grid -->
        <div class="section-header">
          <h2>Connected Devices</h2>
          <button class="btn btn-outline" onclick="this.viewAllDevices()">
            <i class="fas fa-list"></i>
            View All
          </button>
        </div>
        
        <div class="devices-grid" id="devicesGrid">
          <!-- Devices will be populated here -->
        </div>
      </div>
    `;
  }
  
  /**
   * Setup các sự kiện của trang
   */
  async setupEvents() {
    // Populate initial data
    this.loadDashboardData();
    
    // Setup charts
    this.setupCharts();
    
    // Setup auto-refresh
    this.startAutoRefresh();
    
    // Setup event listeners
    const timeRangeSelect = document.getElementById('activityTimeRange');
    if (timeRangeSelect) {
      this.addEventListenerTracked(timeRangeSelect, 'change', () => {
        this.updateActivityChart();
      });
    }
  }
  
  /**
   * Load dashboard data
   */
  loadDashboardData() {
    this.loadDevices();
    this.loadAlerts();
    this.updateMetrics();
  }
  
  /**
   * Load devices data
   */
  loadDevices() {
    const devices = this.getMockDevices();
    const devicesGrid = document.getElementById('devicesGrid');
    
    if (!devicesGrid) return;
    
    devicesGrid.innerHTML = devices.slice(0, 6).map(device => `
      <div class="device-card" data-device-id="${device.id}">
        <div class="device-header">
          <div class="device-info">
            <h3>${device.name}</h3>
            <p>${device.location}</p>
          </div>
          <div class="device-status-badge ${device.status}"></div>
        </div>
        <div class="device-body">
          <p><strong>Type:</strong> ${device.type}</p>
          <p><strong>Last Update:</strong> ${device.lastUpdate}</p>
          
          <div class="device-metrics">
            ${device.metrics.map(metric => `
              <div class="device-metric">
                <div class="device-metric-value">${metric.value}</div>
                <div class="device-metric-label">${metric.label}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="device-actions">
            <button class="btn btn-sm btn-outline" onclick="this.viewDevice('${device.id}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-primary" onclick="this.configureDevice('${device.id}')">
              <i class="fas fa-cog"></i> Configure
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Load alerts data
   */
  loadAlerts() {
    const alerts = this.getMockAlerts();
    const alertsContainer = document.getElementById('recentAlerts');
    
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = alerts.slice(0, 5).map(alert => `
      <div class="alert-item ${alert.severity}">
        <div class="alert-icon">
          <i class="fas ${this.getAlertIcon(alert.severity)}"></i>
        </div>
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-time">${alert.time}</div>
        </div>
        <div class="alert-actions">
          <button class="btn btn-xs btn-outline" onclick="this.acknowledgeAlert('${alert.id}')">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn btn-xs btn-outline" onclick="this.viewAlert('${alert.id}')">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Update metrics
   */
  updateMetrics() {
    const devices = this.getMockDevices();
    const alerts = this.getMockAlerts();
    
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const activeAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;
    
    document.getElementById('totalDevices').textContent = totalDevices;
    document.getElementById('onlineDevices').textContent = onlineDevices;
    document.getElementById('activeAlerts').textContent = activeAlerts;
    document.getElementById('powerConsumption').textContent = '1.2kW';
  }
  
  /**
   * Setup charts
   */
  setupCharts() {
    this.setupActivityChart();
  }
  
  /**
   * Setup activity chart
   */
  setupActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    const data = this.getActivityChartData();
    
    this.charts.activity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Active Devices',
          data: data.values,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }
  
  /**
   * Update activity chart
   */
  updateActivityChart() {
    if (!this.charts.activity) return;
    
    const data = this.getActivityChartData();
    this.charts.activity.data.labels = data.labels;
    this.charts.activity.data.datasets[0].data = data.values;
    this.charts.activity.update();
  }
  
  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.updateActivityChart();
    }, 30000); // Update every 30 seconds
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    super.cleanup();
    
    // Clear auto refresh
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  }
  
  // Mock data methods
  
  /**
   * Get mock devices data
   */
  getMockDevices() {
    return [
      {
        id: 'dev-001',
        name: 'Smart Thermostat',
        type: 'Temperature Sensor',
        location: 'Living Room',
        status: 'online',
        lastUpdate: '2 minutes ago',
        metrics: [
          { label: 'Temp', value: '22°C' },
          { label: 'Humidity', value: '45%' }
        ]
      },
      {
        id: 'dev-002',
        name: 'Security Camera',
        type: 'Camera',
        location: 'Front Door',
        status: 'online',
        lastUpdate: '1 minute ago',
        metrics: [
          { label: 'Status', value: 'Recording' },
          { label: 'Quality', value: '1080p' }
        ]
      },
      {
        id: 'dev-003',
        name: 'Smart Light',
        type: 'Light Control',
        location: 'Bedroom',
        status: 'offline',
        lastUpdate: '15 minutes ago',
        metrics: [
          { label: 'Brightness', value: '0%' },
          { label: 'Color', value: 'Off' }
        ]
      },
      {
        id: 'dev-004',
        name: 'Motion Detector',
        type: 'Motion Sensor',
        location: 'Hallway',
        status: 'online',
        lastUpdate: '30 seconds ago',
        metrics: [
          { label: 'Motion', value: 'None' },
          { label: 'Battery', value: '85%' }
        ]
      },
      {
        id: 'dev-005',
        name: 'Smart Lock',
        type: 'Access Control',
        location: 'Main Door',
        status: 'online',
        lastUpdate: '5 minutes ago',
        metrics: [
          { label: 'Status', value: 'Locked' },
          { label: 'Battery', value: '92%' }
        ]
      },
      {
        id: 'dev-006',
        name: 'Air Quality Monitor',
        type: 'Environment Sensor',
        location: 'Kitchen',
        status: 'warning',
        lastUpdate: '1 minute ago',
        metrics: [
          { label: 'AQI', value: '75' },
          { label: 'CO2', value: '450ppm' }
        ]
      }
    ];
  }
  
  /**
   * Get mock alerts data
   */
  getMockAlerts() {
    return [
      {
        id: 'alert-001',
        message: 'Smart Lock battery is running low',
        severity: 'warning',
        time: '5 minutes ago',
        device: 'Smart Lock'
      },
      {
        id: 'alert-002',
        message: 'Bedroom Smart Light is offline',
        severity: 'critical',
        time: '15 minutes ago',
        device: 'Smart Light'
      },
      {
        id: 'alert-003',
        message: 'Motion detected in hallway',
        severity: 'info',
        time: '30 minutes ago',
        device: 'Motion Detector'
      },
      {
        id: 'alert-004',
        message: 'High CO2 levels detected in kitchen',
        severity: 'warning',
        time: '1 hour ago',
        device: 'Air Quality Monitor'
      },
      {
        id: 'alert-005',
        message: 'Security camera recording quality degraded',
        severity: 'info',
        time: '2 hours ago',
        device: 'Security Camera'
      }
    ];
  }
  
  /**
   * Get activity chart data
   */
  getActivityChartData() {
    const timeRange = document.getElementById('activityTimeRange')?.value || '24h';
    
    if (timeRange === '24h') {
      return {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        values: [15, 12, 18, 22, 20, 24, 18]
      };
    } else if (timeRange === '7d') {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [20, 22, 18, 24, 21, 19, 23]
      };
    } else {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [21, 23, 20, 24]
      };
    }
  }
  
  /**
   * Get alert icon
   */
  getAlertIcon(severity) {
    const icons = {
      critical: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[severity] || 'fa-info-circle';
  }
  
  // Action methods (placeholder implementations)
  
  refreshData() {
    ToastManager.info('Refreshing dashboard data...');
    this.loadDashboardData();
  }
  
  addDevice() {
    ToastManager.info('Add device feature will be implemented soon');
  }
  
  viewAllAlerts() {
    window.router.navigate('#alerts');
  }
  
  viewAllDevices() {
    window.router.navigate('#devices');
  }
  
  viewDevice(deviceId) {
    ToastManager.info(`Viewing device ${deviceId}`);
  }
  
  configureDevice(deviceId) {
    ToastManager.info(`Configuring device ${deviceId}`);
  }
  
  acknowledgeAlert(alertId) {
    ToastManager.success('Alert acknowledged');
    this.loadAlerts();
  }
  
  viewAlert(alertId) {
    ToastManager.info(`Viewing alert ${alertId}`);
  }
}

// Export for use
window.DashboardPage = DashboardPage;
