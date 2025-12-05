# SensorMine Platform – Functional & Non-Functional Requirements

## 1. Overview

SensorMine is an industrial IoT and video analytics platform that ingests, models, processes, visualises, and manages data from sensors, devices, video streams, and industrial systems. The platform includes:

- A cloud-enabled device ecosystem built around the Nexus hardware line.
- A flexible data modelling layer capable of supporting highly diverse data types and payload structures.
- Multi-modal analytics (IoT, video, LLM-driven insights).
- Visualisation, alerting, dashboards, and operational tooling.
- Edge computing and industrial connectivity.
- Mobile capabilities for provisioning, field diagnostics, and metadata management.

---

## 2. Functional Requirements

### 2.1 Device & Hardware Management

#### 2.1.1 Nexus Hardware Integration

**Support Nexus devices communicating via:**
- MQTT
- Azure Device Provisioning Service (DPS) for secure onboarding

**Central configuration for all Nexus settings:**
- Communication/sampling settings
- Probe configurations
- Firmware management
- Telemetry frequency and batching
- Video or sensor linkages

**Nexus devices must support custom probe interfaces:**
- RS485
- RS232
- OneWire
- 4–20 mA

**Provide a dedicated Nexus Configuration UI, including:**
- Probe assignment
- Diagnostics (battery, orientation/tilt, comms, last check-in)
- Live telemetry
- Command/control (reboot, sampling rate, firmware update)

#### 2.1.2 Device Lifecycle Management

**Register/provision devices through:**
- Mobile app
- Azure DPS + MQTT

**Manage device metadata:**
- Custom fields
- Device identity and geolocation
- Installation and operational metadata

**Device state modes:**
- Active
- Inactive
- Maintenance Mode (pause data & alerts)

**Additional capabilities:**
- Ability to deprovision devices and archive or delete historical data

#### 2.1.3 Mobile Device Support

**Mobile app supports:**
- Nexus provisioning
- QR / serial number scanning
- Field metadata collection (custom fields included)
- Diagnostics
- Viewing recent telemetry
- Offline operation with later sync

---

### 2.2 Data Ingestion & Data Modelling

#### 2.2.1 Multi-Protocol Data Ingestion

**Support ingestion from:**
- MQTT, HTTPS, WebSockets
- Video streams (RTSP, HLS, WebRTC)
- CCTV providers (Genetec, Milestone)
- File uploads (video, CSV, JSON, LiDAR)

**Industrial protocols:**
- OPC UA
- Modbus
- BACnet
- EtherNet/IP
- SCADA protocols

**Ingestion modes:**
- Batch ingestion
- Stream-based ingestion

#### 2.2.2 Dynamic Data Payload Definition

**Allow users to define:**
- Payload schemas
- Field names
- Data types
- Units
- Relationships to devices, locations, or video sources

**Support:**
- Versioning
- Deprecation
- Backwards compatibility

**Schema management:** ✅ **Implemented**
- Allow schema mapping and updates without downtime
- **AI-Powered Schema Generation**: Generate schemas from sample data using Claude API
- **Schema UI**: Complete CRUD interface with 3-step wizard
- **AI Metering**: Centralized tracking of all AI API usage and costs
- Multi-tenant usage statistics and monitoring

#### 2.2.3 Data Querying

**Provide a robust query engine supporting:**
- Structured & time-series queries
- Geospatial filtering
- Full-text metadata search
- Video-event search

**Advanced capabilities:**
- Derived fields
- Custom aggregations
- Moving window functions

---

### 2.3 Video Processing & AI/ML Analytics

#### 2.3.1 Video Input Sources

**Accept streams via:**
- RTSP
- HLS
- WebRTC (if edge supports)

**Integrate with CCTV systems:**
- Genetec
- Milestone

**Support uploaded files:**
- MP4
- MOV
- MKV
- Image sequences

#### 2.3.2 Video Analytics Capabilities

**Support:**
- Real-time inference on live streams
- Batch inference on uploaded or archived video
- Model chaining (multiple models per camera)
- Configurable model parameters
- Edge and cloud video processing pipelines

**Models must support:**
- Object detection
- Person/vehicle detection
- Custom ML models
- Behavioural detection
- Near-miss and safety analytics

#### 2.3.3 Video Analytics Output

**Produce structured events:**
- Model results
- Confidence scores
- Bounding boxes
- Derived metrics

**Video events must be:**
- Searchable
- Filterable
- Usable in dashboards

---

### 2.4 Visualisation & Dashboards

#### 2.4.1 Dashboarding Engine

**Allow home-built dashboards and templates:**
- Custom layout
- Widget library
- Filtering
- Page linking and drill-down
- Template library for industrial use cases

#### 2.4.2 Visualisation Types

**Charts:**
- Line, bar, pie, scatter, gauge, heatmap

**Timelines:**
- Events
- Video snippet overlays

**3D Visualisation:**
- CAD model viewer (GLTF/OBJ)
- Device placement overlays

**LiDAR Viewers:**
- LAS/LAZ format support

**Additional:**
- Maps (GIS)
- Lists & tables

---

### 2.5 LLM Interaction & Analytics

#### 2.5.1 Chat-Style Analytics

**Integrated LLM interface to:**
- Query IoT and video data
- Summarise behaviour
- Generate dashboards
- Build analytics automatically

**LLM must understand:**
- Device schemas
- Custom fields
- Metadata relationships

#### 2.5.2 Natural Language Actions

**Support prompts such as:**
- "Show water levels at Site A for the last week."
- "Create a dashboard for all cameras with detections."
- "Which devices need maintenance?"

**Output includes:**
- Charts
- Dashboards
- Tables
- Explanations

---

### 2.6 Alerting & Notifications

#### 2.6.1 Alert Rules

**Must support alerts based on:**
- Thresholds
- Geospatial boundaries
- Video events
- Battery level or comms health
- Device orientation (tilt detection)
- Custom expressions or scripts
- Time schedules

#### 2.6.2 Alert Delivery Channels

**Support sending alerts via:**
- Email
- SMS
- Microsoft Teams
- Webhooks/API endpoints

#### 2.6.3 Alert Management

**Provide:**
- Alert history
- Acknowledgement
- Suppression windows
- Rule templates

**Special handling:**
- Maintenance mode automatically disables alerts for affected devices

---

### 2.7 Industrial Connectivity & Edge Computing

#### 2.7.1 Industrial Protocol Support

**Provide connectors for:**
- OPC UA
- Modbus (TCP/RTU)
- BACnet
- EtherNet/IP
- SCADA integration modules
- External MQTT brokers

#### 2.7.2 Cloud Independence

**Platform must operate on:**
- Azure (preferred)
- AWS
- On-prem or edge deployments

**Design principle:**
- Avoid cloud-specific lock-in where possible

#### 2.7.3 Edge Compute

**Ability to run workloads on edge devices:**
- Data validation & processing
- Pre-filtering
- Local storage
- Video inference
- Model execution

**Support remote deployment of:**
- Containers
- ML models
- Scripts

---

## 3. Non-Functional Requirements

### 3.1 Performance

- Support ingestion of **tens of thousands of events per second**
- Sub-second latency for recent data querying
- Live video latency **< 2 seconds** where hardware permits

### 3.2 Scalability

- Horizontally scalable ingestion, query, and video pipelines
- Optional multi-tenant support

### 3.3 Security

- TLS encryption
- RBAC/permission system
- Audit logging
- Secure key vault storage
- Support for restricted or air-gapped networks

### 3.4 Availability

- Target **99.9% uptime**
- Support regional redundancy
- Auto-recovering services

---

## 4. Metadata & Customisation

### 4.1 Custom Fields

**Allow custom fields on:**
- Devices
- Locations
- Sensors
- Video sources

**Supported field types:**
- Text
- Numeric
- Boolean
- Date/time
- Lists

### 4.2 Mobile Integration

**Users must be able to:**
- Edit custom fields
- Capture metadata in the field
- Update device location
- Run diagnostics

---

## 5. Administration & System Management

### 5.1 User & Role Management

**Custom role definitions:**
- Permission-based access to:
  - Devices
  - Locations
  - Dashboards
  - Data types

### 5.2 Configuration Management

**Provide central configuration UI for:**
- Video models
- Data schemas
- Device templates
- Alert rules
- Dashboard templates

### 5.3 Tenant Management

**(If implemented)**
- Tenant provisioning
- Isolation of data and configuration

---

## 6. Reporting & Data Export

### Export Formats
- CSV
- JSON
- API endpoints
- Scheduled reports
- PDF exports
- Dashboard sharing links or images

---

## 7. Integration Requirements

### 7.1 APIs

**REST APIs for:**
- Ingestion
- Querying
- Device management
- Video processing configuration

**Webhooks for:**
- Alerts
- Data forwarding

### 7.2 Third-Party Integrations

**Support integration with:**
- Genetec
- Milestone
- SCADA systems
- Azure IoT services
- SMS & email providers
- Microsoft Teams messaging APIs

---

## 8. Requirements Mapping to Architecture

### Microservices Alignment

| Requirement Area | Microservice(s) | Status |
|-----------------|-----------------|--------|
| Device Management | Device.API, Edge.Gateway | ✅ Created |
| Data Ingestion | Ingestion.Service, Edge.Gateway | ✅ Created |
| Video Processing | VideoMetadata.API, StreamProcessing.Service | ✅ Created |
| Schema Management | SchemaRegistry.API | ✅ Implemented (UI + API + AI) |
| Querying | Query.API | ✅ Created |
| Alerting | Alerts.API | ✅ Created |
| Digital Twins | DigitalTwin.API | ✅ Created |
| LLM Analytics | Sensormine.AI (library) | ✅ Implemented (AI Metering + Schema Gen) |
| API Gateway | ApiGateway | ✅ Created |

### Implementation Priorities

#### Phase 1: Core Platform (Current)
- ✅ Device registration and management
- ✅ Multi-protocol data ingestion
- ✅ Schema-driven data modeling (UI + API + AI-powered generation)
- ✅ Centralized AI metering and usage tracking
- ✅ Time-series storage
- ✅ Basic querying

#### Phase 2: Analytics & Video (Next)
- [ ] Video stream ingestion
- [ ] ML model inference pipeline
- [ ] Video analytics events
- [ ] Genetec/Milestone integration
- [ ] LLM interface implementation

#### Phase 3: Advanced Features
- [ ] Mobile app development
- [ ] Nexus hardware integration
- [ ] Edge compute deployment
- [ ] 3D/LiDAR visualization
- [ ] Advanced dashboarding

#### Phase 4: Enterprise Features
- [ ] Multi-tenancy
- [ ] Advanced RBAC
- [ ] Audit logging
- [ ] Report generation
- [ ] Regional redundancy

---

## 9. Technology Stack Alignment

### Requirements vs. Technology

| Requirement | Technology Solution |
|------------|-------------------|
| MQTT Support | MQTTnet, MQTT Broker (Mosquitto) |
| Video Streaming | RTSP/HLS support via StreamProcessing |
| ML Inference | ONNX Runtime (Sensormine.AI) |
| Time-Series Data | TimescaleDB |
| Object Storage | MinIO/S3-compatible |
| Real-time Processing | Kafka Streams/Stream Processing Service |
| Search | OpenSearch |
| Cache | Redis |
| LLM Integration | OpenAI/Azure OpenAI SDK |
| Mobile Backend | ASP.NET Core APIs |

---

## 10. Gap Analysis

### Features Requiring Additional Implementation

1. **Azure DPS Integration** - Need to add Azure IoT SDK
2. **Genetec/Milestone Connectors** - Requires vendor-specific SDKs
3. **OPC UA Server** - Need OPC Foundation library
4. **Modbus/BACnet** - Industrial protocol libraries required
5. **Mobile Apps** - React Native or Flutter development
6. **3D Visualization** - Three.js/CesiumJS integration
7. **LiDAR Processing** - Potree or similar library
8. **PDF Export** - Report generation library
9. **Microsoft Teams Integration** - Teams webhook implementation
10. **Natural Language Processing** - LLM prompt engineering layer

### Recommended Next Steps

1. Prioritize Phase 2 analytics features
2. Implement Azure IoT SDK for DPS support
3. Add industrial protocol libraries
4. Build video ingestion pipeline
5. Develop ML inference orchestration
6. Create LLM query interface
7. Design mobile API endpoints
8. Implement alerting notification channels

---

**Document Version:** 1.0  
**Last Updated:** December 4, 2025  
**Status:** Requirements Documented
