/**
 * Help Content for Sensormine Platform
 * 
 * Comprehensive documentation for all platform features
 */

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  content: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags?: string[];
  relatedArticles?: string[];
}

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of the Sensormine Platform',
    icon: 'rocket',
    content: [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        summary: 'Understanding the Sensormine IoT Platform architecture',
        content: `
# Platform Overview

Sensormine is an industrial IoT platform designed for real-time device monitoring, data ingestion, and analytics. The platform follows a **Device Type-Centric Architecture** that simplifies device management and ensures data consistency.

## Key Concepts

### Device Types
Device Types are templates that define:
- **Protocol configuration** (MQTT, HTTP, Modbus, OPC UA, WebSocket)
- **Data schema** (JSON Schema for payload validation)
- **Custom metadata fields** (location, serial number, etc.)
- **Alert templates** (threshold-based alerts)

Think of Device Types as blueprints for your devices.

### Devices
Individual device instances that inherit configuration from their Device Type:
- Each device is registered with a unique Device ID
- Inherits schema and protocol settings from its Device Type
- Can have custom field values specific to the instance
- Tracks status, location, and last-seen timestamp

### Schemas
JSON Schemas that define the structure of telemetry data:
- Validate incoming data payloads
- Define data types, required fields, and constraints
- Support versioning for schema evolution
- Can be generated using AI from sample data

### Data Flow
1. **Device Registration**: Create Device Type → Assign Schema → Register Devices
2. **Data Ingestion**: Device sends telemetry → Edge Gateway receives → Validates against schema → Stores in TimescaleDB
3. **Visualization**: Query API retrieves time-series data → Dashboards display charts and metrics
4. **Alerting**: Alert rules evaluate incoming data → Trigger notifications when thresholds are exceeded

## Architecture

The platform consists of:
- **Frontend**: Next.js React application (this interface)
- **API Gateway**: Entry point for all API requests
- **Device.API**: Device and Device Type management
- **SchemaRegistry.API**: Schema versioning and validation
- **Edge.Gateway**: MQTT broker for device connectivity
- **Ingestion.Service**: Data validation and storage pipeline
- **Query.API**: Time-series data retrieval
- **Alerts.API**: Alert rule management and notifications
- **TimescaleDB**: Time-series data storage (PostgreSQL + TimescaleDB extension)
`,
        tags: ['overview', 'architecture', 'concepts'],
        relatedArticles: ['device-types-guide', 'schema-creation'],
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        summary: 'Get your first device up and running in 5 minutes',
        content: `
# Quick Start Guide

Follow these steps to get your first device sending data to the platform:

## Step 1: Create a Schema (Optional)

If you don't have a schema yet:
1. Navigate to **Schemas** in the sidebar
2. Click **Create Schema**
3. Either:
   - Use the **AI Generator** by pasting sample JSON data
   - Manually write a JSON Schema
4. Review and save the schema

**Tip**: The AI generator can create a schema from just 1-2 sample payloads!

## Step 2: Create a Device Type

1. Navigate to **Devices** → **Device Types**
2. Click **Create Device Type**
3. Fill in the form:
   - **Name**: e.g., "Temperature Sensor"
   - **Description**: Brief description of this device type
   - **Protocol**: Select your device's communication protocol (MQTT recommended)
   - **Schema**: Select the schema you created (or create inline)
   - **Custom Fields**: Add any metadata fields (serial number, location, etc.)
4. Click **Create Device Type**

## Step 3: Register a Device

1. Stay on the Device Types page or navigate to **Devices**
2. Click **Register Device**
3. Fill in the form:
   - **Device ID**: Unique identifier (e.g., "temp-sensor-001")
   - **Name**: Human-readable name
   - **Device Type**: Select the Device Type you created
   - **Custom Fields**: Fill in values for any custom fields
4. Click **Register Device**

## Step 4: Configure Your Device

For MQTT devices:
- **Broker**: localhost:1883 (or your Edge Gateway address)
- **Topic**: \`sensormine/{deviceId}/telemetry\`
- **Payload**: Must match your schema

Example payload:
\`\`\`json
{
  "temperature": 23.5,
  "humidity": 45.2,
  "timestamp": "2025-12-06T10:30:00Z"
}
\`\`\`

## Step 5: Send Test Data

Use the **Device Simulator** (available at port 3021) or configure your actual device.

For quick testing with curl:
\`\`\`bash
curl -X POST http://localhost:5000/api/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "temp-sensor-001",
    "temperature": 23.5,
    "humidity": 45.2,
    "timestamp": "2025-12-06T10:30:00Z"
  }'
\`\`\`

## Step 6: View Your Data

1. Navigate to **Dashboard**
2. Your device should appear in the device list
3. Click on the device to view telemetry charts

**Congratulations!** You've successfully set up your first device.

## Next Steps

- Create alert rules for threshold monitoring
- Build custom dashboards with multiple device charts
- Explore bulk device registration for large deployments
`,
        tags: ['quickstart', 'tutorial', 'beginner'],
        relatedArticles: ['device-types-guide', 'schema-creation', 'mqtt-setup'],
      },
    ],
  },
  {
    id: 'device-types',
    title: 'Device Types',
    description: 'Managing device type templates and configurations',
    icon: 'cpu',
    content: [
      {
        id: 'device-types-guide',
        title: 'Device Types Guide',
        summary: 'Complete guide to creating and managing device types',
        content: `
# Device Types Guide

Device Types are the foundation of the Sensormine platform. They define how devices connect, what data they send, and how that data is validated.

## Creating a Device Type

### Basic Information
- **Name**: Descriptive name for this type of device (e.g., "Industrial Temperature Sensor")
- **Description**: Detailed description of the device's purpose and capabilities
- **Manufacturer**: Optional manufacturer information

### Protocol Configuration

Select the communication protocol your devices use:

#### MQTT (Message Queuing Telemetry Transport)
- **Best for**: Real-time data, low bandwidth, IoT devices
- **Configuration**:
  - Broker address and port
  - Topic pattern
  - QoS level (0, 1, or 2)
  - Retain messages option
- **Topic Format**: \`sensormine/{deviceId}/telemetry\`

#### HTTP/REST
- **Best for**: Web-connected devices, APIs
- **Configuration**:
  - Endpoint URL
  - HTTP method (POST/PUT)
  - Headers
  - Authentication type

#### Modbus TCP
- **Best for**: Industrial equipment, PLCs
- **Configuration**:
  - IP address and port
  - Unit ID
  - Register mapping

#### OPC UA
- **Best for**: Industrial automation, SCADA systems
- **Configuration**:
  - Server URL
  - Security policy
  - Node IDs to monitor

#### WebSocket
- **Best for**: Bidirectional communication, real-time updates
- **Configuration**:
  - WebSocket URL
  - Authentication
  - Message format

### Schema Assignment

Every Device Type must have a schema that defines the structure of telemetry data.

**Option 1: Select Existing Schema**
- Choose from previously created schemas
- Ensures consistency across device types

**Option 2: Create Inline Schema**
- Use the embedded schema wizard
- AI-powered generation from sample data
- Immediate validation and preview

**Schema Requirements**:
- Must be valid JSON Schema (Draft 7 or later)
- Should include all expected telemetry fields
- Define types, required fields, and constraints
- Consider future extensibility

### Custom Fields

Add metadata fields specific to this device type:

- **Field Name**: Unique identifier (e.g., "serialNumber")
- **Display Label**: User-friendly name (e.g., "Serial Number")
- **Field Type**: Text, Number, Boolean, Date, Email, etc.
- **Required**: Whether the field must be filled during device registration
- **Validation Rules**:
  - Min/Max length for text
  - Min/Max value for numbers
  - Regex pattern matching
  - Allowed values (dropdown)
- **Default Value**: Pre-populated value for new devices
- **Help Text**: Tooltip or guidance for users

**Common Custom Fields**:
- Serial Number
- Installation Date
- Location/Site
- Maintenance Schedule
- Warranty Expiration
- Asset ID

### Alert Templates

Define default alert rules for devices of this type:

- **Alert Name**: Description of the condition
- **Condition**: Threshold or pattern to detect
- **Severity**: Critical, Warning, Info
- **Actions**: Email, webhook, SMS
- **Cooldown Period**: Minimum time between alerts

Example:
- Name: "High Temperature Alert"
- Condition: temperature > 80
- Severity: Warning
- Action: Email maintenance team

## Editing Device Types

### Version Control
Device Type changes are versioned:
- Each edit creates a new version
- Historical versions are preserved
- Rollback to previous versions possible

### Impact Analysis
Before saving changes, the system shows:
- Number of affected devices
- Breaking changes (if any)
- Recommended migration steps

### Safe Updates
Non-breaking changes:
- Adding optional custom fields
- Relaxing validation rules
- Adding alert templates

Breaking changes (require migration):
- Removing required fields
- Changing field types
- Tightening validation rules

## Best Practices

1. **Start Simple**: Create basic Device Types first, add complexity later
2. **Consistent Naming**: Use clear, descriptive names
3. **Document Well**: Add detailed descriptions for future reference
4. **Test First**: Register a test device before bulk deployment
5. **Version Carefully**: Plan schema changes to avoid breaking devices
6. **Reuse Schemas**: Share schemas across similar device types
7. **Custom Fields**: Add fields that will be useful for filtering and reporting
8. **Alert Templates**: Set up proactive monitoring from the start
`,
        tags: ['device-types', 'configuration', 'protocols'],
        relatedArticles: ['schema-creation', 'device-registration', 'mqtt-setup'],
      },
    ],
  },
  {
    id: 'devices',
    title: 'Device Management',
    description: 'Registering and managing individual devices',
    icon: 'monitor',
    content: [
      {
        id: 'device-registration',
        title: 'Device Registration',
        summary: 'How to register and configure individual devices',
        content: `
# Device Registration

After creating Device Types, you can register individual device instances.

## Single Device Registration

### Step 1: Select Device Type
Choose the Device Type that matches your device's capabilities. This determines:
- Communication protocol
- Data schema
- Required custom fields

### Step 2: Device Identity
- **Device ID**: Unique identifier used in telemetry
  - Must be unique across your tenant
  - Cannot be changed after creation
  - Use alphanumeric and hyphens only
  - Example: \`temp-sensor-warehouse-01\`
- **Name**: Human-readable name for display
  - Can be changed anytime
  - Example: "Warehouse 1 Temperature Sensor"

### Step 3: Custom Fields
Fill in values for custom fields defined by the Device Type:
- **Required fields** must be completed
- **Optional fields** can be left blank
- Field validation is automatic
- Examples:
  - Serial Number: ABC-123-XYZ
  - Installation Date: 2025-01-15
  - Location: Warehouse 1, Section A

### Step 4: Location (Optional)
Add geographic coordinates if your device has a fixed location:
- Latitude
- Longitude
- Altitude (optional)

Useful for:
- Map visualizations
- Location-based filtering
- Proximity alerts

### Step 5: Review and Register
- Review all information
- Click **Register Device**
- Device is immediately available for data ingestion

## Bulk Device Registration

For large deployments, use bulk registration:

### CSV Import
1. Download the CSV template
2. Fill in device information:
   \`\`\`csv
   deviceId,name,serialNumber,location
   sensor-001,Sensor 1,SN001,"Building A"
   sensor-002,Sensor 2,SN002,"Building B"
   \`\`\`
3. Upload the file
4. Review detected errors
5. Confirm registration

### JSON Import
For programmatic registration:
\`\`\`json
{
  "deviceTypeId": "uuid-here",
  "devices": [
    {
      "deviceId": "sensor-001",
      "name": "Sensor 1",
      "customFieldValues": {
        "serialNumber": "SN001",
        "location": "Building A"
      }
    }
  ]
}
\`\`\`

## Device Status

Devices can have various states:
- **Active**: Currently sending data
- **Inactive**: Registered but not yet connected
- **Maintenance**: Temporarily offline for servicing
- **Offline**: Not seen within expected interval
- **Error**: Validation or connection errors

Status is automatically updated based on:
- Last seen timestamp
- Heartbeat messages
- Error conditions

## Device Management

### Viewing Devices
- **List View**: All devices with filters
- **Card View**: Visual layout with status indicators
- **Map View**: Geographic distribution (if locations set)

### Filtering & Search
- By Device Type
- By Status
- By Custom Field values
- By Location
- Full-text search on name and ID

### Device Details
Click any device to view:
- Configuration summary
- Recent telemetry data
- Data quality metrics
- Active alerts
- Maintenance history
- Edit/Update options

### Updating Devices
Editable fields:
- Name
- Custom field values
- Location
- Status (manual override)

Non-editable:
- Device ID (identifier must remain constant)
- Device Type (create new device instead)

### Deleting Devices
Deletion is permanent and:
- Stops data ingestion for that device
- Preserves historical telemetry data
- Cannot be undone
- Requires confirmation

## Best Practices

1. **Naming Convention**: Use consistent, descriptive device IDs
2. **Documentation**: Use the name field to describe physical location/purpose
3. **Custom Fields**: Fill in all available information for better organization
4. **Testing**: Register test devices before production deployment
5. **Monitoring**: Regularly check device status and last-seen timestamps
6. **Maintenance Mode**: Set status before planned downtime to avoid false alerts
`,
        tags: ['devices', 'registration', 'management'],
        relatedArticles: ['device-types-guide', 'bulk-import'],
      },
    ],
  },
  {
    id: 'schemas',
    title: 'Schema Management',
    description: 'Creating and managing data validation schemas',
    icon: 'file-json',
    content: [
      {
        id: 'schema-creation',
        title: 'Schema Creation Guide',
        summary: 'Creating schemas to validate device telemetry data',
        content: `
# Schema Creation Guide

Schemas define the structure and validation rules for device telemetry data. They ensure data quality and consistency across your platform.

## What is a JSON Schema?

A JSON Schema is a vocabulary that allows you to annotate and validate JSON documents. It defines:
- Data types for each field
- Required vs optional fields
- Value constraints (min/max, length, patterns)
- Nested object structures
- Array validation rules

## Creating a Schema

### Method 1: AI-Powered Generation (Recommended)

The easiest way to create a schema:

1. **Collect Sample Data**
   - Gather 1-3 representative JSON payloads from your device
   - More samples = better schema accuracy
   
2. **Paste Samples**
   - Navigate to Schemas → Create Schema
   - Click "AI Generator" tab
   - Paste your JSON samples
   
3. **Generate & Review**
   - AI analyzes patterns and generates schema
   - Review generated schema
   - Adjust field requirements and constraints
   
4. **Test & Save**
   - Test with additional sample data
   - Save schema with name and version

Example sample data:
\`\`\`json
{
  "temperature": 23.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "timestamp": "2025-12-06T10:30:00Z",
  "batteryLevel": 87
}
\`\`\`

Generated schema will include:
- Correct data types (number, string, etc.)
- Required fields detection
- Value ranges from samples
- Timestamp format validation

### Method 2: Manual Creation

For full control, write the schema manually:

\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["temperature", "timestamp"],
  "properties": {
    "temperature": {
      "type": "number",
      "minimum": -50,
      "maximum": 100,
      "description": "Temperature in Celsius"
    },
    "humidity": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Relative humidity percentage"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    }
  }
}
\`\`\`

### Method 3: Import Existing Schema

If you already have a JSON Schema:
1. Click "Import Schema"
2. Paste the schema JSON
3. System validates it
4. Add name and description
5. Save

## Schema Fields

### Basic Properties
- **Name**: Descriptive name for the schema
- **Version**: Semantic versioning (1.0.0)
- **Description**: Purpose and usage notes
- **Schema Content**: The actual JSON Schema

### Validation Rules

#### Data Types
- \`string\`: Text data
- \`number\`: Numeric values (integers or decimals)
- \`integer\`: Whole numbers only
- \`boolean\`: true/false values
- \`array\`: Lists of items
- \`object\`: Nested structures
- \`null\`: Explicit null values

#### String Constraints
- \`minLength\`: Minimum string length
- \`maxLength\`: Maximum string length
- \`pattern\`: Regular expression validation
- \`format\`: Built-in formats (date-time, email, uri, uuid)

#### Number Constraints
- \`minimum\`: Minimum value (inclusive)
- \`maximum\`: Maximum value (inclusive)
- \`exclusiveMinimum\`: Minimum value (exclusive)
- \`exclusiveMaximum\`: Maximum value (exclusive)
- \`multipleOf\`: Value must be multiple of this number

#### Array Constraints
- \`minItems\`: Minimum array length
- \`maxItems\`: Maximum array length
- \`uniqueItems\`: All items must be unique
- \`items\`: Schema for array elements

### Required Fields

Specify which fields must be present:
\`\`\`json
{
  "required": ["temperature", "timestamp", "deviceId"]
}
\`\`\`

### Optional Fields

Fields not in \`required\` array are optional but will be validated if present.

## Schema Versioning

### Version Numbers
Use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: Backward-compatible additions (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Creating New Versions
1. Open existing schema
2. Click "Create New Version"
3. Make changes
4. Increment version number appropriately
5. Add change notes
6. Save

### Version Management
- All versions are preserved
- Device Types reference specific schema versions
- Can update Device Type to use newer schema version
- Old data validated against original schema

## Testing Schemas

### Validation Testing
1. Open schema in editor
2. Click "Test Schema" tab
3. Paste sample JSON data
4. View validation results:
   - ✅ Valid: Data matches schema
   - ❌ Invalid: Lists specific errors

### Common Validation Errors
- **Missing required field**: Add the field to your data
- **Type mismatch**: Check field is correct type
- **Out of range**: Value exceeds min/max constraints
- **Format invalid**: String doesn't match expected format
- **Additional properties**: Extra fields not in schema (if additionalProperties: false)

## Best Practices

1. **Start Permissive**: Begin with loose validation, tighten over time
2. **Use Descriptions**: Document each field's purpose
3. **Reasonable Constraints**: Set realistic min/max values
4. **Required Fields**: Only mark critical fields as required
5. **Test Thoroughly**: Validate against real device data
6. **Version Carefully**: Plan breaking changes to minimize impact
7. **Document Changes**: Add detailed version notes
8. **Consider Future**: Design for extensibility (additional fields)

## Advanced Features

### Conditional Validation
\`\`\`json
{
  "if": {
    "properties": { "sensorType": { "const": "temperature" } }
  },
  "then": {
    "required": ["temperature"]
  }
}
\`\`\`

### Enum Values
\`\`\`json
{
  "status": {
    "type": "string",
    "enum": ["online", "offline", "maintenance"]
  }
}
\`\`\`

### Nested Objects
\`\`\`json
{
  "location": {
    "type": "object",
    "properties": {
      "latitude": { "type": "number" },
      "longitude": { "type": "number" }
    }
  }
}
\`\`\`

### Array of Objects
\`\`\`json
{
  "sensors": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "value": { "type": "number" }
      }
    }
  }
}
\`\`\`
`,
        tags: ['schemas', 'validation', 'json-schema'],
        relatedArticles: ['device-types-guide', 'ai-schema-generation'],
      },
      {
        id: 'ai-schema-generation',
        title: 'AI Schema Generation',
        summary: 'Using AI to automatically create schemas from sample data',
        content: `
# AI Schema Generation

The Sensormine platform includes an AI-powered schema generator that automatically creates JSON Schemas from sample telemetry data.

## How It Works

The AI analyzes your sample JSON payloads and:
1. **Detects data types** for each field
2. **Identifies required fields** based on presence across samples
3. **Infers value ranges** from observed values
4. **Recognizes formats** (dates, emails, UUIDs, etc.)
5. **Detects patterns** in nested structures and arrays
6. **Generates descriptions** for each field

## Using the AI Generator

### Step 1: Prepare Sample Data

Collect 1-3 representative JSON payloads from your device:

**Single Sample** (minimum):
\`\`\`json
{
  "temperature": 23.5,
  "humidity": 65,
  "timestamp": "2025-12-06T10:30:00Z"
}
\`\`\`

**Multiple Samples** (recommended):
\`\`\`json
// Sample 1
{
  "temperature": 23.5,
  "humidity": 65,
  "timestamp": "2025-12-06T10:30:00Z",
  "batteryLevel": 87
}

// Sample 2
{
  "temperature": 24.1,
  "humidity": 63,
  "timestamp": "2025-12-06T10:35:00Z",
  "batteryLevel": 86
}
\`\`\`

**Tips for Better Results**:
- Include examples with minimum and maximum values
- Show both required and optional fields
- Include various data states (errors, null values)
- Use realistic data, not placeholders

### Step 2: Generate Schema

1. Navigate to **Schemas** → **Create Schema**
2. Click **AI Generator** tab
3. Paste your sample JSON (one or multiple)
4. Click **Generate Schema**
5. Wait a few seconds for AI processing

### Step 3: Review Generated Schema

The AI will generate a complete JSON Schema with:

**Data Types**:
\`\`\`json
"temperature": {
  "type": "number",
  "description": "Temperature measurement"
}
\`\`\`

**Value Constraints**:
\`\`\`json
"humidity": {
  "type": "number",
  "minimum": 0,
  "maximum": 100,
  "description": "Relative humidity percentage"
}
\`\`\`

**Format Detection**:
\`\`\`json
"timestamp": {
  "type": "string",
  "format": "date-time",
  "description": "Measurement timestamp"
}
\`\`\`

**Required Fields**:
\`\`\`json
"required": ["temperature", "timestamp"]
\`\`\`

### Step 4: Refine Schema

Review and adjust as needed:

- **Tighten constraints**: Add more restrictive min/max values
- **Mark additional fields as required**: Change field requirements
- **Add descriptions**: Improve field documentation
- **Adjust types**: Fix any misidentified types
- **Add patterns**: Add regex validation for strings

### Step 5: Test & Save

1. Click **Test Schema** tab
2. Paste additional sample data
3. Verify validation works correctly
4. Click **Save Schema**
5. Provide name and version

## AI Capabilities

### Type Inference

The AI recognizes:
- **Numbers**: Integers vs decimals
- **Strings**: Text data
- **Booleans**: true/false
- **Dates**: ISO 8601 timestamps
- **UUIDs**: Standard UUID format
- **Emails**: Email addresses
- **URLs**: Web addresses
- **Null values**: Optional fields

### Range Detection

For numeric fields, AI infers:
- Minimum value (from samples)
- Maximum value (from samples)
- Typical range (with buffer)
- Decimal places (precision)

Example:
\`\`\`
Samples: 23.5, 24.1, 22.8, 25.3
Generated: min: 20, max: 30
\`\`\`

### Pattern Recognition

The AI detects patterns in:

**Nested Objects**:
\`\`\`json
{
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
\`\`\`
Becomes:
\`\`\`json
"location": {
  "type": "object",
  "properties": {
    "lat": { "type": "number" },
    "lng": { "type": "number" }
  }
}
\`\`\`

**Arrays**:
\`\`\`json
{
  "readings": [23.5, 24.1, 22.8]
}
\`\`\`
Becomes:
\`\`\`json
"readings": {
  "type": "array",
  "items": { "type": "number" }
}
\`\`\`

**Enums**:
\`\`\`json
// Samples show: "active", "inactive", "active", "maintenance"
"status": {
  "type": "string",
  "enum": ["active", "inactive", "maintenance"]
}
\`\`\`

### Field Descriptions

AI generates intelligent descriptions:
- "temperature" → "Temperature measurement in Celsius"
- "batteryLevel" → "Battery charge level percentage"
- "timestamp" → "Timestamp of the measurement"
- "deviceId" → "Unique device identifier"

## Best Practices

### Sample Selection
1. **Include edge cases**: Min/max values, nulls, errors
2. **Multiple samples**: 2-3 samples provide better accuracy
3. **Recent data**: Use current, real data not test data
4. **Complete samples**: Include all expected fields

### Review Process
1. **Check types**: Verify AI identified correct types
2. **Adjust ranges**: Tighten or loosen min/max constraints
3. **Review required fields**: Ensure critical fields are required
4. **Test thoroughly**: Validate against more sample data
5. **Add context**: Enhance descriptions with domain knowledge

### When to Use AI vs Manual

**Use AI when**:
- You have sample data but no schema
- Quick prototyping
- Exploring new device types
- Need a starting point for manual refinement

**Use Manual when**:
- Very specific validation rules needed
- Complex conditional logic required
- Strict compliance requirements
- Existing schema to import

## Troubleshooting

### AI Generated Incorrect Type
- Add more diverse samples
- Manually correct in schema editor
- Example: AI might see "123" as number when it should be string ID

### Required Fields Wrong
- AI guesses based on presence across samples
- Review and adjust required array manually
- Test with real device data

### Missing Constraints
- AI generates permissive schemas by default
- Add tighter min/max after generation
- Add pattern validation for strings

### Complex Structures Not Detected
- Some nested patterns are complex
- Manual refinement may be needed
- Use multiple samples showing the pattern

## Example: Complete Workflow

**Sample Data**:
\`\`\`json
{
  "deviceId": "sensor-001",
  "temperature": 23.5,
  "humidity": 65.2,
  "pressure": 1013.25,
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "status": "online",
  "timestamp": "2025-12-06T10:30:00Z"
}
\`\`\`

**Generated Schema**:
\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["deviceId", "temperature", "timestamp"],
  "properties": {
    "deviceId": {
      "type": "string",
      "description": "Unique device identifier"
    },
    "temperature": {
      "type": "number",
      "minimum": -50,
      "maximum": 100,
      "description": "Temperature in Celsius"
    },
    "humidity": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Relative humidity percentage"
    },
    "pressure": {
      "type": "number",
      "description": "Atmospheric pressure in hPa"
    },
    "location": {
      "type": "object",
      "properties": {
        "lat": {
          "type": "number",
          "description": "Latitude coordinate"
        },
        "lng": {
          "type": "number",
          "description": "Longitude coordinate"
        }
      }
    },
    "status": {
      "type": "string",
      "enum": ["online", "offline", "maintenance"],
      "description": "Device status"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Measurement timestamp"
    }
  }
}
\`\`\`

**Result**: Production-ready schema in under 1 minute!
`,
        tags: ['schemas', 'ai', 'automation'],
        relatedArticles: ['schema-creation', 'json-schema-basics'],
      },
    ],
  },
  {
    id: 'protocols',
    title: 'Communication Protocols',
    description: 'Configuring device connectivity protocols',
    icon: 'network',
    content: [
      {
        id: 'mqtt-setup',
        title: 'MQTT Configuration',
        summary: 'Setting up MQTT protocol for device communication',
        content: `
# MQTT Configuration

MQTT (Message Queuing Telemetry Transport) is the recommended protocol for IoT devices on the Sensormine platform.

## Why MQTT?

- **Lightweight**: Minimal bandwidth and power consumption
- **Reliable**: Built-in QoS levels for guaranteed delivery
- **Real-time**: Push-based, instant data delivery
- **Scalable**: Handles thousands of concurrent connections
- **Bidirectional**: Supports commands to devices

## MQTT Concepts

### Broker
The MQTT server that routes messages:
- **Address**: localhost:1883 (default)
- **Production**: Your Edge Gateway address
- **Protocols**: TCP, WebSocket

### Topics
Hierarchical message routing:
- Format: \`sensormine/{deviceId}/telemetry\`
- Example: \`sensormine/sensor-001/telemetry\`
- Wildcards: + (single level), # (multi-level)

### Quality of Service (QoS)
Message delivery guarantee:
- **QoS 0**: At most once (fire and forget)
- **QoS 1**: At least once (acknowledged)
- **QoS 2**: Exactly once (guaranteed)

Recommendation: **QoS 1** for telemetry data

### Retained Messages
Last message stored by broker:
- New subscribers receive last value immediately
- Useful for status updates
- Not recommended for time-series data

## Configuring MQTT in Device Type

When creating a Device Type:

1. Select **MQTT** as protocol
2. Configure MQTT settings:
   - **Broker Address**: localhost:1883
   - **Topic Pattern**: \`sensormine/{deviceId}/telemetry\`
   - **QoS Level**: 1
   - **Retain**: false (for telemetry)
3. Save Device Type

## Device Configuration

### Connecting to Broker

**Python Example**:
\`\`\`python
import paho.mqtt.client as mqtt
import json
import time

# Configuration
BROKER = "localhost"
PORT = 1883
DEVICE_ID = "sensor-001"
TOPIC = f"sensormine/{DEVICE_ID}/telemetry"

# Create client
client = mqtt.Client(client_id=DEVICE_ID)

# Connect to broker
client.connect(BROKER, PORT, keepalive=60)

# Start network loop
client.loop_start()

# Publish telemetry
while True:
    payload = {
        "temperature": 23.5,
        "humidity": 65.2,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    client.publish(TOPIC, json.dumps(payload), qos=1)
    time.sleep(60)  # Every minute
\`\`\`

**Node.js Example**:
\`\`\`javascript
const mqtt = require('mqtt');

const BROKER = 'mqtt://localhost:1883';
const DEVICE_ID = 'sensor-001';
const TOPIC = \`sensormine/\${DEVICE_ID}/telemetry\`;

// Connect
const client = mqtt.connect(BROKER, {
  clientId: DEVICE_ID,
  keepalive: 60
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Publish every minute
  setInterval(() => {
    const payload = {
      temperature: 23.5,
      humidity: 65.2,
      timestamp: new Date().toISOString()
    };
    
    client.publish(TOPIC, JSON.stringify(payload), { qos: 1 });
  }, 60000);
});
\`\`\`

**Arduino/ESP32 Example**:
\`\`\`cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "YourWiFi";
const char* password = "YourPassword";
const char* mqtt_server = "192.168.1.100";
const char* device_id = "sensor-001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish telemetry
  StaticJsonDocument<200> doc;
  doc["temperature"] = 23.5;
  doc["humidity"] = 65.2;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  char topic[100];
  sprintf(topic, "sensormine/%s/telemetry", device_id);
  client.publish(topic, buffer, false);
  
  delay(60000);  // Wait 1 minute
}
\`\`\`

## Authentication

### No Auth (Development)
- Broker allows anonymous connections
- Suitable for local testing only

### Username/Password
\`\`\`python
client.username_pw_set("device-001", "secret-password")
client.connect(BROKER, PORT)
\`\`\`

### TLS/SSL (Production)
\`\`\`python
client.tls_set(
    ca_certs="ca.crt",
    certfile="client.crt",
    keyfile="client.key"
)
client.connect(BROKER, 8883)  # Port 8883 for TLS
\`\`\`

## Testing MQTT

### Using Device Simulator
1. Open Device Simulator (port 3021)
2. Select MQTT protocol
3. Enter broker address
4. Set device ID and topic
5. Configure telemetry interval
6. Click "Start Simulation"

### Using MQTT Client

**mosquitto_pub** (Command line):
\`\`\`bash
mosquitto_pub -h localhost -p 1883 \\
  -t "sensormine/sensor-001/telemetry" \\
  -m '{"temperature": 23.5, "timestamp": "2025-12-06T10:30:00Z"}'
\`\`\`

**MQTT Explorer** (GUI):
1. Download MQTT Explorer
2. Connect to broker
3. Publish to topic manually
4. View all messages in real-time

### Monitoring

View MQTT traffic:
\`\`\`bash
mosquitto_sub -h localhost -p 1883 \\
  -t "sensormine/#" -v
\`\`\`

## Troubleshooting

### Connection Refused
- Check broker is running: \`docker ps\`
- Verify network access
- Check firewall rules
- Ensure correct port (1883 or 8883)

### Messages Not Received
- Verify topic pattern matches
- Check device ID is correct
- Ensure QoS level set
- Review Ingestion Service logs

### Validation Errors
- Payload must match schema
- Check JSON formatting
- Verify all required fields present
- Review schema validation rules

### High Latency
- Reduce publish frequency
- Check network bandwidth
- Monitor broker load
- Consider QoS 0 for non-critical data

## Best Practices

1. **Unique Client IDs**: Use device ID as client ID
2. **Clean Sessions**: Set true for telemetry devices
3. **Keepalive**: 60 seconds standard
4. **Will Messages**: Set LWT for offline detection
5. **Persistent Connections**: Maintain connection, reconnect on failure
6. **Error Handling**: Implement retry logic
7. **Rate Limiting**: Don't flood broker
8. **Topic Design**: Consistent, hierarchical structure
`,
        tags: ['mqtt', 'protocols', 'connectivity'],
        relatedArticles: ['device-types-guide', 'edge-gateway'],
      },
    ],
  },
  {
    id: 'dashboards',
    title: 'Dashboards & Visualization',
    description: 'Creating charts and monitoring dashboards',
    icon: 'layout-dashboard',
    content: [
      {
        id: 'dashboard-creation',
        title: 'Creating Dashboards',
        summary: 'Build custom dashboards with schema-driven field selection',
        content: `
# Creating Dashboards

Dashboards provide real-time visualization of your device telemetry data using an intuitive, schema-driven approach.

## Dashboard Builder Overview

The Sensormine dashboard builder allows you to create custom visualizations by selecting fields directly from your device type schemas. This ensures that only valid, properly-typed fields are used in your widgets.

### Key Features

- **Schema-Driven Field Selection**: Browse device types and select fields from their schemas
- **Intelligent Recommendations**: Widget-specific suggestions (e.g., gauges work best with single numeric fields)
- **Flexible Data Sources**: Choose between real-time, historical, or aggregated data
- **Drag-and-Drop Layout**: Arrange widgets on a responsive grid
- **Auto-Refresh**: Configure automatic data updates

## Widget Types

### 1. Charts (Time-Series)
**Best for**: Visualizing trends over time

**Recommended Configuration**:
- Data Source: Historical
- Fields: 1-5 numeric fields
- Time Range: Last 24 hours, 7 days, etc.
- Aggregation: Average, Sum, Min, Max

**Example Use Cases**:
- Temperature trends from multiple sensors
- Power consumption over time
- Network traffic patterns
- Production output metrics

### 2. Gauges
**Best for**: Single metric visualization with thresholds

**Recommended Configuration**:
- Data Source: Real-time
- Fields: 1 numeric field
- Aggregation: Average
- Refresh: Every 5 seconds

**Example Use Cases**:
- Current temperature reading
- Tank fill level
- CPU usage percentage
- Voltage level

### 3. KPI Cards
**Best for**: Displaying key performance indicators

**Recommended Configuration**:
- Data Source: Real-time or Aggregated
- Fields: 1 field (numeric or string)
- Format: Large number with unit

**Example Use Cases**:
- Total device count
- Daily production count
- Average response time
- System uptime percentage

### 4. Tables
**Best for**: Displaying multiple fields from multiple devices

**Recommended Configuration**:
- Data Source: Real-time
- Fields: Multiple fields (up to 10)
- Sorting: Enabled
- Pagination: Yes

**Example Use Cases**:
- Device status overview
- Latest readings from all sensors
- Alert history
- Audit logs

### 5. Maps
**Best for**: Geo-located device data

**Recommended Configuration**:
- Data Source: Real-time
- Fields: latitude, longitude, and status fields
- Auto-zoom to fit all markers

**Example Use Cases**:
- Fleet tracking
- Environmental sensor network
- Warehouse asset locations
- Field equipment monitoring

## Creating a Dashboard (Step-by-Step)

### Step 1: Navigate to Dashboard Builder
1. Click **Dashboard** in the sidebar
2. Click **Create Dashboard** or **+ New Dashboard**

### Step 2: Configure Dashboard Settings
1. Enter **Dashboard Name** (e.g., "Factory Floor Monitoring")
2. Add **Description** (optional, helps others understand the purpose)
3. Select **Template** (optional) or start from scratch
4. Choose **Grid Layout** settings (columns, row height)

### Step 3: Add Widgets

#### Adding a Chart Widget
1. Click **Add Widget** → **Chart**
2. Enter widget title (e.g., "Temperature Trends")
3. Configure data source:
   - **Data Type**: Select "Historical Data"
   - **Time Range**: Select "Last 24 Hours"
   - **Aggregation**: Select "Average"
4. Click **Add Fields**
5. Select **Device Type** from dropdown (e.g., "Temperature Sensor")
6. Browse available fields from the schema
7. Select fields to plot (e.g., "temperature", "humidity")
8. Fields are displayed with:
   - 🔢 Icon indicating data type
   - Field name and path
   - Data type (number, string, boolean)
   - Unit (°C, %, etc.)
   - Description
9. Click **Done** when finished
10. Configure chart appearance:
    - Chart type (line, bar, area)
    - Colors
    - Legend position
11. Click **Add Widget**

#### Adding a Gauge Widget
1. Click **Add Widget** → **Gauge**
2. Enter widget title (e.g., "Current Temperature")
3. Configure data source:
   - **Data Type**: Select "Real-time Data"
   - **Refresh Interval**: 5 seconds
4. Click **Add Fields**
5. Select **Device Type** (e.g., "Temperature Sensor")
6. Select **ONE numeric field** (e.g., "temperature")
7. Configure gauge settings:
   - Min/max values
   - Threshold colors (green/yellow/red)
   - Unit display
8. Click **Add Widget**

#### Adding a KPI Card
1. Click **Add Widget** → **KPI Card**
2. Enter widget title (e.g., "Active Devices")
3. Select data source and aggregation
4. Select field to display
5. Choose format (number, percentage, duration)
6. Click **Add Widget**

#### Adding a Table Widget
1. Click **Add Widget** → **Table**
2. Enter widget title (e.g., "Device Status")
3. Select **Device Type**
4. Select multiple fields to display as columns
5. Configure table settings:
   - Sortable columns
   - Page size
   - Refresh interval
6. Click **Add Widget**

### Step 4: Arrange Widgets
- **Drag** widgets to reposition
- **Resize** by dragging corners
- Widgets snap to grid for alignment
- Use full width for charts
- Stack gauges side-by-side

### Step 5: Save Dashboard
1. Click **Save** in the toolbar
2. Dashboard is now available in your dashboard list
3. Set as **Home Dashboard** (optional)

## Field Selector Features

### Device Type Selection
The field selector shows all device types in your system with:
- Device type name
- Protocol badge (MQTT, HTTP, etc.)
- Number of registered devices

### Field Browser
For each device type, you can see:

**Field Information**:
- **Icon**: Visual indicator of data type (🔢 number, 📝 string, ✓ boolean)
- **Field Name**: Human-readable name from schema
- **Data Type**: number, string, boolean, object, array
- **Unit**: °C, %, kPa, etc. (if defined in schema)
- **Description**: What the field represents
- **Field Path**: Exact path in telemetry (e.g., \`gps.lat\`)

**Nested Fields**:
If a device schema has nested objects, they are flattened:
- Parent object: \`gps\`
  - \`gps.lat\` → GPS Location > Latitude
  - \`gps.lon\` → GPS Location > Longitude
  - \`gps.accuracy\` → GPS Location > Accuracy

**Search and Filter**:
- Type in the search box to filter fields
- Searches both field names and paths
- Case-insensitive

### Multi-Select
- Click checkboxes to select multiple fields (for charts, tables)
- Click field badge to remove from selection
- Selected fields show in "Selected Fields" section

### Single-Select
- For gauges and KPI cards
- Only one field can be selected
- Click a field to select it

## Data Source Configuration

### Real-time Data
**When to use**: Current values, live monitoring

**Configuration**:
- Refresh Interval: 1-300 seconds
- No time range needed
- Shows latest value for each field

**Best for**: Gauges, KPI cards, status indicators

### Historical Data
**When to use**: Trends over time, analysis

**Configuration**:
- Time Range: Minutes, hours, days, or weeks
- Aggregation: How to group data points
  - **Average**: Mean value over interval
  - **Sum**: Total of all values
  - **Min**: Minimum value
  - **Max**: Maximum value
  - **Count**: Number of data points

**Best for**: Charts showing trends

**Example**:
- Time Range: Last 7 days
- Aggregation: Average
- Interval: 1 hour
- Result: 168 data points (7 × 24)

### Aggregated Data
**When to use**: Summary statistics, reporting

**Configuration**:
- Aggregation type
- Grouping (by device, time bucket, etc.)

**Best for**: KPI cards, summary tables

## Best Practices

### Widget Placement
- **Top row**: Most important KPIs and status indicators
- **Middle**: Time-series charts
- **Bottom**: Detailed tables and maps
- **Sidebar**: Alert status and notifications

### Field Selection
- Use **descriptive field names** from your schema
- Select fields with **compatible units** for charts (don't mix temperature with pressure)
- Limit charts to **5 fields** maximum for readability
- Use **colors** to distinguish between fields

### Performance
- Set **appropriate refresh intervals** (don't refresh every second unless needed)
- Use **aggregated data** for long time ranges
- Limit **table page size** to 25-50 rows
- **Archive old dashboards** you no longer use

### Organization
- Create **separate dashboards** for different purposes:
  - Operations monitoring
  - Maintenance tracking
  - Security overview
  - Management reporting
- Use **meaningful names** and descriptions
- Add **tags** to categorize dashboards
- **Share** dashboards with team members

## Troubleshooting

### No Fields Showing
**Problem**: Field selector shows "No schema assigned"

**Solution**:
1. Go to **Settings** → **Device Types**
2. Select the device type
3. Click **Assign Schema**
4. Choose appropriate schema
5. Save device type
6. Return to dashboard builder

### Fields Not Updating
**Problem**: Data not refreshing in widgets

**Solution**:
1. Check device is sending data (go to **Devices** → **View Details**)
2. Verify refresh interval is set correctly
3. Check browser console for errors
4. Try manual refresh (click refresh icon)

### Widget Shows "No Data"
**Problem**: Widget configured but shows no data

**Solution**:
1. Verify device type has active devices
2. Check time range (historical data might be outside range)
3. Ensure devices are sending the selected fields
4. Check field paths match schema exactly

## Advanced Features

### Dashboard Templates
Use pre-built templates for common scenarios:
- **Operations Dashboard**: Device status, alerts, key metrics
- **Maintenance Dashboard**: Error rates, uptime, performance
- **Security Dashboard**: Access logs, intrusion detection
- **Executive Dashboard**: High-level KPIs and trends

### Dashboard Sharing
1. Click **Share** on dashboard
2. Add users or teams
3. Set permissions (view/edit)
4. Copy share link

### Export Options
- **PDF**: Print-friendly version
- **CSV**: Export table data
- **Image**: Screenshot of dashboard
- **JSON**: Dashboard configuration

### API Access
Dashboards can be accessed via API for:
- Embedding in external systems
- Automated reporting
- Integration with BI tools

## Next Steps

After creating your dashboard:
1. **Test with real data**: Send telemetry from devices
2. **Refine layouts**: Adjust widget sizes and positions
3. **Set up alerts**: Add threshold alerts for critical metrics
4. **Share with team**: Collaborate on monitoring
5. **Create more dashboards**: Build dashboards for different use cases
`,
        tags: ['dashboards', 'visualization', 'charts', 'field-selector', 'widgets'],
        relatedArticles: ['chart-types', 'data-queries', 'device-types-guide', 'schema-creation'],
      },
    ],
  },
  {
    id: 'alerts',
    title: 'Alerts & Notifications',
    description: 'Setting up threshold alerts and notifications',
    icon: 'bell',
    content: [
      {
        id: 'alert-rules',
        title: 'Alert Rules',
        summary: 'Configure threshold-based alerts for devices',
        content: `
# Alert Rules

Set up automated alerts to monitor device conditions and receive notifications.

## Creating Alert Rules

### Basic Alert
1. Navigate to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name**: Descriptive name
   - **Device/Device Type**: What to monitor
   - **Metric**: Which field to evaluate
   - **Condition**: Threshold (>, <, ==, !=)
   - **Value**: Trigger value
   - **Severity**: Critical, Warning, Info

Example:
- Name: "High Temperature Alert"
- Metric: temperature
- Condition: > 80
- Severity: Critical

### Advanced Conditions
- **Multiple conditions**: AND/OR logic
- **Time windows**: Alert if condition persists
- **Rate of change**: Alert on rapid changes
- **Missing data**: Alert if no data received

## Notification Channels

### Email
- Recipients list
- Email template
- Attachment options

### Webhook
- POST to external URL
- Custom JSON payload
- Authentication headers

### SMS (if configured)
- Phone numbers
- Message template

## Alert Management

### Active Alerts
View currently firing alerts:
- Alert name and severity
- Device information
- Current value
- Time since triggered

### Alert History
Review past alerts:
- When triggered
- When resolved
- Duration
- Notification log

### Acknowledgment
- Acknowledge alerts to mark as seen
- Add notes/comments
- Track who acknowledged

## Best Practices

1. **Start conservative**: Avoid alert fatigue
2. **Meaningful thresholds**: Based on actual risk
3. **Escalation**: Critical alerts to multiple channels
4. **Testing**: Test alerts before production
5. **Documentation**: Document why thresholds chosen
6. **Review regularly**: Adjust based on patterns
`,
        tags: ['alerts', 'notifications', 'monitoring'],
        relatedArticles: ['dashboard-creation', 'device-types-guide'],
      },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    description: 'Using the Sensormine REST API',
    icon: 'code',
    content: [
      {
        id: 'api-overview',
        title: 'API Overview',
        summary: 'Overview of the Sensormine REST API',
        content: `
# API Overview

The Sensormine Platform provides a comprehensive REST API for programmatic access.

## Base URL

\`\`\`
http://localhost:5000/api
\`\`\`

Production: Use your deployment's API Gateway URL

## Authentication

### API Keys (Recommended)
\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  http://localhost:5000/api/devices
\`\`\`

### Session Cookies
After logging in via UI, session cookie is used automatically.

## Common Endpoints

### Device Types
- \`GET /api/DeviceType\` - List device types
- \`POST /api/DeviceType\` - Create device type
- \`GET /api/DeviceType/{id}\` - Get device type
- \`PUT /api/DeviceType/{id}\` - Update device type
- \`DELETE /api/DeviceType/{id}\` - Delete device type

### Devices
- \`GET /api/Device\` - List devices
- \`POST /api/Device\` - Register device
- \`GET /api/Device/{id}\` - Get device
- \`PUT /api/Device/{id}\` - Update device
- \`DELETE /api/Device/{id}\` - Delete device
- \`GET /api/Device/by-device-id/{deviceId}\` - Get by device ID
- \`GET /api/Device/by-device-id/{deviceId}/schema\` - Get schema info

### Schemas
- \`GET /api/Schema\` - List schemas
- \`POST /api/Schema\` - Create schema
- \`GET /api/Schema/{id}\` - Get schema
- \`PUT /api/Schema/{id}\` - Update schema

### Telemetry
- \`GET /api/telemetry/{deviceId}\` - Query device data
- \`POST /api/telemetry\` - Send telemetry (alternative to MQTT)

## Request Format

### Headers
\`\`\`
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Example Request
\`\`\`bash
curl -X POST http://localhost:5000/api/Device \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceId": "sensor-001",
    "name": "Temperature Sensor 1",
    "deviceTypeId": "uuid-here",
    "customFieldValues": {
      "serialNumber": "SN001"
    }
  }'
\`\`\`

## Response Format

### Success Response
\`\`\`json
{
  "id": "uuid",
  "deviceId": "sensor-001",
  "name": "Temperature Sensor 1",
  "status": "Active",
  "createdAt": "2025-12-06T10:30:00Z"
}
\`\`\`

### Error Response
\`\`\`json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Device ID is required",
  "errors": {
    "deviceId": ["The deviceId field is required."]
  }
}
\`\`\`

## Rate Limiting

- 1000 requests per hour per API key
- 429 status code when exceeded
- Retry-After header indicates wait time

## Pagination

List endpoints support pagination:
\`\`\`
GET /api/Device?page=1&pageSize=50
\`\`\`

Response includes:
\`\`\`json
{
  "devices": [...],
  "totalCount": 150,
  "page": 1,
  "pageSize": 50,
  "totalPages": 3
}
\`\`\`

## Webhooks

Subscribe to events:
- Device registered
- Data received
- Alert triggered
- Schema updated

Configure webhooks in Settings.
`,
        tags: ['api', 'integration', 'rest'],
        relatedArticles: ['authentication', 'webhook-setup'],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'wrench',
    content: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        summary: 'Solutions to frequently encountered problems',
        content: `
# Common Issues & Solutions

## Device Not Receiving Data

### Check Device Registration
1. Verify device is registered: **Devices** → Search for device ID
2. Check device status is "Active"
3. Confirm Device Type has correct schema assigned

### Check Connection
1. Verify device is connecting to correct broker
2. Check topic pattern matches: \`sensormine/{deviceId}/telemetry\`
3. Monitor MQTT broker logs

### Check Schema Validation
1. Navigate to device details
2. View validation errors (if any)
3. Compare payload with schema
4. Fix payload format or update schema

## Validation Errors

### Schema Mismatch
**Error**: "Property 'xyz' is required but missing"
- **Solution**: Add missing field to device payload

**Error**: "Value exceeds maximum"
- **Solution**: Check schema constraints, adjust device output or schema

**Error**: "Invalid format for field 'timestamp'"
- **Solution**: Use ISO 8601 format: \`2025-12-06T10:30:00Z\`

### Type Errors
**Error**: "Expected number, got string"
- **Solution**: Remove quotes from numeric values in JSON

## Dashboard Issues

### No Data Displayed
1. Check device has sent data recently
2. Verify time range includes data
3. Check device status is "Active"
4. Try refreshing dashboard

### Chart Not Loading
1. Clear browser cache
2. Check browser console for errors
3. Verify Query API is running
4. Check network tab for failed requests

## Alert Issues

### Alerts Not Triggering
1. Verify alert rule is enabled
2. Check condition matches actual data
3. Ensure notification channels configured
4. Review alert history for errors

### Too Many Alerts
1. Increase threshold values
2. Add cooldown period
3. Use time windows to avoid flapping
4. Consider using rate-of-change instead of absolute values

## Performance Issues

### Slow Dashboard Loading
1. Reduce time range
2. Limit number of devices per chart
3. Decrease auto-refresh frequency
4. Check database performance

### High Memory Usage
1. Review query patterns
2. Implement data retention policies
3. Archive old data
4. Scale infrastructure

## Getting Help

1. **Check Logs**:
   - Device.API: \`docker logs device-api\`
   - Ingestion.Service: \`docker logs ingestion-service\`
   - Edge.Gateway: \`docker logs edge-gateway\`

2. **Contact Support**:
   - Email: support@sensormine.com
   - Slack: #sensormine-support
   - GitHub Issues: https://github.com/sensormine/platform/issues

3. **Documentation**:
   - Full docs: https://docs.sensormine.com
   - API reference: https://api.sensormine.com
   - Video tutorials: https://youtube.com/sensormine
`,
        tags: ['troubleshooting', 'debugging', 'support'],
        relatedArticles: ['logs', 'monitoring', 'performance'],
      },
    ],
  },
];

/**
 * Search help content
 */
export function searchHelpContent(query: string): HelpArticle[] {
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: HelpArticle[] = [];

  for (const section of helpSections) {
    for (const article of section.content) {
      const titleMatch = article.title.toLowerCase().includes(lowerQuery);
      const summaryMatch = article.summary.toLowerCase().includes(lowerQuery);
      const contentMatch = article.content.toLowerCase().includes(lowerQuery);
      const tagMatch = article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (titleMatch || summaryMatch || contentMatch || tagMatch) {
        results.push(article);
      }
    }
  }

  return results;
}

/**
 * Get article by ID
 */
export function getHelpArticle(articleId: string): HelpArticle | null {
  for (const section of helpSections) {
    const article = section.content.find(a => a.id === articleId);
    if (article) {
      return article;
    }
  }
  return null;
}

/**
 * Get related articles
 */
export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getHelpArticle(articleId);
  if (!article || !article.relatedArticles) {
    return [];
  }

  return article.relatedArticles
    .map(id => getHelpArticle(id))
    .filter((a): a is HelpArticle => a !== null);
}
