# Hướng dẫn tích hợp ESP32 với Website qua MQTT

## 1. Kiến trúc hệ thống

```
ESP32 Devices ←→ MQTT Broker ←→ Website (JavaScript)
                     ↓
                Firebase Database
```

## 2. MQTT Broker

### Option 1: Sử dụng HiveMQ Cloud (Miễn phí)
- URL: `broker.hivemq.com`
- Port: `8883` (WSS) cho web
- Port: `1883` (TCP) cho ESP32

### Option 2: Mosquitto Local
```bash
# Cài đặt Mosquitto
sudo apt-get install mosquitto mosquitto-clients

# Cấu hình cho WebSocket
echo "listener 9001" >> /etc/mosquitto/mosquitto.conf
echo "protocol websockets" >> /etc/mosquitto/mosquitto.conf

# Khởi động
sudo systemctl start mosquitto
```

## 3. ESP32 Code (Arduino)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT settings
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* device_id = "ESP32_DEVICE_001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Gửi heartbeat mỗi 30 giây
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 30000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Đọc barcode (giả lập)
  if (Serial.available()) {
    String barcode = Serial.readString();
    barcode.trim();
    sendAttendance(barcode);
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("Received: %s\n", message.c_str());
  
  // Xử lý commands từ website
  if (String(topic) == "attendance/commands/" + String(device_id)) {
    handleCommand(message);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(device_id)) {
      Serial.println("connected");
      
      // Subscribe to commands
      String commandTopic = "attendance/commands/" + String(device_id);
      client.subscribe(commandTopic.c_str());
      
      // Gửi device online status
      sendDeviceStatus("online");
      
    } else {
      Serial.printf("failed, rc=%d try again in 5 seconds\n", client.state());
      delay(5000);
    }
  }
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["device_id"] = device_id;
  doc["type"] = "heartbeat";
  doc["timestamp"] = millis();
  doc["ip_address"] = WiFi.localIP().toString();
  doc["signal_strength"] = WiFi.RSSI();
  
  String message;
  serializeJson(doc, message);
  
  String topic = "attendance/heartbeat/" + String(device_id);
  client.publish(topic.c_str(), message.c_str());
}

void sendAttendance(String barcode) {
  DynamicJsonDocument doc(256);
  doc["device_id"] = device_id;
  doc["type"] = "attendance";
  doc["barcode"] = barcode;
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  
  String topic = "attendance/data/" + String(device_id);
  client.publish(topic.c_str(), message.c_str());
  
  Serial.printf("Sent attendance: %s\n", barcode.c_str());
}

void sendDeviceStatus(String status) {
  DynamicJsonDocument doc(256);
  doc["device_id"] = device_id;
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["firmware_version"] = "1.0.0";
  doc["class"] = "10A1"; // Cấu hình theo lớp
  
  String message;
  serializeJson(doc, message);
  
  String topic = "attendance/status/" + String(device_id);
  client.publish(topic.c_str(), message.c_str());
}

void handleCommand(String command) {
  DynamicJsonDocument doc(256);
  deserializeJson(doc, command);
  
  String cmd = doc["command"];
  
  if (cmd == "sync_time") {
    // Đồng bộ thời gian
    Serial.println("Syncing time...");
  } else if (cmd == "restart") {
    // Restart device
    ESP.restart();
  } else if (cmd == "get_status") {
    // Gửi status chi tiết
    sendDeviceStatus("online");
  }
}
```

## 4. Website JavaScript (MQTT Client)

```javascript
// Thêm vào FirebaseService.js
class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.devices = new Map();
  }

  async connect() {
    try {
      // Sử dụng HiveMQ WebSocket
      this.client = new Paho.MQTT.Client("broker.hivemq.com", 8000, "web_client_" + Date.now());
      
      this.client.onConnectionLost = this.onConnectionLost.bind(this);
      this.client.onMessageArrived = this.onMessageArrived.bind(this);
      
      await new Promise((resolve, reject) => {
        this.client.connect({
          onSuccess: () => {
            console.log("✅ MQTT Connected");
            this.isConnected = true;
            this.subscribeToTopics();
            resolve();
          },
          onFailure: reject,
          useSSL: true
        });
      });
      
    } catch (error) {
      console.error("❌ MQTT Connection failed:", error);
    }
  }

  subscribeToTopics() {
    // Subscribe to all device topics
    this.client.subscribe("attendance/+/+");
    this.client.subscribe("attendance/heartbeat/+");
    this.client.subscribe("attendance/status/+");
    this.client.subscribe("attendance/data/+");
  }

  onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = JSON.parse(message.payloadString);
    
    console.log("📨 MQTT Message:", topic, payload);
    
    if (topic.includes("heartbeat")) {
      this.handleHeartbeat(payload);
    } else if (topic.includes("status")) {
      this.handleDeviceStatus(payload);
    } else if (topic.includes("data")) {
      this.handleAttendanceData(payload);
    }
  }

  handleHeartbeat(data) {
    const deviceId = data.device_id;
    this.devices.set(deviceId, {
      ...this.devices.get(deviceId),
      last_seen: Date.now(),
      status: 'online',
      ip_address: data.ip_address,
      signal_strength: data.signal_strength
    });
    
    // Cập nhật Firebase
    this.updateDeviceInFirebase(deviceId, this.devices.get(deviceId));
  }

  handleDeviceStatus(data) {
    const deviceId = data.device_id;
    this.devices.set(deviceId, {
      id: deviceId,
      name: `Device ${deviceId}`,
      class: data.class || 'Unknown',
      status: data.status,
      firmware: data.firmware_version,
      last_update: Date.now()
    });
    
    // Cập nhật Firebase
    this.updateDeviceInFirebase(deviceId, this.devices.get(deviceId));
  }

  async handleAttendanceData(data) {
    try {
      // Sync attendance với Firebase
      await window.firebaseService.syncWithDevice(data.barcode);
      
      // Gửi response về ESP32
      this.sendCommandToDevice(data.device_id, {
        command: "attendance_received",
        barcode: data.barcode,
        status: "success"
      });
      
    } catch (error) {
      this.sendCommandToDevice(data.device_id, {
        command: "attendance_received",
        barcode: data.barcode,
        status: "error",
        message: error.message
      });
    }
  }

  async updateDeviceInFirebase(deviceId, deviceData) {
    try {
      const deviceRef = window.firebaseService.ref(window.firebaseService.database, `devices/${deviceId}`);
      await window.firebaseService.set(deviceRef, deviceData);
    } catch (error) {
      console.error("❌ Error updating device in Firebase:", error);
    }
  }

  sendCommandToDevice(deviceId, command) {
    if (!this.isConnected) return;
    
    const topic = `attendance/commands/${deviceId}`;
    const message = new Paho.MQTT.Message(JSON.stringify(command));
    message.destinationName = topic;
    
    this.client.send(message);
  }

  onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("❌ MQTT Connection lost:", responseObject.errorMessage);
      this.isConnected = false;
      
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }
}

// Khởi tạo MQTT Service
window.mqttService = new MQTTService();
```

## 5. Thêm MQTT Client Library vào HTML

```html
<!-- Thêm vào index.html -->
<script src="https://unpkg.com/paho-mqtt@1.1.0/paho-mqtt.js"></script>
```

## 6. MQTT Topics Structure

```
attendance/
├── heartbeat/[device_id]     - Device heartbeat
├── status/[device_id]        - Device status updates  
├── data/[device_id]          - Attendance data
└── commands/[device_id]      - Commands to devices
```

## 7. Kích hoạt MQTT

Thêm vào khởi tạo ứng dụng:

```javascript
// Trong App constructor
async initializeApp() {
  // ... existing code ...
  
  // Khởi tạo MQTT
  await window.mqttService.connect();
}
```

## Có cần MQTT không?

**CÓ** - MQTT rất hữu ích cho hệ thống này vì:

1. **Real-time communication**: Website nhận dữ liệu điểm danh ngay lập tức
2. **Device monitoring**: Theo dõi trạng thái thiết bị real-time
3. **Command & Control**: Gửi lệnh điều khiển từ website xuống ESP32
4. **Scalability**: Dễ mở rộng nhiều thiết bị
5. **Reliability**: MQTT có cơ chế retry và QoS

**Lợi ích cụ thể:**
- Hiển thị trạng thái thiết bị real-time trên Dashboard
- Nhận thông báo ngay khi có học sinh điểm danh
- Điều khiển thiết bị từ xa (restart, sync time, etc.)
- Monitor signal strength, IP address của từng thiết bị
