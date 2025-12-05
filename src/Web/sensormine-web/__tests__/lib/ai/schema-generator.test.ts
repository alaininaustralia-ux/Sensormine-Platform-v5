/**
 * Tests for AI-powered schema generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSchemaFromData, validateGeneratedSchema, parseFileContent } from '@/lib/ai/schema-generator';

// Mock fetch
global.fetch = vi.fn();

describe('AI Schema Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateGeneratedSchema', () => {
    it('should validate a correct schema', () => {
      const schema = {
        type: 'object',
        properties: {
          temperature: { type: 'number' },
          humidity: { type: 'number' },
        },
      };

      const result = validateGeneratedSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject schema without type', () => {
      const schema = {
        properties: {
          temperature: { type: 'number' },
        },
      };

      const result = validateGeneratedSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Root type must be "object"');
    });

    it('should reject schema without properties', () => {
      const schema = {
        type: 'object',
      };

      const result = validateGeneratedSchema(schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schema must have properties object');
    });

    it('should reject non-object schema', () => {
      const result = validateGeneratedSchema('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schema must be an object');
    });
  });

  describe('parseFileContent', () => {
    it('should parse JSON file', async () => {
      const jsonContent = '{"temperature": 25.5}';
      const file = {
        name: 'data.json',
        text: async () => jsonContent,
      } as File;

      const result = await parseFileContent(file);
      expect(result.dataType).toBe('json');
      expect(result.data).toBe(jsonContent);
    });

    it('should parse CSV file', async () => {
      const csvContent = 'temp,humidity\n25,60';
      const file = {
        name: 'data.csv',
        text: async () => csvContent,
      } as File;

      const result = await parseFileContent(file);
      expect(result.dataType).toBe('csv');
      expect(result.data).toBe(csvContent);
    });

    it('should reject invalid JSON file', async () => {
      const invalidJson = '{invalid json}';
      const file = {
        name: 'data.json',
        text: async () => invalidJson,
      } as File;

      await expect(parseFileContent(file)).rejects.toThrow('Invalid JSON file');
    });
  });

  describe('generateSchemaFromData', () => {
    it('should generate schema from valid data', async () => {
      const mockResponse = {
        content: [
          {
            text: `SCHEMA:
\`\`\`json
{
  "type": "object",
  "properties": {
    "temperature": { "type": "number" },
    "timestamp": { "type": "string", "format": "date-time" }
  },
  "required": ["temperature", "timestamp"]
}
\`\`\`

CONFIDENCE: high

SUGGESTIONS:
- Consider adding min/max validation for temperature
- Add description fields for better documentation`,
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const data = '{"temperature": 25.5, "timestamp": "2025-12-05T10:00:00Z"}';
      const result = await generateSchemaFromData(data);

      expect(result.success).toBe(true);
      expect(result.schema).toBeDefined();
      expect(result.schema?.type).toBe('object');
      expect(result.confidence).toBeDefined();
      expect(result.suggestions).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      const result = await generateSchemaFromData('test data');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Anthropic API error');
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const result = await generateSchemaFromData('test data');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});
