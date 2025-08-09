/**
 * Main Application Entry Point
 * Khởi tạo và cấu hình ứng dụng
 */

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Kiểm tra các dependencies
    checkDependencies();
    
    // Khởi tạo Toast Manager
    window.toastManager = new ToastManager();
    
    // Khởi tạo Firebase Service
    window.firebaseService = new FirebaseService();
    await window.firebaseService.initialize();
    
    // Khởi tạo MQTT Service
    window.mqttService = new MqttService();
    
    // Khởi tạo Router
    window.router = new Router();
    
    // Đăng ký các routes
    registerRoutes();
    
    // Xử lý route đầu tiên
    const initialRoute = window.location.hash || '#dashboard';
    window.router.handleRoute(initialRoute);
    
    // Setup navbar
    setupNavbar();
    
    // Force show navbar
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.classList.add('show');
      updateUserInfo({
        name: 'Admin User',
        role: 'Administrator',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=007bff&color=fff'
      });
    }
    
    // Hiển thị thông báo chào mừng
    window.toastManager.show('Hệ thống IoT đã sẵn sàng!', 'success');
    
  } catch (error) {
    console.error('❌ Lỗi khởi tạo ứng dụng:', error);
    
    // Hiển thị lỗi cho người dùng
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; left: 20px; right: 20px;
      background: #ff4444; color: white; padding: 20px;
      border-radius: 8px; z-index: 10000;
      font-family: monospace; font-size: 14px;
    `;
    errorDiv.textContent = `INITIALIZATION ERROR: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
});

// Kiểm tra dependencies
function checkDependencies() {
  const dependencies = [
    'ToastManager', 'Router', 'BasePage', 'FirebaseService', 'MqttService',
    'DashboardPage', 'AttendanceStatsPage', 'ClassesPage', 'DeviceControlPage'
  ];
  
  const missing = dependencies.filter(dep => typeof window[dep] === 'undefined');
  
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing.join(', ')}`);
  }
}

// Đăng ký routes
function registerRoutes() {
  // Dashboard page (default)
  window.router.register('#dashboard', {
    component: DashboardPage,
    title: 'Tổng quan',
    auth: false
  });
  
  // Default route
  window.router.register('', {
    component: DashboardPage,
    title: 'Tổng quan',
    auth: false
  });
  
  // Attendance Statistics page
  window.router.register('#attendance-stats', {
    component: AttendanceStatsPage,
    title: 'Thống kê điểm danh',
    auth: false
  });
  
  // Devices page (renamed to Classes)
  window.router.register('#devices', {
    component: ClassesPage,
    title: 'Lớp học',
    auth: false
  });
  
  // Device Control page
  window.router.register('#device-control', {
    component: DeviceControlPage,
    title: 'Điều khiển thiết bị',
    auth: false
  });
  
  // 404 page
  window.router.register('#404', {
    component: class extends BasePage {
      async getContent() {
        return `
          <div style="text-align: center; padding: 100px 20px;">
            <h1 style="font-size: 4rem; color: #e74c3c;">404</h1>
            <h2>Trang không tìm thấy</h2>
            <p>Trang bạn đang tìm kiếm không tồn tại.</p>
            <button class="btn btn-primary" onclick="window.router.navigate('#dashboard')">Về Dashboard</button>
          </div>
        `;
      }
    },
    title: '404 - Not Found',
    auth: false
  });
}

// Setup navbar
function setupNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  
  // Mobile nav toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navbar.classList.toggle('mobile-open');
    });
  }
}

// Update user info
function updateUserInfo(user) {
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userName) userName.textContent = user.name;
  if (userRole) userRole.textContent = user.role;
  if (userAvatar) userAvatar.src = user.avatar;
}
