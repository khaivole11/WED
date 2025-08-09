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
            <h1 class="page-title">Tổng quan</h1>
            <p class="page-subtitle">Hệ thống điểm danh học sinh</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.currentPage.refreshData()">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
            <button class="btn btn-warning" onclick="window.currentPage.clearAllData()">
              <i class="fas fa-trash"></i>
              Clear Data
            </button>
          </div>
        </div>
        
        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="metric-content">
              <h3 id="totalStudents">-</h3>
              <p>Tổng số học sinh</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="metric-content">
              <h3 id="presentStudents">-</h3>
              <p>Số học sinh có mặt</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="metric-content">
              <h3 id="lateStudents">-</h3>
              <p>Số học sinh đi trễ</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="metric-content">
              <h3 id="absentStudents">-</h3>
              <p>Số học sinh vắng mặt</p>
            </div>
          </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Dữ liệu cảm biến môi trường</h3>
            </div>
            <div class="attendance-devices-table">
              <table>
                <thead>
                  <tr>
                    <th>Tên thiết bị</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Dữ liệu</th>
                  </tr>
                </thead>
                <tbody id="devicesTable">
                  <!-- Sensor data will be populated here -->
                </tbody>
              </table>
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
    // Populate initial data
    await this.loadDashboardData();
    
    // Setup charts
    this.setupCharts();
    
    // Setup auto-refresh
    this.startAutoRefresh();
  }
  
  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      // Kiểm tra Firebase với timeout
      const firebaseReady = await this.waitForFirebase(3000);
      
      if (firebaseReady && window.firebaseService.isConnected()) {
        await window.firebaseService.syncCSVWithFirebase();
      }
      
      await this.loadDevices();
      await this.updateMetrics();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      if (window.toastManager) {
        window.toastManager.show('Không thể tải dữ liệu', 'error');
      }
    }
  }
  
  /**
   * Wait for Firebase with timeout
   */
  async waitForFirebase(timeout = 3000) {
    return new Promise(resolve => {
      const start = Date.now();
      const checkInit = () => {
        if (window.firebaseService?.isInitialized) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          resolve(false);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }
  
  /**
   * Load devices data from Firebase and MQTT
   */
  async loadDevices() {
    try {
      const devicesTable = document.getElementById('devicesTable');
      if (!devicesTable) return;
      
      // Get Firebase sensor data
      const firebaseSensorData = await this.getSensorData();
      
      // Get MQTT devices data
      const mqttDevices = window.MqttService ? window.MqttService.getAllDevices() : [];
      
      let sensorRows = '';
      
      // Display Firebase sensor data
      if (firebaseSensorData) {
        sensorRows += `
          <tr>
            <td>Cảm biến môi trường (Firebase)</td>
            <td>Environmental Sensor</td>
            <td>
              <span class="status-badge online">
                <i class="fas fa-database"></i> Firebase
              </span>
            </td>
            <td>
              🌡️ ${firebaseSensorData.temperature || '--'}°C, 
              💧 ${firebaseSensorData.humidity || '--'}%, 
              💡 ${firebaseSensorData.lightLevel || '--'}%,
              💨 ${firebaseSensorData.gasLevel || '--'}%
            </td>
          </tr>
        `;
      }
      
      // Display MQTT devices data
      mqttDevices.forEach(device => {
        const isOnline = this.isDeviceOnline(device);
        const statusClass = isOnline ? 'online' : 'offline';
        const statusText = isOnline ? 'Online' : 'Offline';
        const lastUpdate = this.getTimeAgo(device.lastUpdate);
        
        sensorRows += `
          <tr>
            <td>${device.id} (MQTT)</td>
            <td>IoT Device</td>
            <td>
              <span class="status-badge ${statusClass}">
                <i class="fas fa-wifi"></i> ${statusText}
              </span>
              <small style="display: block; color: #666;">${lastUpdate}</small>
            </td>
            <td>
              ${device.data.temperature ? `🌡️ ${device.data.temperature}°C` : ''}
              ${device.data.humidity ? `, 💧 ${device.data.humidity}%` : ''}
              ${device.data.lightLevel ? `, 💡 ${device.data.lightLevel}%` : ''}
              ${device.data.gasLevel ? `, 💨 ${device.data.gasLevel}%` : ''}
              ${device.data.buzzerStatus ? `, 🔊 ${device.data.buzzerStatus}` : ''}
              ${Object.keys(device.data).length === 0 ? 'Chưa có dữ liệu' : ''}
            </td>
          </tr>
        `;
      });
      
      if (sensorRows === '') {
        devicesTable.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center;">
              <i class="fas fa-search"></i> 
              Chưa có dữ liệu cảm biến. 
              <a href="#device-control" onclick="window.router.navigate('#device-control')">
                Kiểm tra trang Device Control
              </a>
            </td>
          </tr>
        `;
      } else {
        devicesTable.innerHTML = sensorRows;
      }
      
    } catch (error) {
      console.error('Error loading devices:', error);
      const devicesTable = document.getElementById('devicesTable');
      if (devicesTable) {
        devicesTable.innerHTML = '<tr><td colspan="4" style="text-align: center;">Lỗi khi tải dữ liệu cảm biến</td></tr>';
      }
    }
  }

  /**
   * Check if MQTT device is online
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
   * Get sensor data
   */
  async getSensorData() {
    try {
      const sensorRef = window.firebaseService.ref(window.firebaseService.database, 'latest_data');
      const snapshot = await window.firebaseService.get(sensorRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting sensor data:', error);
      return null;
    }
  }

  /**
   * Get device status text
   */
  getDeviceStatusText(status) {
    const statusMap = {
      online: 'Online',
      offline: 'Offline', 
      warning: 'Cảnh báo',
      maintenance: 'Bảo trì'
    };
    return statusMap[status] || 'Không xác định';
  }
  
  /**
   * Update metrics dựa trên dữ liệu thực từ Firebase
   */
  async updateMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const students = await window.firebaseService.getStudents();
      const attendance = await window.firebaseService.getAttendanceByDate(today);
      
      // Tính toán thống kê thực
      const totalStudents = students.length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const absentCount = totalStudents - presentCount - lateCount;
      
      document.getElementById('totalStudents').textContent = totalStudents;
      document.getElementById('presentStudents').textContent = presentCount;
      document.getElementById('lateStudents').textContent = lateCount;
      document.getElementById('absentStudents').textContent = absentCount;
      
    } catch (error) {
      console.error('Error updating metrics:', error);
      document.getElementById('totalStudents').textContent = '-';
      document.getElementById('presentStudents').textContent = '-';
      document.getElementById('lateStudents').textContent = '-';
      document.getElementById('absentStudents').textContent = '-';
    }
  }
  
  /**
   * Setup charts
   */
  setupCharts() {
    // Không cần setup chart nữa vì đã chuyển sang trang khác
  }
  
  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    this.updateInterval = setInterval(async () => {
      await this.updateMetrics();
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
  
  // Action methods
  
  async refreshData() {
    try {
      if (window.ToastManager) {
        window.ToastManager.info('🔄 Đang đồng bộ CSV với Firebase...');
      }
      
      // Force sync CSV with Firebase
      const hasChanges = await window.firebaseService.forceSyncCSV();
      
      if (hasChanges) {
        if (window.ToastManager) {
          window.ToastManager.success('✅ Đã cập nhật dữ liệu từ CSV thành công!');
        }
      } else {
        if (window.ToastManager) {
          window.ToastManager.info('ℹ️ Dữ liệu đã đồng bộ, không có thay đổi');
        }
      }
      
      // Reload dashboard data
      await this.loadDashboardData();
      
      if (window.ToastManager) {
        window.ToastManager.success('📊 Dashboard đã được cập nhật!');
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      if (window.ToastManager) {
        window.ToastManager.error('❌ Lỗi: ' + error.message);
      }
    }
  }

  async clearAllData() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu trong Firebase?\n\nHành động này KHÔNG THỂ hoàn tác!')) {
      return;
    }

    try {
      if (window.ToastManager) {
        window.ToastManager.info('🗑️ Đang xóa tất cả dữ liệu...');
      }

      await window.firebaseService.clearAllStudents();
      await window.firebaseService.clearAllAttendance();

      if (window.ToastManager) {
        window.ToastManager.success('✅ Đã xóa tất cả dữ liệu thành công!');
      }

      // Reload dashboard
      await this.loadDashboardData();

    } catch (error) {
      console.error('Error clearing data:', error);
      if (window.ToastManager) {
        window.ToastManager.error('❌ Lỗi khi xóa dữ liệu: ' + error.message);
      }
    }
  }
}

window.DashboardPage = DashboardPage;
