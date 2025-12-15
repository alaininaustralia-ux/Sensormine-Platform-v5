/**
 * Video Analytics Configuration Form
 * 
 * Form for creating/editing video analytics configurations
 * with dynamic model-specific configuration screens
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { videoAnalyticsApi } from '@/lib/api/videoAnalytics';
import {
  availableModels,
  type VideoSourceType,
  type ProcessingModelType,
  type CreateVideoAnalyticsRequest,
  type VideoAnalyticsConfiguration,
  type RTSPStreamConfig,
  type AzureBlobConfig,
} from '@/lib/types/video-analytics';
import { useToast } from '@/hooks/use-toast';

interface VideoAnalyticsFormProps {
  configuration?: VideoAnalyticsConfiguration;
}

export function VideoAnalyticsForm({ configuration }: VideoAnalyticsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [name, setName] = useState(configuration?.name || '');
  const [description, setDescription] = useState(configuration?.description || '');
  const [sourceType, setSourceType] = useState<VideoSourceType>(configuration?.sourceType || 'rtsp');
  const [processingModel, setProcessingModel] = useState<ProcessingModelType>(
    configuration?.processingModel || 'object-detection'
  );

  // RTSP Stream Config
  const [rtspUrl, setRtspUrl] = useState(
    (configuration?.sourceConfig as RTSPStreamConfig)?.url || ''
  );
  const [rtspUsername, setRtspUsername] = useState(
    (configuration?.sourceConfig as RTSPStreamConfig)?.username || ''
  );
  const [rtspPassword, setRtspPassword] = useState(
    (configuration?.sourceConfig as RTSPStreamConfig)?.password || ''
  );

  // Azure Blob Config
  const [azureContainer, setAzureContainer] = useState(
    (configuration?.sourceConfig as AzureBlobConfig)?.containerName || ''
  );
  const [azureBlobPath, setAzureBlobPath] = useState(
    (configuration?.sourceConfig as AzureBlobConfig)?.blobPath || ''
  );
  const [azureSasToken, setAzureSasToken] = useState(
    (configuration?.sourceConfig as AzureBlobConfig)?.sasToken || ''
  );

  // Object Detection Config
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['person', 'vehicle']);
  const [maxDetections, setMaxDetections] = useState(50);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Build source config based on type
      let sourceConfig: unknown;
      if (sourceType === 'rtsp') {
        sourceConfig = {
          url: rtspUrl,
          username: rtspUsername || undefined,
          password: rtspPassword || undefined,
        };
      } else if (sourceType === 'azure-blob') {
        sourceConfig = {
          containerName: azureContainer,
          blobPath: azureBlobPath,
          sasToken: azureSasToken || undefined,
        };
      }

      // Build model config based on type
      let modelConfiguration: unknown;
      if (processingModel === 'object-detection') {
        modelConfiguration = {
          confidenceThreshold,
          classes: selectedClasses,
          maxDetections,
          enableTracking: true,
        };
      }

      const payload: CreateVideoAnalyticsRequest = {
        name,
        description: description || undefined,
        sourceType,
        sourceConfig: sourceConfig as RTSPStreamConfig | AzureBlobConfig,
        processingModel,
        modelConfiguration: modelConfiguration as CreateVideoAnalyticsRequest['modelConfiguration'],
        enabled: true,
      };

      if (configuration) {
        await videoAnalyticsApi.update(configuration.id, payload);
        toast({
          title: 'Updated',
          description: 'Video analytics configuration has been updated',
        });
      } else {
        await videoAnalyticsApi.create(payload);
        toast({
          title: 'Created',
          description: 'Video analytics configuration has been created',
        });
      }

      router.push('/settings/video-analytics');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);

      let sourceConfig: unknown;
      if (sourceType === 'rtsp') {
        sourceConfig = { url: rtspUrl, username: rtspUsername, password: rtspPassword };
      } else if (sourceType === 'azure-blob') {
        sourceConfig = { containerName: azureContainer, blobPath: azureBlobPath, sasToken: azureSasToken };
      }

      const result = await videoAnalyticsApi.testConnection({
        name,
        sourceType,
        sourceConfig: sourceConfig as RTSPStreamConfig | AzureBlobConfig,
        processingModel,
        modelConfiguration: { confidenceThreshold, classes: selectedClasses, maxDetections, enableTracking: true },
      });

      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch {
      toast({
        title: 'Test Failed',
        description: 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Name and description for this configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Entrance Camera"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Source</CardTitle>
          <CardDescription>Configure the video stream or file location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceType">Source Type</Label>
            <Select value={sourceType} onValueChange={(value) => setSourceType(value as VideoSourceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtsp">RTSP Stream</SelectItem>
                <SelectItem value="azure-blob">Azure Blob Storage</SelectItem>
                <SelectItem value="hls">HLS Stream</SelectItem>
                <SelectItem value="webrtc">WebRTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {sourceType === 'rtsp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rtspUrl">RTSP URL *</Label>
                <Input
                  id="rtspUrl"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://192.168.1.100:554/stream"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rtspUsername">Username</Label>
                  <Input
                    id="rtspUsername"
                    value={rtspUsername}
                    onChange={(e) => setRtspUsername(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtspPassword">Password</Label>
                  <Input
                    id="rtspPassword"
                    type="password"
                    value={rtspPassword}
                    onChange={(e) => setRtspPassword(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {sourceType === 'azure-blob' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="azureContainer">Container Name *</Label>
                <Input
                  id="azureContainer"
                  value={azureContainer}
                  onChange={(e) => setAzureContainer(e.target.value)}
                  placeholder="videos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azureBlobPath">Blob Path *</Label>
                <Input
                  id="azureBlobPath"
                  value={azureBlobPath}
                  onChange={(e) => setAzureBlobPath(e.target.value)}
                  placeholder="camera1/recording.mp4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azureSasToken">SAS Token</Label>
                <Input
                  id="azureSasToken"
                  type="password"
                  value={azureSasToken}
                  onChange={(e) => setAzureSasToken(e.target.value)}
                  placeholder="Optional - if using SAS authentication"
                />
              </div>
            </div>
          )}

          <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
            <TestTube className="mr-2 h-4 w-4" />
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processing Model</CardTitle>
          <CardDescription>Select the AI model to apply to this video source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="processingModel">Model Type</Label>
            <Select value={processingModel} onValueChange={(value) => setProcessingModel(value as ProcessingModelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.type} value={model.type}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {availableModels.find((m) => m.type === processingModel)?.description}
            </p>
          </div>

          <Separator />

          {processingModel === 'object-detection' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence Threshold: {confidenceThreshold}</Label>
                <input
                  id="confidence"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Detections below this confidence will be filtered out
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDetections">Max Detections per Frame</Label>
                <Input
                  id="maxDetections"
                  type="number"
                  value={maxDetections}
                  onChange={(e) => setMaxDetections(parseInt(e.target.value) || 50)}
                  min="1"
                  max="200"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/settings/video-analytics')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : configuration ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
