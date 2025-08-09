/**
 * MQTT Service - Kết nối và điều khiển thiết bị ESP32 qua MQTT
 */
class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscribers = new Map(); // Quản lý callbacks
    this.devices = new Map(); // Quản lý thiết bị
    this.connectionRetries = 0;
    this.maxRetries = 5;
    
    // MQTT Broker config (HiveMQ public broker)
    this.brokerConfig = {
      host: 'broker.hivemq.com',
      port: 8000, // WebSocket port
      protocol: 'ws',
      clientId: 'web_client_' + Math.random().toString(16).substr(2, 8)
    };
    
    this.init();
  }

  /**
   * Initialize MQTT connection
   */
  async init() {
    try {
      // Load MQTT.js library
      if (!window.mqtt) {
        await this.loadMqttLibrary();
      }
      
      await this.connect();
      
    } catch (error) {
      console.error('❌ MQTT Service initialization failed:', error);
      ToastManager.error('Không thể kết nối MQTT server');
    }
  }

  /**
   * Load MQTT.js library dynamically
   */
  async loadMqttLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/mqtt/dist/mqtt.min.js';
      script.onload = () => {
        console.log('✅ MQTT library loaded');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load MQTT library'));
      document.head.appendChild(script);
    });
  }

  /**
   * Connect to MQTT broker
   */
  async connect() {
    if (this.isConnected) return;

    try {
      const connectUrl = `${this.brokerConfig.protocol}://${this.brokerConfig.host}:${this.brokerConfig.port}/mqtt`;
      
      console.log('🔄 Connecting to MQTT broker:', connectUrl);
      
      this.client = mqtt.connect(connectUrl, {
        clientId: this.brokerConfig.clientId,
        clean: true,
        connectTimeout: 10000,
        keepalive: 60
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionRetries = 0;
        
        // Subscribe to all device topics
        this.subscribeToDeviceTopics();
        
        if (window.toastManager) {
          window.toastManager.show('MQTT kết nối thành công', 'success');
        }
        
        // Notify subscribers
        this.notifySubscribers('connection', { status: 'connected' });
      });

      this.client.on('message', (topic, message) => {
        try {
          const messageStr = message.toString();
          this.handleIncomingMessage(topic, messageStr);
        } catch (error) {
          console.error('Error processing MQTT message:', error);
        }
      });

      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
        this.isConnected = false;
        
        if (this.connectionRetries < this.maxRetries) {
          this.connectionRetries++;
          setTimeout(() => this.connect(), 5000);
        } else if (window.toastManager) {
          window.toastManager.show('MQTT connection failed', 'error');
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.notifySubscribers('connection', { status: 'disconnected' });
      });

    } catch (error) {
      console.error('❌ MQTT connection error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to device topics
   */
  subscribeToDeviceTopics() {
    const deviceTopics = [
      '/ESP32_001/+',          // All ESP32_001 topics
      '/ESP32_001/data',       // Sensor data
      '/ESP32_001/temperature',
      '/ESP32_001/humidity', 
      '/ESP32_001/light',
      '/ESP32_001/gas',
      '/ESP32_001/buzzer/status',
      '/+/heartbeat'           // Device heartbeats
    ];

    deviceTopics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  handleIncomingMessage(topic, message) {
    const parts = topic.split('/');
    const deviceId = parts[1];
    const dataType = parts[2];

    // Update device data
    if (!this.devices.has(deviceId)) {
      this.devices.set(deviceId, {
        id: deviceId,
        status: 'online',
        lastUpdate: new Date(),
        data: {}
      });
    }

    const device = this.devices.get(deviceId);
    device.lastUpdate = new Date();
    device.status = 'online';

    // Parse and store data
    try {
      if (dataType === 'data' && message.startsWith('{')) {
        // JSON sensor data
        const data = JSON.parse(message);
        device.data = { ...device.data, ...data };
        
        // Notify subscribers about sensor data
        this.notifySubscribers('sensorData', { deviceId, data });
        
      } else if (['temperature', 'humidity', 'light', 'gas'].includes(dataType)) {
        // Individual sensor values
        device.data[dataType] = parseFloat(message) || message;
        
        // Notify subscribers
        this.notifySubscribers('sensorValue', { deviceId, type: dataType, value: message });
        
      } else if (topic.includes('buzzer/status')) {
        // Buzzer status
        device.data.buzzerStatus = message;
        this.notifySubscribers('deviceStatus', { deviceId, type: 'buzzer', status: message });
        
      } else if (topic.includes('heartbeat')) {
        // Device heartbeat
        this.notifySubscribers('heartbeat', { deviceId, timestamp: new Date() });
      }
      
      // Update device in map
      this.devices.set(deviceId, device);
      
    } catch (error) {
      console.error('❌ Error parsing MQTT message:', error);
    }
  }

  /**
   * Send command to device
   */
  sendCommand(deviceId, command, value = null) {
    if (!this.isConnected) {
      if (window.toastManager) {
        window.toastManager.show('MQTT chưa kết nối', 'error');
      }
      return false;
    }

    const topic = `/${deviceId}/${command}`;
    const message = value !== null ? value.toString() : '';

    try {
      this.client.publish(topic, message, (err) => {
        if (err && window.toastManager) {
          window.toastManager.show(`Lỗi gửi lệnh: ${err.message}`, 'error');
        } else if (window.toastManager) {
          window.toastManager.show(`Đã gửi lệnh: ${command}`, 'success');
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending MQTT command:', error);
      if (window.toastManager) {
        window.toastManager.show(`Lỗi MQTT: ${error.message}`, 'error');
      }
      return false;
    }
  }

  /**
   * Control buzzer
   */
  controlBuzzer(deviceId, action) {
    const validActions = ['ON', 'OFF', 'BEEP', 'ALARM'];
    
    if (!validActions.includes(action)) {
      if (window.toastManager) {
        window.toastManager.show('Lệnh buzzer không hợp lệ', 'error');
      }
      return false;
    }

    return this.sendCommand(deviceId, 'buzzer', action);
  }

  /**
   * Send tone to buzzer
   */
  sendTone(deviceId, frequency, duration) {
    const toneCommand = `TONE:${frequency}:${duration}:`;
    return this.sendCommand(deviceId, 'buzzer', toneCommand);
  }

  /**
   * Request device status
   */
  requestStatus(deviceId) {
    return this.sendCommand(deviceId, 'command', 'status');
  }

  /**
   * Get device data
   */
  getDeviceData(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  /**
   * Get all connected devices
   */
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  /**
   * Subscribe to MQTT events
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Disconnect MQTT
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
    }
  }

  /**
   * Check connection status
   */
  isClientConnected() {
    return this.isConnected && this.client && this.client.connected;
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      broker: `${this.brokerConfig.host}:${this.brokerConfig.port}`,
      clientId: this.brokerConfig.clientId,
      connectedDevices: this.devices.size
    };
  }
}

// Export class
window.MqttService = MqttService;
