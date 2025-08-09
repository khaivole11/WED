/**
 * Toast Manager - Quản lý thông báo toast
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.createContainer();
  }
  
  /**
   * Tạo container cho toasts
   */
  createContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }
  
  /**
   * Hiển thị toast
   * @param {string} message - Nội dung thông báo
   * @param {string} type - Loại toast (success, error, warning, info)
   * @param {Object} options - Tùy chọn bổ sung
   */
  show(message, type = 'info', options = {}) {
    const {
      description = '',
      duration = 5000,
      closable = true,
      onClick = null
    } = options;
    
    const toast = this.createToast(message, type, description, closable, onClick);
    this.container.appendChild(toast);
    
    // Show animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Auto remove
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast-progress');
      if (progressBar) {
        progressBar.style.transition = `transform ${duration}ms linear`;
        progressBar.style.transform = 'scaleX(0)';
      }
      
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    // Track toast
    const toastId = Date.now() + Math.random();
    this.toasts.push({ id: toastId, element: toast });
    
    return toastId;
  }
  
  /**
   * Tạo element toast
   * @param {string} message 
   * @param {string} type 
   * @param {string} description 
   * @param {boolean} closable 
   * @param {Function} onClick 
   * @returns {Element}
   */
  createToast(message, type, description, closable, onClick) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.position = 'relative';
    toast.style.overflow = 'hidden';
    
    const iconMap = {
      success: 'fas fa-check',
      error: 'fas fa-times',
      warning: 'fas fa-exclamation',
      info: 'fas fa-info'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${iconMap[type] || iconMap.info}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
        ${description ? `<div class="toast-description">${description}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close"><i class="fas fa-times"></i></button>' : ''}
      <div class="toast-progress"></div>
    `;
    
    // Add click handler
    if (onClick) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', (e) => {
        if (!e.target.closest('.toast-close')) {
          onClick();
        }
      });
    }
    
    // Add close handler
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        this.remove(toast);
      });
    }
    
    return toast;
  }
  
  /**
   * Xóa toast
   * @param {Element} toast 
   */
  remove(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Remove from tracking
      this.toasts = this.toasts.filter(t => t.element !== toast);
    }, 300);
  }
  
  /**
   * Xóa toast theo ID
   * @param {number} toastId 
   */
  removeById(toastId) {
    const toast = this.toasts.find(t => t.id === toastId);
    if (toast) {
      this.remove(toast.element);
    }
  }
  
  /**
   * Xóa tất cả toasts
   */
  clear() {
    this.toasts.forEach(toast => {
      this.remove(toast.element);
    });
  }
  
  /**
   * Hiển thị toast thành công
   * @param {string} message 
   * @param {Object} options 
   */
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }
  
  /**
   * Hiển thị toast lỗi
   * @param {string} message 
   * @param {Object} options 
   */
  error(message, options = {}) {
    return this.show(message, 'error', options);
  }
  
  /**
   * Hiển thị toast cảnh báo
   * @param {string} message 
   * @param {Object} options 
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }
  
  /**
   * Hiển thị toast thông tin
   * @param {string} message 
   * @param {Object} options 
   */
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
}

// Create global instance
window.ToastManager = new ToastManager();
