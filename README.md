# IoT Attendance System - Hệ thống Điểm danh IoT

## 📋 Tổng quan

Hệ thống điểm danh IoT tích hợp với Firebase Realtime Database và MQTT để:
- Quản lý học sinh và lớp học
- Điểm danh tự động qua mã vạch
- Giám sát môi trường với cảm biến
- Điều khiển thiết bị IoT từ xa
- Thống kê và báo cáo thời gian thực

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │◄──►│ Firebase Realtime│◄──►│  ESP32 Devices  │
│   (Browser)     │    │    Database     │    │   (Hardware)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MQTT Broker    │    │   CSV Data      │    │ Barcode Scanner │
│ (HiveMQ Public) │    │   (Students)    │    │ Environmental   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Tính năng chính

### 📊 Web Dashboard
- **Tổng quan**: Thống kê điểm danh và dữ liệu sensor
- **Thống kê**: Biểu đồ và báo cáo chi tiết
- **Lớp học**: Quản lý học sinh và thông tin lớp
- **Điều khiển**: Điều khiển thiết bị IoT thời gian thực

### 🔧 ESP32 Features
- **Environment Sensor**: Nhiệt độ, độ ẩm, ánh sáng, khí gas
- **Barcode Scanner**: Quét mã vạch học sinh cho điểm danh
- **MQTT Communication**: Giao tiếp thời gian thực với web
- **Buzzer Control**: Điều khiển âm thanh từ xa

### 🗃️ Data Management
- **Firebase Integration**: Lưu trữ dữ liệu realtime
- **CSV Sync**: Đồng bộ dữ liệu từ file CSV
- **Real-time Updates**: Cập nhật tức thời qua websocket

## 📁 Cấu trúc Project

```
Wed/
├── index.html                 # Main HTML file
├── css/
│   ├── global.css            # Global styles
│   ├── components.css        # Component styles
│   └── pages.css             # Page-specific styles
├── js/
│   ├── core/
│   │   ├── Router.js         # SPA routing
│   │   └── BasePage.js       # Base page class
│   ├── services/
│   │   ├── FirebaseService.js # Firebase integration
│   │   └── MqttService.js    # MQTT client
│   ├── pages/
│   │   ├── DashboardPage.js  # Dashboard page
│   │   ├── AttendanceStatsPage.js # Statistics page
│   │   ├── DevicesPage.js    # Classes management
│   │   └── DeviceControlPage.js # Device control
│   └── utils/
│       └── ToastManager.js   # Notification system
├── esp32/
│   └── sketch.ino            # ESP32 firmware
└── data/
    └── data.csv              # Student data
```

## 🛠️ Cài đặt và Chạy

### 1. Web Application

```bash
# 1. Clone repository
git clone <repository-url>
cd Wed

# 2. Serve với HTTP server (để tránh CORS)
# Dùng Python
python -m http.server 8000

# Hoặc dùng Node.js
npx serve .

# Hoặc dùng VS Code Live Server extension

# 3. Mở trình duyệt
http://localhost:8000
```

### 2. ESP32 Setup

1. **Cài đặt Arduino IDE** và ESP32 board package
2. **Install Libraries**:
   - ArduinoJson
   - DHT sensor library  
   - PubSubClient (MQTT)
   - WiFi library

3. **Cấu hình code**:
```cpp
// WiFi settings
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase settings (optional)
#define DATABASE_URL "https://iot-project-4af4e-default-rtdb.firebaseio.com/"
```

4. **Upload code** lên ESP32

### 3. Firebase Setup

1. **Tạo Firebase Project** tại https://console.firebase.google.com
2. **Enable Realtime Database**
3. **Set Database Rules**:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. **Cập nhật Firebase config** trong `FirebaseService.js`

## 🎮 Hướng dẫn Sử dụng

### 📊 Dashboard (Tổng quan)
- Xem thống kê điểm danh tổng quát
- Hiển thị dữ liệu sensor từ Firebase và MQTT
- Thực hiện sync dữ liệu CSV
- Xóa toàn bộ dữ liệu Firebase

### 📈 Attendance Stats (Thống kê)
- Xem biểu đồ điểm danh theo ngày
- Phân tích xu hướng vắng mặt
- Xuất báo cáo (sẽ implement)

### 👥 Classes (Lớp học)  
- Quản lý học sinh theo lớp
- Xem trạng thái điểm danh
- Chi tiết thông tin học sinh

### 🎛️ Device Control (Điều khiển)
- **Kết nối MQTT**: Tự động kết nối đến broker
- **Quét thiết bị**: Tìm kiếm ESP32 devices
- **Điều khiển Buzzer**:
  - Turn ON/OFF
  - Beep một lần
  - Alarm (3 lần beep)
  - Custom tone (tần số + thời gian)
- **Xem dữ liệu sensor** realtime
- **Chart**: Biểu đồ dữ liệu sensor theo thời gian

## 🔧 MQTT Commands

### Device Control Commands
```bash
# Buzzer control
/ESP32_001/buzzer ON
/ESP32_001/buzzer OFF  
/ESP32_001/buzzer BEEP
/ESP32_001/buzzer ALARM
/ESP32_001/buzzer TONE:1000:500:

# Request status
/ESP32_001/command status
```

### Topics Structure
```
/ESP32_001/
├── buzzer              # Buzzer control
├── buzzer/status       # Buzzer status response
├── command             # General commands
├── data                # JSON sensor data
├── temperature         # Individual sensor values
├── humidity
├── light
└── gas
```

## 📊 Data Structure

### Firebase Schema
```json
{
  "students": {
    "STU001": {
      "id": "STU001",
      "name": "Nguyễn Văn An", 
      "class": "10A1",
      "barcode": "STU001"
    }
  },
  "attendance": {
    "2025-08-09": {
      "STU001": {
        "studentId": "STU001",
        "status": "present",
        "timestamp": "2025-08-09 07:15:23"
      }
    }
  },
  "latest_data": {
    "temperature": 25.5,
    "humidity": 65,
    "lightLevel": 80, 
    "gasLevel": 20,
    "timestamp": "2025-08-09 14:30:25"
  }
}
```

### CSV Format (data.csv)
```csv
id,name,class,barcode
STU001,Nguyễn Văn An,10A1,STU001
STU002,Trần Thị Bảo,10A1,STU002
```

## 🔧 Troubleshooting

### Web Application Issues

**1. CORS Error khi đọc CSV**
```bash
# Chạy HTTP server thay vì mở file trực tiếp
python -m http.server 8000
```

**2. Firebase Connection Error**
- Kiểm tra Firebase config trong `FirebaseService.js`
- Đảm bảo Database Rules cho phép read/write

**3. MQTT Connection Failed**
- Kiểm tra internet connection
- HiveMQ broker có thể bị chặn firewall

### ESP32 Issues

**1. WiFi không kết nối**
```cpp
// Kiểm tra SSID và password
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

**2. MQTT không publish**
- Kiểm tra broker address: `broker.hivemq.com`
- Đảm bảo WiFi đã kết nối thành công

**3. Sensor đọc sai**
- Kiểm tra kết nối hardware
- Kiểm tra pin assignments trong code

## 🚧 Development Roadmap

### Phase 1 ✅ (Completed)
- [x] Basic web dashboard
- [x] Firebase integration
- [x] CSV data sync
- [x] ESP32 MQTT communication
- [x] Real-time device control

### Phase 2 🔄 (In Progress)
- [ ] User authentication
- [ ] Advanced analytics
- [ ] Mobile responsive design
- [ ] Offline support

### Phase 3 📋 (Planned)
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] Multi-school support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@iot-attendance.com
- **Documentation**: [Wiki](https://github.com/yourrepo/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourrepo/issues)

---

**Made with ❤️ for IoT Education**
