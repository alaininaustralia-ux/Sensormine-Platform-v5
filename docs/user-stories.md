# SensorMine Platform - User Stories

## Epic Structure

This document organizes user stories into epics that align with the platform's functional requirements. Each story follows the format:

**As a** [user type]  
**I want** [goal]  
**So that** [benefit]

**Acceptance Criteria:**
- [Specific testable criteria]

---

## Epic 1: Device Type Configuration

### Story 1.1: Create Device Type
**As a** system administrator  
**I want** to create a Device Type that defines protocols, schemas, and custom fields  
**So that** I can standardize device configuration across multiple devices

**Acceptance Criteria:**
- Navigate to Settings → Device Types
- Create new Device Type with name and description
- Select primary protocol (MQTT, HTTP, WebSocket, OPC UA, Modbus, etc.)
- Configure protocol-specific settings (endpoints, auth, sampling rate)
- Assign data schema from Schema Registry
- Define custom metadata fields (name, type, validation rules, help text)
- Set field as required/optional
- Configure default alert rule templates
- Add tags for categorization
- Save Device Type
- Preview example device configuration
- Clone existing Device Type to create similar configuration

**Priority:** High  
**Story Points:** 8

---

### Story 1.2: Edit Device Type Configuration
**As a** system administrator  
**I want** to modify an existing Device Type's settings  
**So that** I can adapt to changing requirements without creating new types

**Acceptance Criteria:**
- Select Device Type from Settings → Device Types list
- View usage statistics (number of devices using this type)
- Edit general settings (name, description, tags)
- Update protocol configuration
- Change assigned schema (with version compatibility check)
- Add/remove/modify custom fields
- Warning if changes affect existing devices
- View version history of Device Type changes
- Rollback to previous configuration version
- Changes propagate to all devices of this type
- Audit log captures all modifications

**Priority:** High  
**Story Points:** 5

---

### Story 1.3: Schema Assignment to Device Type
**As a** system administrator  
**I want** to assign a data schema to a Device Type  
**So that** all devices of that type validate their data against the same structure

**Acceptance Criteria:**
- In Device Type editor, navigate to "Schema" section
- Browse available schemas from Schema Registry
- Search/filter schemas by name, device type tags
- Preview schema structure (fields, types, validation rules)
- Select schema version (or "Latest")
- Map schema fields to protocol-specific data points (optional)
- Set up field transformations if needed
- Test schema with sample device payload
- Save schema assignment
- All new devices of this type automatically use assigned schema
- Schema version upgrades require explicit admin action
- Backwards compatibility checking when changing schema

**Priority:** High  
**Story Points:** 5

---

### Story 1.4: Custom Field Definition for Device Type
**As a** system administrator  
**I want** to define custom metadata fields for a Device Type  
**So that** devices of that type collect consistent business context

**Acceptance Criteria:**
- In Device Type editor, navigate to "Custom Fields" section
- Add new custom field with properties:
  - Field name and label
  - Field type (text, number, boolean, date, list/dropdown)
  - Default value
  - Validation rules (min/max, regex, required)
  - Help text/tooltip
  - Conditional visibility (show if another field has certain value)
- Reorder fields (drag and drop)
- Set field as required or optional
- Preview field in device form
- Delete unused fields (with warning if data exists)
- Custom fields appear automatically in device registration form
- Mobile app reflects custom field configuration
- Fields are searchable and filterable in device list
- Export custom field definitions

**Priority:** High  
**Story Points:** 8

---

### Story 1.5: Alert Rule Templates for Device Type
**As a** system administrator  
**I want** to define default alert rules for a Device Type  
**So that** new devices automatically have appropriate alerting configured

**Acceptance Criteria:**
- In Device Type editor, navigate to "Alert Templates" section
- Create alert rule using visual rule builder:
  - Select schema field for threshold
  - Define comparison operator (>, <, =, between, etc.)
  - Set threshold value
  - Configure time window and evaluation frequency
  - Set alert severity (info, warning, critical)
  - Add multiple conditions with AND/OR logic
- Reference custom fields in alert conditions
- Configure alert delivery channels
- Set up escalation rules
- Test alert rule against historical data
- Enable/disable rule template
- New devices inherit enabled alert rules
- Devices can override inherited rules
- View alert rule usage across devices

**Priority:** Medium  
**Story Points:** 8

---

## Epic 2: Device Registration & Management

### Story 2.1: Device Registration via Mobile App
**As a** field technician  
**I want** to register a new device by selecting its Device Type and completing the dynamic form  
**So that** I can quickly onboard devices with correct configuration

**Acceptance Criteria:**
- Scan QR code or enter serial number to identify device
- Select Device Type from dropdown (search/filter enabled)
- Dynamic form loads showing custom fields defined in Device Type:
  - Required fields marked with asterisk
  - Field types render appropriately (text, number, date picker, dropdown, etc.)
  - Help text/tooltips display for each field
  - Conditional fields show/hide based on other field values
- Real-time validation of field inputs
- Location picker for GPS coordinates
- Device metadata automatically captured (registration date, technician ID)
- Preview configuration before submission
- Submit creates device entry in Device.API with:
  - Device Type association
  - All custom field values
  - Protocol configuration from Device Type
  - Schema assignment from Device Type
  - Inherited alert rules from Device Type
- Offline registration cached and synced when connectivity returns
- Success/failure feedback displayed
- Option to register another device of same type (pre-fill Device Type)

**Priority:** High  
**Story Points:** 8

---

### Story 2.2: Azure DPS Provisioning
**As a** Nexus device  
**I want** to automatically provision myself through Azure DPS  
**So that** I can securely connect without manual configuration

**Acceptance Criteria:**
- Device authenticates using X.509 certificates or symmetric keys
- DPS assigns device to appropriate IoT Hub
- Device receives connection string and certificates
- Device registers with Device.API upon successful provisioning
- Provisioning errors are logged and retryable

**Priority:** High  
**Story Points:** 8

---

### Story 2.3: Web UI Device Registration
**As a** system administrator  
**I want** to register devices through the web interface  
**So that** I can onboard devices from my desk

**Acceptance Criteria:**
- Navigate to Devices → Add New Device
- Select Device Type from dropdown with search
- Dynamic form renders based on Device Type custom fields
- All field validation from Device Type applies
- Upload device CSV for bulk registration
- CSV template auto-generated from Device Type fields
- Validation errors shown per-row in bulk upload
- Review and confirm bulk registration
- Progress indicator for bulk operations
- Summary of successful/failed registrations
- Option to retry failed registrations

**Priority:** High  
**Story Points:** 5

---

### Story 2.4: Edit Device Configuration
**As a** system administrator  
**I want** to edit a device's custom fields and settings  
**So that** I can update device metadata as conditions change

**Acceptance Criteria:**
- Select device from device list
- View current Device Type and custom field values
- Edit custom field values (respecting validation rules)
- Option to change Device Type (with warning about schema/config changes)
- If Device Type changes:
  - Show diff of field changes (added/removed fields)
  - Warn about schema compatibility
  - Confirm alert rule changes
  - Map old custom field values to new fields (if possible)
- Update location and deployment metadata
- Save changes with audit log entry
- Changes reflect immediately in device details
- Historical custom field values preserved

**Priority:** Medium  
**Story Points:** 5

---

### Story 2.5: Nexus Probe Configuration
**As a** system administrator  
**I want** to configure probe interfaces (RS485, RS232, OneWire, 4-20mA) on Nexus devices  
**So that** I can connect various industrial sensors

**Acceptance Criteria:**
- Select Nexus device (Device Type must be Nexus family)
- Navigate to "Probe Configuration" section
- UI provides probe slot selection (1-4 or based on device model)
- For each slot, configure:
  - Probe type (RS485, RS232, OneWire, 4-20mA, or None)
  - Probe name and description
  - Sampling rate
  - Data format/scaling
  - Mapping to schema fields (auto-suggested based on Device Type schema)
- Send configuration to device via MQTT command
- Device acknowledges configuration within timeout
- Configuration status indicator (pending, confirmed, failed)
- Configuration history maintained per device
- Test probe reading in real-time
- Validate probe data against Device Type schema
- Alert if probe data doesn't match expected schema fields

**Priority:** High  
**Story Points:** 8

---

### Story 2.6: Device State Management
**As a** operations manager  
**I want** to set devices to Active, Inactive, or Maintenance mode  
**So that** I can control data collection and alerting

**Acceptance Criteria:**
- Device state can be changed through Device.API
- Maintenance mode pauses data ingestion
- Maintenance mode disables all alerts for the device
- State changes are logged with timestamp and user
- State changes are reflected in device dashboard
- Scheduled maintenance windows can be configured

**Priority:** Medium  
**Story Points:** 5

---

### Story 1.5: Device Diagnostics Dashboard
**As a** field technician  
**I want** to view device diagnostics (battery, tilt, comms, last check-in)  
**So that** I can troubleshoot issues quickly

**Acceptance Criteria:**
- Dashboard shows battery level with status indicator
- Tilt/orientation status with visual representation
- Communication health (signal strength, last successful message)
- Last check-in timestamp
- Historical diagnostic data available
- Warning indicators for abnormal conditions
- Mobile app displays same diagnostics

**Priority:** High  
**Story Points:** 8

---

### Story 1.6: Device Command & Control
**As a** system administrator  
**I want** to send commands to Nexus devices (reboot, update sampling rate, firmware update)  
**So that** I can remotely manage device operations

**Acceptance Criteria:**
- Commands sent via MQTT to specific device
- Supported commands: reboot, set sampling rate, update firmware
- Command status tracked (pending, acknowledged, completed, failed)
- Command history maintained per device
- Bulk command execution for multiple devices
- Command timeout and retry logic

**Priority:** Medium  
**Story Points:** 8

---

### Story 1.7: Device Metadata Management
**As a** data analyst  
**I want** to add custom fields to devices (installation date, project code, owner)  
**So that** I can organize and filter devices by business context

**Acceptance Criteria:**
- Custom field types supported: text, numeric, boolean, date, list
- Custom fields can be defined per device type or globally
- Fields are searchable and filterable
- Mobile app can edit custom fields
- Custom fields appear in device details and exports
- Validation rules can be applied to fields

**Priority:** Medium  
**Story Points:** 5

---

### Story 1.8: Device Deprovisioning
**As a** system administrator  
**I want** to deprovision devices and choose to archive or delete their data  
**So that** I can manage device lifecycle and data retention

**Acceptance Criteria:**
- Deprovisioning removes device from active list
- Option to archive data (read-only) or permanently delete
- Archived data is queryable but not modifiable
- Deletion requires confirmation and admin privileges
- Audit log captures deprovisioning action
- Device can be re-provisioned with same serial number

**Priority:** Low  
**Story Points:** 5

---

### Story 1.9: Device Firmware Management
**As a** system administrator  
**I want** to manage and deploy firmware updates to Nexus devices  
**So that** devices stay secure and up-to-date

**Acceptance Criteria:**
- View current firmware version for all devices
- Upload new firmware packages
- Deploy firmware to individual devices or groups
- Schedule firmware updates for maintenance windows
- Rollback capability if update fails
- Device reports update progress and status
- Version history and release notes accessible

**Priority:** Medium  
**Story Points:** 13

---

### Story 1.10: Device Groups and Tags
**As a** operations manager  
**I want** to organize devices into groups and apply tags  
**So that** I can manage devices at scale

**Acceptance Criteria:**
- Create device groups (by location, type, customer, etc.)
- Apply multiple tags to devices
- Bulk operations on groups (configuration, firmware, alerts)
- Dynamic groups based on device properties
- Hierarchical group structures
- Tag-based filtering in all device views
- Import/export group configurations

**Priority:** Medium  
**Story Points:** 8

---

### Story 1.11: Device Templates
**As a** system administrator  
**I want** to create device templates with predefined configurations  
**So that** new devices can be provisioned consistently

**Acceptance Criteria:**
- Define template with probe configurations, schemas, and settings
- Apply template during device registration
- Modify templates without affecting existing devices
- Clone existing device configuration as template
- Template versioning and change tracking
- Export/import templates for reuse
- Template library with common configurations

**Priority:** Low  
**Story Points:** 8

---

## Epic 2: Data Ingestion & Modeling

### Story 2.1: MQTT Data Ingestion
**As a** Nexus device  
**I want** to publish telemetry data via MQTT  
**So that** my sensor readings reach the platform

**Acceptance Criteria:**
- Edge.Gateway subscribes to device MQTT topics
- Messages are validated against device schema
- Invalid messages are sent to dead letter queue
- Message rate limiting per device
- Support for batched messages
- Acknowledgment sent to device

**Priority:** High  
**Story Points:** 8

---

### Story 2.2: Schema Definition
**As a** data engineer  
**I want** to define payload schemas with field names, types, and units  
**So that** incoming data is validated and structured correctly

**Acceptance Criteria:**

**Backend (✅ Complete):**
- ✅ Schema Registry API with full CRUD operations
- ✅ Support for JSON Schema Draft 7 format
- ✅ Field definitions include: name, type, unit, description, validation rules
- ✅ Schema versioning (major.minor.patch semantic versioning)
- ✅ Schema validation service using NJsonSchema
- ✅ Repository layer with 21 passing tests
- ✅ EF Core migration for PostgreSQL

**Frontend (🔴 Not Started):**
- Schema list view with search, filter by name/status/tags
- Create schema wizard:
  - Step 1: Basic info (name, description, tags)
  - Step 2: JSON Schema editor with syntax validation
  - Step 3: Test schema with sample JSON data
  - Step 4: Review and create
- Edit schema workflow:
  - Load existing schema for editing
  - Create new version on save (semantic versioning)
  - Show diff between versions
- Schema detail page:
  - Display schema metadata and current version
  - Show all versions with changelog
  - Compare versions side-by-side
  - Delete schema (soft delete with confirmation)
- Schema testing panel:
  - Paste sample JSON data
  - Validate against schema
  - Display validation errors with line numbers
  - Show validated data structure
- Schema can be associated with device types (dropdown selector)
- Responsive design for mobile/tablet
- Loading states and error handling
- Toast notifications for CRUD operations

**Priority:** High  
**Story Points:** 8 (Backend) + 13 (Frontend) = 21 total

---

### Story 2.3: Schema Evolution
**As a** data engineer  
**I want** to update schemas without breaking existing devices  
**So that** I can evolve data models over time

**Acceptance Criteria:**
- Backward compatible changes allowed (add optional fields)
- Breaking changes require major version increment
- Devices specify schema version in messages
- Platform supports multiple active schema versions
- Deprecation warnings for old schemas
- Migration tools for data transformation

**Priority:** Medium  
**Story Points:** 8

---

### Story 2.4: Multi-Protocol Ingestion
**As a** integration engineer  
**I want** to ingest data via HTTPS, WebSockets, and file uploads  
**So that** I can support diverse data sources

**Acceptance Criteria:**
- REST API endpoint for JSON/CSV data ingestion
- WebSocket endpoint for streaming data
- File upload supports CSV, JSON, binary formats
- Each protocol validates against schemas
- Rate limiting and authentication per protocol
- Ingestion metrics tracked per protocol

**Priority:** Medium  
**Story Points:** 13

---

### Story 2.5: Industrial Protocol Connectors
**As a** industrial systems engineer  
**I want** to connect OPC UA, Modbus, BACnet, and EtherNet/IP devices  
**So that** I can integrate existing industrial equipment

**Acceptance Criteria:**
- OPC UA client connector with browsing capability
- Modbus TCP and RTU connector
- BACnet IP connector
- EtherNet/IP connector
- Each connector maps protocol data to schema
- Connector configuration UI
- Connection health monitoring

**Priority:** Medium  
**Story Points:** 21

---

### Story 2.6: Batch Data Import
**As a** data analyst  
**I want** to upload historical data via CSV or JSON files  
**So that** I can backfill data for analysis

**Acceptance Criteria:**
- File upload UI with drag-and-drop
- CSV/JSON file validation
- Field mapping interface
- Batch processing with progress indicator
- Error reporting for invalid rows
- Rollback capability for failed imports

**Priority:** Low  
**Story Points:** 8

---

### Story 2.7: Time-Series Query API
**As a** application developer  
**I want** to query time-series data with filters and aggregations  
**So that** I can build custom applications

**Acceptance Criteria:**
- REST API supports time range queries
- Filter by device, location, custom fields
- Aggregation functions: avg, min, max, sum, count
- Grouping by time interval (1s, 1m, 1h, 1d)
- Pagination support
- Response includes metadata and units
- Query performance < 1 second for recent data

**Priority:** High  
**Story Points:** 13

---

### Story 2.8: Geospatial Filtering
**As a** GIS analyst  
**I want** to query devices and data within geographic boundaries  
**So that** I can analyze regional patterns

**Acceptance Criteria:**
- Query API supports bounding box queries
- Support for polygon and radius queries
- Devices have latitude/longitude fields
- Query returns devices and their latest data
- Integration with mapping visualization
- Performance optimized with spatial indexes

**Priority:** Medium  
**Story Points:** 8

---

### Story 2.9: Data Quality Monitoring
**As a** data engineer  
**I want** to monitor data quality metrics (completeness, timeliness, accuracy)  
**So that** I can identify and resolve data issues

**Acceptance Criteria:**
- Dashboard shows data quality KPIs per device/schema
- Metrics: message rate, missing fields, out-of-range values, staleness
- Configurable quality rules and thresholds
- Alert when quality degrades
- Historical quality trends
- Data quality reports

**Priority:** Medium  
**Story Points:** 13

---

### Story 2.10: Schema Marketplace
**As a** platform user  
**I want** to browse and import pre-built schemas for common sensors  
**So that** I don't have to create schemas from scratch

**Acceptance Criteria:**
- Public schema repository/marketplace
- Browse schemas by category (environmental, industrial, video, etc.)
- Preview schema definition and sample data
- One-click import to tenant
- Rate and review schemas
- Contribute custom schemas to marketplace
- Version control for marketplace schemas

**Priority:** Low  
**Story Points:** 13

---

## Epic 3: Video Processing & AI/ML Analytics

### Story 3.1: RTSP Stream Ingestion
**As a** video engineer  
**I want** to configure RTSP streams from IP cameras  
**So that** they can be processed by the platform

**Acceptance Criteria:**
- UI for adding RTSP stream URLs
- Authentication support (username/password)
- Stream health monitoring
- Automatic reconnection on failure
- Multiple streams per location
- Stream metadata (resolution, FPS, codec)

**Priority:** High  
**Story Points:** 8

---

### Story 3.2: Genetec Integration
**As a** security manager  
**I want** to integrate with Genetec Security Center  
**So that** I can leverage existing camera infrastructure

**Acceptance Criteria:**
- Connector authenticates with Genetec API
- Automatically discover cameras
- Stream video from Genetec cameras
- Sync camera metadata (name, location)
- Handle Genetec events
- Support for Genetec credentials vault

**Priority:** High  
**Story Points:** 13

---

### Story 3.3: Milestone Integration
**As a** security manager  
**I want** to integrate with Milestone XProtect  
**So that** I can use Milestone-managed cameras

**Acceptance Criteria:**
- Connector authenticates with Milestone API
- Discover and list available cameras
- Stream video from Milestone
- Access recorded video
- Sync camera metadata
- Handle Milestone events and alarms

**Priority:** High  
**Story Points:** 13

---

### Story 3.4: Video File Upload
**As a** analyst  
**I want** to upload video files (MP4, MOV, MKV) for processing  
**So that** I can analyze historical footage

**Acceptance Criteria:**
- File upload UI with progress bar
- Support for MP4, MOV, MKV, AVI formats
- File size limits and validation
- Automatic metadata extraction (duration, resolution, codec)
- Storage in object storage (MinIO/S3)
- Video playback in browser

**Priority:** Medium  
**Story Points:** 8

---

### Story 3.5: Real-Time Object Detection
**As a** safety manager  
**I want** to run object detection models on live video streams  
**So that** I can detect people, vehicles, and safety hazards in real-time

**Acceptance Criteria:**
- Configure ML model per camera
- Support YOLO, SSD, Faster R-CNN models
- Real-time inference (< 2 second latency)
- Detection events include: object type, confidence, bounding box, timestamp
- Events stored in time-series database
- Events displayed on video timeline

**Priority:** High  
**Story Points:** 13

---

### Story 3.6: Custom ML Model Deployment
**As a** ML engineer  
**I want** to deploy custom ONNX models  
**So that** I can run specialized detection algorithms

**Acceptance Criteria:**
- UI for uploading ONNX model files
- Model metadata: name, version, input/output spec
- Model testing interface
- Model assignment to cameras
- Model performance metrics (inference time, GPU usage)
- Model versioning and rollback

**Priority:** Medium  
**Story Points:** 13

---

### Story 3.7: Video Event Search
**As a** security analyst  
**I want** to search video events by object type, time, and location  
**So that** I can investigate incidents

**Acceptance Criteria:**
- Search UI with filters: date range, camera, object type, confidence threshold
- Results show thumbnail, timestamp, camera, confidence
- Click to view video clip
- Export search results to CSV
- Save search queries as templates
- Pagination for large result sets

**Priority:** High  
**Story Points:** 8

---

### Story 3.8: Behavioral Analytics
**As a** operations manager  
**I want** to detect unusual behaviors (loitering, wrong-way movement, crowd formation)  
**So that** I can respond to potential issues

**Acceptance Criteria:**
- Configurable behavior rules per camera
- Support for: loitering detection, zone crossing, crowd detection
- Behavior events trigger alerts
- Events include video snapshot
- Behavior analytics dashboard
- Tunable sensitivity parameters

**Priority:** Medium  
**Story Points:** 13

---

### Story 3.9: Near-Miss Detection
**As a** safety officer  
**I want** to detect near-miss incidents (close calls between people/vehicles)  
**So that** I can improve safety protocols

**Acceptance Criteria:**
- Configurable proximity thresholds
- Detection of person-vehicle, person-equipment near-misses
- Events captured with video snippet
- Near-miss incident report
- Trend analysis of near-miss locations
- Integration with alerting system

**Priority:** Medium  
**Story Points:** 13

---

### Story 3.10: Edge Video Processing
**As a** system architect  
**I want** to run video inference on edge devices  
**So that** I can reduce bandwidth and cloud costs

**Acceptance Criteria:**
- Deploy ML models to edge devices
- Edge device performs local inference
- Only events/alerts sent to cloud
- Edge device buffers video locally
- Remote model updates
- Edge health monitoring

**Priority:** Low  
**Story Points:** 21

---

### Story 3.11: Video Retention Policies
**As a** compliance officer  
**I want** to configure video retention policies (duration, quality, archival)  
**So that** I comply with data retention regulations

**Acceptance Criteria:**
- Define retention period per camera or camera group
- Automatic deletion after retention period
- Archive to cold storage option
- Reduced resolution/frame rate for long-term storage
- Legal hold capability to prevent deletion
- Audit log of retention policy actions
- Storage usage dashboard

**Priority:** Medium  
**Story Points:** 8

---

### Story 3.12: Privacy Masking and Redaction
**As a** privacy officer  
**I want** to mask or redact sensitive areas in video feeds  
**So that** I protect individual privacy

**Acceptance Criteria:**
- Define masking zones per camera (static areas)
- Dynamic face blurring option
- License plate redaction
- Masking applied in real-time and recorded video
- Different masking levels for different user roles
- Audit log of who viewed unmasked video
- Export masked video for third parties

**Priority:** High  
**Story Points:** 13

---

### Story 3.13: Video Analytics Model Training
**As a** ML engineer  
**I want** to train custom video analytics models using platform data  
**So that** I can create site-specific detection models

**Acceptance Criteria:**
- Label video frames for training data
- Export labeled dataset
- Integration with model training pipelines
- Upload and test trained models
- A/B testing of model versions
- Model performance metrics dashboard
- Automated retraining workflows

**Priority:** Low  
**Story Points:** 21

---

## Epic 4: Visualization & Dashboards

### Story 4.1: Dashboard Builder
**As a** operations manager  
**I want** to create custom dashboards with drag-and-drop widgets  
**So that** I can visualize data relevant to my operations

**Acceptance Criteria:**

**Dashboard Core (✅ Complete):**
- ✅ Drag-and-drop dashboard editor using react-grid-layout
- ✅ Widget library: charts, tables, maps, video feeds, gauges
- ✅ Dashboard layouts with responsive grid
- ✅ Save and share dashboards
- ✅ Dashboard toolbar with edit/view modes

**Widget Data Source Configuration (🔴 Not Started):**
- Widget configuration panel with tabs:
  - Data Source tab
  - Filters tab
  - Styling tab
- Data Source Configuration:
  - Step 1: Select data source type (Schema, Device, Query, API)
  - Step 2: Schema selector (if schema-based):
    - Dropdown to select schema
    - Display schema version and fields
    - Filter devices by selected schema
  - Step 3: Field mapping:
    - Drag schema fields to widget properties
    - Map fields to X-axis, Y-axis, series, labels, etc.
    - Set aggregation function per field (avg, sum, min, max, count)
    - Configure time range and grouping interval
  - Step 4: Device/data selection:
    - Multi-select devices using selected schema
    - Filter by device tags, groups, location
    - Preview live data from selected devices
- Real-time data preview in configuration panel:
  - Show sample data matching schema structure
  - Update preview when changing field mappings
  - Display validation errors if data doesn't match schema
- Save widget configuration:
  - Store schema ID, version, field mappings
  - Store device filters and selections
  - Store aggregation and time range settings
- Widget refresh settings:
  - Auto-refresh interval (5s, 10s, 30s, 1m, 5m, manual)
  - Last updated timestamp display
  - Manual refresh button
- Schema version handling:
  - Widget continues working if schema updated (backward compatible)
  - Warning indicator if schema has breaking changes
  - Option to update widget to new schema version

**Dashboard Templates (🔴 Not Started):**
- Template library for common use cases
- Templates include pre-configured widgets with schema bindings

**Priority:** High  
**Story Points:** 21 (Core Complete) + 13 (Data Source Config) = 34 total

---

### Story 4.2: Time-Series Charts
**As a** analyst  
**I want** to create line, bar, and scatter charts for time-series data  
**So that** I can visualize trends and patterns

**Acceptance Criteria:**
- Chart types: line, bar, area, scatter, step
- Multiple series per chart
- Time range selection and zooming
- Aggregation intervals configurable
- Chart legends and axis labels
- Export chart as image or data

**Priority:** High  
**Story Points:** 13

---

### Story 4.3: Video Timeline Widget
**As a** security analyst  
**I want** to see video events overlaid on a timeline  
**So that** I can correlate events with video footage

**Acceptance Criteria:**
- Timeline shows video events as markers
- Events color-coded by type
- Click event to jump to video timestamp
- Zoom and pan timeline
- Filter events by type
- Multiple camera timelines in sync

**Priority:** High  
**Story Points:** 13

---

### Story 4.4: 3D CAD Viewer
**As a** facility manager  
**I want** to visualize devices on a 3D CAD model of my facility  
**So that** I can see device placement in context

**Acceptance Criteria:**
- Upload GLTF/OBJ CAD models
- Place device markers on 3D model
- Click device for details and live data
- Color-code devices by status or value
- Rotate, zoom, pan 3D view
- Layer controls for device types

**Priority:** Medium  
**Story Points:** 21

---

### Story 4.5: LiDAR Point Cloud Viewer
**As a** surveyor  
**I want** to view LiDAR point clouds (LAS/LAZ files)  
**So that** I can visualize 3D scan data

**Acceptance Criteria:**
- Upload LAS/LAZ files
- Render point cloud in browser
- Color by elevation, intensity, or classification
- Navigation controls (orbit, pan, zoom)
- Measurement tools
- Integrate device locations in point cloud

**Priority:** Low  
**Story Points:** 21

---

### Story 4.6: GIS Map Widget
**As a** GIS analyst  
**I want** to display devices on an interactive map  
**So that** I can see geographic distribution

**Acceptance Criteria:**
- Map widget using Leaflet or Mapbox
- Device markers with clustering
- Click marker for device details
- Color-code by device type or status
- Heat maps for data values
- Layer controls for device types
- Geofencing visualization

**Priority:** High  
**Story Points:** 13

---

### Story 4.7: Gauge and KPI Widgets
**As a** operations manager  
**I want** to display key metrics as gauges and KPIs  
**So that** I can monitor system health at a glance

**Acceptance Criteria:**
- Gauge widget types: circular, linear, bullet
- KPI cards with current value and trend
- Configurable thresholds (green, yellow, red)
- Comparison to historical average or target
- Auto-refresh intervals
- Animated transitions

**Priority:** Medium  
**Story Points:** 8

---

### Story 4.8: Dashboard Templates
**As a** new user  
**I want** to use pre-built dashboard templates  
**So that** I can get started quickly

**Acceptance Criteria:**
- Template library with categories (safety, operations, maintenance)
- Preview template before applying
- Templates auto-populate with user's devices
- Templates are customizable after creation
- Export/import custom templates
- Community template sharing (optional)

**Priority:** Low  
**Story Points:** 8

---

### Story 4.9: Real-Time Dashboard Updates
**As a** control room operator  
**I want** dashboards to update in real-time without manual refresh  
**So that** I always see current data

**Acceptance Criteria:**
- WebSocket or SignalR for real-time updates
- Configurable refresh intervals per widget
- Visual indicator when data updates
- Automatic reconnection if connection lost
- Bandwidth-efficient delta updates
- Pause/resume real-time updates

**Priority:** High  
**Story Points:** 13

---

### Story 4.10: Dashboard Annotations and Notes
**As a** operations manager  
**I want** to add annotations and notes to dashboards and charts  
**So that** I can document observations and decisions

**Acceptance Criteria:**
- Add text annotations to any widget
- Pin notes to specific timestamps or locations
- Attach notes to alerts or events
- Share notes with team members
- Search notes across dashboards
- Export dashboards with annotations
- Note edit history

**Priority:** Low  
**Story Points:** 8

---

### Story 4.11: Dashboard Components for Device Types and Devices
**As a** system administrator or operations manager  
**I want** to associate dashboard widgets/components with Device Types or specific Devices  
**So that** I can automatically display relevant visualizations when viewing a device or device type

**Acceptance Criteria:**

**Device Type Dashboard Components:**
- In Device Type configuration (Settings → Device Types), add "Dashboard Components" section
- Define default dashboard widgets for all devices of this type:
  - Select from widget library (charts, gauges, tables, maps)
  - Configure widget data bindings to Device Type schema fields
  - Set default time ranges and refresh intervals
  - Define widget layout/positioning
  - Preview widgets with sample data
- Save component configuration as part of Device Type
- All devices of this type inherit these dashboard components
- Device Type components appear in:
  - Device Type detail view
  - Device list view (summary widgets)
  - Device detail view (as default dashboard)

**Device-Specific Dashboard Components:**
- In individual Device detail view, add "Custom Dashboard" section
- Option to use Device Type defaults or create custom layout
- Add/remove/configure widgets specific to this device:
  - Override inherited widgets from Device Type
  - Add device-specific widgets
  - Rearrange widget layout
  - Configure device-specific thresholds/alerts
- Device-level customizations take precedence over Device Type defaults
- Show indicator if using Device Type defaults vs. custom layout

**Widget Data Binding:**
- Widgets automatically bind to schema fields from Device Type
- Support for:
  - Real-time data display (latest values)
  - Historical data visualization (time-series charts)
  - Aggregations (avg, min, max, sum)
  - Multiple fields per widget (multi-series charts)
- Automatic field mapping when schema changes (with validation)
- Warning if schema field removed that widget depends on

**Component Library Integration:**
- Pre-built component templates for common sensor types:
  - Temperature sensors → line chart + gauge
  - Flow sensors → area chart + totalizer
  - Pressure sensors → gauge + threshold indicators
  - GPS/location → map widget
  - Video cameras → live stream + event timeline
- Component templates automatically suggested based on Device Type protocol and schema
- One-click apply templates to Device Type or Device

**Navigation & Discovery:**
- Device list view shows mini-widgets (sparklines, gauges) from Device Type config
- Click device to see full dashboard with all components
- Device Type page shows aggregated view across all devices of that type
- Quick filter to show only devices with custom dashboards
- Search/filter devices by dashboard metrics

**Permissions & Sharing:**
- Dashboard component configurations respect user roles
- Admin can lock Device Type dashboard components (prevent device-level overrides)
- Share dashboard component configurations between Device Types
- Export/import dashboard configurations

**Performance:**
- Lazy load dashboard components (only fetch data when visible)
- Cache component configurations
- Optimize queries for multiple devices displaying same widget
- Paginate device list with many widgets

**Priority:** High  
**Story Points:** 13

---

## Epic 5: LLM Interaction & Analytics

### Story 5.1: Natural Language Query
**As a** business user  
**I want** to ask questions in plain English about my data  
**So that** I don't need to learn query syntax

**Acceptance Criteria:**
- Chat interface for natural language queries
- Understands device schemas and metadata
- Generates appropriate SQL/API queries
- Returns results as tables or charts
- Handles follow-up questions with context
- Example prompts provided

**Priority:** High  
**Story Points:** 21

---

### Story 5.2: Automatic Dashboard Generation
**As a** manager  
**I want** to ask "Create a dashboard for all water level sensors"  
**So that** dashboards are generated automatically

**Acceptance Criteria:**
- LLM interprets dashboard request
- Identifies relevant devices and data
- Generates appropriate widgets
- Creates dashboard layout
- User can modify generated dashboard
- Dashboard naming suggestions

**Priority:** Medium  
**Story Points:** 21

---

### Story 5.3: Data Summarization
**As a** executive  
**I want** to ask "Summarize this week's safety incidents"  
**So that** I get a concise overview

**Acceptance Criteria:**
- LLM queries relevant data
- Generates narrative summary
- Includes key statistics
- Highlights anomalies
- Provides visualizations
- Summary can be exported to PDF

**Priority:** Medium  
**Story Points:** 13

---

### Story 5.4: Maintenance Recommendations
**As a** maintenance manager  
**I want** to ask "Which devices need maintenance?"  
**So that** I get proactive maintenance suggestions

**Acceptance Criteria:**
- LLM analyzes device diagnostics
- Identifies devices with issues (low battery, poor signal)
- Considers maintenance schedules
- Prioritizes recommendations
- Provides reasoning for each recommendation
- Export to work order system

**Priority:** Medium  
**Story Points:** 13

---

### Story 5.5: Schema Understanding
**As a** data engineer  
**I want** the LLM to understand my custom schemas and fields  
**So that** it provides accurate answers

**Acceptance Criteria:**
- LLM ingests schema definitions
- Understands field names, types, units
- Recognizes custom fields
- Handles schema versioning
- Learns from user corrections
- Schema context in responses

**Priority:** High  
**Story Points:** 13

---

### Story 5.6: Anomaly Detection Suggestions
**As a** data analyst  
**I want** the LLM to suggest anomalies in my data  
**So that** I can investigate unusual patterns

**Acceptance Criteria:**
- LLM analyzes time-series data for anomalies
- Suggests statistical outliers
- Identifies temporal patterns (time-of-day, seasonality)
- Explains why data point is anomalous
- Recommend alert rules based on anomalies
- Historical anomaly archive

**Priority:** Low  
**Story Points:** 21

---

## Epic 6: Alerting & Notifications (Settings-Based Configuration)

### Story 6.1: Alert Rule Configuration in Settings
**As a** system administrator  
**I want** to configure alert rules in the Settings section  
**So that** I can manage all alerting centrally

**Acceptance Criteria:**
- Navigate to Settings → Alert Rules
- View list of all alert rule templates
- Filter by Device Type, severity, status
- Create new alert rule template:
  - Rule name and description
  - Associated Device Type (or "Global")
  - Schema field selection (auto-populated from Device Type)
  - Condition builder (threshold, comparison, custom expression)
  - Severity level (info, warning, critical)
  - Evaluation frequency and time windows
  - Delivery channels (email, SMS, Teams, webhook)
- Test alert rule against sample data
- Enable/disable rule template
- Clone existing rule for similar configuration
- View rule usage (which devices have this rule)
- Audit log of rule changes

**Priority:** High  
**Story Points:** 8

---

### Story 6.2: Alert Delivery Channel Configuration
**As a** system administrator  
**I want** to configure alert delivery channels in Settings  
**So that** alerts can be sent through various communication methods

**Acceptance Criteria:**
- Navigate to Settings → Alert Rules → Delivery Channels
- Configure Email:
  - SMTP server settings
  - From address and display name
  - Email template editor
  - Test email delivery
- Configure SMS:
  - Provider selection (Twilio, AWS SNS, etc.)
  - API credentials
  - Default sender number
  - Test SMS delivery
- Configure Microsoft Teams:
  - Webhook URL configuration
  - Message card template editor
  - Test Teams message
- Configure Webhooks:
  - Endpoint URL
  - Authentication method (API key, OAuth, etc.)
  - Custom headers
  - Payload template
  - Test webhook delivery
- Create distribution lists:
  - Name and description
  - Member list (emails, phone numbers)
  - Channel preferences per member
- Associate distribution lists with alert rules

**Priority:** High  
**Story Points:** 13

---

### Story 6.3: Device Type Alert Templates
**As a** system administrator  
**I want** to define default alert rules for each Device Type  
**So that** new devices automatically have appropriate alerts

**Acceptance Criteria:**
- In Settings → Device Types → [Device Type] → Alert Templates
- View alert rules inherited by this Device Type
- Add new alert rule template specific to this type
- Reference Device Type custom fields in conditions
- Reference schema fields (auto-populated)
- Multi-condition rules with AND/OR logic
- Set default thresholds using custom field values
- Enable/disable alert inheritance for new devices
- Preview which devices will be affected
- Apply alert template to existing devices (bulk operation)
- Devices can override inherited alerts

**Priority:** High  
**Story Points:** 8

---

### Story 6.4: Threshold Alerts
**As a** operations manager  
**I want** to create alerts when sensor values exceed thresholds  
**So that** I'm notified of abnormal conditions

**Acceptance Criteria:**
- Create alert rule in Settings (Story 6.1)
- Visual rule builder:
  - Select schema field from dropdown
  - Choose comparison operator (>, <, =, !=, between, outside)
  - Set threshold value
  - Configure time window (e.g., "for 5 minutes")
  - Add multiple conditions with AND/OR
- Test rule against historical device data
- Associate with Device Type or specific devices
- Configure delivery channels and recipients
- Set alert cooldown period
- Enable rate limiting
- Save and activate rule
- New devices of associated Device Type inherit rule

**Priority:** High  
**Story Points:** 5

---

### Story 6.2: Geofence Alerts
**As a** security manager  
**I want** to trigger alerts when devices move outside defined areas  
**So that** I can detect unauthorized movement

**Acceptance Criteria:**
- Draw geofence on map (polygon or circle)
- Alert when device enters or exits geofence
- Multiple geofences per device
- Alert includes device location and map
- Geofence violations logged
- Snooze option for temporary movements

**Priority:** Medium  
**Story Points:** 13

---

### Story 6.3: Video Event Alerts
**As a** safety manager  
**I want** to receive alerts for specific video detections  
**So that** I can respond to safety events

**Acceptance Criteria:**
- Configure alerts per detection type (person, vehicle, behavior)
- Confidence threshold filter
- Time-based rules (alert only during certain hours)
- Alert includes video snapshot
- Rate limiting to prevent alert flooding
- Alert aggregation for repeated events

**Priority:** High  
**Story Points:** 13

---

### Story 6.4: Battery and Health Alerts
**As a** field technician  
**I want** to receive alerts for low battery or device health issues  
**So that** I can perform maintenance proactively

**Acceptance Criteria:**
- Alert for battery level below threshold
- Alert for communication failures
- Alert for device tilt/orientation changes
- Alert for firmware update required
- Grouped alerts for multiple devices
- Maintenance mode disables these alerts

**Priority:** High  
**Story Points:** 8

---

### Story 6.5: Email Notifications
**As a** manager  
**I want** to receive alert notifications via email  
**So that** I stay informed when away from the platform

**Acceptance Criteria:**
- Configure email recipients per alert rule
- Email includes alert details and link to platform
- HTML email template with branding
- Attachments for snapshots/charts
- Email delivery confirmation
- Unsubscribe option

**Priority:** High  
**Story Points:** 8

---

### Story 6.6: SMS Notifications
**As a** on-call engineer  
**I want** to receive critical alerts via SMS  
**So that** I'm notified immediately

**Acceptance Criteria:**
- Configure phone numbers per alert rule
- SMS for critical alerts only (rate limited)
- SMS includes concise alert summary and link
- Integration with Twilio or similar
- SMS delivery status tracked
- Opt-out capability

**Priority:** Medium  
**Story Points:** 8

---

### Story 6.7: Microsoft Teams Integration
**As a** team lead  
**I want** to send alerts to Microsoft Teams channels  
**So that** the team sees notifications in their workflow

**Acceptance Criteria:**
- Configure Teams webhook per alert rule
- Alert posted as adaptive card
- Card includes alert details, severity, timestamp
- Action buttons: acknowledge, view in platform
- @mention users for critical alerts
- Separate channels for different alert types

**Priority:** Medium  
**Story Points:** 8

---

### Story 6.8: Alert Acknowledgment
**As a** operator  
**I want** to acknowledge alerts to indicate I'm handling them  
**So that** others know the alert is being addressed

**Acceptance Criteria:**
- Acknowledge button on alert
- Acknowledgment records user and timestamp
- Alert status changes to "Acknowledged"
- Acknowledged alerts visually distinct
- History of all acknowledgments
- Optional notes on acknowledgment

**Priority:** Medium  
**Story Points:** 5

---

### Story 6.9: Alert Suppression Windows
**As a** system administrator  
**I want** to suppress alerts during maintenance windows  
**So that** we don't get false alarms

**Acceptance Criteria:**
- Schedule suppression windows (start/end time)
- Recurring suppression schedules (e.g., every Sunday)
- Suppression per device or alert rule
- Suppressed alerts logged but not sent
- Visual indicator during suppression
- Override option for critical alerts

**Priority:** Medium  
**Story Points:** 5

---

### Story 6.10: Alert Rule Templates
**As a** operations manager  
**I want** to use pre-configured alert rule templates  
**So that** I can quickly set up common alerts

**Acceptance Criteria:**
- Template library (high water, low battery, motion detection)
- Templates auto-populate with device selection
- Templates are customizable
- Save custom templates
- Template categories and search
- Import/export templates

**Priority:** Low  
**Story Points:** 5

---

### Story 6.11: Alert Escalation Workflows
**As a** incident manager  
**I want** to configure alert escalation policies  
**So that** critical alerts reach the right people

**Acceptance Criteria:**
- Define escalation levels (L1, L2, L3)
- Time-based escalation (if not acknowledged in X minutes)
- Severity-based routing
- On-call schedule integration
- Multiple notification channels per level
- Escalation history tracking
- Override escalation for specific alerts

**Priority:** Medium  
**Story Points:** 13

---

### Story 6.12: Alert Aggregation and Deduplication
**As a** operations manager  
**I want** to aggregate similar alerts to avoid alert fatigue  
**So that** I'm not overwhelmed with redundant notifications

**Acceptance Criteria:**
- Group related alerts (same device, same condition)
- Configurable aggregation window (time-based)
- Single notification for grouped alerts
- Show count of grouped alerts
- Expand to see individual alerts in group
- Deduplicate identical alerts
- Smart aggregation using ML

**Priority:** Medium  
**Story Points:** 13

---

## Epic 7: Industrial Connectivity & Edge Computing

### Story 7.1: OPC UA Client Configuration
**As a** industrial engineer  
**I want** to connect to OPC UA servers and browse their node tree  
**So that** I can integrate SCADA and PLC data

**Acceptance Criteria:**
- UI for OPC UA server configuration (endpoint, credentials)
- Browse OPC UA node tree
- Select nodes to subscribe to
- Map OPC UA data to platform schemas
- Connection health monitoring
- Support for security policies (None, Basic256, Basic256Sha256)

**Priority:** High  
**Story Points:** 13

---

### Story 7.2: Modbus Connector
**As a** automation engineer  
**I want** to connect Modbus TCP and RTU devices  
**So that** I can collect data from PLCs and sensors

**Acceptance Criteria:**
- Configure Modbus connection (IP/port or serial port)
- Define register mappings (holding, input, coil)
- Specify data types (int16, uint16, float32)
- Polling interval configuration
- Error handling and retries
- Modbus diagnostics (read/write counts, errors)

**Priority:** High  
**Story Points:** 13

---

### Story 7.3: BACnet Integration
**As a** building automation engineer  
**I want** to connect to BACnet devices  
**So that** I can integrate HVAC and building systems

**Acceptance Criteria:**
- BACnet IP discovery
- Read BACnet object properties
- Subscribe to BACnet COV (Change of Value)
- Map BACnet points to platform
- BACnet device list and status
- Support for BACnet priority array

**Priority:** Medium  
**Story Points:** 13

---

### Story 7.4: EtherNet/IP Connector
**As a** industrial network engineer  
**I want** to integrate EtherNet/IP devices  
**So that** I can collect data from Allen-Bradley and Rockwell systems

**Acceptance Criteria:**
- Configure EtherNet/IP connection
- Tag browsing
- Implicit and explicit messaging
- Data type mapping
- Connection health monitoring
- Support for multiple connections

**Priority:** Medium  
**Story Points:** 13

---

### Story 7.5: External MQTT Broker Integration
**As a** IoT architect  
**I want** to connect to external MQTT brokers  
**So that** I can integrate third-party IoT systems

**Acceptance Criteria:**
- Configure external broker (host, port, credentials)
- Subscribe to topics with wildcards
- TLS/SSL support
- QoS level configuration
- Topic-to-schema mapping
- Broker connection monitoring

**Priority:** Medium  
**Story Points:** 8

---

### Story 7.6: Edge Device Management
**As a** system administrator  
**I want** to remotely manage edge devices  
**So that** I can deploy and update edge workloads

**Acceptance Criteria:**
- Edge device registration and discovery
- View edge device status (CPU, memory, disk)
- Deploy containers to edge devices
- Update edge software remotely
- View edge device logs
- Rollback deployments

**Priority:** Medium  
**Story Points:** 13

---

### Story 7.7: Edge Model Deployment
**As a** ML engineer  
**I want** to deploy ML models to edge devices  
**So that** inference happens locally

**Acceptance Criteria:**
- Select model for edge deployment
- Push model to edge devices
- Configure inference parameters
- Monitor inference performance
- Update models remotely
- Edge model versioning

**Priority:** Medium  
**Story Points:** 13

---

### Story 7.8: Edge Data Buffering
**As a** reliability engineer  
**I want** edge devices to buffer data during connectivity loss  
**So that** no data is lost

**Acceptance Criteria:**
- Edge device stores data locally when offline
- Configurable buffer size and retention
- Automatic sync when connection restored
- Buffer overflow handling (FIFO)
- Buffer status monitoring
- Manual buffer flush option

**Priority:** High  
**Story Points:** 8

---

### Story 7.9: Cloud Provider Agnostic Deployment
**As a** DevOps engineer  
**I want** to deploy the platform on Azure, AWS, or on-premises  
**So that** I'm not locked into a single cloud

**Acceptance Criteria:**
- Deployment scripts for Azure, AWS, GCP
- Infrastructure as Code (Terraform)
- Cloud-agnostic storage abstractions
- Cloud-agnostic message broker config
- On-premises installation guide
- Migration tools between clouds

**Priority:** High  
**Story Points:** 21

---

### Story 7.10: Air-Gapped Deployment
**As a** security architect  
**I want** to deploy the platform in air-gapped networks  
**So that** sensitive environments remain isolated

**Acceptance Criteria:**
- Offline installation packages
- Local container registry
- Local certificate authority
- No internet dependency for operation
- Documentation for air-gapped setup
- Update process for air-gapped systems

**Priority:** Low  
**Story Points:** 21

---

## Epic 8: Administration & System Management

### Story 8.1: User Registration and Authentication
**As a** system administrator  
**I want** to create user accounts with email and password  
**So that** users can access the platform securely

**Acceptance Criteria:**
- User registration form (email, name, password)
- Password strength requirements
- Email verification
- Login with username/password
- Forgot password flow
- Account lockout after failed attempts

**Priority:** High  
**Story Points:** 8

---

### Story 8.2: Role-Based Access Control (RBAC)
**As a** system administrator  
**I want** to define custom roles with specific permissions  
**So that** users only access what they need

**Acceptance Criteria:**
- Create/edit custom roles
- Assign permissions per role (devices, dashboards, alerts, data types)
- Assign roles to users
- Permission inheritance
- Audit log of permission changes
- Default roles: Admin, Operator, Viewer

**Priority:** High  
**Story Points:** 13

---

### Story 8.3: Device-Level Permissions
**As a** system administrator  
**I want** to restrict user access to specific devices or locations  
**So that** users only see relevant data

**Acceptance Criteria:**
- Assign users/roles to specific devices
- Assign users/roles to locations
- Hierarchical permissions (location includes child devices)
- Users only see permitted devices in lists and dashboards
- API enforces device-level permissions
- Bulk permission assignment

**Priority:** Medium  
**Story Points:** 13

---

### Story 8.4: Audit Logging
**As a** compliance officer  
**I want** to view audit logs of all system actions  
**So that** I can track changes and access

**Acceptance Criteria:**
- Log all user actions (login, create, update, delete)
- Log includes: timestamp, user, action, resource, IP address
- Searchable and filterable audit log
- Export audit log to CSV
- Retention policy for audit logs
- Immutable log storage

**Priority:** Medium  
**Story Points:** 8

---

### Story 8.5: Configuration Backup and Restore
**As a** system administrator  
**I want** to backup and restore system configuration  
**So that** I can recover from failures

**Acceptance Criteria:**
- Backup includes: schemas, alert rules, dashboards, users
- Manual and scheduled backups
- Download backup file
- Restore from backup file
- Backup verification
- Backup encryption

**Priority:** Low  
**Story Points:** 8

---

### Story 8.6: System Health Dashboard
**As a** system administrator  
**I want** to view system health metrics  
**So that** I can monitor platform performance

**Acceptance Criteria:**
- Dashboard shows: uptime, CPU, memory, disk usage
- Service health indicators (database, message broker, APIs)
- Recent errors and warnings
- Data ingestion rate
- Active users and sessions
- Alert firing rate

**Priority:** Medium  
**Story Points:** 8

---

### Story 8.7: Hierarchical Multi-Tenant Management
**As a** platform operator  
**I want** to create tenants and sub-tenants with inheritance  
**So that** I can support reseller and enterprise hierarchies

**Acceptance Criteria:**
- Create parent tenants (organizations)
- Create sub-tenants under parent tenants (departments, sites)
- Inherit permissions and configurations from parent
- Override parent settings at sub-tenant level
- Data isolation between tenant hierarchies
- Cross-tenant reporting for parent tenants
- Tenant-specific branding (logo, colors, domain)
- Soft delete with data retention policies
- Tenant provisioning API

**Priority:** High  
**Story Points:** 21

---

### Story 8.8: Single Sign-On (SSO) Integration
**As a** enterprise administrator  
**I want** to integrate with corporate SSO (SAML, OAuth, Azure AD)  
**So that** users can log in with existing credentials

**Acceptance Criteria:**
- SAML 2.0 integration
- OAuth 2.0 / OpenID Connect support
- Azure Active Directory integration
- Google Workspace integration
- Automatic user provisioning from SSO
- Group/role mapping from SSO
- SSO configuration per tenant

**Priority:** High  
**Story Points:** 13

---

### Story 8.9: API Key Management
**As a** developer  
**I want** to generate and manage API keys for programmatic access  
**So that** I can integrate with external systems

**Acceptance Criteria:**
- Generate API keys with custom names
- Assign permissions per API key
- Revoke API keys
- Set expiration dates
- Track API key usage
- Rate limiting per API key
- Rotate API keys without downtime

**Priority:** Medium  
**Story Points:** 8

---

## Epic 9: Reporting & Data Export

### Story 9.1: CSV Data Export
**As a** analyst  
**I want** to export query results to CSV  
**So that** I can analyze data in Excel

**Acceptance Criteria:**
- Export button on data tables
- CSV includes all visible columns
- CSV formatting options (delimiter, encoding)
- Export respects current filters
- Large exports handled asynchronously
- Download link provided when ready

**Priority:** High  
**Story Points:** 5

---

### Story 9.2: JSON API Export
**As a** developer  
**I want** to export data via REST API  
**So that** I can integrate with external systems

**Acceptance Criteria:**
- API endpoint for data export
- Support for filters and pagination
- JSON or CSV format selection
- API authentication (API key or OAuth)
- Rate limiting
- API documentation with examples

**Priority:** High  
**Story Points:** 5

---

### Story 9.3: Scheduled Reports
**As a** manager  
**I want** to schedule daily/weekly reports  
**So that** I receive data automatically

**Acceptance Criteria:**
- Configure report schedule (daily, weekly, monthly)
- Select data sources and filters
- Report format (PDF, CSV, email body)
- Email delivery to recipients
- Report history and archiving
- Report generation status

**Priority:** Medium  
**Story Points:** 13

---

### Story 9.4: PDF Report Generation
**As a** executive  
**I want** to generate PDF reports with charts and summaries  
**So that** I can share findings with stakeholders

**Acceptance Criteria:**
- PDF includes: title, date range, charts, tables, summary text
- Custom branding (logo, colors)
- Report templates
- PDF generation in background
- Download or email PDF
- PDF includes table of contents

**Priority:** Medium  
**Story Points:** 13

---

### Story 9.5: Dashboard Sharing
**As a** team lead  
**I want** to share dashboard links with colleagues  
**So that** they can view without logging in

**Acceptance Criteria:**
- Generate shareable dashboard link
- Link expiration options (24h, 7d, never)
- Optional password protection
- Shared dashboard is read-only
- Revoke shared link
- Track shared link usage

**Priority:** Low  
**Story Points:** 8

---

### Story 9.6: Dashboard Export as Image
**As a** presenter  
**I want** to export dashboards as PNG/PDF  
**So that** I can include them in presentations

**Acceptance Criteria:**
- Export dashboard to PNG or PDF
- High-resolution export option
- Include or exclude date range and filters
- Export individual widgets or entire dashboard
- Batch export multiple dashboards
- Scheduled dashboard snapshots

**Priority:** Low  
**Story Points:** 8

---

## Epic 10: Mobile Application

### Story 10.1: Mobile Device Provisioning
**As a** field technician  
**I want** to provision Nexus devices via mobile app  
**So that** I can onboard devices on-site

**Acceptance Criteria:**
- Mobile app on iOS and Android
- Scan QR code or enter serial number
- Capture device location (GPS or manual)
- Fill custom fields during provisioning
- Offline provisioning with later sync
- Confirmation of successful provisioning

**Priority:** High  
**Story Points:** 13

---

### Story 10.2: Mobile Diagnostics
**As a** field technician  
**I want** to view device diagnostics on mobile  
**So that** I can troubleshoot in the field

**Acceptance Criteria:**
- View battery level, signal strength, last check-in
- View recent telemetry data
- Device location on map
- Send test command to device
- Diagnostic history
- Offline viewing of cached diagnostics

**Priority:** High  
**Story Points:** 13

---

### Story 10.3: Mobile Metadata Collection
**As a** field worker  
**I want** to capture photos and notes on mobile  
**So that** I can document site conditions

**Acceptance Criteria:**
- Take photos and attach to devices
- Add text notes and descriptions
- Update custom fields
- Capture GPS coordinates
- Offline mode with sync
- Timestamp all entries

**Priority:** Medium  
**Story Points:** 8

---

### Story 10.4: Mobile Alerts
**As a** on-call engineer  
**I want** to receive push notifications for critical alerts  
**So that** I'm notified immediately

**Acceptance Criteria:**
- Push notifications for selected alert rules
- Notification includes alert summary
- Tap notification to open app to alert details
- Acknowledge alerts from mobile
- Notification history
- Configure notification preferences

**Priority:** Medium  
**Story Points:** 8

---

### Story 10.5: Mobile Dashboard Viewing
**As a** manager  
**I want** to view dashboards on mobile  
**So that** I can monitor operations on the go

**Acceptance Criteria:**
- Mobile-responsive dashboard layouts
- Swipe between dashboards
- Filter and zoom on mobile
- Offline dashboard viewing (cached data)
- Pull to refresh data
- Share dashboard from mobile

**Priority:** Low  
**Story Points:** 13

---

### Story 10.6: Mobile Offline Data Collection
**As a** field technician  
**I want** to collect data offline and sync when connected  
**So that** I can work in areas without connectivity

**Acceptance Criteria:**
- Offline data entry forms
- Local storage of collected data
- Automatic sync when connectivity returns
- Sync status indicator
- Conflict resolution for concurrent edits
- Queued operations list

**Priority:** High  
**Story Points:** 13

---

## Epic 11: Integration & APIs

### Story 11.1: REST API Documentation
**As a** developer  
**I want** comprehensive API documentation  
**So that** I can integrate with the platform

**Acceptance Criteria:**
- OpenAPI/Swagger documentation
- API endpoint descriptions
- Request/response examples
- Authentication instructions
- Error code reference
- Code samples in multiple languages

**Priority:** High  
**Story Points:** 8

---

### Story 11.2: Webhook Configuration
**As a** integration engineer  
**I want** to configure webhooks for events  
**So that** external systems are notified

**Acceptance Criteria:**
- Configure webhook URL and events
- Webhook payload customization
- Authentication headers (API key, OAuth)
- Retry logic for failed webhooks
- Webhook delivery logs
- Test webhook functionality

**Priority:** High  
**Story Points:** 8

---

### Story 11.3: Third-Party SCADA Integration
**As a** SCADA engineer  
**I want** to integrate with existing SCADA systems  
**So that** data flows bidirectionally

**Acceptance Criteria:**
- Read/write data to SCADA via OPC UA or Modbus
- Map SCADA tags to platform schemas
- Real-time data sync
- Historical data import
- SCADA event forwarding
- Connection monitoring

**Priority:** Medium  
**Story Points:** 21

---

### Story 11.4: Azure IoT Services Integration
**As a** cloud architect  
**I want** to integrate with Azure IoT Hub and DPS  
**So that** I leverage Azure IoT capabilities

**Acceptance Criteria:**
- Connect to Azure IoT Hub
- Device provisioning via Azure DPS
- Twin synchronization
- Direct method invocation
- Azure Event Hub integration
- Azure Stream Analytics integration

**Priority:** High  
**Story Points:** 13

---

### Story 11.5: Email Provider Integration
**As a** system administrator  
**I want** to configure SMTP or SendGrid for emails  
**So that** alert emails are delivered

**Acceptance Criteria:**
- Configure SMTP settings (host, port, credentials)
- SendGrid API key integration
- Test email functionality
- Email templates
- Delivery status tracking
- Bounce handling

**Priority:** High  
**Story Points:** 5

---

### Story 11.6: SMS Provider Integration
**As a** system administrator  
**I want** to configure Twilio or similar for SMS  
**So that** SMS alerts are sent

**Acceptance Criteria:**
- Configure SMS provider (Twilio, AWS SNS)
- Test SMS functionality
- SMS rate limiting
- Delivery status tracking
- Cost monitoring
- Opt-out handling

**Priority:** Medium  
**Story Points:** 5

---

### Story 11.7: GraphQL API
**As a** frontend developer  
**I want** a GraphQL API for flexible data queries  
**So that** I can fetch exactly the data I need

**Acceptance Criteria:**
- GraphQL schema for all entities
- Query devices, data, alerts, dashboards
- Mutations for creating/updating entities
- Subscriptions for real-time data
- GraphQL Playground for testing
- Query complexity limits
- Pagination support

**Priority:** Low  
**Story Points:** 13

---

### Story 11.8: Event Streaming Platform
**As a** integration developer  
**I want** to subscribe to platform events via Kafka or NATS  
**So that** I can build event-driven integrations

**Acceptance Criteria:**
- Publish all platform events to message broker
- Topics for devices, alerts, data, users
- Schema registry for event formats
- Consumer group support
- Event replay capability
- Monitoring and metrics

**Priority:** Medium  
**Story Points:** 13

---

## Epic 12: Billing, Metering & Payments

### Story 12.1: Usage Metering Infrastructure
**As a** platform operator  
**I want** to track resource consumption per tenant  
**So that** I can bill based on usage

**Acceptance Criteria:**
- Meter device count (active devices)
- Meter data ingestion volume (messages/bytes per month)
- Meter API calls per tenant
- Meter storage usage (time-series, object storage)
- Meter video processing hours
- Meter ML inference requests
- Real-time usage dashboards per tenant
- Historical usage reports
- Usage anomaly detection
- Export usage data to billing system

**Priority:** High  
**Story Points:** 21

---

### Story 12.2: Stripe Integration for Payments
**As a** platform operator  
**I want** to integrate with Stripe for payment processing  
**So that** tenants can pay via credit card

**Acceptance Criteria:**
- Stripe account connection
- Create Stripe customers for tenants
- Store payment methods securely
- Process one-time payments
- Set up recurring subscriptions
- Handle payment failures and retries
- PCI compliance (use Stripe Elements)
- Payment receipt emails
- Refund processing
- Webhook handling for payment events

**Priority:** High  
**Story Points:** 13

---

### Story 12.3: Subscription Plan Management
**As a** platform operator  
**I want** to define subscription plans (Free, Pro, Enterprise)  
**So that** tenants can choose the right plan

**Acceptance Criteria:**
- Create subscription plans in Stripe
- Define plan features (device limits, storage, API calls)
- Pricing tiers (monthly, annual)
- Free trial periods
- Plan upgrade/downgrade workflows
- Prorated billing on plan changes
- Usage-based add-ons (extra devices, storage)
- Custom enterprise pricing
- Plan comparison page
- Tenant self-service plan selection

**Priority:** High  
**Story Points:** 13

---

### Story 12.4: Automated Invoice Generation
**As a** platform operator  
**I want** to generate invoices automatically based on usage  
**So that** tenants receive accurate bills

**Acceptance Criteria:**
- Monthly invoice generation
- Invoice includes metered usage
- Line items for each billable resource
- Calculate taxes based on location
- Apply discounts and credits
- Send invoices via email (Stripe)
- Invoice PDF generation
- Invoice payment tracking
- Dunning emails for failed payments
- Invoice history per tenant

**Priority:** High  
**Story Points:** 13

---

### Story 12.5: Tenant Billing Portal
**As a** tenant administrator  
**I want** to view invoices and manage payment methods  
**So that** I can control billing without contacting support

**Acceptance Criteria:**
- View current usage and costs (real-time)
- Access invoice history
- Download invoice PDFs
- Add/update payment methods
- View payment history
- Update billing address
- Apply promotional codes
- Cancel subscription
- Request refunds
- Usage breakdown by resource type

**Priority:** High  
**Story Points:** 13

---

### Story 12.6: Resource Quota Enforcement
**As a** platform operator  
**I want** to enforce resource quotas per subscription plan  
**So that** tenants stay within their limits

**Acceptance Criteria:**
- Define quotas per plan (devices, API calls, storage)
- Soft limits with warnings
- Hard limits that block operations
- Quota exceeded notifications
- Grace period before hard limit
- Overage charges for metered resources
- Real-time quota monitoring
- Tenant quota dashboard
- Auto-upgrade suggestions when approaching limits

**Priority:** High  
**Story Points:** 13

---

### Story 12.7: Multi-Currency Support
**As a** platform operator  
**I want** to support multiple currencies  
**So that** I can bill international customers

**Acceptance Criteria:**
- Configure supported currencies in Stripe
- Tenant selects preferred currency
- Display prices in tenant currency
- Currency conversion for invoices
- VAT/GST handling by region
- Localized pricing (geo-specific plans)
- Currency symbol and formatting
- Exchange rate updates

**Priority:** Medium  
**Story Points:** 8

---

### Story 12.8: Revenue Analytics Dashboard
**As a** business executive  
**I want** to view revenue metrics and forecasts  
**So that** I can make business decisions

**Acceptance Criteria:**
- Monthly Recurring Revenue (MRR) chart
- Annual Recurring Revenue (ARR)
- Revenue by plan
- Revenue by tenant
- Churn rate and retention metrics
- Customer Lifetime Value (LTV)
- Trial conversion rate
- Revenue forecasting
- Subscription growth trends
- Payment success/failure rates

**Priority:** Medium  
**Story Points:** 13

---

### Story 12.9: Billing Webhooks and Events
**As a** developer  
**I want** to handle Stripe webhooks for billing events  
**So that** the platform reacts to payment changes

**Acceptance Criteria:**
- Webhook endpoint for Stripe events
- Handle payment succeeded/failed events
- Handle subscription created/updated/cancelled
- Handle invoice finalized/payment_failed
- Handle customer updated
- Webhook signature verification
- Idempotent event processing
- Event logging and replay
- Alert on webhook failures
- Webhook testing tools

**Priority:** High  
**Story Points:** 8

---

### Story 12.10: Sub-Tenant Billing Allocation
**As a** parent tenant administrator  
**I want** to allocate costs to sub-tenants  
**So that** I can charge back or show back usage

**Acceptance Criteria:**
- Track usage per sub-tenant
- Allocate parent tenant costs to sub-tenants
- Generate sub-tenant invoices or reports
- Configurable allocation rules (direct, proportional, fixed)
- Sub-tenant cost center tagging
- Consolidated billing for parent
- Sub-tenant billing visibility (optional)
- Export allocation data
- Chargeback vs showback modes

**Priority:** Medium  
**Story Points:** 13

---

### Story 12.11: Promotional Codes and Discounts
**As a** marketing manager  
**I want** to create promotional codes for discounts  
**So that** I can run marketing campaigns

**Acceptance Criteria:**
- Create coupon codes in Stripe
- Percentage or fixed amount discounts
- Limited-use or unlimited codes
- Expiration dates
- Applicable to specific plans
- First-time customer only codes
- Track code redemption
- Discount appears on invoices
- Code validation at checkout

**Priority:** Low  
**Story Points:** 8

---

### Story 12.12: Payment Method Compliance
**As a** compliance officer  
**I want** to ensure PCI-DSS compliance for payments  
**So that** customer payment data is secure

**Acceptance Criteria:**
- All payment forms use Stripe Elements (no PCI scope)
- No credit card data stored in platform database
- Stripe tokenization for payment methods
- TLS 1.2+ for all payment communications
- Annual PCI compliance attestation
- Security audit logging for billing operations
- Data encryption at rest for billing data
- GDPR compliance for billing data

**Priority:** High  
**Story Points:** 8

---

## Epic 13: Performance & Scalability

### Story 13.1: Horizontal Scalability Testing
**As a** platform engineer  
**I want** to verify the platform scales horizontally  
**So that** I can handle increasing load

**Acceptance Criteria:**
- Load testing scripts for all services
- Demonstrate linear scaling with added nodes
- Identify bottlenecks
- Auto-scaling policies configured
- Performance benchmarks documented
- Stress testing reports

**Priority:** High  
**Story Points:** 13

---

### Story 13.2: Query Performance Optimization
**As a** database engineer  
**I want** to optimize time-series query performance  
**So that** dashboards load quickly

**Acceptance Criteria:**
- Analyze slow queries
- Add appropriate indexes
- Implement query result caching
- Pre-aggregate common queries
- Query execution plan analysis
- Performance comparison before/after

**Priority:** High  
**Story Points:** 13

---

### Story 13.3: Data Archival and Tiering
**As a** platform administrator  
**I want** to archive old data to cheaper storage  
**So that** I reduce storage costs

**Acceptance Criteria:**
- Define retention policies per data type
- Automatic archival to cold storage (S3 Glacier, Azure Archive)
- Query across hot and cold data
- Data restore from archive
- Archival job monitoring
- Cost savings reporting

**Priority:** Medium  
**Story Points:** 13

---

### Story 13.4: Connection Pooling and Resource Management
**As a** platform engineer  
**I want** efficient connection pooling for databases and brokers  
**So that** resources are used efficiently

**Acceptance Criteria:**
- Connection pooling configured for PostgreSQL, TimescaleDB
- Kafka/NATS producer/consumer pooling
- Redis connection pooling
- Monitor connection usage
- Connection leak detection
- Graceful degradation under load

**Priority:** Medium  
**Story Points:** 8

---

### Story 13.5: CDN Integration for Static Assets
**As a** frontend engineer  
**I want** static assets served via CDN  
**So that** global users have fast load times

**Acceptance Criteria:**
- Integrate with CDN (CloudFront, Azure CDN, Cloudflare)
- Cache static assets (JS, CSS, images)
- Cache invalidation on deployment
- HTTPS support
- Geographic distribution
- CDN performance monitoring

**Priority:** Low  
**Story Points:** 5

---

## Epic 14: Mobile App - Device Discovery & NFC Operations (.NET MAUI)

### Story 14.1: NFC Tap to Identify Device
**As a** field technician  
**I want to** tap a Nexus-enabled sensor with my mobile device via NFC  
**So that** I can automatically identify the device and load its platform metadata

**Acceptance Criteria:**
- NFC tap reads device ID, device type, firmware version, and hardware info from NDEF tag
- App retrieves device type definition and schema from SensorMine platform when authenticated
- If offline or not authenticated, app can still read values directly from the device via NFC
- Device information displayed in structured format (device ID, type, firmware, battery level)
- Support for multiple NFC tag formats (NDEF, Mifare, ISO 15693)
- Visual and haptic feedback when NFC scan is successful
- Error handling for unreadable or corrupted NFC tags
- Background NFC scanning when app is in foreground

**Priority:** High  
**Story Points:** 13

---

### Story 14.2: NFC Tap to Read Diagnostics
**As a** field technician  
**I want to** tap a device and view diagnostics  
**So that** I can confirm operational status without needing cloud connectivity

**Acceptance Criteria:**
- Reads battery level (percentage and voltage)
- Reads last broadcast time (timestamp)
- Reads sensor statuses (operational, error, offline)
- Reads configuration integrity checksum
- Displays any error codes or warnings stored on device
- Shows signal strength and connectivity status
- Works both online (with platform sync) and offline (direct NFC read)
- Diagnostic data can be exported as JSON or CSV
- Historical diagnostics stored locally for comparison
- Color-coded status indicators (green/yellow/red)

**Priority:** High  
**Story Points:** 13

---

## Epic 15: Mobile App - Device Configuration & Provisioning

### Story 15.1: Load Device Schemas and Nexus Configuration
**As a** field technician  
**I want** the app to fetch device types, schemas, and Nexus capability definitions  
**So that** I always work with up-to-date configuration formats

**Acceptance Criteria:**
- Retrieves device types and their JSON schema definitions from SensorMine platform
- Retrieves Nexus configuration capabilities (radio settings, broadcast intervals, sensor interfaces)
- Offline caching for previously downloaded schemas (stored in SQLite)
- Cache expiration and refresh policies (24-hour default, manual refresh option)
- Version checking to ensure schema compatibility
- Visual indicator showing last sync time
- Download schemas in batches for entire device type families
- Schema validation before applying to devices

**Priority:** High  
**Story Points:** 8

---

### Story 15.2: Apply Configuration from JSON
**As a** field technician  
**I want to** apply a configuration JSON to a device  
**So that** I can standardize sensor setup across multiple sites

**Acceptance Criteria:**
- App verifies JSON configuration against the schema for that device type
- Real-time validation with field-level error highlighting
- Displays invalid or missing fields with specific error messages
- Preview configuration before applying to device
- Push configuration to device via NFC write operation
- Confirmation dialog before writing to prevent accidental changes
- Save a record of configuration changes when authenticated
- Rollback to previous configuration if write fails
- Configuration templates for common setups
- Support for bulk configuration (multiple devices)

**Priority:** High  
**Story Points:** 13

---

### Story 15.3: Configure Without Logging In ("Tabletop Configuration")
**As a** technician  
**I want to** load a configuration file locally without logging into the platform  
**So that** I can prepare devices before deployment

**Acceptance Criteria:**
- Import configuration JSON via file picker, QR code scanner, clipboard paste, or Bluetooth/WiFi transfer
- Validate against cached schema or embedded schema
- Push configuration to device via NFC without cloud connection
- No cloud API calls required for basic operations
- Local logging of configuration changes (synced later when online)
- Embedded schema library for common device types
- Warning when using outdated schemas
- Export configured device list for later cloud provisioning

**Priority:** High  
**Story Points:** 8

---

### Story 15.4: Set Device Location
**As a** technician  
**I want to** set a device's location when configuring it  
**So that** the device registers correctly when installed

**Acceptance Criteria:**
- App captures GPS location using the phone (latitude, longitude, altitude)
- Option to override with manually entered coordinates
- Location accuracy indicator (GPS, network, manual)
- Map view showing device location
- Support for different coordinate formats (decimal degrees, DMS, UTM)
- Location written to device NFC tag (if supported)
- Location written to platform device profile via API
- Ability to adjust location on map by dragging pin
- Address geocoding (convert GPS to street address)
- Save locations as named waypoints for reuse

**Priority:** High  
**Story Points:** 8

---

## Epic 16: Mobile App - Custom Fields & User-Defined Metadata

### Story 16.1: Retrieve Custom Fields from Platform
**As a** technician  
**I want** the app to load custom fields defined for a device type  
**So that** I can collect required data during installation

**Acceptance Criteria:**
- Custom fields are pulled from platform metadata (Device Type API)
- Supported field types: text, numeric, boolean, dropdown, date/datetime, image capture, file attachments, barcode/QR code, signature
- Field validation rules respected (required, min/max, regex patterns)
- Conditional fields (show/hide based on other field values)
- Field grouping and sections
- Help text and tooltips for each field
- User can complete mandatory custom fields before provisioning
- Form auto-saves draft responses

**Priority:** High  
**Story Points:** 13

---

### Story 16.2: Store and Sync Custom Field Data
**As a** technician  
**I want to** enter custom field values and sync them  
**So that** the device has accurate context in SensorMine

**Acceptance Criteria:**
- Offline entry available (stored locally in SQLite)
- Syncs values and attachments when back online
- Validation for required fields before submission
- Visual indicator showing sync status (pending, syncing, synced, failed)
- Conflict resolution when same device edited on multiple devices
- Attachment compression and upload optimization
- Batch sync for multiple devices
- Retry logic for failed syncs
- Manual sync trigger
- Last synced timestamp display

**Priority:** High  
**Story Points:** 8

---

## Epic 17: Mobile App - Device Lifecycle Management

### Story 17.1: Reconfigure Device
**As a** technician  
**I want to** reconfigure an existing device  
**So that** I can update settings, change schemas, or adjust Nexus behaviour

**Acceptance Criteria:**
- App loads current configuration from platform or device (via NFC)
- User can modify configuration fields
- Re-push configuration to device via NFC
- Change history logged on the platform
- Side-by-side comparison of old vs new configuration
- Warning if changes require firmware update
- Rollback option to previous configuration
- Test configuration before applying
- Audit trail of all configuration changes

**Priority:** High  
**Story Points:** 13

---

### Story 17.2: Deprovision Device
**As a** technician  
**I want to** deprovision a device  
**So that** it can be safely removed from service or repurposed

**Acceptance Criteria:**
- Deprovision endpoint called on platform
- Device flagged as inactive in platform
- Optional wipe or reset pushed to device via NFC
- Confirmation dialog before deprovisioning
- Archive device data option
- Deprovision reason capture (broken, relocated, replaced)
- Audit log entry created
- Device removed from active device list
- Historical data retention policy applied

**Priority:** Medium  
**Story Points:** 8

---

### Story 17.3: Toggle Maintenance Mode
**As a** technician  
**I want to** put a device into maintenance mode  
**So that** it stops broadcasting while temporarily removed or worked on

**Acceptance Criteria:**
- User can enable/disable maintenance mode from device detail page
- App pushes the setting via NFC or platform API
- Device configuration reflects broadcast state (enabled/disabled)
- Platform visibility updated (device shown as "In Maintenance")
- Alerts suspended during maintenance mode
- Maintenance mode duration setting (indefinite or scheduled end time)
- Automatic mode exit after duration expires
- Notification when device returns to active mode
- Audit log of maintenance mode changes

**Priority:** Medium  
**Story Points:** 5

---

## Epic 18: Mobile App - Offline-First Operation & Sync

### Story 18.1: Offline Caching of Schemas and Configurations
**As a** technician in the field  
**I want to** access schemas and previous configurations offline  
**So that** I can operate in remote Australian locations

**Acceptance Criteria:**
- App caches device schemas in local SQLite database
- Caches Nexus configuration capabilities
- Caches custom field definitions
- Automatically updates cache when online
- Manual "refresh metadata" option in settings
- Cache size limit with intelligent eviction (LRU)
- Offline indicator in UI
- Pre-load cache for specific device types or regions
- Export/import cache for sharing between technicians

**Priority:** High  
**Story Points:** 8

---

### Story 18.2: Offline Queueing of Actions
**As a** technician  
**I want to** perform provisioning or updates offline  
**So that** actions sync when connectivity returns

**Acceptance Criteria:**
- Local queue for create/update/deprovision actions
- Automatic retry when network is available
- Clear indication of pending vs completed actions
- Queue status page showing pending operations
- Manual retry for failed operations
- Queue persistence across app restarts
- Priority queue for critical operations
- Conflict detection and resolution
- Success/failure notifications after sync

**Priority:** High  
**Story Points:** 13

---

## Epic 19: Mobile App - Security, Permissions & Auditability

### Story 19.1: Secure Access to Platform
**As a** user  
**I want** secure authentication  
**So that** only authorized staff can modify devices

**Acceptance Criteria:**
- Authentication via OAuth 2.0 / OpenID Connect
- Support for Azure AD / Entra ID
- Biometric authentication (fingerprint, Face ID) for app access
- Role-based access controls respected (admin, technician, viewer)
- Token refresh handled seamlessly
- Multi-factor authentication support
- Secure token storage (iOS Keychain, Android Keystore)
- Automatic logout after inactivity
- Session expiration handling with graceful re-authentication

**Priority:** High  
**Story Points:** 13

---

### Story 19.2: Full Audit Trail of Field Actions
**As a** system owner  
**I want** an audit history of all field interactions  
**So that** I can track configuration integrity across the network

**Acceptance Criteria:**
- Every push, read, or configuration change recorded
- NFC-only changes stored locally and synced when authenticated
- Audit log includes: timestamp (UTC), device ID, user ID, action type, old/new configuration, GPS location, result
- Audit logs synced to platform when online
- Local audit log viewer in app
- Export audit logs as CSV or JSON
- Platform audit log API integration

**Priority:** High  
**Story Points:** 8

---

## Story Summary

### Total Stories: 138 (was 122, added 16 MAUI mobile stories)

### By Epic:
1. **Device Type Configuration**: 5 stories
2. **Device Registration & Management**: 8 stories
3. **Data Ingestion & Modeling**: 10 stories
4. **Video Processing & AI/ML**: 13 stories
5. **Visualization & Dashboards**: 12 stories
6. **LLM Interaction & Analytics**: 6 stories
7. **Alerting & Notifications**: 12 stories
8. **Industrial Connectivity & Edge**: 10 stories
9. **Administration & System Management**: 9 stories
10. **Reporting & Data Export**: 8 stories
11. **Mobile Application (Web/Dashboard Viewing)**: 6 stories
12. **Integration & APIs**: 8 stories
13. **Billing, Metering & Payments**: 12 stories
14. **Performance & Scalability**: 5 stories
15. **Mobile MAUI - Device Discovery & NFC**: 2 stories (NEW - .NET MAUI)
16. **Mobile MAUI - Configuration & Provisioning**: 4 stories (NEW - .NET MAUI)
17. **Mobile MAUI - Custom Fields & Metadata**: 2 stories (NEW - .NET MAUI)
18. **Mobile MAUI - Device Lifecycle Management**: 3 stories (NEW - .NET MAUI)
19. **Mobile MAUI - Offline-First & Sync**: 2 stories (NEW - .NET MAUI)
20. **Mobile MAUI - Security & Audit**: 2 stories (NEW - .NET MAUI)

### By Priority:
- **High**: 71 stories (was 56, added 15 MAUI high-priority stories)
- **Medium**: 56 stories (was 55, added 1 MAUI medium-priority story)
- **Low**: 11 stories

### Total Story Points: ~1,682 (was ~1,520, added 162 MAUI story points)

**New Stories Added (27 total, 280 story points):**
- Device firmware management, groups/tags, templates (29 pts)
- Data quality monitoring, schema marketplace (26 pts)
- Video retention, privacy masking, model training (42 pts)
- Real-time dashboard updates, annotations (21 pts)
- LLM anomaly detection (21 pts)
- Alert escalation, aggregation (26 pts)
- SSO, API key management (21 pts)
- Mobile offline data collection (13 pts)
- GraphQL API, event streaming (26 pts)
- Performance & scalability epic (55 pts)

### Estimated Timeline:
- Assuming 20-30 story points per developer per sprint (2 weeks)
- 5-person development team
- **Estimated Duration**: 18-24 months for full implementation

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-6)
**Focus**: Core device management, data ingestion, basic visualization

**Key Stories**:
- Device registration and Azure DPS (1.1, 1.2)
- MQTT ingestion and schema definition (2.1, 2.2)
- Time-series query API (2.7)
- Basic dashboards and charts (4.1, 4.2)
- User authentication and RBAC (8.1, 8.2)
- REST API documentation (11.1)

**Deliverable**: Working platform for device management and basic telemetry

---

### Phase 2: Video & Analytics (Months 7-12)
**Focus**: Video processing, ML inference, video analytics

**Key Stories**:
- RTSP stream ingestion (3.1)
- Real-time object detection (3.5)
- Custom ML model deployment (3.6)
- Video event search (3.7)
- Video timeline widget (4.3)
- Video event alerts (6.3)

**Deliverable**: Video analytics platform with ML capabilities

---

### Phase 3: Advanced Features (Months 13-18)
**Focus**: LLM integration, industrial protocols, mobile app

**Key Stories**:
- Natural language query (5.1)
- OPC UA and Modbus connectors (7.1, 7.2)
- Mobile device provisioning (10.1, 10.2)
- 3D CAD viewer (4.4)
- Dashboard templates (4.8)
- Scheduled reports (9.3)

**Deliverable**: Full-featured platform with AI assistant and mobile support

---

### Phase 4: Enterprise & Scale (Months 19-24)
**Focus**: Multi-tenancy, edge computing, integrations

**Key Stories**:
- Multi-tenant management (8.7)
- Edge video processing (3.10)
- SCADA integration (11.3)
- Air-gapped deployment (7.10)
- Advanced behavioral analytics (3.8)
- PDF reports (9.4)

**Deliverable**: Enterprise-ready platform with edge capabilities

---

## Next Steps

1. **Review and prioritize** stories with stakeholders
2. **Refine acceptance criteria** for Phase 1 stories
3. **Create technical tasks** for each story
4. **Estimate dependencies** between stories
5. **Set up project tracking** (Azure DevOps, Jira, GitHub Projects)
6. **Begin sprint planning** for Phase 1

---

**Document Version:** 3.0  
**Last Updated:** December 7, 2025  
**Total Stories:** 138 (was 122, added 16 MAUI mobile stories)  
**Total Story Points:** ~1,682 (was ~1,520, added 162 MAUI story points)  
**New in v3.0:** .NET MAUI mobile application with NFC device configuration (Epics 14-19), complete offline-first architecture, field technician workflows  
**Previous updates (v2.0):** Billing & metering (Epic 12), Enhanced multi-tenancy (8.7), Stripe payment integration

---

## .NET MAUI Mobile App Overview (Epics 14-19)

The SensorMine Mobile application is a cross-platform solution built with .NET MAUI for iOS and Android. It provides field technicians with:

**Key Capabilities:**
- **NFC-based device discovery** - Tap Nexus devices to read diagnostics and configuration
- **Offline-first architecture** - Work in remote locations without connectivity
- **Dynamic configuration** - Apply JSON configurations validated against device schemas
- **Custom field collection** - Capture site-specific metadata during installation
- **Security & audit** - Full audit trail of field actions with biometric authentication

**Technology Stack:**
- .NET MAUI (.NET 8+) for cross-platform development
- NFC support (CoreNFC for iOS, Android.Nfc for Android)
- SQLite for offline storage
- Azure AD / Entra ID for authentication
- Background sync with conflict resolution

**Total MAUI Stories:** 15 stories across 6 epics (162 story points)

For detailed MAUI requirements and architecture, see [mobile-maui-requirements.md](./mobile-maui-requirements.md)
