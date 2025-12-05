# AI-Powered Schema Generation

## Overview
The Schema Wizard now includes AI-powered schema generation using Claude API (Haiku 4.5). Users can upload sample data files or paste example data, and the AI will automatically derive a JSON Schema definition.

**All AI calls are centralized through the `AiMeteringService`** which provides automatic usage tracking, cost calculation, and monitoring across the entire platform.

## Features

### 1. **File Upload**
- Supported formats: JSON, CSV, XML, TXT
- Maximum file size: 10MB
- Automatic file type detection
- JSON validation for .json files

### 2. **Text Input**
- Paste sample data directly into textarea
- Supports any text format
- AI analyzes structure and patterns

### 3. **AI Processing**
- Uses Claude Haiku 4.5 model
- Analyzes data structure and types
- Detects measurement fields (temperature, pressure, etc.)
- Identifies timestamps and formats
- Distinguishes device metadata vs telemetry data

### 4. **Confidence Scoring**
- **High**: Good data size (>500 chars), reasonable property count (3-50)
- **Medium**: Moderate data or unusual structure
- **Low**: Very little data (<100 chars) or extreme property count

### 5. **AI Suggestions**
- Recommendations for improving the schema
- Notes about ambiguities in the data
- Suggestions for additional useful fields

## Usage

### In the Schema Wizard (Step 2)

1. Click the **"AI Generator"** tab
2. Choose one of two methods:

#### Method A: File Upload
```
1. Click "Choose File"
2. Select a sample data file (.json, .csv, .xml, .txt)
3. Click "Generate Schema"
4. Review generated schema in Manual Editor tab
```

#### Method B: Text Input
```
1. Paste sample data into the textarea
2. Click "Generate Schema from Text"
3. Review generated schema in Manual Editor tab
```

### Sample Data Examples

**JSON Example:**
```json
{
  "deviceId": "TEMP-001",
  "timestamp": "2025-12-05T10:30:00Z",
  "temperature": 22.5,
  "humidity": 65,
  "pressure": 1013.25
}
```

**CSV Example:**
```csv
deviceId,timestamp,temperature,humidity,pressure
TEMP-001,2025-12-05T10:30:00Z,22.5,65,1013.25
TEMP-002,2025-12-05T10:31:00Z,23.1,63,1012.88
```

## Generated Schema Output

The AI generates a complete JSON Schema with:
- Appropriate data types for each field
- Field descriptions (when purpose is clear)
- Required field markers
- Validation rules (min, max, patterns)
- Format specifications (date-time, email, etc.)
- Enum values (when patterns detected)

**Example Generated Schema:**
```json
{
  "type": "object",
  "title": "Temperature Sensor Reading",
  "properties": {
    "deviceId": {
      "type": "string",
      "description": "Unique device identifier",
      "pattern": "^TEMP-[0-9]{3}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Reading timestamp in ISO 8601 format"
    },
    "temperature": {
      "type": "number",
      "description": "Temperature measurement in Celsius",
      "minimum": -50,
      "maximum": 150
    },
    "humidity": {
      "type": "number",
      "description": "Relative humidity percentage",
      "minimum": 0,
      "maximum": 100
    },
    "pressure": {
      "type": "number",
      "description": "Atmospheric pressure in hPa",
      "minimum": 870,
      "maximum": 1085
    }
  },
  "required": ["deviceId", "timestamp", "temperature"]
}
```

## Architecture

### Backend Implementation

AI logic is implemented in the SchemaRegistry.API service for security and maintainability:

**Service Layer**: `AiSchemaGeneratorService.cs`
- Anthropic Claude API integration via HttpClient
- Prompt engineering optimized for IoT schemas
- Response parsing and validation
- Confidence assessment algorithm

**API Endpoint**: `POST /api/schemas/generate`
```json
Request:
{
  "data": "sample data string",
  "fileName": "optional",
  "dataType": "json|csv|xml|text",
  "description": "optional context"
}

Response:
{
  "success": true,
  "schema": { /* JSON Schema object */ },
  "confidence": "high|medium|low",
  "suggestions": ["...", "..."],
  "error": null
}
```

**Configuration**: `appsettings.json`
```json
{
  "Anthropic": {
    "ApiKey": "{SECURE_API_KEY}",
    "Model": "claude-haiku-4-5",
    "MaxTokens": 8192,
    "TimeoutMinutes": 5
  }
}
```

### Frontend Integration

Frontend calls the backend API instead of Claude directly:

**Library**: `src/lib/ai/schema-generator.ts`
- Calls `POST /api/schemas/generate`
- Handles file parsing locally
- Displays results with confidence badges

**Component**: `src/components/schemas/schema-json-editor-ai.tsx`
- File upload interface
- Text input textarea
- Real-time processing feedback

### Centralized AI Metering

**All AI calls are routed through `AiMeteringService`** (Sensormine.AI library):

**Key Features**:
- Automatic tracking of all AI API calls
- Token usage measurement (input + output)
- Duration tracking
- Cost calculation per provider/model
- Success/failure logging
- Tenant-based usage statistics
- Aggregation by provider, model, and operation

**Usage Statistics API**:
- `GET /api/aiusage/current` - Current tenant's usage
- `GET /api/aiusage/tenant/{id}` - Specific tenant's usage
- `GET /api/aiusage/all` - All tenants' usage
- Filterable by date range

**Cost Tracking**:
```csharp
Provider Pricing (per 1M tokens):
- Anthropic Claude Haiku 4.5: $0.25
- Anthropic Claude Sonnet 3.5: $3.00
- Anthropic Claude Opus 3: $15.00
- OpenAI GPT-4: $30.00
- OpenAI GPT-3.5 Turbo: $0.50
```

### Data Flow
```
User uploads file/pastes text
        ↓
Frontend: parseFileContent() → detect type, validate
        ↓
Frontend: POST /api/schemas/generate
        ↓
Backend: SchemasController.GenerateSchema()
        ↓
Backend: AiSchemaGeneratorService.GenerateSchemaAsync()
        ↓
Backend: BuildPrompt() → IoT-specific prompt
        ↓
Backend: AiMeteringService.CallAiAsync() ← CENTRALIZED METERING
        ├─ Start timer
        ├─ Log call start
        ├─ Make API call → Anthropic API via HttpClient
        ├─ Extract token counts
        ├─ Calculate cost
        ├─ Store metrics (tenant, provider, model, operation)
        └─ Log completion/failure
        ↓
Backend: ExtractSchema(), ExtractConfidence(), ExtractSuggestions()
        ↓
Backend: ValidateSchema() → ensure valid JSON Schema
        ↓
Backend: Return GenerateSchemaResponse (includes metered usage)
        ↓
Frontend: Display with confidence indicator
```

## Error Handling

The AI schema generator handles:
- API errors (500, 429, etc.)
- Network errors and timeouts
- Invalid JSON schemas from AI
- File parsing errors
- Validation failures

All errors are displayed to the user with helpful messages.

## Testing

### Backend Tests (Planned)
- Unit tests for AiSchemaGeneratorService
- Integration tests for /api/schemas/generate endpoint
- Mock Anthropic API responses
- Error handling scenarios

### Frontend Tests
Existing test coverage in `__tests__/lib/ai/schema-generator.test.ts`:
- Schema validation
- File parsing (JSON, CSV, XML)
- API client error handling

## Performance

- **Claude Haiku 4.5**: Fast inference (~1-3 seconds)
- **Cost-effective**: Lower token cost compared to Sonnet/Opus
- **Optimized prompts**: Concise, focused on IoT use cases
- **Data truncation**: Limits input to 10,000 characters for speed

## Future Enhancements

- [ ] Support for more file formats (Excel, Parquet, Avro)
- [ ] Batch schema generation from multiple files
- [ ] Schema refinement suggestions
- [ ] Historical schema comparison
- [ ] Custom AI prompts for specific domains
- [ ] Integration with schema version history

## Security

✅ **Backend Architecture**: API key stored securely in backend configuration
- API keys never exposed to browser/frontend code
- Backend acts as proxy/gateway to Anthropic API
- Configuration-based secrets management
- Environment-specific settings (Development/Production)

**Production Recommendations**:
- Use Azure Key Vault or AWS Secrets Manager for API keys
- Implement rate limiting on `/api/schemas/generate` endpoint
- Add authentication/authorization for API access
- Monitor API usage and costs
- Implement request validation and sanitization

## Documentation

- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/messages_post)
- [JSON Schema Specification](https://json-schema.org/)
- [IoT Data Best Practices](https://docs.sensormine.com/data-modeling)
