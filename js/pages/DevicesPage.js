/**
 * Classes Page - Trang quản lý lớp học
 */
class ClassesPage extends BasePage {
  constructor() {
    super();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.classes = [];
    this.students = [];
  }
  
  /**
   * Lấy nội dung HTML của trang
   */
  async getContent() {
    return `
      <div class="classes-page">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Quản lý lớp học</h1>
            <p class="page-subtitle">Theo dõi và quản lý các lớp học và học sinh</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline" onclick="window.currentPage.refreshClasses()">
              <i class="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>
        
        <!-- Stats Overview -->
        <div class="devices-stats">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="fas fa-school"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalClasses">-</h3>
              <p>Tổng số lớp</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon online">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h3 id="totalStudents">-</h3>
              <p>Tổng học sinh</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon online">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-content">
              <h3 id="presentToday">-</h3>
              <p>Có mặt hôm nay</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon warning">
              <i class="fas fa-user-times"></i>
            </div>
            <div class="stat-content">
              <h3 id="absentToday">-</h3>
              <p>Vắng mặt hôm nay</p>
            </div>
          </div>
        </div>
        
        <!-- Filters and Search -->
        <div class="devices-filters">
          <div class="filter-group">
            <label>Lọc theo lớp:</label>
            <div class="filter-buttons" id="classFilterButtons">
              <button class="filter-btn active" data-filter="all">Tất cả</button>
            </div>
          </div>
          
          <div class="search-group">
            <div class="input-group">
              <i class="fas fa-search"></i>
              <input type="text" id="studentSearch" placeholder="Tìm kiếm học sinh..." />
            </div>
          </div>
        </div>
        
        <!-- Classes Grid -->
        <div class="classes-grid" id="classesGrid">
          <!-- Classes will be populated here -->
        </div>
        
        <!-- Student Detail Modal -->
        <div id="studentModal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Chi tiết học sinh</h3>
              <span class="close" onclick="window.currentPage.closeModal()">&times;</span>
            </div>
            <div class="modal-body" id="studentModalBody">
              <!-- Student details will be populated here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup page events
   */
  async setupEvents() {
    await this.loadClassesData();
    this.setupFilters();
    this.setupSearch();
  }

  /**
   * Load classes and students data
   */
  async loadClassesData() {
    try {
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

      // Load students data
      this.students = await window.firebaseService.getStudents();
      
      // Load attendance data for today
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await window.firebaseService.getAttendanceByDate(today);
      
      // Group students by class
      this.groupStudentsByClass(attendanceData);
      
      this.updateStats();
      this.renderClasses();
      this.updateFilterButtons();
      
    } catch (error) {
      console.error('Error loading classes data:', error);
      this.students = [];
      this.classes = [];
      this.updateStats();
      this.renderClasses();
    }
  }

  /**
   * Group students by class
   */
  groupStudentsByClass(attendanceData) {
    const classMap = new Map();
    
    this.students.forEach(student => {
      const className = student.class;
      if (!classMap.has(className)) {
        classMap.set(className, {
          name: className,
          students: [],
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0
        });
      }
      
      const attendance = attendanceData.find(a => a.studentId === student.id);
      const attendanceStatus = attendance ? attendance.status : 'absent';
      
      const studentWithAttendance = {
        ...student,
        attendanceStatus,
        arrivalTime: attendance ? attendance.arrivalTime : null,
        attendanceTimestamp: attendance ? attendance.timestamp : null
      };
      
      const classData = classMap.get(className);
      classData.students.push(studentWithAttendance);
      classData.totalStudents++;
      
      if (attendanceStatus === 'present') {
        classData.presentToday++;
      } else if (attendanceStatus === 'late') {
        classData.lateToday++;
      } else {
        classData.absentToday++;
      }
    });
    
    this.classes = Array.from(classMap.values());
  }

  /**
   * Update statistics
   */
  updateStats() {
    const totalClasses = this.classes.length;
    const totalStudents = this.students.length;
    const presentToday = this.classes.reduce((sum, cls) => sum + cls.presentToday + cls.lateToday, 0);
    const absentToday = this.classes.reduce((sum, cls) => sum + cls.absentToday, 0);

    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('presentToday').textContent = presentToday;
    document.getElementById('absentToday').textContent = absentToday;
  }

  /**
   * Update filter buttons
   */
  updateFilterButtons() {
    const container = document.getElementById('classFilterButtons');
    const buttons = ['<button class="filter-btn active" data-filter="all">Tất cả</button>'];
    
    this.classes.forEach(cls => {
      buttons.push(`<button class="filter-btn" data-filter="${cls.name}">${cls.name}</button>`);
    });
    
    container.innerHTML = buttons.join('');
    this.setupFilters();
  }

  /**
   * Render classes grid
   */
  renderClasses() {
    const container = document.getElementById('classesGrid');
    if (!container) return;

    const filteredClasses = this.getFilteredClasses();

    if (filteredClasses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-school"></i>
          <h3>Không có lớp học nào</h3>
          <p>Chưa có dữ liệu lớp học trong hệ thống</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredClasses.map(classData => `
      <div class="class-card">
        <div class="class-header">
          <h3>${classData.name}</h3>
          <div class="class-stats">
            <span class="stat-badge present">${classData.presentToday + classData.lateToday}/${classData.totalStudents}</span>
          </div>
        </div>
        
        <div class="class-summary">
          <div class="summary-item">
            <i class="fas fa-users"></i>
            <span>Tổng: ${classData.totalStudents}</span>
          </div>
          <div class="summary-item present">
            <i class="fas fa-user-check"></i>
            <span>Có mặt: ${classData.presentToday}</span>
          </div>
          <div class="summary-item late">
            <i class="fas fa-clock"></i>
            <span>Trễ: ${classData.lateToday}</span>
          </div>
          <div class="summary-item absent">
            <i class="fas fa-user-times"></i>
            <span>Vắng: ${classData.absentToday}</span>
          </div>
        </div>
        
        <div class="students-list">
          ${classData.students.slice(0, 5).map(student => `
            <div class="student-item ${student.attendanceStatus}" onclick="window.currentPage.showStudentDetail('${student.id}')">
              <div class="student-info">
                <span class="student-name">${student.name}</span>
                <span class="student-id">${student.id}</span>
              </div>
              <div class="attendance-status">
                <i class="fas fa-circle"></i>
                ${this.getStatusText(student.attendanceStatus)}
              </div>
            </div>
          `).join('')}
          ${classData.students.length > 5 ? `
            <div class="more-students">
              <span>+${classData.students.length - 5} học sinh khác</span>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Get filtered classes
   */
  getFilteredClasses() {
    let filtered = this.classes;

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(cls => cls.name === this.currentFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.map(cls => ({
        ...cls,
        students: cls.students.filter(student => 
          student.name.toLowerCase().includes(query) ||
          student.id.toLowerCase().includes(query)
        )
      })).filter(cls => cls.students.length > 0);
    }

    return filtered;
  }

  /**
   * Setup filter buttons
   */
  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      this.addEventListenerTracked(btn, 'click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderClasses();
      });
    });
  }

  /**
   * Setup search functionality
   */
  setupSearch() {
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
      this.addEventListenerTracked(searchInput, 'input', (e) => {
        this.searchQuery = e.target.value;
        this.renderClasses();
      });
    }
  }

  /**
   * Show student detail modal
   */
  showStudentDetail(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    const modal = document.getElementById('studentModal');
    const modalBody = document.getElementById('studentModalBody');
    
    modalBody.innerHTML = `
      <div class="student-detail">
        <div class="detail-header">
          <div class="attendance-status ${student.attendanceStatus || 'absent'}">
            <i class="fas fa-circle"></i>
            ${this.getStatusText(student.attendanceStatus || 'absent')}
          </div>
          <h4>${student.name}</h4>
        </div>
        
        <div class="detail-content">
          <div class="detail-row">
            <label>Mã học sinh:</label>
            <span>${student.id}</span>
          </div>
          <div class="detail-row">
            <label>Lớp:</label>
            <span>${student.class}</span>
          </div>
          <div class="detail-row">
            <label>Mã barcode:</label>
            <span>${student.barcode}</span>
          </div>
          <div class="detail-row">
            <label>Trạng thái hôm nay:</label>
            <span class="${student.attendanceStatus || 'absent'}">${this.getStatusText(student.attendanceStatus || 'absent')}</span>
          </div>
          ${student.arrivalTime ? `
            <div class="detail-row">
              <label>Thời gian đến:</label>
              <span>${student.arrivalTime}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <label>Ngày tạo:</label>
            <span>${new Date(student.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'block';
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('studentModal');
    modal.style.display = 'none';
  }

  /**
   * Get status text
   */
  getStatusText(status) {
    const statusMap = {
      present: 'Có mặt',
      late: 'Đi trễ',
      absent: 'Vắng mặt'
    };
    return statusMap[status] || 'Chưa xác định';
  }

  /**
   * Refresh classes data
   */
  async refreshClasses() {
    if (window.ToastManager) {
      window.ToastManager.info('🔄 Đang cập nhật dữ liệu lớp học...');
    }
    await this.loadClassesData();
    if (window.ToastManager) {
      window.ToastManager.success('✅ Đã cập nhật dữ liệu lớp học!');
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    super.cleanup();
    this.closeModal();
  }
}

window.ClassesPage = ClassesPage;