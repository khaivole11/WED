/**
 * Router Class - Quản lý routing và navigation trong SPA
 */
class Router {
  constructor() {
    this.routes = new Map();
    this.currentPage = null;
    this.pageContainer = document.getElementById('pageContainer');
    
    // Bind methods
    this.handlePopState = this.handlePopState.bind(this);
    
    // Khởi tạo router
    this.init();
  }
  
  /**
   * Khởi tạo router
   */
  init() {
    window.addEventListener('popstate', this.handlePopState);
    
    // Không xử lý route đầu tiên ở đây nữa
    // Route sẽ được xử lý sau khi đăng ký trong App.init()
  }
  
  /**
   * Đăng ký route mới
   * @param {string} path - Đường dẫn route (VD: '#login', '#dashboard')
   * @param {Object} pageConfig - Cấu hình trang {component, title, auth}
   */
  register(path, pageConfig) {
    this.routes.set(path, pageConfig);
  }
  
  /**
   * Điều hướng đến route
   * @param {string} path - Đường dẫn cần điều hướng
   * @param {boolean} replace - Thay thế history thay vì push
   */
  navigate(path, replace = false) {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    
    this.handleRoute(path);
  }
  
  /**
   * Xử lý route hiện tại
   * @param {string} path - Đường dẫn cần xử lý
   */
  async handleRoute(path) {
    const route = this.routes.get(path);
    
    if (!route) {
      console.warn(`Route not found: ${path}`);
      return this.navigate('#404', true);
    }
    
    // Kiểm tra authentication nếu cần
    if (route.auth && !AuthService.isAuthenticated()) {
      return this.navigate('#login', true);
    }
    
    // Ẩn trang hiện tại
    if (this.currentPage) {
      await this.currentPage.hide();
    }
    
    // Cập nhật title
    if (route.title) {
      document.title = `IoT Dashboard - ${route.title}`;
    }
    
    // Khởi tạo và hiển thị trang mới
    try {
      const pageInstance = new route.component();
      await pageInstance.render();
      await pageInstance.show();
      
      this.currentPage = pageInstance;
      
      // Cập nhật navbar active state
      this.updateNavbar(path);
      
    } catch (error) {
      console.error('Error loading page:', error);
      this.navigate('#error', true);
    }
  }
  
  /**
   * Xử lý sự kiện popstate (nút back/forward)
   */
  handlePopState() {
    this.handleRoute(window.location.hash || '#login');
  }
  
  /**
   * Cập nhật trạng thái active của navbar
   * @param {string} currentPath - Route hiện tại
   */
  updateNavbar(currentPath) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }
  
  /**
   * Lấy tham số từ hash
   * @param {string} param - Tên tham số
   * @returns {string|null} Giá trị tham số
   */
  getParam(param) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlParams.get(param);
  }
  
  /**
   * Thiết lập tham số cho hash
   * @param {Object} params - Object chứa các tham số
   */
  setParams(params) {
    const currentPath = window.location.hash.split('?')[0];
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlParams.set(key, value);
      }
    });
    
    const queryString = urlParams.toString();
    const newPath = queryString ? `${currentPath}?${queryString}` : currentPath;
    
    this.navigate(newPath, true);
  }
}

// Export cho sử dụng global
window.Router = Router;
