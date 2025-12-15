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

### 2.1 Device Type Configuration & Management

#### 2.1.1 Device Type Definition

**Device Types are templates that define:**
- Protocol configuration (MQTT, HTTP, WebSocket, OPC UA, Modbus, etc.)
- Data schema (payload structure and validation rules)
- Custom metadata fields specific to this device type
- Default alert rules and thresholds
- Visualization templates and dashboard widgets
- Communication settings (frequency, batching, compression)

**Each Device Type includes:**
- **Name and Description**: Human-readable identification
- **Protocol Settings**: Connection parameters, authentication, endpoints
- **Data Schema**: JSON Schema defining telemetry payload structure
- **Custom Fields**: Type-specific metadata fields (text, numeric, boolean, date, list)
- **Field Validation**: Rules for custom field values
- **Alert Templates**: Pre-configured alert rules for this device type
- **Tags**: Categorization and filtering

**Device Type UI (Settings Section):**
- Create/Edit/Delete device types
- Clone existing types for similar configurations
- Import/Export device type definitions
- Version history and change tracking
- Usage statistics (how many devices use this type)

#### 2.1.2 Nexus Hardware Integration

**Support Nexus devices communicating via:**
- MQTT
- Azure Device Provisioning Service (DPS) for secure onboarding

**Nexus-specific Device Type settings:**
- Probe configurations (RS485, RS232, OneWire, 4–20 mA)
- Probe-to-schema field mapping
- Firmware requirements
- Telemetry frequency and batching
- Video or sensor linkages
- Orientation/tilt monitoring settings

**Provide a dedicated Nexus Configuration UI, including:**
- Probe assignment and configuration
- Diagnostics (battery, orientation/tilt, comms, last check-in)
- Live telemetry
- Command/control (reboot, sampling rate, firmware update)

#### 2.1.3 Device Lifecycle Management

**Register/provision devices through:**
- Mobile app
- Azure DPS + MQTT
- Web UI bulk import

**Device Registration Process:**
1. Select Device Type (required)
2. Enter device identity (serial number, MAC address, etc.)
3. Complete custom fields defined by Device Type
4. Set location and deployment metadata
5. Configure protocol-specific connection details
6. Validate configuration and provision

**Dynamic Device Form:**
- Form fields auto-generated from Device Type custom field definitions
- Field validation based on Device Type rules
- Conditional fields based on other field values
- Help text and tooltips from Device Type configuration
- Real-time validation feedback

**Device state modes:**
- Active
- Inactive
- Maintenance Mode (pause data & alerts)

**Additional capabilities:**
- Ability to deprovision devices and archive or delete historical data
- Change device type (with data migration warning)
- Bulk operations on devices of same type

#### 2.1.4 Mobile App Requirements (.NET MAUI)

**Platform**: Cross-platform mobile application built with .NET MAUI for iOS and Android

**Technology Stack:**
- .NET MAUI (.NET 8+)
- C# 12
- NFC support (CoreNFC for iOS, Android.Nfc for Android)
- SQLite for offline storage
- Azure AD / Entra ID authentication

**Core Capabilities:**

**1. NFC-Based Device Interaction:**
- Tap Nexus device to read device ID, type, firmware, hardware info
- Read diagnostics via NFC (battery, sensors, errors, last broadcast time)
- Write configuration to device via NFC
- Support NDEF message parsing
- Visual and haptic feedback for NFC operations
- Works offline (direct device communication)

**2. Device Configuration Management:**
- Load device types and schemas from platform
- Apply JSON configuration validated against device schema
- Tabletop configuration (offline mode without cloud connection)
- Import configuration via file, QR code, clipboard, or Bluetooth/WiFi
- Configuration templates for common setups
- Bulk configuration operations
- Configuration preview before applying
- Rollback to previous configuration

**3. Location Services:**
- GPS location capture (latitude, longitude, altitude)
- Manual coordinate entry with multiple formats (decimal degrees, DMS, UTM)
- Map view with device markers
- Address geocoding (GPS to street address)
- Save waypoints for reuse
- Write location to device and platform

**4. Custom Field Handling:**
- Dynamic form generation based on Device Type definitions
- Supported field types: text, numeric, boolean, dropdown, date/datetime, image, file, barcode, signature
- Field validation (required, min/max, regex)
- Conditional fields based on other field values
- Offline data entry with automatic sync
- Draft auto-save

**5. Device Lifecycle Management:**
- Device provisioning with custom fields
- Device reconfiguration
- Device deprovisioning with optional factory reset
- Maintenance mode toggle (suspend broadcasts and alerts)
- Configuration change history and audit trail

**6. Offline-First Architecture:**
- All operations work offline first
- Local SQLite database for caching
- Cache device schemas, configurations, custom field definitions
- Sync queue for pending operations
- Automatic sync when connectivity returns
- Conflict resolution (server wins with notification)
- Manual sync trigger
- Cache expiration (24-hour default)

**7. Security & Authentication:**
- OAuth 2.0 / OpenID Connect authentication
- Azure AD / Entra ID integration
- Biometric authentication (fingerprint, Face ID) for app access
- Role-based access controls (admin, technician, viewer)
- Secure token storage (iOS Keychain, Android Keystore)
- Token refresh with seamless re-authentication
- Automatic logout after 15 minutes of inactivity
- Encrypted local database (SQLCipher)

**8. Audit & Compliance:**
- Full audit trail of all field actions
- Log every NFC read, write, configuration change
- Audit log includes: timestamp, device ID, user ID, action type, old/new config, GPS location, result
- Local audit log storage with cloud sync
- Export audit logs as CSV or JSON

**9. Additional Features:**
- QR code and barcode scanning
- Photo capture and attachment to devices
- File attachments with compression
- Diagnostic history viewer
- Export diagnostics as JSON or CSV
- Push notifications for critical alerts
- Background sync service

**Platform Requirements:**
- **iOS**: Minimum iOS 14.0+, iPhone 7+ for NFC, App Store distribution
- **Android**: Minimum Android 8.0 (API 26)+, NFC hardware required, Google Play distribution
- Both platforms support enterprise distribution for internal deployments

**Performance Targets:**
- App startup: < 3 seconds (cold), < 1 second (warm)
- NFC scan and read: < 2 seconds
- NFC write configuration: < 5 seconds
- Page navigation: < 300ms
- Background sync: every 5 minutes when connected

**For detailed MAUI requirements and architecture, see [mobile-maui-requirements.md](./mobile-maui-requirements.md)**

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

#### 2.2.2 Schema Management (Integrated with Device Types)

**Schemas define data payload structure:**
- Field names, data types, and units
- Validation rules and constraints
- Relationships to devices, locations, or video sources
- Version history and compatibility

**Schema Integration with Device Types:**
- Each Device Type references one or more schemas
- Schemas are assigned during Device Type configuration (not during device registration)
- Schema versioning allows updates without breaking existing devices
- Devices inherit schema from their Device Type
- Schema validation occurs during data ingestion

**Schema management:** ✅ **Implemented**
- Allow schema mapping and updates without downtime
- **AI-Powered Schema Generation**: Generate schemas from sample data using Claude API
- **Schema UI**: Complete CRUD interface with 3-step wizard
- **AI Metering**: Centralized tracking of all AI API usage and costs
- Multi-tenant usage statistics and monitoring

**Schema Migration:**
- Update Device Type schema version
- All devices of that type automatically use new schema
- Backwards compatibility checking
- Data migration tools for breaking changes

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

#### 2.6.1 Alert Configuration (Settings Section)

**Alert configuration is managed in Settings UI:**
- Create/edit alert rule templates
- Associate alert rules with Device Types
- Global alert rules (apply to all devices)
- Device-specific overrides

**Device Type Alert Templates:**
- Pre-configured alert rules for device type
- New devices automatically inherit these rules
- Threshold values can use Device Type custom fields
- Alert rules reference schema fields by name

#### 2.6.2 Alert Rules

**Must support alerts based on:**
- Schema field thresholds (numeric comparisons)
- Geospatial boundaries
- Video events
- Battery level or comms health
- Device orientation (tilt detection)
- Custom expressions or scripts
- Time schedules
- Device Type custom field values

**Alert Rule Builder:**
- Visual rule builder UI
- Schema field picker (auto-populated from Device Type)
- Custom field conditions
- Multiple conditions with AND/OR logic
- Test alert rules against historical data

#### 2.6.3 Alert Delivery Channels

**Support sending alerts via:**
- Email
- SMS
- Microsoft Teams
- Webhooks/API endpoints
- In-app notifications

**Channel Configuration (Settings):**
- Configure delivery channel credentials
- Set up distribution lists
- Template customization per channel
- Escalation rules

#### 2.6.4 Alert Management

**Provide:**
- Alert history dashboard
- Acknowledgement workflow
- Suppression windows
- Rule templates library
- Alert analytics and statistics

**Special handling:**
- Maintenance mode automatically disables alerts for affected devices
- Device Type changes preserve alert history
- Bulk alert operations for device groups

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

#### 2.7.3 Edge Computing Platform

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

#### 2.7.4 Edge Processing Engine

**Local Data Processing Capabilities:**

**Pre-Processing Pipeline:**
- Data validation and sanitization at the edge
- Schema compliance checking before cloud transmission
- Data aggregation (reduce bandwidth by aggregating values locally)
- Outlier detection and anomaly flagging
- Data compression and encoding
- Time-series downsampling
- Unit conversion and normalization

**Edge Intelligence:**
- Local threshold-based alerting (critical alerts without cloud latency)
- Event detection and classification
- Pattern recognition on time-series data
- Local ML model inference (TensorFlow Lite, ONNX Runtime)
- Predictive maintenance calculations
- Statistical analysis (moving averages, standard deviation)

**Edge Storage & Buffering:**
- Local time-series database (SQLite, InfluxDB edge)
- Store-and-forward mechanism for intermittent connectivity
- Configurable retention policies (keep last N hours/days)
- Automatic data cleanup on successful upload
- Critical data prioritization during bandwidth constraints

**Edge Configuration:**
- Deploy processing rules via cloud UI
- A/B testing of edge logic before full rollout
- Version control and rollback capabilities
- Remote monitoring of edge compute health
- Resource usage metrics (CPU, memory, disk)

#### 2.7.5 Custom Logic & AI Module Framework

**Plugin Architecture:**

**Custom Data Processing Modules:**
- Plugin SDK for custom data processors
- Support for .NET assemblies, Python scripts, JavaScript/Node.js modules
- Sandboxed execution environment for security
- Module lifecycle management (load, execute, unload)
- Hot-reload capabilities without service restart

**AI/ML Model Management:**

**Model Registry:**
- Centralized repository for AI/ML models
- Support for multiple model formats:
  - ONNX (cross-platform)
  - TensorFlow/TensorFlow Lite
  - PyTorch
  - Scikit-learn (pickle)
  - Custom models via REST API
- Model versioning and A/B testing
- Model metadata (accuracy, latency, resource requirements)
- Model performance tracking and drift detection

**Model Deployment:**
- Deploy models to edge devices or cloud
- Automatic model optimization for target hardware
- Batch inference for efficiency
- Real-time inference with latency SLAs
- GPU acceleration support where available
- Model chaining (output of one model feeds another)

**Custom AI Modules:**
- **Anomaly Detection**: Train models on normal behavior, flag deviations
- **Predictive Maintenance**: Predict equipment failures based on sensor trends
- **Classification**: Categorize events, images, or data patterns
- **Regression**: Predict future values (forecasting)
- **Clustering**: Group similar devices or data patterns
- **Computer Vision**: Object detection, image classification, segmentation
- **NLP/LLM**: Text analysis, sentiment detection, entity extraction

**Custom Logic Framework:**

**Script-Based Logic:**
- JavaScript/TypeScript execution engine (V8 or Deno)
- Python script runner (isolated with resource limits)
- C# script compilation and execution (Roslyn)
- SQL-like query language for data transformations
- Low-code/no-code visual workflow builder

**Logic Types:**
- **Data Transformation**: Convert, enrich, or filter incoming data
- **Business Rules**: Apply conditional logic based on device context
- **Aggregation Functions**: Custom aggregations beyond standard (avg, sum, min, max)
- **Correlation Logic**: Combine data from multiple devices
- **Geofencing**: Trigger actions based on device location
- **Time-Based Actions**: Scheduled or cron-based logic execution

**Logic Configuration UI (Settings):**
```
Settings → Custom Logic
├── Data Processors
│   ├── List all processors
│   ├── Create new processor
│   │   ├── Choose type (script, compiled, model)
│   │   ├── Upload code/model file
│   │   ├── Configure inputs/outputs
│   │   ├── Set resource limits
│   │   └── Test with sample data
│   └── Assign to devices/device types
├── AI Models
│   ├── Model registry
│   ├── Upload new model
│   │   ├── Model file upload
│   │   ├── Input/output schema definition
│   │   ├── Performance benchmarks
│   │   └── Deployment targets (edge/cloud)
│   ├── Model versioning
│   └── Model monitoring
└── Workflows
    ├── Visual workflow builder
    ├── Trigger configuration
    └── Action chains
```

**Custom Module API:**

**Data Processor Interface:**
```csharp
public interface IDataProcessor
{
    string Name { get; }
    string Version { get; }
    Task<ProcessingResult> ProcessAsync(
        DeviceData input, 
        ProcessingContext context, 
        CancellationToken cancellationToken);
}

public class ProcessingContext
{
    public Device Device { get; set; }
    public DeviceType DeviceType { get; set; }
    public Dictionary<string, object> Configuration { get; set; }
    public ILogger Logger { get; set; }
    public IMetricsCollector Metrics { get; set; }
}
```

**AI Model Interface:**
```csharp
public interface IAIModel
{
    string ModelId { get; }
    string ModelType { get; }
    Task<InferenceResult> InferAsync(
        ModelInput input, 
        InferenceOptions options, 
        CancellationToken cancellationToken);
    Task WarmupAsync(); // Pre-load model
}
```

**Processing Pipeline:**

**Pipeline Configuration:**
- Chain multiple processors/models in sequence
- Parallel execution for independent steps
- Conditional routing based on intermediate results
- Error handling and fallback logic
- Dead-letter queue for failed processing

**Pipeline Stages:**
1. **Ingestion** → Data arrives from device
2. **Pre-Processing** → Data validation, normalization
3. **Custom Logic** → User-defined processors execute
4. **AI Inference** → Models run on processed data
5. **Post-Processing** → Enrich results, format outputs
6. **Storage** → Write to database
7. **Event Publishing** → Trigger alerts, webhooks

**Edge vs Cloud Processing:**

**Decision Criteria:**
- Latency requirements (edge for <100ms, cloud for batch)
- Bandwidth constraints (edge for high-frequency data)
- Model size and compute requirements
- Data privacy and compliance (edge for PII)
- Cost optimization (edge reduces cloud egress)

**Hybrid Processing:**
- Run lightweight models on edge
- Send reduced dataset to cloud for complex analysis
- Edge pre-filters data, cloud performs deep learning
- Cloud trains models, edge executes inference

**Security & Governance:**

**Module Security:**
- Code signing and verification
- Sandboxed execution with resource limits (CPU, memory, disk)
- Network access controls
- Audit logging of all module executions
- Module permissions (read-only vs read-write data access)

**Model Security:**
- Encrypted model storage
- Model access controls (which tenants/users can deploy)
- Model output validation
- Model tampering detection
- Intellectual property protection

**Performance & Monitoring:**

**Module Performance Metrics:**
- Execution time per invocation
- Success/failure rates
- Resource consumption (CPU, memory, I/O)
- Throughput (records processed per second)
- Error rates and types

**Model Performance Metrics:**
- Inference latency (P50, P95, P99)
- Accuracy/precision/recall (if ground truth available)
- Model drift detection (input distribution changes)
- Resource utilization per inference
- Cost per inference (cloud deployments)

**Developer Tools:**

**SDK & Documentation:**
- Comprehensive SDK for .NET, Python, JavaScript
- Code samples and starter templates
- Testing framework with mock data
- Local development environment
- CI/CD integration for automated deployment

**Testing Tools:**
- Unit testing framework for modules
- Integration testing with mock device data
- Performance benchmarking tools
- Load testing capabilities
- Model validation and accuracy testing

**Use Cases:**

**Example 1: Water Quality Monitoring**
- **Edge Logic**: Validate pH sensor readings, detect anomalies locally
- **Custom Processor**: Apply temperature compensation to pH values
- **AI Model**: Predict algae bloom risk based on multiple sensors
- **Action**: Trigger local alert if immediate danger, send enriched data to cloud

**Example 2: Predictive Maintenance**
- **Edge Logic**: Monitor vibration sensor for high-frequency anomalies
- **Custom Processor**: Calculate RMS, peak-to-peak, and FFT features
- **AI Model**: Classification model predicts bearing failure probability
- **Action**: Schedule maintenance when probability > 80%

**Example 3: Video Analytics**
- **Edge Logic**: Motion detection and frame extraction
- **Custom Processor**: Image pre-processing (resize, normalize)
- **AI Model**: Object detection (vehicles, people, safety equipment)
- **Action**: Count objects, detect safety violations, alert on anomalies

**Example 4: Energy Optimization**
- **Edge Logic**: Monitor power consumption patterns
- **Custom Processor**: Calculate cost based on time-of-use pricing
- **AI Model**: Forecast demand for next 24 hours
- **Action**: Optimize equipment scheduling to reduce costs

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

### 5.2 Settings Section (Configuration Management)

**Centralized Settings UI includes:**

**Device Configuration:**
- Device Types (create, edit, delete, clone)
- Custom field definitions per Device Type
- Protocol configuration templates
- Schema assignment to Device Types
- Firmware version management

**Alert Configuration:**
- Alert rule templates
- Delivery channel setup (email, SMS, Teams, webhooks)
- Distribution lists
- Escalation rules
- Alert thresholds per Device Type

**Data Configuration:**
- Schema Registry (create, edit, version schemas)
- Data validation rules
- Retention policies
- Export formats

**Integration Configuration:**
- MQTT broker settings
- OPC UA server connections
- Modbus/BACnet configurations
- Video stream sources (RTSP, HLS)
- CCTV system integrations (Genetec, Milestone)
- Third-party API credentials

**System Configuration:**
- User and role management
- Tenant settings (if multi-tenant)
- Backup and restore
- Audit log settings
- Performance tuning

**UI Navigation:**
```
Settings (top-level menu)
├── Device Types
│   ├── List all types
│   ├── Create new type
│   └── Edit type
│       ├── General settings
│       ├── Protocol configuration
│       ├── Schema selection
│       ├── Custom fields
│       └── Alert templates
├── Alert Rules
│   ├── Rule templates
│   ├── Delivery channels
│   └── Distribution lists
├── Schemas
│   ├── Browse schemas
│   ├── Create schema (wizard)
│   └── AI schema generation
├── Integrations
│   ├── MQTT brokers
│   ├── Industrial protocols
│   ├── Video sources
│   └── Third-party APIs
└── System
    ├── Users & roles
    ├── Tenants
    └── Audit logs
```

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
