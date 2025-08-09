/**
 * Attendance Statistics Page - Trang thống kê điểm danh
 */
class AttendanceStatsPage extends BasePage {
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
      <div class="attendance-stats-page">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Thống kê điểm danh</h1>
            <p class="page-subtitle">Báo cáo và phân tích chi tiết về điểm danh học sinh</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="this.exportReport()">
              <i class="fas fa-download"></i>
              Xuất báo cáo
            </button>
            <button class="btn btn-primary" onclick="this.refreshData()">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>
        
        <!-- Stats Overview -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h3 id="avgAttendance">91.2%</h3>
              <p>Tỷ lệ điểm danh trung bình</p>
              <div class="stat-trend up">
                <i class="fas fa-arrow-up"></i> +2.3% so với tháng trước
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-calendar-day"></i>
            </div>
            <div class="stat-content">
              <h3 id="todayAttendance">455/500</h3>
              <p>Điểm danh hôm nay</p>
              <div class="stat-trend up">
                <i class="fas fa-arrow-up"></i> 91% có mặt
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <h3 id="lateRate">7%</h3>
              <p>Tỷ lệ đi trễ</p>
              <div class="stat-trend down">
                <i class="fas fa-arrow-down"></i> -1.2% tuần này
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-user-times"></i>
            </div>
            <div class="stat-content">
              <h3 id="absentRate">2%</h3>
              <p>Tỷ lệ vắng mặt</p>
              <div class="stat-trend up">
                <i class="fas fa-arrow-up"></i> +0.5% hôm nay
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Main Chart -->
          <div class="chart-container large">
            <div class="chart-header">
              <h3 class="chart-title">Thống kê điểm danh theo thời gian</h3>
              <div class="chart-actions">
                <select class="btn btn-sm" id="attendanceTimeRange">
                  <option value="7d">7 ngày qua</option>
                  <option value="30d">30 ngày qua</option>
                  <option value="semester">Học kỳ này</option>
                  <option value="year">Năm học này</option>
                </select>
              </div>
            </div>
            <div style="position: relative; height: 400px;">
              <canvas id="attendanceChart"></canvas>
            </div>
          </div>
          
          <!-- Secondary Charts -->
          <div class="secondary-charts">
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Phân bố theo lớp</h3>
              </div>
              <div style="position: relative; height: 300px;">
                <canvas id="classChart"></canvas>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Xu hướng hàng tuần</h3>
              </div>
              <div style="position: relative; height: 300px;">
                <canvas id="weeklyTrendChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Detailed Table -->
        <div class="detailed-stats">
          <div class="section-header">
            <h2>Chi tiết theo lớp</h2>
            <div class="table-actions">
              <input type="text" class="form-control" placeholder="Tìm kiếm lớp..." id="classSearch">
              <button class="btn btn-outline" onclick="this.exportClassReport()">
                <i class="fas fa-file-excel"></i>
                Xuất Excel
              </button>
            </div>
          </div>
          
          <div class="class-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Tổng HS</th>
                  <th>Có mặt</th>
                  <th>Đi trễ</th>
                  <th>Vắng mặt</th>
                  <th>Tỷ lệ (%)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody id="classStatsTable">
                <!-- Class stats will be populated here -->
              </tbody>
            </table>
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
    await this.loadStatsData();
    
    // Setup charts
    this.setupCharts();
    
    // Setup auto-refresh
    this.startAutoRefresh();
    
    // Setup event listeners
    const timeRangeSelect = document.getElementById('attendanceTimeRange');
    if (timeRangeSelect) {
      this.addEventListenerTracked(timeRangeSelect, 'change', () => {
        this.updateAttendanceChart();
      });
    }
    
    const classSearch = document.getElementById('classSearch');
    if (classSearch) {
      this.addEventListenerTracked(classSearch, 'input', (e) => {
        this.filterClassStats(e.target.value);
      });
    }
  }
  
  /**
   * Load statistics data
   */
  async loadStatsData() {
    try {
      await this.loadClassStats();
      await this.updateOverviewStats();
    } catch (error) {
      console.error('Error loading stats data:', error);
      ToastManager.error('Lỗi khi tải dữ liệu thống kê');
    }
  }
  
  /**
   * Load class statistics
   */
  async loadClassStats() {
    try {
      // Wait for Firebase to initialize
      if (!window.firebaseService.isInitialized) {
        await new Promise(resolve => {
          const checkInit = () => {
            if (window.firebaseService.isInitialized) {
              resolve();
            } else {
              setTimeout(checkInit, 100);
            }
          };
          checkInit();
        });
      }
      
      // Get today's attendance and all students
      const todayAttendance = await window.firebaseService.getTodayAttendance();
      const allStudents = await window.firebaseService.getStudents();
      
      // Group by class
      const classSummary = {};
      
      // Initialize all classes from students
      allStudents.forEach(student => {
        if (!classSummary[student.class]) {
          classSummary[student.class] = {
            className: student.class,
            total: 0,
            present: 0,
            late: 0,
            absent: 0
          };
        }
        classSummary[student.class].total++;
      });
      
      // Count attendance by class
      todayAttendance.forEach(record => {
        if (classSummary[record.class]) {
          classSummary[record.class][record.status]++;
        }
      });
      
      // Calculate attendance rates and missing students
      const classStats = Object.values(classSummary).map(cls => {
        const attendedCount = cls.present + cls.late;
        cls.absent = cls.total - attendedCount; // Students not marked present/late are absent
        cls.percentage = cls.total > 0 ? Math.round((attendedCount / cls.total) * 100) : 0;
        return cls;
      });
      
      // Update table
      const tableBody = document.getElementById('classStatsTable');
      if (tableBody) {
        tableBody.innerHTML = classStats.map(cls => `
          <tr data-class="${cls.className}">
            <td><strong>${cls.className}</strong></td>
            <td>${cls.total}</td>
            <td>
              <span class="status-badge present">${cls.present}</span>
            </td>
            <td>
              <span class="status-badge late">${cls.late}</span>
            </td>
            <td>
              <span class="status-badge absent">${cls.absent}</span>
            </td>
            <td>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${cls.percentage}%"></div>
                <span class="progress-text">${cls.percentage}%</span>
              </div>
            </td>
            <td>
              <button class="btn btn-xs btn-outline" onclick="this.viewClassDetail('${cls.className}')">
                <i class="fas fa-eye"></i> Chi tiết
              </button>
            </td>
          </tr>
        `).join('');
      }
      
    } catch (error) {
      console.error('Error loading class stats:', error);
      
      const tableBody = document.getElementById('classStatsTable');
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không thể tải dữ liệu thống kê lớp</td></tr>';
      }
    }
  }
  
  /**
   * Update overview statistics
   */
  async updateOverviewStats() {
    try {
      // Get today's stats
      const stats = await window.firebaseService.getAttendanceStats();
      const totalStudents = await window.firebaseService.getStudents();
      
      // Calculate rates
      const total = totalStudents.length;
      const attended = stats.present + stats.late;
      const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
      const lateRate = total > 0 ? Math.round((stats.late / total) * 100) : 0;
      const absentRate = total > 0 ? Math.round((stats.absent / total) * 100) : 0;
      
      // Update UI
      document.getElementById('avgAttendance').textContent = `${attendanceRate}%`;
      document.getElementById('todayAttendance').textContent = `${attended}/${total}`;
      document.getElementById('lateRate').textContent = `${lateRate}%`;
      document.getElementById('absentRate').textContent = `${absentRate}%`;
      
    } catch (error) {
      console.error('Error updating overview stats:', error);
      
      document.getElementById('avgAttendance').textContent = '-';
      document.getElementById('todayAttendance').textContent = '-';
      document.getElementById('lateRate').textContent = '-';
      document.getElementById('absentRate').textContent = '-';
    }
  }
  
  /**
   * Setup charts
   */
  setupCharts() {
    this.setupAttendanceChart();
    this.setupClassChart();
    this.setupWeeklyTrendChart();
  }
  
  /**
   * Setup main attendance chart
   */
  setupAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    const data = this.getAttendanceChartData();
    
    this.charts.attendance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Có mặt',
            data: data.present,
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Đi trễ',
            data: data.late,
            borderColor: '#f39c12',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Vắng mặt',
            data: data.absent,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              font: {
                size: 12
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#ffffff'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }
  
  /**
   * Setup class distribution chart
   */
  setupClassChart() {
    const ctx = document.getElementById('classChart');
    if (!ctx) return;
    
    this.charts.class = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06'],
        datasets: [{
          data: [45, 42, 48, 40, 46, 44],
          backgroundColor: [
            '#3498db',
            '#27ae60',
            '#f39c12',
            '#e74c3c',
            '#9b59b6',
            '#1abc9c'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Setup weekly trend chart
   */
  setupWeeklyTrendChart() {
    const ctx = document.getElementById('weeklyTrendChart');
    if (!ctx) return;
    
    this.charts.weekly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6'],
        datasets: [{
          label: 'Tỷ lệ có mặt (%)',
          data: [92, 94, 88, 93, 90],
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: '#3498db',
          borderWidth: 1
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
            },
            ticks: {
              color: '#ffffff'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }
  
  /**
   * Update attendance chart
   */
  updateAttendanceChart() {
    if (!this.charts.attendance) return;
    
    const data = this.getAttendanceChartData();
    this.charts.attendance.data.labels = data.labels;
    this.charts.attendance.data.datasets[0].data = data.present;
    this.charts.attendance.data.datasets[1].data = data.late;
    this.charts.attendance.data.datasets[2].data = data.absent;
    this.charts.attendance.update();
  }
  
  /**
   * Filter class statistics
   */
  filterClassStats(searchTerm) {
    const rows = document.querySelectorAll('#classStatsTable tr');
    rows.forEach(row => {
      const className = row.dataset.class || '';
      if (className.toLowerCase().includes(searchTerm.toLowerCase())) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
  
  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    this.updateInterval = setInterval(async () => {
      await this.updateOverviewStats();
      this.updateAttendanceChart();
    }, 60000); // Update every 60 seconds
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
    ToastManager.info('Đang làm mới dữ liệu thống kê...');
    await this.loadStatsData();
  }
  
  exportReport() {
    ToastManager.info('Tính năng xuất báo cáo sẽ được triển khai sớm');
  }
  
  exportClassReport() {
    ToastManager.info('Xuất báo cáo Excel theo lớp');
  }
  
  viewClassDetail(className) {
    ToastManager.info(`Xem chi tiết lớp ${className}`);
  }
}

// Export for use
window.AttendanceStatsPage = AttendanceStatsPage;
