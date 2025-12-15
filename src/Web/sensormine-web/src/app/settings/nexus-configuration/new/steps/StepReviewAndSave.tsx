/**
 * Step 4: Review and Save
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Radio, Wifi, Save, AlertTriangle, Info, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nexusConfigurationApi, type ValidationResult } from '@/lib/api/nexusConfiguration';
import type { CreateNexusConfigurationRequest } from '@/lib/api';

interface StepReviewAndSaveProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  onSave: () => void;
  saving: boolean;
}

export function StepReviewAndSave({ formData, onSave, saving }: StepReviewAndSaveProps) {
  const { toast } = useToast();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Validate configuration when component mounts
  useEffect(() => {
    const validateConfig = async () => {
      try {
        setValidating(true);
        const result = await nexusConfigurationApi.validateConfiguration(
          formData as CreateNexusConfigurationRequest
        );
        setValidationResult(result);
        
        if (!result.isValid) {
          toast({
            title: 'Validation Issues Found',
            description: `${result.errors.length} error(s) found. Please review below.`,
            variant: 'destructive',
          });
        } else if (result.warnings.length > 0) {
          toast({
            title: 'Validation Warnings',
            description: `Configuration is valid, but ${result.warnings.length} warning(s) found.`,
          });
        }
      } catch (error) {
        console.error('Error validating configuration:', error);
        toast({
          title: 'Validation Error',
          description: 'Failed to validate configuration. You can still save it.',
          variant: 'destructive',
        });
      } finally {
        setValidating(false);
      }
    };
    
    if (formData.name) {
      validateConfig();
    }
  }, [formData, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Configuration</h2>
        <p className="text-muted-foreground">
          Review your configuration before saving. You can edit it later if needed.
        </p>
      </div>

      {/* Validation Status */}
      {validating && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Validating Configuration...</AlertTitle>
          <AlertDescription>
            Checking your configuration for errors and potential issues.
          </AlertDescription>
        </Alert>
      )}

      {validationResult && !validating && (
        <>
          {/* Validation Errors */}
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Configuration Errors Found</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Suggestions */}
          {validationResult.suggestions.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Suggestions</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {validationResult.isValid && validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle>Configuration Valid</AlertTitle>
              <AlertDescription>
                Your configuration looks great! Ready to save.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-lg">{formData.name || 'Not specified'}</p>
          </div>
          {formData.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p>{formData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Probes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-600" />
            Probes
          </CardTitle>
          <CardDescription>
            {formData.probeConfigurations?.length || 0} probe(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.probeConfigurations && formData.probeConfigurations.length > 0 ? (
            <div className="space-y-3">
              {formData.probeConfigurations.map((probe) => (
                <div
                  key={probe.probeId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{probe.probeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {probe.sensorType} ({probe.unit})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{probe.probeType}</Badge>
                    <Badge variant="outline">
                      {probe.samplingIntervalSeconds}s
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No probes configured</p>
          )}
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            Communication Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protocol</p>
              <Badge className="mt-1">{formData.communicationSettings?.protocol}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Transmission Interval
              </p>
              <p className="mt-1">
                {formData.communicationSettings?.transmissionIntervalSeconds}s
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batching</p>
              <p className="mt-1">
                {formData.communicationSettings?.enableBatching
                  ? `Enabled (max ${formData.communicationSettings?.maxBatchSize})`
                  : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compression</p>
              <p className="mt-1">
                {formData.communicationSettings?.enableCompression
                  ? 'Enabled'
                  : 'Disabled'}
              </p>
            </div>
          </div>

          {formData.communicationSettings?.protocol === 'MQTT' &&
            formData.communicationSettings?.mqttSettings && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  MQTT Settings
                </p>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Broker:</span>{' '}
                    {formData.communicationSettings.mqttSettings.brokerUrl}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Port:</span>{' '}
                    {formData.communicationSettings.mqttSettings.port}
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Topic:</span>{' '}
                    {formData.communicationSettings.mqttSettings.topicPattern}
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {validationResult?.isValid === false && (
        <p className="text-center text-sm text-destructive">
          Please fix validation errors before saving. Use the "Save Configuration" button at the bottom right.
        </p>
      )}
    </div>
  );
}
