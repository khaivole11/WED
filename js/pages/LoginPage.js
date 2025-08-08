/**
 * Login Page - Trang đăng nhập/đăng ký
 */
class LoginPage extends BasePage {
  constructor() {
    super();
    this.isLoginMode = true;
  }
  
  /**
   * Lấy nội dung HTML của trang
   * @returns {Promise<string>}
   */
  async getContent() {
    return `
      <div class="auth-page">
        <!-- Background animations -->
        <div class="auth-background">
          <div class="floating-icon"><i class="fas fa-wifi"></i></div>
          <div class="floating-icon"><i class="fas fa-microchip"></i></div>
          <div class="floating-icon"><i class="fas fa-satellite-dish"></i></div>
          <div class="floating-icon"><i class="fas fa-network-wired"></i></div>
          <div class="floating-icon"><i class="fas fa-server"></i></div>
        </div>
        
        <div class="auth-container">
          <div class="auth-card">
            <!-- Header -->
            <div class="auth-header">
              <h1><i class="fas fa-cube"></i> IoT Dashboard</h1>
              <p>Quản lý và giám sát hệ thống IoT thông minh</p>
            </div>
            
            <!-- Form Container -->
            <div class="auth-form" id="authForm">
              ${this.getLoginForm()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Lấy form đăng nhập
   * @returns {string}
   */
  getLoginForm() {
    return `
      <h2>Đăng nhập</h2>
      <p class="form-subtitle">Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.</p>
      
      <form id="loginForm" novalidate>
        <div class="input-group">
          <i class="fas fa-envelope"></i>
          <input type="email" name="email" placeholder="Email address" required>
        </div>
        
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input type="password" name="password" placeholder="Password" required>
          <button type="button" class="password-toggle" data-target="password">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" name="remember">
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a href="#" class="forgot-password">Quên mật khẩu?</a>
        </div>
        
        <button type="submit" class="btn btn-primary auth-btn">
          <span class="btn-text">Đăng nhập</span>
          <span class="btn-loading" style="display: none;">
            <i class="fas fa-spinner fa-spin"></i> Đang xử lý...
          </span>
        </button>
      </form>
      
      <div class="auth-divider">
        <span>hoặc</span>
      </div>
      
      <div class="social-login">
        <button class="social-btn" data-provider="google">
          <i class="fab fa-google"></i>
          Đăng nhập với Google
        </button>
        <button class="social-btn" data-provider="github">
          <i class="fab fa-github"></i>
          Đăng nhập với GitHub
        </button>
      </div>
      
      <div class="auth-switch">
        Chưa có tài khoản? <a href="#" id="switchToRegister">Đăng ký ngay</a>
      </div>
      
      <!-- Demo accounts info -->
      <div class="demo-accounts" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px;">
        <strong>Demo Accounts:</strong><br>
        Admin: admin@iot.com / admin123<br>
        User: user@iot.com / user123
      </div>
    `;
  }
  
  /**
   * Lấy form đăng ký
   * @returns {string}
   */
  getRegisterForm() {
    return `
      <h2>Đăng ký</h2>
      <p class="form-subtitle">Tạo tài khoản mới để bắt đầu sử dụng IoT Dashboard.</p>
      
      <form id="registerForm" novalidate>
        <div class="input-row">
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" name="firstName" placeholder="Họ" required>
          </div>
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" name="lastName" placeholder="Tên" required>
          </div>
        </div>
        
        <div class="input-group">
          <i class="fas fa-envelope"></i>
          <input type="email" name="email" placeholder="Email address" required>
        </div>
        
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input type="password" name="password" placeholder="Mật khẩu" required>
          <button type="button" class="password-toggle" data-target="password">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        <div class="password-strength" id="passwordStrength" style="display: none;">
          <div class="strength-bar">
            <div class="strength-fill" id="strengthFill"></div>
          </div>
          <p class="strength-text" id="strengthText">Nhập mật khẩu để kiểm tra độ mạnh</p>
        </div>
        
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu" required>
          <button type="button" class="password-toggle" data-target="confirmPassword">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        
        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" name="terms" required>
            <span>Tôi đồng ý với <a href="#" target="_blank">Điều khoản sử dụng</a></span>
          </label>
        </div>
        
        <button type="submit" class="btn btn-primary auth-btn">
          <span class="btn-text">Đăng ký</span>
          <span class="btn-loading" style="display: none;">
            <i class="fas fa-spinner fa-spin"></i> Đang xử lý...
          </span>
        </button>
      </form>
      
      <div class="auth-divider">
        <span>hoặc</span>
      </div>
      
      <div class="social-login">
        <button class="social-btn" data-provider="google">
          <i class="fab fa-google"></i>
          Đăng ký với Google
        </button>
        <button class="social-btn" data-provider="github">
          <i class="fab fa-github"></i>
          Đăng ký với GitHub
        </button>
      </div>
      
      <div class="auth-switch">
        Đã có tài khoản? <a href="#" id="switchToLogin">Đăng nhập</a>
      </div>
    `;
  }
  
  /**
   * Setup các sự kiện của trang
   */
  async setupEvents() {
    const authForm = document.getElementById('authForm');
    
    // Form switch events
    this.addEventListenerTracked(authForm, 'click', (e) => {
      if (e.target.id === 'switchToRegister') {
        e.preventDefault();
        this.switchToRegister();
      } else if (e.target.id === 'switchToLogin') {
        e.preventDefault();
        this.switchToLogin();
      }
    });
    
    // Password toggle events
    this.addEventListenerTracked(authForm, 'click', (e) => {
      if (e.target.closest('.password-toggle')) {
        e.preventDefault();
        this.togglePassword(e.target.closest('.password-toggle'));
      }
    });
    
    // Form submit events
    this.addEventListenerTracked(authForm, 'submit', (e) => {
      e.preventDefault();
      
      if (e.target.id === 'loginForm') {
        this.handleLogin(e.target);
      } else if (e.target.id === 'registerForm') {
        this.handleRegister(e.target);
      }
    });
    
    // Social login events
    this.addEventListenerTracked(authForm, 'click', (e) => {
      if (e.target.closest('.social-btn')) {
        e.preventDefault();
        const provider = e.target.closest('.social-btn').dataset.provider;
        this.handleSocialLogin(provider);
      }
    });
    
    // Password strength checker (only for register form)
    if (!this.isLoginMode) {
      this.setupPasswordStrength();
    }
  }
  
  /**
   * Chuyển sang form đăng ký
   */
  switchToRegister() {
    this.isLoginMode = false;
    const authForm = document.getElementById('authForm');
    authForm.innerHTML = this.getRegisterForm();
    this.setupPasswordStrength();
  }
  
  /**
   * Chuyển sang form đăng nhập
   */
  switchToLogin() {
    this.isLoginMode = true;
    const authForm = document.getElementById('authForm');
    authForm.innerHTML = this.getLoginForm();
  }
  
  /**
   * Toggle hiển thị mật khẩu
   * @param {Element} button - Nút toggle
   */
  togglePassword(button) {
    const targetName = button.dataset.target;
    const input = document.querySelector(`input[name="${targetName}"]`);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }
  
  /**
   * Setup password strength checker
   */
  setupPasswordStrength() {
    const passwordInput = document.querySelector('input[name="password"]');
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthContainer) return;
    
    this.addEventListenerTracked(passwordInput, 'input', (e) => {
      const password = e.target.value;
      
      if (password.length === 0) {
        strengthContainer.style.display = 'none';
        return;
      }
      
      strengthContainer.style.display = 'block';
      const strength = this.calculatePasswordStrength(password);
      
      strengthFill.className = `strength-fill ${strength.class}`;
      strengthText.textContent = strength.text;
    });
  }
  
  /**
   * Tính toán độ mạnh mật khẩu
   * @param {string} password 
   * @returns {Object}
   */
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 2;
    else if (password.length >= 6) score += 1;
    
    // Lowercase
    if (/[a-z]/.test(password)) score += 1;
    
    // Uppercase
    if (/[A-Z]/.test(password)) score += 1;
    
    // Numbers
    if (/\d/.test(password)) score += 1;
    
    // Special characters
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score < 3) return { class: 'weak', text: 'Mật khẩu yếu' };
    if (score < 4) return { class: 'fair', text: 'Mật khẩu trung bình' };
    if (score < 6) return { class: 'good', text: 'Mật khẩu tốt' };
    return { class: 'strong', text: 'Mật khẩu mạnh' };
  }
  
  /**
   * Xử lý đăng nhập
   * @param {HTMLFormElement} form 
   */
  async handleLogin(form) {
    this.clearFormErrors();
    
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      remember: formData.get('remember')
    };
    
    // Validate
    const validation = this.validateForm(data, {
      email: { required: true, email: true, label: 'Email' },
      password: { required: true, label: 'Mật khẩu' }
    });
    
    if (!validation.isValid) {
      this.showFormErrors(validation.errors);
      return;
    }
    
    // Show loading
    this.toggleFormLoading(form, true);
    
    try {
      const user = await AuthService.login(data.email, data.password);
      
      // Success
      ToastManager.show('Đăng nhập thành công!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.router.navigate('#dashboard');
      }, 1000);
      
    } catch (error) {
      this.toggleFormLoading(form, false);
      ToastManager.show(error.message, 'error');
    }
  }
  
  /**
   * Xử lý đăng ký
   * @param {HTMLFormElement} form 
   */
  async handleRegister(form) {
    this.clearFormErrors();
    
    const formData = new FormData(form);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      terms: formData.get('terms')
    };
    
    // Validate
    const validation = this.validateForm(data, {
      firstName: { required: true, label: 'Họ' },
      lastName: { required: true, label: 'Tên' },
      email: { required: true, email: true, label: 'Email' },
      password: { required: true, minLength: 6, label: 'Mật khẩu' },
      confirmPassword: {
        required: true,
        label: 'Xác nhận mật khẩu',
        custom: (value) => value === data.password,
        message: 'Mật khẩu xác nhận không khớp'
      },
      terms: {
        required: true,
        label: 'Điều khoản',
        custom: (value) => !!value,
        message: 'Bạn phải đồng ý với điều khoản sử dụng'
      }
    });
    
    if (!validation.isValid) {
      this.showFormErrors(validation.errors);
      return;
    }
    
    // Show loading
    this.toggleFormLoading(form, true);
    
    try {
      const user = await AuthService.register(data);
      
      // Success
      ToastManager.show('Đăng ký thành công!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.router.navigate('#dashboard');
      }, 1000);
      
    } catch (error) {
      this.toggleFormLoading(form, false);
      ToastManager.show(error.message, 'error');
    }
  }
  
  /**
   * Xử lý đăng nhập social
   * @param {string} provider 
   */
  async handleSocialLogin(provider) {
    ToastManager.show(`Đăng nhập với ${provider} sẽ được tích hợp sớm`, 'info');
  }
  
  /**
   * Toggle loading state của form
   * @param {HTMLFormElement} form 
   * @param {boolean} loading 
   */
  toggleFormLoading(form, loading) {
    const btn = form.querySelector('.auth-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    if (loading) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
    } else {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
}

// Export for use
window.LoginPage = LoginPage;
