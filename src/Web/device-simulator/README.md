# Device Simulator

A React application for simulating IoT devices with various industrial protocols. Part of the Sensormine Platform v5.

## Overview

The Device Simulator allows you to create virtual devices that generate realistic telemetry data and simulate communication with the Sensormine platform using different protocols. This is useful for:

- **Development & Testing**: Test platform features without physical devices
- **Demos & Training**: Demonstrate platform capabilities
- **Load Testing**: Generate data at scale to test system performance
- **Protocol Validation**: Verify protocol implementations

## Supported Protocols

| Protocol | Description | Use Case |
|----------|-------------|----------|
| **MQTT** | Lightweight pub/sub messaging | IoT devices, constrained networks |
| **HTTP/REST** | Standard REST API calls | Web integrations, batch uploads |
| **WebSocket** | Full-duplex streaming | Real-time dashboards, live data |
| **Modbus TCP** | Industrial automation protocol | PLCs, SCADA systems |
| **OPC UA** | Industrial interoperability standard | Factory automation, process control |

## Features

- **Quick Device Creation**: Pre-configured sample devices for each protocol
- **Custom Sensor Configuration**: Define sensors with type, range, and variance
- **Protocol-Specific Settings**: Configure connection details for each protocol
- **Real-Time Simulation**: Generate telemetry data at configurable intervals
- **Simulation Logs**: View detailed logs of all protocol operations
- **Persistent Configuration**: Device configs saved to localStorage
- **Bulk Operations**: Start/stop all simulations at once

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, or pnpm

### Installation

```bash
# Navigate to the device-simulator directory
cd src/Web/device-simulator

# Install dependencies
npm install

# Start development server (runs on port 3021 to avoid conflicts)
npm run dev -- -p 3021
```

Open [http://localhost:3021](http://localhost:3021) in your browser.

Alternatively, use VS Code's launch configuration "Device Simulator" to start the app.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating a Device

1. **Quick Create**: Click a protocol button to create a sample device with pre-configured sensors
2. **Custom Create**: Click "Create Device" for full customization:
   - Enter device name and description
   - Select protocol and configure connection settings
   - Add sensors with custom types, ranges, and variance

### Running Simulations

1. Click **Start** on a device card to begin simulation
2. Watch real-time sensor readings in the device card
3. View protocol-level logs in the right panel
4. Click **Stop** to end simulation

### Configuring Protocols

#### MQTT
- **Broker URL**: MQTT broker address (e.g., `mqtt://localhost`)
- **Port**: Broker port (default: 1883)
- **Topic**: Publish topic (use `{deviceId}` placeholder)
- **QoS**: Quality of Service level (0, 1, or 2)
- **Client ID**: Unique client identifier

#### HTTP/REST
- **Endpoint**: API URL for telemetry ingestion
- **Method**: POST or PUT
- **Auth Type**: None, Bearer Token, API Key, or Basic Auth

#### WebSocket
- **URL**: WebSocket server URL (e.g., `ws://localhost:5000/ws/telemetry`)
- **Reconnect Interval**: Time between reconnection attempts
- **Heartbeat Interval**: Ping/pong interval for connection keep-alive

#### Modbus TCP
- **Host**: Modbus device IP address
- **Port**: Modbus port (default: 502)
- **Unit ID**: Slave device ID (1-247)
- **Register Type**: Holding, Input, or Coil registers
- **Start Address**: Beginning register address

#### OPC UA
- **Endpoint URL**: OPC UA server endpoint
- **Security Mode**: None, Sign, or Sign and Encrypt
- **Node IDs**: Comma-separated list of OPC UA node identifiers

## Sensor Types

The simulator supports various sensor types with realistic data generation:

| Type | Unit | Default Range |
|------|------|---------------|
| Temperature | °C | -20 to 50 |
| Humidity | % | 0 to 100 |
| Pressure | bar | 0 to 10 |
| Flow | L/min | 0 to 100 |
| Level | m | 0 to 10 |
| Vibration | mm/s | 0 to 50 |
| Voltage | V | 0 to 480 |
| Current | A | 0 to 100 |
| Power | kW | 0 to 1000 |
| Speed | RPM | 0 to 3600 |
| Position | mm | 0 to 1000 |
| pH | pH | 0 to 14 |
| CO2 | ppm | 400 to 5000 |
| Light | lux | 0 to 10000 |

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── label.tsx
│   ├── device-card.tsx    # Device display card
│   ├── device-editor.tsx  # Device configuration modal
│   └── log-viewer.tsx     # Simulation log viewer
├── lib/
│   ├── simulators/        # Protocol simulators
│   │   ├── base-simulator.ts
│   │   ├── mqtt-simulator.ts
│   │   ├── http-simulator.ts
│   │   ├── websocket-simulator.ts
│   │   ├── modbus-simulator.ts
│   │   ├── opcua-simulator.ts
│   │   └── index.ts
│   ├── data-generator.ts  # Sensor data generation
│   ├── store.ts           # Zustand state management
│   └── utils.ts           # Utility functions
└── types/
    ├── device.ts          # TypeScript type definitions
    └── index.ts
```

## Technology Stack

- **Framework**: Next.js 14
- **UI**: React 18, Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Styling**: class-variance-authority, tailwind-merge

## Integration with Sensormine Platform

The Device Simulator is designed to work with the Sensormine Platform's:

- **Edge.Gateway**: MQTT message ingestion
- **Ingestion.Service**: Data validation and processing
- **Query.API**: Time-series data storage and retrieval
- **Device.API**: Device registration and management

Configure the simulator's protocol endpoints to match your platform deployment.

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## License

Part of the Sensormine Platform v5. See repository LICENSE file for details.
