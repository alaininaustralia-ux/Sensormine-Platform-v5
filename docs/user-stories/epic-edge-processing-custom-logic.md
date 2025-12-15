# Epic: Edge Processing & Custom Logic Framework

**Status:** Planning  
**Priority:** High  
**Target Release:** Phase 3  
**Dependencies:** Device.API, Ingestion.Service, Query.API

---

## Overview

Enable edge computing capabilities and a flexible framework for custom data processing logic and AI model deployment. This epic covers local processing on edge devices, custom data transformation modules, and AI/ML model management.

---

## User Stories

### Story 7.1: Edge Data Processing Configuration

**As a** Platform Administrator  
**I want to** configure data processing rules that run on edge devices  
**So that** I can reduce cloud costs, improve latency, and process data locally

**Acceptance Criteria:**
- Settings section has "Edge Processing" configuration page
- Can define processing rules with visual builder or scripts
- Can assign processing rules to device types or individual devices
- Rules support data validation, aggregation, filtering, and transformation
- Can test rules against sample data before deployment
- Rules can be versioned and rolled back
- Deployment status tracked per device (pending, deployed, active, failed)

**Technical Notes:**
- Edge processing engine runs in Edge.Gateway service
- Rules stored in sensormine_metadata database
- Supports JavaScript, Python, or compiled .NET assemblies
- Resource limits enforced (CPU, memory, execution time)

---

### Story 7.2: Edge Store-and-Forward

**As a** System  
**I want to** buffer telemetry data locally when cloud connectivity is lost  
**So that** no data is lost during network outages

**Acceptance Criteria:**
- Edge devices detect connectivity loss automatically
- Data buffered in local time-series database (SQLite/InfluxDB)
- Configurable retention policy (keep last N hours/days or up to X MB)
- Automatic resume upload when connectivity restored
- Critical data prioritized during bandwidth constraints
- Dashboard shows buffered data status per device
- Alerts when buffer approaching capacity limits

**Technical Notes:**
- Local storage on edge device or gateway
- Compression applied to reduce storage requirements
- Checksums ensure data integrity
- Upload uses efficient binary protocol (Protocol Buffers)

---

### Story 7.3: Local Threshold Alerting

**As an** Operations Manager  
**I want** critical alerts to trigger locally on edge devices  
**So that** immediate actions can be taken without waiting for cloud processing

**Acceptance Criteria:**
- Can configure threshold rules for edge execution
- Edge devices evaluate rules in real-time (<100ms latency)
- Local alerts trigger actions (relay activation, local alarm, SMS via attached modem)
- Alert events still sent to cloud for logging and dashboards
- Dashboard shows edge alert history
- Can disable edge alerting and fall back to cloud-only
- Edge alert rules synchronized from cloud configuration

**Technical Notes:**
- Rules engine runs on edge gateway
- Uses minimal resources (suitable for Raspberry Pi class devices)
- Supports numeric thresholds, geofencing, pattern matching

---

### Story 7.4: Custom Data Processor Upload

**As a** Platform Developer  
**I want to** upload custom data processing modules  
**So that** I can implement business-specific logic not available in standard features

**Acceptance Criteria:**
- Settings → Custom Logic → Data Processors page
- Can upload processor as:
  - .NET assembly (DLL with specified interface)
  - Python script (.py file)
  - JavaScript module (.js/.mjs file)
- Processor configuration form auto-generated from metadata
- Can test processor with sample input data
- Processor versioning supported
- Can enable/disable processors without deletion
- Usage statistics shown (invocations, errors, avg execution time)

**Technical Notes:**
- Processors implement IDataProcessor interface
- Sandboxed execution with resource limits
- Timeout after 30 seconds default (configurable)
- Errors logged but don't crash pipeline

---

### Story 7.5: Visual Workflow Builder

**As a** Platform Administrator  
**I want to** build data processing workflows with a drag-and-drop interface  
**So that** I can create logic without writing code

**Acceptance Criteria:**
- Visual workflow canvas with nodes and connections
- Node types include:
  - Input (device data)
  - Filter (conditional branching)
  - Transform (data manipulation)
  - Aggregate (sum, avg, count, etc.)
  - Custom Processor (call uploaded module)
  - AI Model (inference)
  - Alert (trigger notification)
  - Output (write to database, call webhook)
- Can save and version workflows
- Can test workflow with sample data
- Visual execution trace shows data flow
- Workflows assigned to device types or devices
- Import/export workflow definitions (JSON)

**Technical Notes:**
- React Flow or similar library for UI
- Backend compiles workflow to executable pipeline
- Execution engine in StreamProcessing.Service

---

### Story 7.6: AI Model Registry

**As a** Data Scientist  
**I want to** upload and manage AI/ML models in a central registry  
**So that** models can be deployed to edge or cloud for inference

**Acceptance Criteria:**
- Settings → AI Models → Model Registry page
- Can upload models in formats:
  - ONNX
  - TensorFlow SavedModel or TFLite
  - PyTorch (.pt/.pth)
  - Scikit-learn (pickle)
- Model metadata captured:
  - Name, description, version
  - Input/output schema
  - Framework and format
  - Model size
  - Expected latency
  - Accuracy metrics (if available)
- Can tag models (production, staging, experimental)
- Can deprecate old model versions
- Model download statistics

**Technical Notes:**
- Models stored in MinIO object storage
- Metadata in sensormine_metadata database
- Model validation on upload (check format, test inference)

---

### Story 7.7: Model Deployment to Edge

**As a** Data Scientist  
**I want to** deploy AI models to edge devices  
**So that** inference can run locally with low latency

**Acceptance Criteria:**
- From Model Registry, select "Deploy to Edge"
- Choose target devices or device types
- System checks compatibility:
  - Model size fits available storage
  - Device has required runtime (ONNX, TFLite)
  - Sufficient compute resources
- Deployment status tracked per device
- Can rollback to previous model version
- Can run A/B test (50% devices use new model)
- Model performance metrics collected (latency, throughput)

**Technical Notes:**
- Edge runtime supports ONNX Runtime or TensorFlow Lite
- Models optimized for target architecture (ARM, x86)
- Incremental download for large models
- GPU acceleration if available (CUDA, Metal, OpenCL)

---

### Story 7.8: Model Inference API

**As a** Developer  
**I want to** call AI models via API  
**So that** I can integrate predictions into applications

**Acceptance Criteria:**
- REST API endpoint: `POST /api/inference/{modelId}`
- Request includes input data matching model schema
- Response includes:
  - Prediction results
  - Confidence scores
  - Inference latency
  - Model version used
- Batch inference supported (multiple inputs in one request)
- Async inference for long-running models (return job ID, poll for results)
- API key authentication and rate limiting

**Technical Notes:**
- Inference.Service handles requests
- Routes to appropriate model runtime
- Caches models in memory for performance
- Supports GPU acceleration

---

### Story 7.9: Anomaly Detection Model Training

**As a** Platform Administrator  
**I want to** train anomaly detection models on historical device data  
**So that** the system can automatically flag unusual behavior

**Acceptance Criteria:**
- Select device type and time range for training data
- Choose anomaly detection algorithm:
  - Statistical (Z-score, IQR)
  - Isolation Forest
  - LSTM Autoencoder
  - One-Class SVM
- Configure sensitivity threshold
- Training job runs asynchronously
- View training progress and results
- Trained model automatically added to Model Registry
- Can deploy model to production with one click
- Model detects anomalies on live data and triggers alerts

**Technical Notes:**
- Training pipeline in Sensormine.AI library
- Uses historical data from sensormine_timeseries database
- Hyperparameter tuning via grid search
- Model evaluation with ROC-AUC, precision, recall

---

### Story 7.10: Predictive Maintenance Model

**As an** Operations Manager  
**I want to** predict equipment failures before they occur  
**So that** I can schedule maintenance proactively

**Acceptance Criteria:**
- Select device type and relevant sensors (vibration, temperature, current)
- Upload historical failure data (labels: normal, warning, failure)
- System trains classification or regression model
- Model predicts:
  - Probability of failure in next N days
  - Estimated remaining useful life (RUL)
  - Failure type (if multi-class)
- Model deployed to production devices
- Dashboard shows predictions per device
- Alerts triggered when failure probability > threshold
- Maintenance recommendations based on predictions

**Technical Notes:**
- Supervised learning (requires labeled training data)
- Feature engineering (RMS, FFT, statistical features)
- Models: Random Forest, Gradient Boosting, Neural Network
- Retraining on new data to prevent drift

---

### Story 7.11: Custom Script Execution

**As a** Platform Developer  
**I want to** write and execute custom scripts for data processing  
**So that** I can implement one-off transformations without building full modules

**Acceptance Criteria:**
- Settings → Custom Logic → Scripts page
- Can create script in JavaScript or Python
- Script editor with syntax highlighting and autocomplete
- Access to device data and context via API:
  ```javascript
  function process(data, context) {
    const temp = data.temperature;
    const humidity = data.humidity;
    const heatIndex = calculateHeatIndex(temp, humidity);
    return { ...data, heatIndex };
  }
  ```
- Can test script with sample data
- Script runs in sandboxed environment (no file system or network access)
- Execution timeout (default 5 seconds)
- Error handling and logging
- Assign scripts to device types or devices

**Technical Notes:**
- JavaScript: V8 isolate or QuickJS
- Python: RestrictedPython or subprocess isolation
- Resource limits enforced
- Hot reload without service restart

---

### Story 7.12: Data Aggregation Rules

**As a** Platform Administrator  
**I want to** define aggregation rules for high-frequency sensor data  
**So that** I can reduce storage and bandwidth costs

**Acceptance Criteria:**
- Create aggregation rule specifying:
  - Source device type and fields
  - Aggregation window (1 min, 5 min, 15 min, 1 hour)
  - Aggregation functions (avg, min, max, sum, count, stddev)
  - Downsample or keep raw data
- Rules run on edge or in StreamProcessing.Service
- Aggregated data written to separate table
- Dashboards can query aggregated data for faster performance
- Raw data retention policy separate from aggregated data

**Technical Notes:**
- TimescaleDB continuous aggregates for cloud processing
- Edge aggregation using local SQLite with periodic upload
- Configurable data retention (raw: 7 days, aggregated: 2 years)

---

### Story 7.13: Geofencing Logic

**As an** Operations Manager  
**I want to** define geofences and trigger actions when devices enter/exit  
**So that** I can automate location-based workflows

**Acceptance Criteria:**
- Create geofence by:
  - Drawing polygon on map
  - Uploading GeoJSON file
  - Defining radius around point
- Assign geofences to device types
- Configure actions on enter/exit:
  - Send alert
  - Change device configuration
  - Run custom script
  - Log event
- Dashboard shows devices in each geofence
- Geofence evaluation runs on edge or cloud
- Historical geofence crossings logged

**Technical Notes:**
- PostGIS for geospatial queries
- ST_Within, ST_Intersects for point-in-polygon
- Edge geofencing uses lightweight library (Turf.js)

---

### Story 7.14: Time-Based Automation

**As a** Platform Administrator  
**I want to** schedule actions to run at specific times  
**So that** I can automate recurring tasks

**Acceptance Criteria:**
- Create scheduled job with:
  - Cron expression or simple schedule (daily, weekly, monthly)
  - Action to perform (run script, send command, generate report)
  - Target devices or device types
- Jobs tracked in database with execution history
- Can enable/disable jobs
- Missed executions logged
- Timezone support
- One-time or recurring schedules

**Technical Notes:**
- Quartz.NET or Hangfire for job scheduling
- Jobs persisted in database
- Distributed locking for high availability

---

### Story 7.15: Model Performance Monitoring

**As a** Data Scientist  
**I want to** monitor deployed AI models for performance degradation  
**So that** I can retrain or replace models when accuracy drops

**Acceptance Criteria:**
- Dashboard shows per model:
  - Inference count per day
  - Average latency (P50, P95, P99)
  - Error rate
  - Model drift score (input distribution shift)
  - Accuracy metrics (if ground truth available)
- Alerts when metrics exceed thresholds
- Model comparison view (A/B test results)
- Historical performance charts
- Export metrics for further analysis

**Technical Notes:**
- Metrics collected in StreamProcessing.Service
- Stored in sensormine_timeseries database
- Drift detection using KL divergence or PSI
- Ground truth ingestion via API or manual labeling

---

### Story 7.16: Pipeline Debugging Tools

**As a** Platform Developer  
**I want to** debug custom processing pipelines  
**So that** I can identify and fix issues quickly

**Acceptance Criteria:**
- Execution trace shows:
  - Input data
  - Each processing step
  - Intermediate results
  - Output data
  - Execution time per step
- Can replay pipeline with historical data
- Breakpoint-style inspection (pause and inspect state)
- Logs accessible from UI
- Error stack traces shown
- Can export trace for offline analysis

**Technical Notes:**
- Pipeline execution wrapped in tracing middleware
- OpenTelemetry spans for each step
- Trace storage in Jaeger or similar
- UI visualizes execution flow

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 sprints)
- [ ] Story 7.1: Edge Data Processing Configuration
- [ ] Story 7.2: Edge Store-and-Forward
- [ ] Story 7.4: Custom Data Processor Upload
- [ ] Story 7.11: Custom Script Execution

### Phase 2: AI/ML Core (3-4 sprints)
- [ ] Story 7.6: AI Model Registry
- [ ] Story 7.7: Model Deployment to Edge
- [ ] Story 7.8: Model Inference API
- [ ] Story 7.15: Model Performance Monitoring

### Phase 3: Advanced Features (3-4 sprints)
- [ ] Story 7.5: Visual Workflow Builder
- [ ] Story 7.9: Anomaly Detection Model Training
- [ ] Story 7.10: Predictive Maintenance Model
- [ ] Story 7.12: Data Aggregation Rules

### Phase 4: Automation & Ops (2-3 sprints)
- [ ] Story 7.3: Local Threshold Alerting
- [ ] Story 7.13: Geofencing Logic
- [ ] Story 7.14: Time-Based Automation
- [ ] Story 7.16: Pipeline Debugging Tools

---

## Technical Architecture

### Services Involved

| Service | Responsibility |
|---------|---------------|
| **Edge.Gateway** | Edge processing engine, local storage, rule execution |
| **StreamProcessing.Service** | Cloud-based processing pipelines, aggregations |
| **Sensormine.AI** | Model registry, training, inference orchestration |
| **Ingestion.Service** | Receive and route data to processors |
| **Query.API** | Query processed data and model results |
| **Dashboard.API** | UI for configuration and monitoring |

### Data Flow

```
Device → Edge.Gateway (local processing) → Ingestion.Service → Processors/Models → TimescaleDB
                ↓                                 ↓
         Local Storage                    StreamProcessing.Service
                                                  ↓
                                          Aggregated Metrics
```

### Database Schema Additions

**custom_processors table:**
- id, tenant_id, name, type (script/assembly/model), version, code/file_path, configuration, created_at, updated_at

**processing_pipelines table:**
- id, tenant_id, name, workflow_definition (JSON), device_type_id, status, created_at, updated_at

**ai_models table:**
- id, tenant_id, name, version, format, file_path, input_schema, output_schema, metadata (JSON), created_at

**model_deployments table:**
- id, model_id, device_id, status, deployed_at, performance_metrics (JSON)

**edge_rules table:**
- id, tenant_id, device_type_id, rule_type, condition, action, enabled, created_at, updated_at

---

## Dependencies

### External Libraries
- **ONNX Runtime** - Cross-platform AI inference
- **TensorFlow Lite** - Lightweight ML for edge
- **V8 / QuickJS** - JavaScript execution
- **IronPython / RestrictedPython** - Python sandboxing
- **Roslyn** - C# script compilation
- **PostGIS** - Geospatial queries

### Infrastructure
- Edge devices with sufficient compute (Raspberry Pi 4+, x86 edge gateways)
- GPU support optional but recommended for model training
- MinIO for model file storage

---

## Testing Strategy

### Unit Tests
- Test each processor type (script, assembly, model)
- Test resource limits and timeouts
- Test error handling and fallbacks

### Integration Tests
- End-to-end pipeline execution
- Edge-to-cloud data flow
- Model deployment and inference
- Geofencing accuracy

### Performance Tests
- Inference latency under load
- Pipeline throughput (events/second)
- Edge device resource usage
- Model accuracy benchmarks

---

## Security Considerations

- Code signing for uploaded processors
- Sandboxed execution environments
- Resource limits (CPU, memory, disk I/O)
- Network isolation for edge devices
- Model encryption in storage and transit
- Audit logging of all processor executions
- RBAC for model deployment permissions

---

## Documentation Requirements

- SDK documentation for IDataProcessor, IAIModel interfaces
- Code samples for common use cases
- Model deployment guide
- Edge gateway setup instructions
- Performance tuning guide
- Troubleshooting guide

---

**Last Updated:** December 11, 2025  
**Owner:** Platform Team  
**Reviewers:** Architecture Team, Data Science Team
