# Monitoring & Observability Requirements

## Overview
A comprehensive monitoring and admin dashboard system to provide visibility into the telemetry ingestion pipeline, including schema validation failures, data quality issues, and system health metrics.

## Business Requirements

### BR-1: Schema Validation Visibility
**Priority:** HIGH  
**Description:** Administrators must be able to identify and troubleshoot schema validation failures to ensure devices are properly configured and data quality is maintained.

**Acceptance Criteria:**
- System tracks all schema validation failures with detailed error information
- Failures include: device ID, timestamp, schema name/version, specific validation errors (field name, expected type, actual value)
- Failures are queryable by device, time range, error type
- Administrators can see trends in validation failures over time

### BR-2: Dead Letter Queue (DLQ) Management
**Priority:** HIGH  
**Description:** Failed messages must be accessible for review, reprocessing, or permanent deletion.

**Acceptance Criteria:**
- DLQ messages include: original payload, device ID, failure reason, timestamp, retry count
- Administrators can view DLQ messages with pagination and filtering
- Support bulk reprocessing of DLQ messages after device/schema fixes
- Ability to permanently delete DLQ messages after review
- Export DLQ messages for offline analysis

### BR-3: Real-time Ingestion Metrics
**Priority:** MEDIUM  
**Description:** System health metrics should be visible in real-time to identify bottlenecks and performance issues.

**Acceptance Criteria:**
- Messages per second (by device, protocol, tenant)
- Kafka consumer lag monitoring
- Processing latency (MQTT → Kafka → Database)
- Success/failure rate percentages
- Active device count and connection status

### BR-4: Device Schema Association Tracking
**Priority:** HIGH  
**Description:** Clear visibility into which devices are using which schemas to aid in troubleshooting validation failures.

**Acceptance Criteria:**
- Display current schema assignment per device
- Show schema version history per device
- Alert when device sends data but has no schema assigned
- Support bulk schema assignment to multiple devices

### BR-5: Data Quality Monitoring
**Priority:** MEDIUM  
**Description:** Track data quality issues beyond schema validation to ensure data reliability.

**Acceptance Criteria:**
- Out-of-range value detection
- Missing/null value tracking
- Duplicate message detection
- Stale data alerts (device hasn't sent data in X minutes)

---

## Functional Requirements

### FR-1: Monitoring Dashboard UI

#### FR-1.1: Overview Page
**Components:**
- **Real-time Metrics Cards:**
  - Total devices online
  - Messages/sec (live graph)
  - Success rate (last hour)
  - DLQ message count
  - Kafka consumer lag

- **Recent Failures Widget:**
  - Last 10 validation failures
  - Quick view of error type and device
  - Click to view full details

- **Health Status Indicators:**
  - Edge Gateway (green/yellow/red)
  - Kafka brokers
  - Ingestion Service
  - TimescaleDB
  - Schema Registry

#### FR-1.2: Schema Validation Failures Page
**Features:**
- **Search & Filter:**
  - By device ID
  - By schema name
  - By time range
  - By error type (missing field, type mismatch, constraint violation)
  - By tenant

- **Failure Details View:**
  ```
  Device ID: 9c1c9a4a-e7f1-448e-b0f4-33dec14e17ba
  Timestamp: 2025-12-06 10:03:45 UTC
  Schema: temperature-sensor-v1
  Error: No schema found for device
  
  Expected Schema: (none assigned)
  
  Payload:
  {
    "timestamp": 1765014930650,
    "temperature": 23.5,
    "humidity": 45.2,
    "pressure": 1013.25
  }
  
  Validation Errors:
  1. Device has no schema assigned
  2. Suggested schema: generic-iot-sensor (85% match)
  
  Actions:
  [Assign Schema] [Reprocess Message] [Add to DLQ Ignore List]
  ```

- **Bulk Actions:**
  - Assign schema to multiple devices
  - Reprocess failed messages
  - Export to CSV

#### FR-1.3: Dead Letter Queue Page
**Features:**
- **Message List:**
  - Device ID, Timestamp, Error Category, Retry Count
  - Pagination (100 messages per page)
  - Sort by timestamp, device, error type

- **Message Details:**
  - Full error stack trace
  - Original payload (JSON formatted)
  - Kafka metadata (partition, offset, headers)
  - Retry history

- **Actions:**
  - Reprocess single message
  - Reprocess filtered set
  - Delete message(s)
  - Export messages

#### FR-1.4: Device-Schema Association Page
**Features:**
- **Device List:**
  - Device ID, Schema Name, Schema Version, Last Message Time
  - Filter by: has schema, no schema, schema version
  - Search by device ID

- **Assign Schema Modal:**
  - Select device(s)
  - Choose schema from dropdown
  - Optional: backfill validation for recent messages

- **Schema Compatibility Checker:**
  - Test payload against schema before assignment
  - Show validation results

#### FR-1.5: Metrics & Analytics Page
**Features:**
- **Time-series Graphs:**
  - Messages per second (grouped by protocol)
  - Success vs failure rate
  - Processing latency percentiles (p50, p95, p99)
  - Kafka consumer lag

- **Breakdown Tables:**
  - Top 10 devices by message volume
  - Top 10 failure reasons
  - Schema usage distribution

- **Export Options:**
  - Download graphs as PNG
  - Export data as CSV
  - Schedule email reports

---

## Technical Requirements

### TR-1: Data Storage

#### TR-1.1: Schema Validation Events Table (PostgreSQL)
```sql
CREATE TABLE schema_validation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Schema info
    expected_schema_id UUID,
    expected_schema_name VARCHAR(255),
    expected_schema_version INT,
    
    -- Validation results
    is_valid BOOLEAN NOT NULL,
    error_count INT NOT NULL DEFAULT 0,
    validation_errors JSONB, -- Array of {path, message, errorType}
    
    -- Payload
    payload_sample TEXT, -- First 1000 chars
    payload_hash VARCHAR(64), -- SHA-256 for deduplication
    
    -- Metadata
    kafka_topic VARCHAR(255),
    kafka_partition INT,
    kafka_offset BIGINT,
    processing_duration_ms INT,
    
    INDEX idx_device_timestamp (device_id, timestamp DESC),
    INDEX idx_tenant_timestamp (tenant_id, timestamp DESC),
    INDEX idx_validation_status (is_valid, timestamp DESC)
);
```

#### TR-1.2: Dead Letter Queue Enhanced Metadata (Kafka Headers + PostgreSQL)
Store extended metadata in PostgreSQL for queryability:
```sql
CREATE TABLE dlq_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Error classification
    error_category VARCHAR(50) NOT NULL, -- schema_validation, parsing_error, database_error, timeout
    error_message TEXT NOT NULL,
    error_stack_trace TEXT,
    
    -- Kafka reference
    dlq_topic VARCHAR(255) NOT NULL,
    dlq_partition INT NOT NULL,
    dlq_offset BIGINT NOT NULL,
    original_topic VARCHAR(255),
    original_partition INT,
    original_offset BIGINT,
    
    -- Payload
    payload TEXT NOT NULL,
    payload_size_bytes INT,
    
    -- Retry tracking
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    reprocessed BOOLEAN DEFAULT FALSE,
    reprocessed_at TIMESTAMPTZ,
    
    INDEX idx_device_timestamp (device_id, timestamp DESC),
    INDEX idx_category (error_category, timestamp DESC),
    INDEX idx_reprocessed (reprocessed, timestamp DESC)
);
```

#### TR-1.3: Device Schema Assignments Table
```sql
CREATE TABLE device_schema_assignments (
    device_id VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    schema_id UUID NOT NULL,
    schema_name VARCHAR(255) NOT NULL,
    schema_version INT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by VARCHAR(255), -- User ID or 'system'
    
    -- Auto-detection
    auto_detected BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    INDEX idx_schema (schema_id),
    INDEX idx_tenant (tenant_id)
);
```

#### TR-1.4: Ingestion Metrics (TimescaleDB Hypertable)
```sql
CREATE TABLE ingestion_metrics (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID,
    device_id VARCHAR(255),
    protocol VARCHAR(50), -- mqtt, http, websocket
    
    -- Counts
    message_count INT,
    success_count INT,
    failure_count INT,
    
    -- Latency
    avg_processing_ms INT,
    p95_processing_ms INT,
    p99_processing_ms INT,
    
    -- Sizes
    total_bytes_processed BIGINT,
    
    PRIMARY KEY (time, tenant_id, device_id, protocol)
);

SELECT create_hypertable('ingestion_metrics', 'time');
```

### TR-2: API Endpoints

#### TR-2.1: Monitoring.API Service (New)
**Base URL:** `http://localhost:5030/api`

**Endpoints:**

```
GET /validation-failures
  Query params: ?deviceId, ?tenantId, ?from, ?to, ?page, ?pageSize, ?errorType
  Response: { failures: [...], totalCount, page, pageSize }

GET /validation-failures/{id}
  Response: Full failure details including payload and suggestions

POST /validation-failures/reprocess
  Body: { ids: [...] }
  Response: { jobId, status }

GET /dlq/messages
  Query params: ?deviceId, ?category, ?from, ?to, ?page, ?pageSize
  Response: { messages: [...], totalCount }

GET /dlq/messages/{id}
  Response: Full DLQ message details

POST /dlq/messages/reprocess
  Body: { ids: [...] }
  Response: { jobId, status }

DELETE /dlq/messages
  Body: { ids: [...] }
  Response: { deletedCount }

GET /device-schemas
  Query params: ?hasSchema, ?schemaId, ?page, ?pageSize
  Response: { devices: [...], totalCount }

PUT /device-schemas/{deviceId}
  Body: { schemaId, schemaVersion }
  Response: { deviceId, schemaId, assignedAt }

POST /device-schemas/bulk-assign
  Body: { deviceIds: [...], schemaId, schemaVersion }
  Response: { assignedCount, failures }

GET /metrics/realtime
  Response: { messagesPerSecond, successRate, dlqCount, consumerLag, activeDevices }

GET /metrics/timeseries
  Query params: ?metric, ?from, ?to, ?groupBy
  Response: { data: [{timestamp, value}...] }

GET /health/services
  Response: { edgeGateway, kafka, ingestion, timescaledb, schemaRegistry: {status, lastCheck} }
```

### TR-3: Enhanced Logging & Events

#### TR-3.1: Structured Logging
All validation failures must emit structured logs with:
- `EventType`: SchemaValidationFailed
- `DeviceId`: Device identifier
- `TenantId`: Tenant identifier
- `SchemaId`: Expected schema
- `ValidationErrors`: Array of error objects
- `PayloadHash`: SHA-256 hash for deduplication
- `Timestamp`: ISO 8601 UTC

#### TR-3.2: Event Publishing
Publish validation events to dedicated Kafka topic `telemetry.validation-events` for:
- Real-time dashboard updates
- Stream processing/alerting
- Audit trail

### TR-4: Ingestion Service Changes

#### TR-4.1: Enhanced Schema Validation
```csharp
public class EnhancedValidationResult
{
    public bool IsValid { get; set; }
    public string? ExpectedSchemaId { get; set; }
    public string? ExpectedSchemaName { get; set; }
    public int? ExpectedSchemaVersion { get; set; }
    public List<ValidationError> Errors { get; set; } = new();
    public List<SchemaSuggestion> Suggestions { get; set; } = new(); // Auto-detected schemas
    public int ConfidenceScore { get; set; } // 0-100
}

public class ValidationError
{
    public string Path { get; set; } // e.g., "sensors.temperature"
    public string Message { get; set; } // Human-readable error
    public string ErrorType { get; set; } // type_mismatch, missing_required, constraint_violation
    public object? ExpectedValue { get; set; }
    public object? ActualValue { get; set; }
}

public class SchemaSuggestion
{
    public string SchemaId { get; set; }
    public string SchemaName { get; set; }
    public int ConfidenceScore { get; set; } // 0-100
    public string Reason { get; set; } // Why this schema might match
}
```

#### TR-4.2: Validation Event Recording
After validation, record result to `schema_validation_events` table AND publish to Kafka topic.

#### TR-4.3: DLQ Enhancement
When sending to DLQ:
- Categorize error type
- Record full error details to PostgreSQL `dlq_messages` table
- Add retry count to Kafka message headers
- Include processing metadata

### TR-5: Schema Registry Enhancements

#### TR-5.1: Auto-Detection API
```
POST /api/schemas/detect
Body: { payload: {...}, topN: 3 }
Response: [
  { schemaId, schemaName, confidence, matchedFields, missingFields }
]
```

Uses heuristics to suggest schemas based on:
- Field names present in payload
- Field types
- Required fields match percentage

#### TR-5.2: Device Schema Assignment
Add endpoints to Schema Registry for managing device-to-schema mappings.

---

## Non-Functional Requirements

### NFR-1: Performance
- Validation event recording must not add >10ms latency to ingestion pipeline
- Dashboard queries must return in <2 seconds for 7 days of data
- Support 10,000 validation events per second

### NFR-2: Retention
- Schema validation events: 90 days
- DLQ messages: 30 days (configurable)
- Ingestion metrics: 1 year (with downsampling)

### NFR-3: Security
- All monitoring endpoints require admin role
- Sensitive payload data must be redactable
- Audit log all DLQ reprocessing actions

### NFR-4: Scalability
- Monitoring database should be separate from operational database
- Support horizontal scaling of Monitoring.API service
- Dashboard should handle 100+ concurrent admin users

---

## Implementation Phases

### Phase 1: Foundation (Sprint 1)
- [ ] Create database schemas
- [ ] Implement enhanced validation result structure
- [ ] Record validation events to PostgreSQL
- [ ] Publish validation events to Kafka topic
- [ ] Create Monitoring.API service skeleton

### Phase 2: DLQ Management (Sprint 2)
- [ ] Implement DLQ message recording to PostgreSQL
- [ ] Build DLQ query endpoints
- [ ] Implement message reprocessing logic
- [ ] Add DLQ delete functionality

### Phase 3: Device-Schema Management (Sprint 3)
- [ ] Create device schema assignment table
- [ ] Implement auto-detection algorithm
- [ ] Build device-schema endpoints
- [ ] Add bulk assignment capability

### Phase 4: Dashboard UI (Sprint 4-5)
- [ ] Overview page with real-time metrics
- [ ] Schema validation failures page
- [ ] DLQ management page
- [ ] Device-schema association page

### Phase 5: Analytics & Reporting (Sprint 6)
- [ ] Time-series metrics collection
- [ ] Metrics API endpoints
- [ ] Analytics dashboard page
- [ ] Export functionality

---

## Configuration

### Ingestion Service Configuration
```json
{
  "Monitoring": {
    "ValidationEventsEnabled": true,
    "RecordSuccessfulValidations": false,
    "MaxPayloadSampleLength": 1000,
    "ValidationEventTopic": "telemetry.validation-events"
  },
  "DLQ": {
    "RecordMetadataToDatabase": true,
    "RetentionDays": 30,
    "EnableReprocessing": true
  }
}
```

### Monitoring.API Configuration
```json
{
  "ConnectionStrings": {
    "MonitoringDb": "Host=localhost;Database=sensormine_monitoring;..."
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "ValidationEventsTopic": "telemetry.validation-events",
    "DLQTopic": "telemetry.dlq"
  },
  "Caching": {
    "RealtimeMetricsCacheDurationSeconds": 5
  }
}
```

---

## Success Metrics

1. **Time to Resolution:** Reduce time to identify and fix schema validation issues by 80%
2. **DLQ Processing:** Enable reprocessing of 95%+ of DLQ messages after fixes
3. **Device Onboarding:** Reduce schema assignment errors by 70% through auto-detection
4. **Visibility:** 100% of validation failures visible to administrators with full context
5. **Admin Satisfaction:** >4.5/5 rating from platform administrators on monitoring tools

---

## Future Enhancements

- **ML-based Schema Detection:** Train model on successful validations to improve auto-detection
- **Alerting:** Email/Slack notifications for high failure rates
- **Anomaly Detection:** Identify unusual patterns in validation failures
- **Schema Migration Tools:** Assisted schema versioning and device migration
- **Custom Dashboards:** Allow tenants to create custom monitoring views
- **Mobile App:** Mobile admin dashboard for on-the-go monitoring
