/**
 * AI-powered schema generation using backend API
 * Derives JSON Schema from uploaded files or pasted text
 */

interface SchemaGenerationResult {
  success: boolean;
  schema?: Record<string, unknown>;
  error?: string;
  confidence?: 'high' | 'medium' | 'low';
  suggestions?: string[];
}

/**
 * Generate JSON Schema from sample data using backend API
 */
export async function generateSchemaFromData(
  data: string,
  context?: {
    fileName?: string;
    dataType?: 'json' | 'csv' | 'xml' | 'text';
    description?: string;
  }
): Promise<SchemaGenerationResult> {
  try {
    // Call backend API instead of Claude directly
    const response = await fetch('/api/schemas/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        fileName: context?.fileName,
        dataType: context?.dataType,
        description: context?.description,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      schema: result.schema,
      confidence: result.confidence,
      suggestions: result.suggestions,
      error: result.error,
    };
  } catch (error) {
    console.error('Schema generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Parse file content based on file type
 */
export async function parseFileContent(file: File): Promise<{ data: string; dataType: string }> {
  const fileName = file.name.toLowerCase();
  const text = await file.text();

  // Detect file type
  let dataType = 'text';
  
  if (fileName.endsWith('.json')) {
    dataType = 'json';
    // Validate JSON
    try {
      JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file');
    }
  } else if (fileName.endsWith('.csv')) {
    dataType = 'csv';
  } else if (fileName.endsWith('.xml')) {
    dataType = 'xml';
  }

  return { data: text, dataType };
}

/**
 * Validate generated schema
 */
export function validateGeneratedSchema(schema: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be an object');
    return { valid: false, errors };
  }

  const schemaObj = schema as Record<string, unknown>;

  if (schemaObj.type !== 'object') {
    errors.push('Root type must be "object"');
  }

  if (!schemaObj.properties || typeof schemaObj.properties !== 'object') {
    errors.push('Schema must have properties object');
  }

  if (schemaObj.properties && Object.keys(schemaObj.properties as object).length === 0) {
    errors.push('Schema must have at least one property');
  }

  return { valid: errors.length === 0, errors };
}
