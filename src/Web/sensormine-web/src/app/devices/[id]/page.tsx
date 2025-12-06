/**
 * Device Detail Page
 * 
 * Displays device configuration and status based on the device registration flow.
 * Shows device information, device type details, custom fields, location, and metadata.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import {
  ActivityIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  RefreshCwIcon,
  Settings2Icon,
  InfoIcon,
  ServerIcon,
  AlertCircleIcon,
  Loader2Icon,
} from 'lucide-react';
import { getDeviceById } from '@/lib/api/devices';
import { getDeviceTypeById } from '@/lib/api/deviceTypes';
import { DeviceConnectionConfig, DeviceTelemetryView } from '@/components/devices';
import type { Device } from '@/lib/api/devices';
import type { DeviceType } from '@/lib/api/deviceTypes';

export default function DevicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = params.id as string;
  const addRecentlyViewedDevice = usePreferencesStore((state) => state.addRecentlyViewedDevice);

  const [device, setDevice] = useState<Device | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch device data
  useEffect(() => {
    async function fetchDeviceData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch device by ID
        const deviceResponse = await getDeviceById(deviceId);
        const deviceData = deviceResponse.data;
        
        if (!deviceData) {
          throw new Error('Device not found');
        }

        setDevice(deviceData);
        
        // Track recently viewed device
        addRecentlyViewedDevice(deviceId);

        // Fetch device type details
        if (deviceData.deviceTypeId) {
          const deviceTypeResponse = await getDeviceTypeById(deviceData.deviceTypeId);
          setDeviceType(deviceTypeResponse);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load device';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (deviceId) {
      fetchDeviceData();
    }
  }, [deviceId, toast, addRecentlyViewedDevice]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading device...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5 text-destructive" />
                <CardTitle>Error Loading Device</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error || 'Device not found'}</p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/devices')} variant="outline">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Devices
                </Button>
                <Button onClick={handleRefresh}>
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    Active: 'default',
    Inactive: 'secondary',
    Maintenance: 'outline',
    Offline: 'destructive',
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/devices">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
              <Badge variant={statusColors[device.status] || 'default'}>{device.status}</Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{device.deviceId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href={`/devices/${device.id}/edit`}>
            <Button variant="outline">
              <Settings2Icon className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <ServerIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Device Type</p>
              <p className="text-lg font-bold">{deviceType?.name || 'Unknown'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-bold">{device.status}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <ClockIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Seen</p>
              <p className="text-lg font-medium">
                {device.lastSeenAt 
                  ? new Date(device.lastSeenAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <InfoIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="telemetry">
            <ActivityIcon className="mr-2 h-4 w-4" />
            Live Telemetry
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Connection Configuration - Full Width */}
            <div className="md:col-span-2">
              <DeviceConnectionConfig 
                deviceId={device.deviceId}
                protocol="MQTT"
                brokerUrl="localhost"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device ID</span>
                  <span className="font-mono text-sm">{device.deviceId}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Internal ID</span>
                  <span className="font-mono text-sm">{device.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Device Type</span>
                  <span className="font-medium">
                    {deviceType?.name || device.deviceTypeName || 'Unknown'}
                  </span>
                </div>
                <Separator />
                {device.serialNumber && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial Number</span>
                      <span className="font-mono text-sm">{device.serialNumber}</span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Schema</span>
                  <span className="font-medium">
                    {device.schemaName ? (
                      <Link href={`/schemas/${device.schemaId}`} className="text-primary hover:underline">
                        {device.schemaName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(device.createdAt).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(device.updatedAt).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {device.location ? (
                  <>
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Lat: {device.location.latitude.toFixed(6)}, 
                          Lng: {device.location.longitude.toFixed(6)}
                        </p>
                        {device.location.altitude && (
                          <p className="text-sm text-muted-foreground">
                            Altitude: {device.location.altitude}m
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">No location data available</p>
                    <Separator />
                  </>
                )}
                {Object.keys(device.metadata).length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Metadata</p>
                    <div className="space-y-2">
                      {Object.entries(device.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No metadata available</p>
                )}
              </CardContent>
            </Card>

            {Object.keys(device.customFieldValues).length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>
                    Custom field values configured during device registration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {Object.entries(device.customFieldValues).map(([key, value]) => (
                      <div key={key} className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground mb-1">{key}</p>
                        <p className="text-lg font-medium">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="mt-6">
          <DeviceTelemetryView deviceId={device.deviceId} refreshInterval={5000} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
