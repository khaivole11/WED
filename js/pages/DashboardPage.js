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
            <button class="btn btn-outline" onclick="this.refreshData()">
              <i class="fas fa-sync-alt"></i>
              Refresh
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
              <h3 id="totalStudents">500</h3>
              <p>Tổng số học sinh</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="metric-content">
              <h3 id="presentStudents">455</h3>
              <p>Số học sinh có mặt</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="metric-content">
              <h3 id="lateStudents">35</h3>
              <p>Số học sinh đi trễ</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="metric-content">
              <h3 id="absentStudents">10</h3>
              <p>Số học sinh vắng mặt</p>
            </div>
          </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Tình trạng thiết bị điểm danh</h3>
            </div>
            <div class="attendance-devices-table">
              <table>
                <thead>
                  <tr>
                    <th>Tên thiết bị</th>
                    <th>Lớp</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody id="devicesTable">
                  <!-- Devices will be populated here -->
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
    this.loadDashboardData();
    
    // Setup charts
    this.setupCharts();
    
    // Setup auto-refresh
    this.startAutoRefresh();
  }
  
  /**
   * Load dashboard data
   */
  loadDashboardData() {
    this.loadDevices();
    this.updateMetrics();
  }
  
  /**
   * Load alerts data
   */
  loadDevices() {
    const devices = this.getMockAttendanceDevices();
    const devicesTable = document.getElementById('devicesTable');
    
    if (!devicesTable) return;
    
    devicesTable.innerHTML = devices.map(device => `
      <tr>
        <td>${device.name}</td>
        <td>${device.class}</td>
        <td>
          <span class="status-badge ${device.status}">
            ${this.getDeviceStatusText(device.status)}
          </span>
        </td>
        <td>${device.note}</td>
      </tr>
    `).join('');
  }
  
  /**
   * Update metrics
   */
  updateMetrics() {
    const students = this.getMockStudents();
    
    const totalStudents = 500;
    const presentStudents = students.filter(s => s.status === 'present').length;
    const lateStudents = students.filter(s => s.status === 'late').length;
    const absentStudents = students.filter(s => s.status === 'absent').length;
    
    // Scale up the numbers to match the total
    const scaleFactor = totalStudents / students.length;
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('presentStudents').textContent = Math.round(presentStudents * scaleFactor);
    document.getElementById('lateStudents').textContent = Math.round(lateStudents * scaleFactor);
    document.getElementById('absentStudents').textContent = Math.round(absentStudents * scaleFactor);
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
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
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
   * Get mock students data
   */
  getMockStudents() {
    return [
      {
        id: 'hs-001',
        name: 'Nguyễn Văn A',
        studentId: 'HS101',
        class: 'A01',
        status: 'present',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '06:55',
        note: '--'
      },
      {
        id: 'hs-002',
        name: 'Lê Thị B',
        studentId: 'HS102',
        class: 'A02',
        status: 'late',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '07:21',
        note: '--'
      },
      {
        id: 'hs-003',
        name: 'Trần Văn C',
        studentId: 'HS103',
        class: 'A03',
        status: 'absent',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '--',
        note: 'Có phép'
      },
      {
        id: 'hs-004',
        name: 'Phạm Minh D',
        studentId: 'HS104',
        class: 'A04',
        status: 'absent',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '--',
        note: 'Không phép'
      },
      {
        id: 'hs-005',
        name: 'Hồ Thị E',
        studentId: 'HS105',
        class: 'A05',
        status: 'present',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '06:58',
        note: '--'
      },
      {
        id: 'hs-006',
        name: 'Đặng Văn F',
        studentId: 'HS106',
        class: 'A06',
        status: 'present',
        attendanceDate: 'Apr 24, 2022',
        arrivalTime: '06:59',
        note: '--'
      }
    ];
  }
  
  /**
   * Get mock attendance devices data
   */
  getMockAttendanceDevices() {
    return [
      {
        name: 'Device 1',
        class: '10A1',
        status: 'online',
        note: 'None'
      },
      {
        name: 'Device 2',
        class: '10A2',
        status: 'offline',
        note: 'Lose connection'
      }
    ];
  }
  
  /**
   * Get device status text
   */
  getDeviceStatusText(status) {
    const statusMap = {
      online: 'Online',
      offline: 'Offline',
      warning: 'Warning'
    };
    return statusMap[status] || status;
  }
  
  // Action methods (placeholder implementations)
  
  refreshData() {
    ToastManager.info('Đang làm mới dữ liệu...');
    this.loadDashboardData();
  }
}

// Export for use
window.DashboardPage = DashboardPage;
