# 🌱 Smart Indoor Plant Control System – Web Dashboard

This repository contains the **Web Admin Dashboard** for the Smart Indoor Plant Control System. It acts as the central control unit, visualizing real-time sensor data from the ESP32 and allowing manual management of hardware actuators via Firebase Realtime Database.

---

## 🧠 System Architecture

The project operates on a three-layer decoupled architecture:

1.  **Embedded Layer (ESP32):** Collects raw sensor data (DHT11/SHT40, Capacitive Soil Moisture, LDR) and executes physical commands.
2.  **Cloud Layer (Firebase):** Acts as the low-latency synchronization bridge between hardware and software.
3.  **Web Dashboard (This Repo):** Handles data visualization, historical logging, and automation logic override.

---

## ⚡ Key Features

### 📡 Real-Time Telemetry
* Live monitoring of **Soil Moisture (%)**, **Temperature (°C)**, **Humidity (%)**, and **Light Status**.
* **Heartbeat Indicator:** Visual pulse animation to confirm active device connection.

### 📈 Client-Side Data Historian
* Implements a custom **FIFO (First-In-First-Out) logger** within the frontend.
* Automatically records incoming sensor data to Firebase `history/` node.
* **Optimization:** Limits historical data to the last **30 data points** to ensure chart performance and prevent database bloating.

### ⚙️ Automation & Control
* **Hysteresis Logic:** In `AUTO` mode, the dashboard triggers irrigation when moisture drops below **34.5%** and cuts off at **40%**.
* **Manual Override:** Direct toggle switches for the Water Pump, Cooling Fan, and Grow Lights.
* **Safety Protocol:** A global **"Master Switch"** completely disables the system and actuators in case of emergency.

### 📊 Visualization
* Interactive line charts powered by **Recharts**.
* Responsive UI built with **Tailwind CSS** and **Lucide-React** icons.

---

## 🧰 Tech Stack

* **Core:** React.js (Vite)
* **Styling:** Tailwind CSS
* **State Management:** Firebase Realtime Database (WebSocket)
* **Charts:** Recharts
* **Icons:** Lucide-React

---
## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have **Node.js** (v16+) installed.

### 2. Clone & Install
git clone [https://github.com/ulas-dursun/smart-plant-dashboard.git](https://github.com/ulas-dursun/smart-plant-dashboard.git)
cd smart-plant-dashboard

# Install dependencies
npm install
# Run the Application
npm run dev
