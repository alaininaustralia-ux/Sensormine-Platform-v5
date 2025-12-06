/**
 * Edit Device Page
 * 
 * Allows editing device properties (name, custom fields, location, metadata).
 * Schema is not editable here - it's managed at the device type level.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeftIcon,
  SaveIcon,
  Loader2Icon,
  AlertCircleIcon,
  TrashIcon,
  PlusIcon,
} from 'lucide-react';
import { getDeviceById, updateDevice } from '@/lib/api/devices';
import { getDeviceTypeById } from '@/lib/api/deviceTypes';
import type { Device } from '@/lib/api/devices';
import type { DeviceType } from '@/lib/api/deviceTypes';

export default function EditDevicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [serialNumber, setSerialNumber] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

  // Fetch device data
  useEffect(() => {
    async function fetchDeviceData() {
      try {
        setIsLoading(true);
        setError(null);

        const deviceResponse = await getDeviceById(deviceId);
        const deviceData = deviceResponse.data;

        if (!deviceData) {
          throw new Error('Device not found');
        }

        setDevice(deviceData);
        setName(deviceData.name);
        setStatus(deviceData.status);
        setSerialNumber(deviceData.serialNumber || '');
        setLatitude(deviceData.location?.latitude?.toString() || '');
        setLongitude(deviceData.location?.longitude?.toString() || '');
        setAltitude(deviceData.location?.altitude?.toString() || '');
        setCustomFields(deviceData.customFieldValues || {});
        setMetadata(deviceData.metadata || {});

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

    fetchDeviceData();
  }, [deviceId, toast]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updateData = {
        name,
        status,
        customFieldValues: customFields,
        location:
          latitude && longitude
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: altitude ? parseFloat(altitude) : undefined,
              }
            : undefined,
        metadata,
      };

      await updateDevice(deviceId, updateData);

      toast({
        title: 'Success',
        description: 'Device updated successfully',
      });

      router.push(`/devices/${deviceId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update device';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMetadata = () => {
    if (newMetadataKey && newMetadataValue) {
      setMetadata({ ...metadata, [newMetadataKey]: newMetadataValue });
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const updatedMetadata = { ...metadata };
    delete updatedMetadata[key];
    setMetadata(updatedMetadata);
  };

  const handleCustomFieldChange = (fieldName: string, value: unknown) => {
    setCustomFields({ ...customFields, [fieldName]: value });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading device...</p>
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
              <Button onClick={() => router.push('/devices')} variant="outline">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Devices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/devices/${deviceId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Device</h1>
            <p className="text-muted-foreground font-mono text-sm">{device.deviceId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/devices/${deviceId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update device name and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter device name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g., Active, Inactive"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID (Read-only)</Label>
              <Input id="deviceId" value={device.deviceId} disabled />
            </div>

            {serialNumber && (
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number (Read-only)</Label>
                <Input id="serialNumber" value={serialNumber} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type (Read-only)</Label>
              <Input
                id="deviceType"
                value={deviceType?.name || device.deviceTypeName || 'Unknown'}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Schema is managed at the device type level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Geographic coordinates for the device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 45.5017"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -73.5673"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altitude">Altitude (m)</Label>
                <Input
                  id="altitude"
                  type="number"
                  step="any"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        {deviceType?.customFields && deviceType.customFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Custom fields defined by the {deviceType.name} device type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceType.customFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`custom-${field.name}`}>
                    {field.name}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'Text' && (
                    <Input
                      id={`custom-${field.name}`}
                      value={(customFields[field.name] as string) || ''}
                      onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                      placeholder={field.description || `Enter ${field.name}`}
                      required={field.required}
                    />
                  )}
                  {field.type === 'Number' && (
                    <Input
                      id={`custom-${field.name}`}
                      type="number"
                      step="any"
                      value={(customFields[field.name] as number) || ''}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          field.name,
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder={field.description || `Enter ${field.name}`}
                      required={field.required}
                    />
                  )}
                  {field.type === 'Boolean' && (
                    <div className="flex items-center space-x-2">
                      <input
                        id={`custom-${field.name}`}
                        type="checkbox"
                        checked={(customFields[field.name] as boolean) || false}
                        onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`custom-${field.name}`} className="text-sm">
                        {field.description || field.name}
                      </label>
                    </div>
                  )}
                  {field.description && field.type !== 'Boolean' && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Additional key-value pairs for this device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metadata).length > 0 && (
              <div className="space-y-2">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="font-mono text-sm">{key}</div>
                      <div className="text-sm">{value}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMetadata(key)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label>Add Metadata</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Key"
                  value={newMetadataKey}
                  onChange={(e) => setNewMetadataKey(e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={newMetadataValue}
                  onChange={(e) => setNewMetadataValue(e.target.value)}
                />
                <Button onClick={handleAddMetadata} disabled={!newMetadataKey || !newMetadataValue}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
