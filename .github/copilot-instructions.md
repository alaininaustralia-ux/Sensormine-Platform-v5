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
This is a cloud-agnostic industrial IoT platform built with C# .NET 8 microservices architecture and a modern React/Next.js frontend.

## Architecture Style
- Microservices architecture
- Event-driven design
- API-first approach
- Schema-driven system
- Stateless services with stateful storage

## Technology Stack

### Backend
- .NET 8 (C# 12)
- ASP.NET Core Web API
- Kafka/NATS for messaging
- TimescaleDB/PostgreSQL for storage
- Redis for caching
- MQTT for edge connectivity
- Docker & Kubernetes
- Helm & Terraform for deployment

### Frontend
- Next.js 16 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- Vitest + React Testing Library for testing
- ESLint for linting

## Project Structure
```
src/
├── Web/                   # Frontend Applications
│   ├── sensormine-web/    # Main web app (Next.js + React)
│   │   ├── src/
│   │   │   ├── app/       # Next.js App Router pages
│   │   │   ├── components/ # UI components (shadcn/ui)
│   │   │   └── lib/       # Utilities, API client, auth
│   │   └── __tests__/     # Vitest unit tests
│   └── device-simulator/  # Device simulator for testing (Next.js + React)
│
├── Services/              # Backend Microservices
│   ├── ApiGateway/        # Entry point, rate limiting, auth
│   ├── Edge.Gateway/      # MQTT broker, device connectivity
│   ├── Ingestion.Service/ # Data ingestion pipeline
│   ├── Device.API/        # Device management CRUD
│   ├── SchemaRegistry.API/# Schema versioning and validation
│   ├── Query.API/         # Time-series data queries
│   ├── Alerts.API/        # Alert rules and notifications
│   ├── DigitalTwin.API/   # Digital twin state management
│   ├── VideoMetadata.API/ # Video processing metadata
│   ├── StreamProcessing.Service/ # Real-time stream processing
│   └── Billing.API/       # Billing, metering, Stripe integration
│
└── Shared/                # Shared Libraries
    ├── Sensormine.Core/   # Domain models, interfaces, utilities
    ├── Sensormine.Messaging/ # Kafka/NATS abstractions
    ├── Sensormine.Storage/   # Repository patterns, DB abstractions
    ├── Sensormine.AI/        # ML pipelines, anomaly detection
    ├── Sensormine.Schemas/   # Avro/JSON schema definitions
    └── Sensormine.Billing/   # Billing models, Stripe SDK wrappers
```

## Build & Test Commands

### Backend (.NET)
```bash
# Restore dependencies
dotnet restore Sensormine.sln

# Build entire solution
dotnet build Sensormine.sln

# Run all tests
dotnet test Sensormine.sln

# Run specific service
cd src/Services/Device.API && dotnet run
```

### Frontend (Next.js)
```bash
# Navigate to frontend project
cd src/Web/sensormine-web

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npx vitest
```

### Infrastructure
```bash
# Start local development stack (PostgreSQL, Kafka, Redis, MQTT)
docker-compose up -d

# Stop infrastructure
docker-compose down
```

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

### Backend (C#)
- Use C# 12 features
- Follow Microsoft naming conventions
- Use nullable reference types
- Implement IDisposable/IAsyncDisposable when needed
- Add XML documentation for public APIs
- Write unit tests for business logic (xUnit)

### Frontend (TypeScript/React)
- Use TypeScript strict mode
- Follow React best practices (hooks, functional components)
- Use shadcn/ui components for UI consistency
- Write tests with Vitest + React Testing Library
- Follow ESLint rules configured in the project

## AI-Driven Development Workflow
- **Always read** `.agent/current-state.md` at session start
- **Follow TDD workflow** defined in `.agent/workflow.md`
- **One story per commit** with `[Story X.Y]` prefix
- **Update state** after completing each story
- **See** `.github/copilot-standing-orders.md` for complete protocol
