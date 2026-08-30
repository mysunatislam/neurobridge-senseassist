/*
  NeuroBridge SenseAssist - ESP32 BLE Haptic Wearable Firmware
  ==============================================================
  Hardware:
    - ESP32 Development Board (ESP32-WROOM-32)
    - Vibration Motor / ERM / LRA (PWM Pin GPIO 23 or DRV2605L via I2C)
    - MPU6050 6-DOF IMU (SDA: GPIO 21, SCL: GPIO 22)
    - Status LEDs: Blue (BLE Connected), Amber (Haptic Active)

  Bluetooth Low Energy (BLE) GATT Architecture:
    - Service UUID:        4fafc201-1fb5-459e-8fcc-c5c9c331914b
    - Haptic RX Char UUID:  beb5483e-36e1-4688-b7f5-ea07361b26a8
    - Motion TX Char UUID:  c832e8b2-2972-4d2a-9e12-421736b45138
*/

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_RX   "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_TX   "c832e8b2-2972-4d2a-9e12-421736b45138"

const int MOTOR_PWM_PIN = 23;
const int LED_BLE_PIN = 2;
const int LED_HAPTIC_PIN = 4;

// PWM Properties
const int PWM_FREQ = 5000;
const int PWM_CHANNEL = 0;
const int PWM_RESOLUTION = 8; // 0 - 255

BLEServer* pServer = NULL;
BLECharacteristic* pHapticCharacteristic = NULL;
BLECharacteristic* pMotionCharacteristic = NULL;
bool deviceConnected = false;

// Haptic pacing parameters
uint8_t currentBpm = 80;
uint8_t currentIntensity = 60; // 0 - 100%
uint8_t currentPattern = 1;    // 1: 1-2-3-4, 2: Tap-Tap-Pause-Tap, 3: Ascending, 4: Calming Wave
bool isHapticActive = false;

unsigned long lastBeatTime = 0;
int currentBeatIndex = 0;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    digitalWrite(LED_BLE_PIN, HIGH);
    Serial.println("[BLE] NeuroBridge SenseAssist client connected!");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    digitalWrite(LED_BLE_PIN, LOW);
    isHapticActive = false;
    currentBeatIndex = 0;
    ledcWrite(PWM_CHANNEL, 0);
    Serial.println("[BLE] Client disconnected. Re-advertising...");
    pServer->getAdvertising()->start();
  }
};

// Hardware Safety Boundaries
const uint8_t MAX_SAFE_INTENSITY = 80; // Hard clamp: 80% maximum duty cycle to prevent tissue overstimulation
const unsigned long PACKET_WATCHDOG_TIMEOUT_MS = 3000; // Watchdog: halt if no keepalive packet received within 3s

unsigned long lastPacketTime = 0;

class HapticPacketCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    uint8_t* data = pCharacteristic->getData();
    size_t length = pCharacteristic->getLength();

    // Emergency Kill Switch Byte (0xFF)
    if (length == 1 && data[0] == 0xFF) {
      isHapticActive = false;
      ledcWrite(PWM_CHANNEL, 0);
      digitalWrite(LED_HAPTIC_PIN, LOW);
      Serial.println("[SAFETY] Emergency Stop Triggered via BLE!");
      return;
    }

    if (length >= 4) {
      currentBpm = constrain(data[0], 40, 120);
      currentIntensity = min((uint8_t)data[1], MAX_SAFE_INTENSITY); // Independent safety clamp
      currentPattern = constrain(data[2], 1, 4);
      bool wasHapticActive = isHapticActive;
      isHapticActive = (data[3] == 1);
      lastPacketTime = millis();

      if (isHapticActive && !wasHapticActive) {
        lastBeatTime = millis();
        currentBeatIndex = 0;
      }

      if (!isHapticActive) {
        ledcWrite(PWM_CHANNEL, 0);
        digitalWrite(LED_HAPTIC_PIN, LOW);
      }

      Serial.printf("[HAPTIC] Packet received -> BPM: %d, Intensity: %d%% (Clamped max %d%%), Pattern: %d, Active: %s\n",
                    currentBpm, currentIntensity, MAX_SAFE_INTENSITY, currentPattern, isHapticActive ? "YES" : "NO");
    }
  }
};

void executeHapticPulse(int dutyCycle, int pulseDurationMs) {
  digitalWrite(LED_HAPTIC_PIN, HIGH);
  ledcWrite(PWM_CHANNEL, map(dutyCycle, 0, 100, 0, 255));
  delay(pulseDurationMs);
  ledcWrite(PWM_CHANNEL, 0);
  digitalWrite(LED_HAPTIC_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  Serial.println("==================================================");
  Serial.println("NeuroBridge SenseAssist Haptic Wearable Initializing");
  Serial.println("==================================================");

  pinMode(LED_BLE_PIN, OUTPUT);
  pinMode(LED_HAPTIC_PIN, OUTPUT);
  digitalWrite(LED_BLE_PIN, LOW);
  digitalWrite(LED_HAPTIC_PIN, LOW);

  // Setup PWM for Vibration Motor
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_PWM_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0);

  // Initialize BLE
  BLEDevice::init("NeuroBridge SenseAssist");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pHapticCharacteristic = pService->createCharacteristic(
                            CHARACTERISTIC_RX,
                            BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
                          );
  pHapticCharacteristic->setCallbacks(new HapticPacketCallbacks());

  pMotionCharacteristic = pService->createCharacteristic(
                            CHARACTERISTIC_TX,
                            BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
                          );
  pMotionCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("[BLE] Device ready. Broadcast name: 'NeuroBridge SenseAssist'");
}

void loop() {
  // Watchdog Safety Check: If no keepalive BLE packet received in >3s, shut down actuator
  if (isHapticActive && (millis() - lastPacketTime > PACKET_WATCHDOG_TIMEOUT_MS)) {
    isHapticActive = false;
    ledcWrite(PWM_CHANNEL, 0);
    digitalWrite(LED_HAPTIC_PIN, LOW);
    Serial.println("[SAFETY WATCHDOG] Packet keepalive timeout (>3000ms). Pacing motor halted automatically.");
  }

  if (isHapticActive && currentBpm > 0) {
    unsigned long intervalMs = (60000 / currentBpm);
    unsigned long currentMillis = millis();

    if (currentMillis - lastBeatTime >= intervalMs) {
      lastBeatTime = currentMillis;

      bool shouldPulse = true;
      int pulseIntensity = currentIntensity;
      int pulseWidthMs = 120;

      // Pattern Logic
      if (currentPattern == 2) { // Tap-Tap-Pause-Tap
        if (currentBeatIndex == 2) {
          shouldPulse = false; // Pause
        }
      } else if (currentPattern == 3) { // Ascending
        pulseIntensity = map(currentBeatIndex, 0, 3, currentIntensity / 2, currentIntensity);
      } else if (currentPattern == 4) { // Calming Wave
        const uint8_t calmingScalePercent[4] = {60, 85, 100, 85};
        pulseIntensity = (currentIntensity * calmingScalePercent[currentBeatIndex]) / 100;
      }

      if (shouldPulse) {
        executeHapticPulse(pulseIntensity, pulseWidthMs);
      }

      currentBeatIndex = (currentBeatIndex + 1) % 4;
    }
  }

  delay(10);
}
