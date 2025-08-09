/**
 * Firebase Service - Phiên bản đơn giản để tránh lỗi khởi tạo
 */

const firebaseConfig = {
  apiKey: "AIzaSyDjoi0p_taMTI5auLanrjGywrGY4AFxp_4",
  authDomain: "iot-project-4af4e.firebaseapp.com",
  databaseURL: "https://iot-project-4af4e-default-rtdb.firebaseio.com",
  projectId: "iot-project-4af4e",
  storageBucket: "iot-project-4af4e.firebasestorage.app",
  messagingSenderId: "557777574521",
  appId: "1:557777574521:web:c1346370dc4bffcdc3d2a8",
  measurementId: "G-8K2M01GM20"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.database = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Firebase
   */
  async initialize() {
    try {
      // Kiểm tra Firebase đã load chưa
      if (typeof firebase === 'undefined') {
        this.isInitialized = false;
        return;
      }
      
      // Khởi tạo Firebase
      this.app = firebase.initializeApp(firebaseConfig);
      this.database = firebase.database();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this.isInitialized && this.database;
  }

  /**
   * Lấy dữ liệu học sinh
   */
  async getStudents() {
    if (!this.isConnected()) {
      return [];
    }

    try {
      const snapshot = await this.database.ref('students').once('value');
      const data = snapshot.val();
      return data ? Object.values(data) : [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  /**
   * Lấy dữ liệu điểm danh
   */
  async getAttendanceByDate(date) {
    if (!this.isConnected()) {
      return [];
    }

    try {
      const snapshot = await this.database.ref(`attendance/${date}`).once('value');
      const data = snapshot.val();
      return data ? Object.values(data) : [];
    } catch (error) {
      console.error('Error getting attendance:', error);
      return [];
    }
  }

  /**
   * Lưu dữ liệu sensor
   */
  async saveSensorData(data) {
    if (!this.isConnected()) {
      return;
    }

    try {
      await this.database.ref('latest_data').set({
        ...data,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }

  /**
   * Lấy dữ liệu sensor mới nhất
   */
  async getLatestSensorData() {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const snapshot = await this.database.ref('latest_data').once('value');
      return snapshot.val() || null;
    } catch (error) {
      console.error('Error getting sensor data:', error);
      return null;
    }
  }

  /**
   * Sync dữ liệu CSV với Firebase
   */
  async syncCSVWithFirebase() {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const csvData = await this.readCSVFile('data.csv');
      
      for (const student of csvData) {
        await this.database.ref(`students/${student.id}`).set({
          ...student,
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
          status: 'active'
        });
      }

      return true;
    } catch (error) {
      console.error('Error syncing CSV:', error);
      return false;
    }
  }

  /**
   * Xóa toàn bộ dữ liệu Firebase
   */
  async clearAllData() {
    if (!this.isConnected()) {
      return;
    }

    try {
      await this.database.ref('students').remove();
      await this.database.ref('attendance').remove();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Đọc file CSV
   */
  async readCSVFile(filename) {
    try {
      const response = await fetch(filename);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error reading CSV:', error);
      return [];
    }
  }

  /**
   * Parse CSV text
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj;
    }).filter(obj => obj.id); // Lọc bỏ dòng trống
  }
}

// Export class
window.FirebaseService = FirebaseService;
