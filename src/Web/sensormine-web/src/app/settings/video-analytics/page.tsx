/**
 * Video Analytics Configuration Page
 * 
 * List, create, edit, and manage video analytics configurations
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Pause, Trash2, Edit, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { videoAnalyticsApi } from '@/lib/api/videoAnalytics';
import type { VideoAnalyticsConfiguration } from '@/lib/types/video-analytics';
import { useToast } from '@/hooks/use-toast';

export default function VideoAnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [configurations, setConfigurations] = useState<VideoAnalyticsConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadConfigurations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await videoAnalyticsApi.list();
      setConfigurations(response.configurations);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load video analytics configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, currentlyEnabled: boolean) => {
    try {
      if (currentlyEnabled) {
        await videoAnalyticsApi.disable(id);
        toast({
          title: 'Disabled',
          description: 'Video analytics configuration has been disabled',
        });
      } else {
        await videoAnalyticsApi.enable(id);
        toast({
          title: 'Enabled',
          description: 'Video analytics configuration has been enabled',
        });
      }
      await loadConfigurations();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to toggle configuration',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await videoAnalyticsApi.delete(id);
      toast({
        title: 'Deleted',
        description: 'Video analytics configuration has been deleted',
      });
      await loadConfigurations();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'rtsp':
        return 'RTSP Stream';
      case 'azure-blob':
        return 'Azure Blob';
      case 'hls':
        return 'HLS Stream';
      case 'webrtc':
        return 'WebRTC';
      default:
        return type;
    }
  };

  const getModelLabel = (type: string) => {
    switch (type) {
      case 'object-detection':
        return 'Object Detection';
      case 'person-detection':
        return 'Person Detection';
      case 'vehicle-detection':
        return 'Vehicle Detection';
      case 'behavior-analysis':
        return 'Behavior Analysis';
      case 'near-miss-detection':
        return 'Near-Miss Detection';
      case 'custom':
        return 'Custom Model';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-8 relative">
      {/* INCOMPLETE Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
        <div className="text-9xl font-bold text-gray-900 dark:text-gray-100 transform -rotate-45 select-none">
          INCOMPLETE
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Configure camera streams and AI processing models
            </p>
          </div>
          <Button onClick={() => router.push('/settings/video-analytics/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
        </div>
      </div>

      <Card className="relative z-10">
        <CardHeader>
          <CardTitle>Configurations</CardTitle>
          <CardDescription>
            Manage video analytics configurations that appear as devices in dashboards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading configurations...</p>
            </div>
          ) : configurations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No video analytics configurations yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/settings/video-analytics/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Configuration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{getSourceTypeLabel(config.sourceType)}</TableCell>
                    <TableCell>{getModelLabel(config.processingModel)}</TableCell>
                    <TableCell>
                      {config.enabled ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {config.deviceId ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {config.deviceId.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not generated</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEnabled(config.id, config.enabled)}
                          title={config.enabled ? 'Disable' : 'Enable'}
                        >
                          {config.enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/settings/video-analytics/${config.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(config.id, config.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
