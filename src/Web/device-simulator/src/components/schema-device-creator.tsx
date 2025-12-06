'use client';

import React, { useState } from 'react';
import { FileJson, Play, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateFromSchema, extractSensorsFromSchema, JsonSchema } from '@/lib/schema-generator';
import { useSimulatorStore } from '@/lib/store';
import { DeviceConfig, ProtocolType } from '@/types';
import { generateId } from '@/lib/data-generator';

interface SchemaDeviceCreatorProps {
  onClose: () => void;
}

export function SchemaDeviceCreator({ onClose }: SchemaDeviceCreatorProps) {
  const { addDevice, setProtocolConfig } = useSimulatorStore();
  const [schemaInput, setSchemaInput] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [protocol, setProtocol] = useState<ProtocolType>('mqtt');
  const [intervalMs, setIntervalMs] = useState(5000);
  const [parsedSchema, setParsedSchema] = useState<JsonSchema | null>(null);
  const [sampleData, setSampleData] = useState<string>('');
  const [error, setError] = useState<string>('');

  const exampleSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Temperature Sensor Data",
    "type": "object",
    "properties": {
      "deviceId": {
        "type": "string",
        "description": "Device identifier"
      },
      "timestamp": {
        "type": "string",
        "format": "date-time",
        "description": "Measurement timestamp"
      },
      "temperature": {
        "type": "number",
        "minimum": 18.0,
        "maximum": 28.0,
        "description": "Temperature in Celsius"
      },
      "humidity": {
        "type": "number",
        "minimum": 30.0,
        "maximum": 70.0,
        "description": "Relative humidity percentage"
      },
      "pressure": {
        "type": "number",
        "minimum": 950.0,
        "maximum": 1050.0,
        "description": "Atmospheric pressure in hPa"
      },
      "status": {
        "type": "string",
        "enum": ["ok", "warning", "error"],
        "description": "Device status"
      }
    },
    "required": ["deviceId", "timestamp", "temperature"]
  };

  const handleLoadExample = () => {
    const exampleJson = JSON.stringify(exampleSchema, null, 2);
    setSchemaInput(exampleJson);
    handleParseSchema(exampleJson);
  };

  const handleParseSchema = (schemaText: string) => {
    try {
      const schema = JSON.parse(schemaText);
      
      if (!schema.type) {
        setError('Invalid schema: must have a "type" property');
        setParsedSchema(null);
        return;
      }

      setParsedSchema(schema);
      setError('');

      // Generate sample data
      const sample = generateFromSchema(schema);
      setSampleData(JSON.stringify(sample, null, 2));

      // Auto-fill device name from schema title
      if (schema.title && !deviceName) {
        setDeviceName(schema.title);
      }
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setParsedSchema(null);
      setSampleData('');
    }
  };

  const handleCreateDevice = () => {
    if (!parsedSchema) {
      setError('Please provide a valid JSON schema');
      return;
    }

    if (!deviceName.trim()) {
      setError('Please provide a device name');
      return;
    }

    // Extract simulatable sensors from schema
    const sensors = extractSensorsFromSchema(parsedSchema);

    // Create device config with schema-based sensors
    const deviceConfig: Omit<DeviceConfig, 'id'> = {
      name: deviceName,
      description: parsedSchema.description || parsedSchema.title || 'Schema-based device',
      protocol,
      sensors: sensors.map(sensor => ({
        id: generateId(),
        name: sensor.name,
        type: 'temperature', // Default type
        unit: sensor.type === 'boolean' ? 'bool' : (sensor.type === 'integer' || sensor.type === 'number' ? 'units' : 'text'),
        minValue: sensor.min ?? 0,
        maxValue: sensor.max ?? 100,
        precision: sensor.type === 'integer' ? 0 : 2,
        variance: 10,
      })),
      intervalMs,
      enabled: false,
    };

    // Add device
    const deviceId = addDevice(deviceConfig);

    // Store the schema for this device
    const protocolConfig = {
      type: protocol,
      deviceId,
      schema: parsedSchema,
      schemaText: schemaInput,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setProtocolConfig(deviceId, protocolConfig as any);

    onClose();
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Create Device from JSON Schema
          </CardTitle>
          <CardDescription>
            Paste a JSON Schema and the simulator will generate realistic telemetry data based on the schema definition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <input
                id="deviceName"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Temperature Sensor"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="protocol">Protocol</Label>
              <select
                id="protocol"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as ProtocolType)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="mqtt">MQTT</option>
                <option value="http">HTTP/REST</option>
                <option value="websocket">WebSocket</option>
                <option value="modbus">Modbus TCP</option>
                <option value="opcua">OPC UA</option>
              </select>
            </div>
            <div>
              <Label htmlFor="interval">Publish Interval (ms)</Label>
              <input
                id="interval"
                type="number"
                value={intervalMs}
                onChange={(e) => setIntervalMs(parseInt(e.target.value) || 5000)}
                min="100"
                step="100"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Schema Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>JSON Schema</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadExample}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Load Example
              </Button>
            </div>
            <textarea
              value={schemaInput}
              onChange={(e) => setSchemaInput(e.target.value)}
              onBlur={() => schemaInput && handleParseSchema(schemaInput)}
              placeholder="Paste your JSON Schema here..."
              className="w-full h-64 px-3 py-2 border rounded-md font-mono text-sm"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Parse Button */}
          <Button
            type="button"
            onClick={() => handleParseSchema(schemaInput)}
            disabled={!schemaInput}
            className="w-full"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Parse Schema
          </Button>

          {/* Sample Data Preview */}
          {sampleData && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sample Generated Data</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopySample}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="w-full p-4 bg-gray-50 border rounded-md font-mono text-sm overflow-x-auto">
                {sampleData}
              </pre>
            </div>
          )}

          {/* Schema Info */}
          {parsedSchema && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Schema Summary</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {parsedSchema.title && <li><strong>Title:</strong> {parsedSchema.title}</li>}
                {parsedSchema.description && <li><strong>Description:</strong> {parsedSchema.description}</li>}
                {parsedSchema.properties && (
                  <li><strong>Properties:</strong> {Object.keys(parsedSchema.properties).length} fields</li>
                )}
                {parsedSchema.required && parsedSchema.required.length > 0 && (
                  <li><strong>Required:</strong> {parsedSchema.required.join(', ')}</li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateDevice}
              disabled={!parsedSchema || !deviceName}
            >
              <Play className="w-4 h-4 mr-2" />
              Create Device
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
