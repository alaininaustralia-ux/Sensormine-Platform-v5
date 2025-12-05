/**
 * Schema JSON Editor Component
 * 
 * Second step of schema wizard - JSON Schema editor
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, FileJson } from 'lucide-react';

interface SchemaJsonEditorProps {
  data: {
    jsonSchema: string;
    changeLog: string;
  };
  onChange: (data: Partial<SchemaJsonEditorProps['data']>) => void;
}

const EXAMPLE_SCHEMAS = {
  temperature: {
    name: 'Temperature Sensor',
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title: 'Temperature Sensor Data',
      properties: {
        temperature: {
          type: 'number',
          description: 'Temperature reading in Celsius',
          minimum: -50,
          maximum: 150,
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          default: 'celsius',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp',
        },
      },
      required: ['temperature', 'timestamp'],
    },
  },
  multiSensor: {
    name: 'Multi-Sensor Device',
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title: 'Multi-Sensor Device Data',
      properties: {
        temperature: { type: 'number', description: 'Temperature in °C' },
        humidity: { type: 'number', minimum: 0, maximum: 100 },
        pressure: { type: 'number', description: 'Pressure in hPa' },
        timestamp: { type: 'string', format: 'date-time' },
        deviceId: { type: 'string' },
      },
      required: ['temperature', 'humidity', 'timestamp', 'deviceId'],
    },
  },
};

export function SchemaJsonEditor({ data, onChange }: SchemaJsonEditorProps) {
  const validation = useMemo(() => {
    try {
      const parsed = JSON.parse(data.jsonSchema);
      
      // Basic JSON Schema validation
      if (typeof parsed !== 'object' || parsed === null) {
        return { isValid: false, error: 'Schema must be a JSON object' };
      }

      if (!parsed.type) {
        return { isValid: false, error: 'Schema must have a "type" property' };
      }

      return { isValid: true, error: null };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }, [data.jsonSchema]);

  const handleLoadExample = (exampleKey: keyof typeof EXAMPLE_SCHEMAS) => {
    const example = EXAMPLE_SCHEMAS[exampleKey];
    onChange({
      jsonSchema: JSON.stringify(example.schema, null, 2),
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(data.jsonSchema);
      onChange({
        jsonSchema: JSON.stringify(parsed, null, 2),
      });
    } catch {
      // Ignore formatting errors
    }
  };

  return (
    <div className="space-y-6">
      {/* JSON Schema Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="jsonSchema">
            JSON Schema <span className="text-red-500">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormatJson}
            disabled={!validation.isValid}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Format
          </Button>
        </div>
        <Textarea
          id="jsonSchema"
          value={data.jsonSchema}
          onChange={(e) => onChange({ jsonSchema: e.target.value })}
          className="font-mono text-sm min-h-[400px]"
          placeholder="Paste or write your JSON Schema here..."
        />
        
        {/* Validation Status */}
        {validation.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validation.error}</AlertDescription>
          </Alert>
        ) : validation.isValid ? (
          <Alert className="border-green-500 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Valid JSON Schema</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* Change Log */}
      <div className="space-y-2">
        <Label htmlFor="changeLog">Change Log</Label>
        <Textarea
          id="changeLog"
          value={data.changeLog}
          onChange={(e) => onChange({ changeLog: e.target.value })}
          rows={2}
          placeholder="Describe what's new in this version..."
        />
        <p className="text-sm text-muted-foreground">
          Document changes for version tracking
        </p>
      </div>

      {/* Example Schemas */}
      <Card className="p-4 space-y-4">
        <h3 className="font-medium">📚 Load Example Schema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => handleLoadExample('temperature')}
          >
            {EXAMPLE_SCHEMAS.temperature.name}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => handleLoadExample('multiSensor')}
          >
            {EXAMPLE_SCHEMAS.multiSensor.name}
          </Button>
        </div>
      </Card>

      {/* Help Text */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="font-medium">💡 JSON Schema Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use &quot;type&quot; to define property types (string, number, boolean, object, array)</li>
          <li>Add &quot;description&quot; to document each property</li>
          <li>Use &quot;required&quot; array to specify mandatory fields</li>
          <li>Add &quot;minimum&quot;, &quot;maximum&quot;, &quot;enum&quot; for validation rules</li>
          <li>
            Learn more at{' '}
            <a
              href="https://json-schema.org/learn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              json-schema.org
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
