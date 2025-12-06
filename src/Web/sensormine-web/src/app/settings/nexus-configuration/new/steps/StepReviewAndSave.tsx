/**
 * Step 4: Review and Save
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Radio, Wifi, Save } from 'lucide-react';
import type { CreateNexusConfigurationRequest } from '@/lib/api';

interface StepReviewAndSaveProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  onSave: () => void;
  saving: boolean;
}

export function StepReviewAndSave({ formData, onSave, saving }: StepReviewAndSaveProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Configuration</h2>
        <p className="text-muted-foreground">
          Review your configuration before saving. You can edit it later if needed.
        </p>
      </div>

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

      {/* Save Button */}
      <div className="flex justify-center">
        <Button size="lg" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'Saving Configuration...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
