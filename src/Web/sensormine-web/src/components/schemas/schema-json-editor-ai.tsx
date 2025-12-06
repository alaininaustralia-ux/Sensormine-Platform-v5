'use client';

import React, { useState, useMemo } from 'react';
import { Loader2, Upload, Sparkles, FileJson, FileText, WandSparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { generateSchemaFromData, parseFileContent, validateGeneratedSchema } from '@/lib/ai/schema-generator';

interface SchemaJsonEditorAIProps {
  value: string;
  onChange: (value: string) => void;
  changeLog: string;
  onChangeLogUpdate: (log: string) => void;
}

export function SchemaJsonEditorAI({
  value,
  onChange,
  changeLog,
  onChangeLogUpdate,
}: SchemaJsonEditorAIProps) {
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual');
  const [aiInput, setAiInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    confidence?: string;
    suggestions?: string[];
  } | null>(null);

  // Validation logic using useMemo
  const validation = useMemo(() => {
    if (!value.trim()) {
      return { isValid: false, error: null };
    }

    try {
      const parsed = JSON.parse(value);
      
      // Basic JSON Schema validation
      if (typeof parsed !== 'object') {
        return { isValid: false, error: 'Schema must be an object' };
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
  }, [value]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch {
      // Silently fail if JSON is invalid
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setAiResult(null);

    try {
      const { data, dataType } = await parseFileContent(selectedFile);
      
      const result = await generateSchemaFromData(data, {
        fileName: selectedFile.name,
        dataType: dataType as 'json' | 'csv' | 'xml' | 'text',
        description: 'IoT sensor data schema',
      });

      if (result.success && result.schema) {
        // Validate the generated schema
        const validationResult = validateGeneratedSchema(result.schema);
        
        if (!validationResult.valid) {
          throw new Error(`Invalid schema: ${validationResult.errors.join(', ')}`);
        }

        const formattedSchema = JSON.stringify(result.schema, null, 2);
        onChange(formattedSchema);
        
        // Update change log
        const newLog = `Generated from ${selectedFile.name} using AI (${result.confidence} confidence)`;
        onChangeLogUpdate(changeLog ? `${changeLog}\n${newLog}` : newLog);

        // Store AI metadata
        setAiResult({
          confidence: result.confidence,
          suggestions: result.suggestions,
        });

        // Switch to manual mode to show the result
        setInputMode('manual');
      } else {
        throw new Error(result.error || 'Failed to generate schema');
      }
    } catch (error) {
      console.error('Schema generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate schema');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!aiInput.trim()) return;

    setIsGenerating(true);
    setAiResult(null);

    try {
      const result = await generateSchemaFromData(aiInput, {
        dataType: 'text',
        description: 'IoT sensor data schema',
      });

      if (result.success && result.schema) {
        const validationResult = validateGeneratedSchema(result.schema);
        
        if (!validationResult.valid) {
          throw new Error(`Invalid schema: ${validationResult.errors.join(', ')}`);
        }

        const formattedSchema = JSON.stringify(result.schema, null, 2);
        onChange(formattedSchema);
        
        const newLog = `Generated from pasted text using AI (${result.confidence} confidence)`;
        onChangeLogUpdate(changeLog ? `${changeLog}\n${newLog}` : newLog);

        setAiResult({
          confidence: result.confidence,
          suggestions: result.suggestions,
        });

        setInputMode('manual');
      } else {
        throw new Error(result.error || 'Failed to generate schema');
      }
    } catch (error) {
      console.error('Schema generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate schema');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExampleSchema = (type: 'temperature' | 'multi-sensor') => {
    const examples = {
      temperature: {
        type: 'object',
        title: 'Temperature Sensor Reading',
        properties: {
          deviceId: { type: 'string', description: 'Unique device identifier' },
          timestamp: { type: 'string', format: 'date-time' },
          temperature: { type: 'number', minimum: -50, maximum: 150 },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['deviceId', 'timestamp', 'temperature'],
      },
      'multi-sensor': {
        type: 'object',
        title: 'Multi-Sensor Device',
        properties: {
          deviceId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          sensors: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              humidity: { type: 'number', minimum: 0, maximum: 100 },
              pressure: { type: 'number' },
              co2: { type: 'number', minimum: 0 },
            },
          },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 },
            },
          },
        },
        required: ['deviceId', 'timestamp', 'sensors'],
      },
    };

    const schema = JSON.stringify(examples[type], null, 2);
    onChange(schema);
    onChangeLogUpdate('Loaded example schema');
  };

  return (
    <div className="space-y-6">
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'manual' | 'ai')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2">
            <FileJson className="h-4 w-4" />
            Manual Editor
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jsonSchema" className="flex items-center gap-2">
                JSON Schema <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFormatJson}
                  disabled={!value.trim()}
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  Format
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadExampleSchema('temperature')}
                  className="gap-1.5"
                >
                  Load Example
                </Button>
              </div>
            </div>

            <Textarea
              id="jsonSchema"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder='{\n  "type": "object",\n  "properties": {\n    "temperature": { "type": "number" }\n  }\n}'
              className="font-mono text-sm min-h-96"
              required
            />

            {validation.error && (
              <Alert variant="destructive">
                <AlertDescription>{validation.error}</AlertDescription>
              </Alert>
            )}

            {validation.isValid && (
              <Alert>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  ✓ Valid JSON Schema
                </AlertDescription>
              </Alert>
            )}

            {aiResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <WandSparkles className="h-4 w-4" />
                    AI Generation Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <Badge variant={aiResult.confidence === 'high' ? 'default' : aiResult.confidence === 'medium' ? 'secondary' : 'outline'}>
                      {aiResult.confidence}
                    </Badge>
                  </div>
                  
                  {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Suggestions:</span>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {aiResult.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeLog">Change Log</Label>
            <Textarea
              id="changeLog"
              value={changeLog}
              onChange={(e) => onChangeLogUpdate(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="min-h-24"
            />
            <p className="text-sm text-muted-foreground">
              Document changes for version tracking
            </p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Schema Generation
              </CardTitle>
              <CardDescription>
                Upload a sample data file or paste example data, and AI will automatically generate a JSON Schema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Upload Sample Data File</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".json,.csv,.xml,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isGenerating}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isGenerating}
                      >
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                    </label>
                  </div>
                  {selectedFile && (
                    <Button
                      type="button"
                      onClick={handleGenerateFromFile}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Schema
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: JSON, CSV, XML, TXT (max 10MB)
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-3">
                <Label className="text-base font-semibold" htmlFor="ai-text-input">
                  Paste Sample Data
                </Label>
                <Textarea
                  id="ai-text-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={'Paste your sample data here, for example:\n\n{\n  "deviceId": "TEMP-001",\n  "timestamp": "2025-12-05T10:30:00Z",\n  "temperature": 22.5,\n  "humidity": 65\n}'}
                  className="font-mono text-sm min-h-48"
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  onClick={handleGenerateFromText}
                  disabled={!aiInput.trim() || isGenerating}
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Schema from Text
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI-Powered:</strong> Our AI analyzes your sample data to automatically detect data types, 
                  patterns, and validation rules. Review and refine the generated schema as needed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
