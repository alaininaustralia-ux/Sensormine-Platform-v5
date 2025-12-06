/**
 * Device Registration Form Component
 * 
 * Form for registering a new device instance
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircleIcon, 
  CheckCircle2Icon, 
  Loader2Icon,
  PlusIcon,
  XIcon,
  UploadIcon,
} from 'lucide-react';
import { 
  getAllDeviceTypes, 
  registerDevice, 
  bulkRegisterDevices,
  type DeviceType,
  type CreateDeviceRequest,
} from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomFieldValue {
  name: string;
  value: string;
}

export function DeviceRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Single device form state
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('Active');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldValue[]>([]);
  const [metadataFields, setMetadataFields] = useState<CustomFieldValue[]>([]);

  // Bulk upload state
  const [bulkData, setBulkData] = useState('');
  const [bulkDeviceTypeId, setBulkDeviceTypeId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: Array<{ deviceId: string; errorMessage: string }>;
  } | null>(null);

  // Fetch device types
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await getAllDeviceTypes();
        setDeviceTypes(response.items);
      } catch (err) {
        console.error('Failed to fetch device types:', err);
        setError('Failed to load device types');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchDeviceTypes();
  }, []);

  const selectedDeviceType = deviceTypes.find(dt => dt.id === deviceTypeId);

  const handleCustomFieldChange = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleAddMetadataField = () => {
    setMetadataFields([...metadataFields, { name: '', value: '' }]);
  };

  const handleRemoveMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index));
  };

  const handleMetadataFieldChange = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...metadataFields];
    updated[index][field] = value;
    setMetadataFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const request: CreateDeviceRequest = {
        deviceId,
        name,
        deviceTypeId,
        serialNumber: serialNumber || undefined,
        status: status || 'Active',
        customFieldValues: Object.fromEntries(
          customFields.filter(f => f.name).map(f => [f.name, f.value])
        ),
        metadata: Object.fromEntries(
          metadataFields.filter(f => f.name).map(f => [f.name, f.value])
        ),
        location: latitude && longitude ? {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: altitude ? parseFloat(altitude) : undefined,
        } : undefined,
      };

      await registerDevice(request);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/devices');
      }, 1500);
    } catch (err) {
      console.error('Failed to register device:', err);
      setError(err instanceof Error ? err.message : 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBulkResult(null);
    setBulkLoading(true);

    try {
      // Parse CSV/JSON data
      const devices: CreateDeviceRequest[] = [];
      const lines = bulkData.trim().split('\n');
      
      // Skip header row if present
      const startIndex = lines[0].toLowerCase().includes('deviceid') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) continue;

        devices.push({
          deviceId: parts[0],
          name: parts[1],
          deviceTypeId: bulkDeviceTypeId,
          serialNumber: parts[2] || undefined,
          status: parts[3] || 'Active',
          location: parts[4] && parts[5] ? {
            latitude: parseFloat(parts[4]),
            longitude: parseFloat(parts[5]),
          } : undefined,
        });
      }

      if (devices.length === 0) {
        setError('No valid devices found in the uploaded data');
        return;
      }

      const response = await bulkRegisterDevices({
        deviceTypeId: bulkDeviceTypeId,
        devices,
      });

      const result = {
        successCount: response.data.successCount,
        failureCount: response.data.failureCount,
        errors: response.data.errors.map(e => ({
          deviceId: e.deviceId,
          errorMessage: e.error,
        })),
      };
      setBulkResult(result);
      
      if (result.failureCount === 0) {
        setTimeout(() => {
          router.push('/devices');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to bulk upload devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk upload devices');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="single">Single Device</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
      </TabsList>

      {/* Single Device Registration */}
      <TabsContent value="single">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="deviceId">Device ID (Hardware ID) *</Label>
                  <Input
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="e.g., DEVICE-001, MAC-ADDRESS, SERIAL-123"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier from the physical device
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Device Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Water Tank Sensor #1"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deviceType">Device Type *</Label>
                  <Select value={deviceTypeId} onValueChange={setDeviceTypeId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTypes ? (
                        <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                      ) : deviceTypes.length === 0 ? (
                        <SelectItem value="__empty__" disabled>No device types available</SelectItem>
                      ) : (
                        deviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.protocol})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedDeviceType && (
                    <p className="text-xs text-muted-foreground">
                      Protocol: {selectedDeviceType.protocol}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  GPS coordinates for device location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g., 51.5074"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g., -0.1278"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="altitude">Altitude (meters)</Label>
                  <Input
                    id="altitude"
                    type="number"
                    step="any"
                    value={altitude}
                    onChange={(e) => setAltitude(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {selectedDeviceType && selectedDeviceType.customFields && selectedDeviceType.customFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>
                    Device Type specific fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDeviceType.customFields.map((field, index) => (
                    <div key={index} className="grid gap-2">
                      <Label>
                        {field.name}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        placeholder={field.description || field.name}
                        required={field.required}
                        onChange={(e) => {
                          const existing = customFields.find(f => f.name === field.name);
                          if (existing) {
                            handleCustomFieldChange(
                              customFields.indexOf(existing),
                              'value',
                              e.target.value
                            );
                          } else {
                            setCustomFields([...customFields, { name: field.name, value: e.target.value }]);
                          }
                        }}
                      />
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Metadata (Optional)</CardTitle>
                    <CardDescription>
                      Additional key-value pairs for this device
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMetadataField}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {metadataFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={field.name}
                      onChange={(e) => handleMetadataFieldChange(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleMetadataFieldChange(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMetadataField(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {metadataFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No metadata fields added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Error/Success Messages */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircleIcon className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {success && (
              <Card className="border-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2Icon className="h-5 w-5" />
                    <p>Device registered successfully! Redirecting...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !deviceId || !name || !deviceTypeId}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Device'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/devices')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>

      {/* Bulk Upload */}
      <TabsContent value="bulk">
        <form onSubmit={handleBulkUpload}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Device Upload</CardTitle>
                <CardDescription>
                  Upload multiple devices at once using CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkDeviceType">Device Type *</Label>
                  <Select value={bulkDeviceTypeId} onValueChange={setBulkDeviceTypeId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type for all devices" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.protocol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bulkData">Device Data (CSV Format)</Label>
                  <Textarea
                    id="bulkData"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="DeviceId, Name, SerialNumber, Status, Latitude, Longitude
DEVICE-001, Water Tank Sensor, SN123, Active, 51.5074, -0.1278
DEVICE-002, Pressure Sensor, SN124, Active, 51.5075, -0.1279"
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: DeviceId, Name, SerialNumber (optional), Status (optional), Latitude (optional), Longitude (optional)
                  </p>
                </div>
              </CardContent>
            </Card>

            {bulkResult && (
              <Card className={bulkResult.failureCount > 0 ? 'border-yellow-500' : 'border-green-500'}>
                <CardHeader>
                  <CardTitle>Upload Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Badge variant="default" className="bg-green-500">
                      {bulkResult.successCount} Successful
                    </Badge>
                    {bulkResult.failureCount > 0 && (
                      <Badge variant="destructive">
                        {bulkResult.failureCount} Failed
                      </Badge>
                    )}
                  </div>

                  {bulkResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Errors:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {bulkResult.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-destructive">
                            • {err.deviceId}: {err.errorMessage}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircleIcon className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={bulkLoading || !bulkDeviceTypeId || !bulkData}
                className="flex-1"
              >
                {bulkLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload Devices
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/devices')}
                disabled={bulkLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
