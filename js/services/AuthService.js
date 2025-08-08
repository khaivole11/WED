/**
 * Authentication Service - Quản lý xác thực người dùng
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    
    // Khôi phục session từ localStorage
    this.restoreSession();
  }
  
  /**
   * Đăng nhập người dùng
   * @param {string} email - Email đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} User object hoặc error
   */
  async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Simulate API call
      await this.delay(1000);
      
      // Mock authentication logic
      const users = this.getMockUsers();
      const user = users.find(u => u.email === email);
      
      if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
      }
      
      // Create session
      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        loginTime: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };
      
      // Store session
      localStorage.setItem('userSession', JSON.stringify(sessionData));
      this.currentUser = sessionData;
      
      // Notify listeners
      this.notifyListeners('login', sessionData);
      
      return sessionData;
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Đăng ký người dùng mới
   * @param {Object} userData - Thông tin người dùng
   * @returns {Promise<Object>} User object hoặc error
   */
  async register(userData) {
    try {
      const { email, password, firstName, lastName, confirmPassword } = userData;
      
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        throw new Error('All fields are required');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Check if email exists
      const users = this.getMockUsers();
      if (users.find(u => u.email === email)) {
        throw new Error('Email already exists');
      }
      
      // Simulate API call
      await this.delay(1500);
      
      // Create new user
      const newUser = {
        id: this.generateUserId(),
        email,
        password, // In real app, this would be hashed
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: 'user',
        avatar: this.generateAvatar(firstName, lastName),
        createdAt: new Date().toISOString()
      };
      
      // Save user (in real app, this would be sent to server)
      users.push(newUser);
      localStorage.setItem('mockUsers', JSON.stringify(users));
      
      // Auto login after registration
      return await this.login(email, password);
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Đăng xuất người dùng
   */
  logout() {
    // Clear session
    localStorage.removeItem('userSession');
    this.currentUser = null;
    
    // Notify listeners
    this.notifyListeners('logout');
    
    // Redirect to login
    if (window.router) {
      window.router.navigate('#login');
    }
  }
  
  /**
   * Kiểm tra trạng thái đăng nhập
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.currentUser;
  }
  
  /**
   * Lấy thông tin user hiện tại
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Khôi phục session từ localStorage
   */
  restoreSession() {
    try {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        this.currentUser = JSON.parse(sessionData);
        
        // Check if session is expired (24 hours)
        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          this.logout();
          return;
        }
        
        // Notify listeners
        this.notifyListeners('sessionRestored', this.currentUser);
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      localStorage.removeItem('userSession');
    }
  }
  
  /**
   * Thêm listener cho auth events
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  /**
   * Xóa listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Thông báo cho tất cả listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
  
  /**
   * Cập nhật thông tin user
   * @param {Object} updates - Thông tin cần cập nhật
   */
  updateUser(updates) {
    if (!this.currentUser) return;
    
    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('userSession', JSON.stringify(this.currentUser));
    
    this.notifyListeners('userUpdated', this.currentUser);
  }
  
  /**
   * Đổi mật khẩu
   * @param {string} currentPassword - Mật khẩu hiện tại
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<boolean>}
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Validate current password (in real app, verify with server)
      const users = this.getMockUsers();
      const user = users.find(u => u.id === this.currentUser.id);
      
      if (!user || user.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }
      
      // Simulate API call
      await this.delay(1000);
      
      // Update password
      user.password = newPassword;
      localStorage.setItem('mockUsers', JSON.stringify(users));
      
      this.notifyListeners('passwordChanged');
      return true;
      
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
  
  /**
   * Kiểm tra quyền hạn
   * @param {string} permission - Quyền cần kiểm tra
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_devices'],
      user: ['read', 'write'],
      viewer: ['read']
    };
    
    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return userPermissions.includes(permission);
  }
  
  // Utility methods
  
  /**
   * Mock users data
   * @returns {Array}
   */
  getMockUsers() {
    const stored = localStorage.getItem('mockUsers');
    if (stored) {
      return JSON.parse(stored);
    }
    
    const defaultUsers = [
      {
        id: '1',
        email: 'admin@iot.com',
        password: 'admin123',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3498db&color=fff'
      },
      {
        id: '2',
        email: 'user@iot.com',
        password: 'user123',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=27ae60&color=fff'
      }
    ];
    
    localStorage.setItem('mockUsers', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  
  /**
   * Generate session ID
   * @returns {string}
   */
  generateSessionId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
  
  /**
   * Generate user ID
   * @returns {string}
   */
  generateUserId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * Generate avatar URL
   * @param {string} firstName 
   * @param {string} lastName 
   * @returns {string}
   */
  generateAvatar(firstName, lastName) {
    const colors = ['3498db', '27ae60', 'e74c3c', 'f39c12', '9b59b6', '1abc9c'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${color}&color=fff`;
  }
  
  /**
   * Delay utility
   * @param {number} ms - Milliseconds
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create global instance
window.AuthService = new AuthService();
