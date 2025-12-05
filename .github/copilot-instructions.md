# Sensormine Platform v5 - Copilot Instructions

## ⚡ MANDATORY: Read Standing Orders First
**At the start of EVERY chat session, read `.github/copilot-standing-orders.md`**

This file contains:
- Automatic startup procedure (read `.agent/current-state.md` first)
- Workflow rules (TDD, story planning, state updates)
- Story selection priority
- Session handoff protocol

**Then provide project status summary and recommend next story.**

---

## Project Overview
This is a cloud-agnostic industrial IoT platform built with C# .NET 8 microservices architecture.

## Architecture Style
- Microservices architecture
- Event-driven design
- API-first approach
- Schema-driven system
- Stateless services with stateful storage

## Technology Stack
- .NET 8
- ASP.NET Core Web API
- Kafka/NATS for messaging
- TimescaleDB/PostgreSQL for storage
- Redis for caching
- MQTT for edge connectivity
- Docker & Kubernetes
- Helm & Terraform for deployment

## Project Structure
- **src/Services**: Microservices (Edge.Gateway, Ingestion, Device.API, etc.)
- **src/Shared**: Shared libraries (Core, Messaging, Storage, AI, Schemas)
- **src/Web/sensormine-web**: Main web application (Next.js 14 + React)
- **src/Web/device-simulator**: Device simulator for testing (Next.js 14 + React)
- **infrastructure**: Docker Compose, Helm charts, Terraform modules
- **tests**: Unit and integration tests

## Device Simulator

A standalone React application for simulating IoT devices across multiple protocols. Located at `src/Web/device-simulator/`.

### Supported Protocols
- **MQTT**: Publish telemetry to MQTT broker
- **HTTP/REST**: POST/PUT telemetry to REST API
- **WebSocket**: Stream telemetry via WebSocket
- **Modbus TCP**: Simulate Modbus register reads
- **OPC UA**: Simulate OPC UA node data changes

### Sensor Types
Temperature, humidity, pressure, flow, level, vibration, voltage, current, power, speed, position, pH, CO2, light

### Running the Simulator
```bash
cd src/Web/device-simulator
npm install
npm run dev -- -p 3021  # Runs on port 3021
```

Or use VS Code launch configuration "Device Simulator" (runs on port 3021).

### Features
- Quick device creation with pre-configured sensors
- Custom device and sensor configuration
- Real-time telemetry simulation with configurable intervals
- Protocol-level logging with filtering and CSV export
- Persistent configuration in localStorage

## Development Guidelines
- Follow clean architecture principles
- Use dependency injection throughout
- Implement health checks in all services
- Add OpenTelemetry instrumentation
- Design for multi-tenancy
- Keep services cloud-agnostic
- Use async/await patterns
- Implement proper error handling and logging

## Coding Standards
- Use C# 12 features
- Follow Microsoft naming conventions
- Use nullable reference types
- Implement IDisposable/IAsyncDisposable when needed
- Add XML documentation for public APIs
- Write unit tests for business logic

## AI-Driven Development Workflow
- **Always read** `.agent/current-state.md` at session start
- **Follow TDD workflow** defined in `.agent/workflow.md`
- **One story per commit** with `[Story X.Y]` prefix
- **Update state** after completing each story
- **See** `.github/copilot-standing-orders.md` for complete protocol
