/**
 * Base Page Class - Lớp cơ sở cho tất cả các trang
 */
class BasePage {
  constructor() {
    this.container = document.getElementById('pageContainer');
    this.isVisible = false;
    this.eventListeners = [];
  }
  
  /**
   * Render nội dung trang
   * @returns {Promise<void>}
   */
  async render() {
    const content = await this.getContent();
    this.container.innerHTML = content;
    
    // Setup sự kiện sau khi render
    await this.setupEvents();
  }
  
  /**
   * Lấy nội dung HTML của trang (phải được override)
   * @returns {Promise<string>}
   */
  async getContent() {
    throw new Error('getContent method must be implemented');
  }
  
  /**
   * Setup các sự kiện của trang
   * @returns {Promise<void>}
   */
  async setupEvents() {
    // Override trong subclass nếu cần
  }
  
  /**
   * Hiển thị trang với animation
   * @returns {Promise<void>}
   */
  async show() {
    this.container.style.display = 'block';
    this.container.classList.add('page-enter');
    
    // Trigger animation
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        this.container.classList.add('page-enter-active');
        setTimeout(resolve, 300);
      });
    });
    
    this.isVisible = true;
  }
  
  /**
   * Ẩn trang với animation
   * @returns {Promise<void>}
   */
  async hide() {
    if (!this.isVisible) return;
    
    this.container.classList.add('page-leave');
    
    await new Promise(resolve => {
      setTimeout(() => {
        this.container.classList.remove('page-enter', 'page-enter-active', 'page-leave');
        this.container.style.display = 'none';
        resolve();
      }, 200);
    });
    
    // Cleanup events
    this.cleanup();
    this.isVisible = false;
  }
  
  /**
   * Cleanup các sự kiện và resources
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
  
  /**
   * Thêm event listener và track để cleanup sau
   * @param {Element} element - Element để thêm event
   * @param {string} event - Tên sự kiện
   * @param {Function} handler - Handler function
   */
  addEventListenerTracked(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
  
  /**
   * Hiển thị loading state
   * @param {string} message - Thông điệp loading
   */
  showLoading(message = 'Loading...') {
    const loadingHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    this.container.innerHTML = loadingHTML;
  }
  
  /**
   * Hiển thị thông báo lỗi
   * @param {string} message - Thông điệp lỗi
   * @param {Function} retryCallback - Callback khi nhấn retry
   */
  showError(message = 'An error occurred', retryCallback = null) {
    const retryButton = retryCallback ? 
      `<button class="btn btn-primary" onclick="(${retryCallback.toString()})()">Retry</button>` : '';
    
    const errorHTML = `
      <div class="error-container">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="error-title">Oops! Something went wrong</h3>
        <p class="error-message">${message}</p>
        ${retryButton}
      </div>
    `;
    this.container.innerHTML = errorHTML;
  }
  
  /**
   * Tạo element với class và nội dung
   * @param {string} tag - Tag name
   * @param {string|Array} className - Class name(s)
   * @param {string} content - Nội dung HTML
   * @returns {Element}
   */
  createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    
    if (className) {
      if (Array.isArray(className)) {
        element.classList.add(...className);
      } else {
        element.className = className;
      }
    }
    
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  }
  
  /**
   * Validate form data
   * @param {Object} data - Form data để validate
   * @param {Object} rules - Validation rules
   * @returns {Object} {isValid: boolean, errors: Object}
   */
  validateForm(data, rules) {
    const errors = {};
    let isValid = true;
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      
      // Required validation
      if (rule.required && (!value || value.trim() === '')) {
        errors[field] = `${rule.label || field} is required`;
        isValid = false;
        return;
      }
      
      // Skip other validations if field is empty and not required
      if (!value || value.trim() === '') return;
      
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
        isValid = false;
      }
      
      // Email validation
      if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field] = `${rule.label || field} must be a valid email`;
        isValid = false;
      }
      
      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors[field] = rule.message || `${rule.label || field} is invalid`;
        isValid = false;
      }
    });
    
    return { isValid, errors };
  }
  
  /**
   * Hiển thị form errors
   * @param {Object} errors - Object chứa errors
   */
  showFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    // Show new errors
    Object.entries(errors).forEach(([field, message]) => {
      const input = document.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
      }
    });
  }
  
  /**
   * Clear form errors
   */
  clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  }
}

// Export cho sử dụng global
window.BasePage = BasePage;
