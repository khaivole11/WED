#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <time.h>
#include <PubSubClient.h> 

// Thông tin Firebase
#define DATABASE_URL "https://iot-project-4af4e-default-rtdb.firebaseio.com/"
#define API_KEY "AIzaSyDjoi0p_taMTI5auLanrjGywrGY4AFxp_4"

// Thông tin WiFi
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""

//***Set server***
const char* mqttServer = "broker.hivemq.com"; 
int port = 1883;
const char* DEVICE_ID = "ESP32_001";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Định nghĩa chân kết nối
#define DHT_PIN 4
#define LDR_PIN 34    
#define MQ2_PIN 35    
#define BUZZER_PIN  5

// Khởi tạo cảm biến
DHT dht(DHT_PIN, DHT22);

// Biến lưu trữ dữ liệu
struct SensorData {
  float temperature;
  float humidity;
  int lightLevel;
  int gasLevel;
  String timestamp;
};

SensorData currentData;
unsigned long sendDataPrevMillis = 0;
const unsigned long sendDataIntervalMs = 10000; // 10 giây

void wifiConnect() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
}

void mqttConnect() {
  while(!mqttClient.connected()) {
    Serial.println("Attempting MQTT connection...");
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    
    if(mqttClient.connect(clientId.c_str())) {
      Serial.println("MQTT connected");

      String buzzerTopic = "/" + String(DEVICE_ID) + "/buzzer";
      String commandTopic = "/" + String(DEVICE_ID) + "/command";
      
      mqttClient.subscribe(buzzerTopic.c_str());
      mqttClient.subscribe(commandTopic.c_str());
      
      Serial.println("Subscribed to: " + buzzerTopic);
      Serial.println("Subscribed to: " + commandTopic);
    }
    else {
      Serial.print("MQTT connection failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// MQTT Receiver
void callback(char* topic, byte* message, unsigned int length) {
  Serial.println(topic);
  String msg;
  for(int i=0; i<length; i++) {
    msg += (char)message[i];
  }
  Serial.println(msg);

  String topicStr = String(topic);
  String buzzerTopic = "/" + String(DEVICE_ID) + "/buzzer";
  String commandTopic = "/" + String(DEVICE_ID) + "/command";
  
  if(topicStr == buzzerTopic) {
    if(msg == "ON" || msg == "1") {
      digitalWrite(BUZZER_PIN, HIGH);
      Serial.println("BUZZER turned ON");
      String statusTopic = "/" + String(DEVICE_ID) + "/buzzer/status";
      mqttClient.publish(statusTopic.c_str(), "ON");
    }
    else if(msg == "OFF" || msg == "0") {
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("BUZZER turned OFF");
      String statusTopic = "/" + String(DEVICE_ID) + "/buzzer/status";
      mqttClient.publish(statusTopic.c_str(), "OFF");
    }
    else if(msg == "BEEP") {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("BUZZER beeped once");
      String statusTopic = "/" + String(DEVICE_ID) + "/buzzer/status";
      mqttClient.publish(statusTopic.c_str(), "BEEPED");
    }
    else if(msg == "ALARM") {
      for(int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(300);
        digitalWrite(BUZZER_PIN, LOW);
        delay(200);
      }
      Serial.println("BUZZER alarm sequence completed");
      String statusTopic = "/" + String(DEVICE_ID) + "/buzzer/status";
      mqttClient.publish(statusTopic.c_str(), "ALARM_DONE");
    }
    else if(msg.startsWith("TONE:")) {
      int colonIndex1 = msg.indexOf(':', 5);
      int colonIndex2 = msg.indexOf(':', colonIndex1 + 1);
      if(colonIndex1 > 0 && colonIndex2 > 0) {
        int frequency = msg.substring(5, colonIndex1).toInt();
        int duration = msg.substring(colonIndex1 + 1, colonIndex2).toInt();
        tone(BUZZER_PIN, frequency, duration);
        Serial.println("BUZZER tone: " + String(frequency) + "Hz for " + String(duration) + "ms");
        String statusTopic = "/" + String(DEVICE_ID) + "/buzzer/status";
        mqttClient.publish(statusTopic.c_str(), ("TONE_" + String(frequency)).c_str());
      }
    }
  }
  
  if(topicStr == commandTopic) {
    if(msg == "status") {
      publishSensorDataMQTT();
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  dht.begin();
  
  wifiConnect();
  
  mqttClient.setServer(mqttServer, port);
  mqttClient.setCallback(callback);
  mqttClient.setKeepAlive(90);

  configTime(7 * 3600, 0, "pool.ntp.org");
  
  Serial.println("System ready!");
}

void loop() {
  if(!mqttClient.connected()) {
    mqttConnect();
  }
  
  mqttClient.loop();

  if (WiFi.status() == WL_CONNECTED && (millis() - sendDataPrevMillis > sendDataIntervalMs || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    readSensors();
    sendToFirebase();
    printSensorData();
  }
  
  delay(1000);
}

void publishSensorDataMQTT() {
  String baseTopic = "/" + String(DEVICE_ID);
  char buffer[20];
  
  sprintf(buffer, "%.1f", currentData.temperature);
  mqttClient.publish((baseTopic + "/temperature").c_str(), buffer);
  
  sprintf(buffer, "%.1f", currentData.humidity);
  mqttClient.publish((baseTopic + "/humidity").c_str(), buffer);
  
  sprintf(buffer, "%d", currentData.lightLevel);
  mqttClient.publish((baseTopic + "/light").c_str(), buffer);
  
  sprintf(buffer, "%d", currentData.gasLevel);
  mqttClient.publish((baseTopic + "/gas").c_str(), buffer);
  
  mqttClient.publish((baseTopic + "/timestamp").c_str(), currentData.timestamp.c_str());
  
  String jsonData = "{";
  jsonData += "\"temperature\":" + String(currentData.temperature) + ",";
  jsonData += "\"humidity\":" + String(currentData.humidity) + ",";
  jsonData += "\"light\":" + String(currentData.lightLevel) + ",";
  jsonData += "\"gas\":" + String(currentData.gasLevel) + ",";
  jsonData += "\"timestamp\":\"" + currentData.timestamp + "\"";
  jsonData += "}";
  
  mqttClient.publish((baseTopic + "/data").c_str(), jsonData.c_str());
  
  Serial.println("Data published to MQTT topics");
}

void readSensors() {
  currentData.temperature = dht.readTemperature();
  currentData.humidity = dht.readHumidity();
  if (isnan(currentData.temperature) || isnan(currentData.humidity)) {
    currentData.temperature = 25.0;
    currentData.humidity = 60.0;
  }
  
  int ldrValue = analogRead(LDR_PIN);
  currentData.lightLevel = map(ldrValue, 0, 4095, 0, 100);
  
  int mq2Value = analogRead(MQ2_PIN);
  currentData.gasLevel = map(mq2Value, 0, 4095, 0, 100);
  
  currentData.timestamp = getTimestamp();
}

String getTimestamp() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis());
  }
  char timeStr[64];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeStr);
}

// ✅ Hàm đã sửa để Firebase tự sort
void sendToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }
  
  HTTPClient http;
  String url = String(DATABASE_URL) + "/sensor_data.json?auth=" + String(API_KEY);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["timestamp"] = currentData.timestamp;
  doc["temperature"] = currentData.temperature;
  doc["humidity"] = currentData.humidity;
  doc["lightLevel"] = currentData.lightLevel;
  doc["gasLevel"] = currentData.gasLevel;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // POST → Firebase tự tạo key push(), sort theo thời gian
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("Data sent to Firebase successfully!");
    Serial.println("Response code: " + String(httpResponseCode));
  } else {
    Serial.println("Error sending data to Firebase");
    Serial.println("Error code: " + String(httpResponseCode));
  }
  
  http.end();
  updateLatestData();
}

void updateLatestData() {
  HTTPClient http;
  String url = String(DATABASE_URL) + "/latest_data.json?auth=" + String(API_KEY);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(256);
  doc["timestamp"] = currentData.timestamp;
  doc["temperature"] = currentData.temperature;
  doc["humidity"] = currentData.humidity;
  doc["lightLevel"] = currentData.lightLevel;
  doc["gasLevel"] = currentData.gasLevel;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.println("Latest data updated!");
  }
  
  http.end();
}

void printSensorData() {
  Serial.println("========== SENSOR DATA ==========");
  Serial.println("Timestamp: " + currentData.timestamp);
  Serial.println("Temperature: " + String(currentData.temperature) + "°C");
  Serial.println("Humidity: " + String(currentData.humidity) + "%");
  Serial.println("Light Level: " + String(currentData.lightLevel) + "%");
  Serial.println("Gas Level: " + String(currentData.gasLevel) + "%");
  Serial.println("================================");
  Serial.println();
}
