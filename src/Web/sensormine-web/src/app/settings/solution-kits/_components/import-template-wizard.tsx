/**
 * Import Template Wizard
 * 
 * Wizard for importing configuration templates
 * Includes file upload, validation, conflict resolution, and import
 */

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, Loader2, FileJson, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

interface Template {
  metadata: {
    name: string;
    description: string;
    version: string;
    author?: string;
    tags?: string[];
    category?: string;
  };
  resources: {
    schemas?: any[];
    deviceTypes?: any[];
    dashboards?: any[];
    alertRules?: any[];
    assets?: any[];
    nexusConfigurations?: any[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ message: string; path: string }>;
  warnings: Array<{ message: string; path: string }>;
}

interface ConflictInfo {
  type: string;
  name: string;
  existingId: string;
  resolution: 'skip' | 'overwrite' | 'rename';
}

interface ImportPreview {
  conflicts: Array<{
    type: string;
    name: string;
    existingId: string;
  }>;
  summary: {
    schemas: number;
    deviceTypes: number;
    dashboards: number;
    alertRules: number;
    assets: number;
    nexusConfigurations: number;
  };
}

export function ImportTemplateWizard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setUploadedFile(file);

      // Read and parse file
      const text = await file.text();
      const parsed = JSON.parse(text);
      setTemplate(parsed);

      // Validate template
      const validationResponse = await apiClient.post<ValidationResult>('/api/templates/validate', parsed);
      const validationResult = validationResponse.data;
      setValidation(validationResult);

      if (!validationResult.isValid) {
        toast({
          title: 'Invalid Template',
          description: 'The template file contains errors',
          variant: 'destructive',
        });
        return;
      }

      // Get import preview
      const previewResponse = await apiClient.post<ImportPreview>('/api/templates/preview', parsed);
      const previewResult = previewResponse.data;
      setPreview(previewResult);

      // Initialize conflict resolutions
      const initialConflicts: ConflictInfo[] = previewResult.conflicts.map(c => ({
        type: c.type,
        name: c.name,
        existingId: c.existingId,
        resolution: 'skip',
      }));
      setConflicts(initialConflicts);

      // Move to next step
      setStep(2);

      toast({
        title: 'Template Loaded',
        description: 'Template is valid and ready to import',
      });
    } catch (error: any) {
      console.error('File processing error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process template file',
        variant: 'destructive',
      });
      setTemplate(null);
      setValidation(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function updateConflictResolution(index: number, resolution: 'skip' | 'overwrite' | 'rename') {
    setConflicts(prev => {
      const updated = [...prev];
      updated[index].resolution = resolution;
      return updated;
    });
  }

  async function handleImport() {
    if (!template) return;

    try {
      setLoading(true);
      setStep(3);
      setImportProgress(0);

      // Build conflict resolution map
      const conflictResolutions: Record<string, { action: string; newName?: string }> = {};
      conflicts.forEach(c => {
        const key = `${c.type}:${c.name}`;
        conflictResolutions[key] = {
          action: c.resolution,
          newName: c.resolution === 'rename' ? `${c.name} (imported)` : undefined,
        };
      });

      // Simulate progress (in real implementation, use SSE or polling)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const importRequest = {
        template,
        importOptions: {
          onConflict: 'skip',
          createMissingReferences: true,
          validateReferences: true,
          dryRun: false,
        },
        conflictResolutions,
      };

      const response = await apiClient.post('/api/templates/import', importRequest);
      const result = response.data;
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.summary?.totalCreated || 0} resources`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import template',
        variant: 'destructive',
      });
      setImportResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setUploadedFile(null);
    setTemplate(null);
    setValidation(null);
    setPreview(null);
    setConflicts([]);
    setImportProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          1
        </div>
        <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          2
        </div>
        <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          3
        </div>
      </div>

      {/* Step 1: Upload File */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Upload Template</h3>
            <p className="text-sm text-muted-foreground">
              Select a solution kit JSON file to import
            </p>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <FileJson className="h-8 w-8" />
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="font-medium">Select a template file</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a JSON template file exported from another tenant
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Choose File
                  </>
                )}
              </Button>

              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{uploadedFile.name}</span>
                </div>
              )}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Template Requirements</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Must be a valid JSON file</li>
                  <li>Must include template metadata (name, version, description)</li>
                  <li>Must contain at least one resource type</li>
                  <li>All referenced resources must be included or exist in target tenant</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Step 2: Preview & Resolve Conflicts */}
      {step === 2 && template && preview && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Review & Resolve Conflicts</h3>
            <p className="text-sm text-muted-foreground">
              Review what will be imported and resolve any conflicts
            </p>
          </div>

          {/* Template Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">{template.metadata.name}</h4>
            <p className="text-sm text-muted-foreground">{template.metadata.description}</p>
            <div className="flex gap-2 items-center text-sm">
              <Badge variant="outline">v{template.metadata.version}</Badge>
              {template.metadata.author && (
                <span className="text-muted-foreground">by {template.metadata.author}</span>
              )}
            </div>
            {template.metadata.tags && template.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.metadata.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Import Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium">Resources to Import</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Schemas:</span>
                <span className="font-medium">{preview.summary.schemas}</span>
              </div>
              <div className="flex justify-between">
                <span>Device Types:</span>
                <span className="font-medium">{preview.summary.deviceTypes}</span>
              </div>
              <div className="flex justify-between">
                <span>Dashboards:</span>
                <span className="font-medium">{preview.summary.dashboards}</span>
              </div>
              <div className="flex justify-between">
                <span>Alert Rules:</span>
                <span className="font-medium">{preview.summary.alertRules}</span>
              </div>
              <div className="flex justify-between">
                <span>Assets:</span>
                <span className="font-medium">{preview.summary.assets}</span>
              </div>
              <div className="flex justify-between">
                <span>Nexus Configurations:</span>
                <span className="font-medium">{preview.summary.nexusConfigurations}</span>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validation && validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Validation Errors</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error.message} ({error.path})</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validation && validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Warnings</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>{warning.message} ({warning.path})</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Resolve Conflicts</h4>
                <p className="text-sm text-muted-foreground">
                  The following resources already exist. Choose how to handle each one.
                </p>
              </div>

              <div className="space-y-3 border rounded-lg p-4 max-h-96 overflow-y-auto">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{conflict.name}</p>
                        <p className="text-sm text-muted-foreground">{conflict.type}</p>
                      </div>
                      <Badge variant="outline">Conflict</Badge>
                    </div>
                    
                    <RadioGroup
                      value={conflict.resolution}
                      onValueChange={(value) => updateConflictResolution(index, value as any)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skip" id={`skip-${index}`} />
                        <Label htmlFor={`skip-${index}`} className="text-sm">
                          Skip - Don&apos;t import this resource
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overwrite" id={`overwrite-${index}`} />
                        <Label htmlFor={`overwrite-${index}`} className="text-sm">
                          Overwrite - Replace existing resource
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rename" id={`rename-${index}`} />
                        <Label htmlFor={`rename-${index}`} className="text-sm">
                          Rename - Create with new name
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conflicts.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No conflicts detected. All resources can be imported directly.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Step 3: Import Progress/Result */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">
              {loading ? 'Importing...' : importResult?.success !== false ? 'Import Complete' : 'Import Failed'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Please wait while we import your template' : 'Import operation finished'}
            </p>
          </div>

          {loading && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-center text-muted-foreground">
                {importProgress}% complete
              </p>
            </div>
          )}

          {!loading && importResult && (
            <>
              {importResult.success !== false ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Successful</p>
                      {importResult.summary && (
                        <div className="text-sm space-y-1">
                          <p>Created: {importResult.summary.totalCreated} resources</p>
                          <p>Updated: {importResult.summary.totalUpdated} resources</p>
                          <p>Skipped: {importResult.summary.totalSkipped} resources</p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Failed</p>
                      <p className="text-sm">{importResult.error || 'An unknown error occurred'}</p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {importResult.errors.map((error: any, i: number) => (
                            <li key={i}>{error.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => step === 1 ? reset() : setStep(Math.max(1, step - 1))}
          disabled={loading}
        >
          {step === 1 ? 'Reset' : 'Back'}
        </Button>

        {step === 2 && (
          <Button
            onClick={handleImport}
            disabled={loading || (validation && !validation.isValid)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Solution Kit
          </Button>
        )}

        {step === 3 && !loading && (
          <Button onClick={reset}>
            Import Another
          </Button>
        )}
      </div>
    </div>
  );
}
