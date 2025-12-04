# Sensormine Platform v5 - Copilot Instructions

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
- **infrastructure**: Docker Compose, Helm charts, Terraform modules
- **tests**: Unit and integration tests

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
