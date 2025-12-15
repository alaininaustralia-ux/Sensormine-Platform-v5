/**
 * Sensor Mapping Modal
 * 
 * Modal for mapping sensors to 3D CAD model elements with device/field selection and chart type.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, BarChart3, LineChart, Activity } from 'lucide-react';
import { AssetHierarchySelector } from '@/components/digital-twin/AssetHierarchySelector';
import type { AssetWithChildren } from '@/lib/api/assets';

export interface SensorMappingData {
  elementId: string;
  elementName: string;
  deviceId: string;
  deviceName: string;
  fieldName: string;
  fieldFriendlyName?: string;
  chartType: 'line' | 'bar' | 'gauge' | 'value';
}

export interface SensorMappingModalProps {
  open: boolean;
  elementId: string;
  existingMapping?: SensorMappingData;
  onSave: (mapping: SensorMappingData) => void;
  onClose: () => void;
}

interface Device {
  id: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName?: string;
  assetId?: string;
  fields?: DeviceField[];
}

interface DeviceField {
  fieldName: string;
  friendlyName: string;
  dataType: string;
  unit?: string;
}

const chartTypes = [
  { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Time series trend' },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Comparison view' },
  { value: 'gauge', label: 'Gauge', icon: Activity, description: 'Current value with range' },
  { value: 'value', label: 'Value Display', icon: TrendingUp, description: 'Simple numeric display' },
];

export function SensorMappingModal({
  open,
  elementId,
  existingMapping,
  onSave,
  onClose,
}: SensorMappingModalProps) {
  const [selectionMethod, setSelectionMethod] = useState<'asset' | 'search'>('asset');
  const [elementName, setElementName] = useState(existingMapping?.elementName || '');
  const [selectedAsset, setSelectedAsset] = useState<AssetWithChildren | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [chartType, setChartType] = useState<SensorMappingData['chartType']>(existingMapping?.chartType || 'line');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Load initial data
  useEffect(() => {
    if (existingMapping) {
      setElementName(existingMapping.elementName);
      setChartType(existingMapping.chartType);
      // TODO: Load existing device and field
    }
  }, [existingMapping]);

  // Load devices when asset is selected
  useEffect(() => {
    if (selectedAsset && selectionMethod === 'asset') {
      loadDevicesForAsset(selectedAsset.id);
    }
  }, [selectedAsset, selectionMethod]);

  // Load device fields when device is selected
  useEffect(() => {
    if (selectedDevice) {
      loadDeviceFields(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadDevicesForAsset = async (assetId: string) => {
    setIsLoadingDevices(true);
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const response = await fetch(`/api/assets/${assetId}/devices`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const searchDevices = async (query: string) => {
    if (!query) {
      setDevices([]);
      return;
    }

    setIsLoadingDevices(true);
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const response = await fetch(`/api/devices?search=${encodeURIComponent(query)}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Error searching devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const loadDeviceFields = async (deviceId: string) => {
    setIsLoadingFields(true);
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const response = await fetch(`/api/devices/${deviceId}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      
      if (response.ok) {
        const device = await response.json();
        
        // Get field mappings from device type
        const typeResponse = await fetch(`/api/devicetype/${device.deviceTypeId}/fields`, {
          headers: { 'X-Tenant-Id': tenantId },
        });
        
        if (typeResponse.ok) {
          const fields = await typeResponse.json();
          setSelectedDevice({
            ...device,
            fields: fields.filter((f: any) => f.isQueryable),
          });
        }
      }
    } catch (error) {
      console.error('Error loading device fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleSave = () => {
    if (!elementName || !selectedDevice || !selectedField) {
      return;
    }

    const field = selectedDevice.fields?.find(f => f.fieldName === selectedField);
    
    onSave({
      elementId,
      elementName,
      deviceId: selectedDevice.id,
      deviceName: selectedDevice.name,
      fieldName: selectedField,
      fieldFriendlyName: field?.friendlyName,
      chartType,
    });

    handleClose();
  };

  const handleClose = () => {
    // Reset state
    setElementName('');
    setSelectedAsset(null);
    setDevices([]);
    setSelectedDevice(null);
    setSelectedField('');
    setSearchQuery('');
    onClose();
  };

  const canSave = elementName && selectedDevice && selectedField && chartType;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Sensor Mapping</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Element Name */}
          <div className="space-y-2">
            <Label htmlFor="element-name">Element Name</Label>
            <Input
              id="element-name"
              value={elementName}
              onChange={(e) => setElementName(e.target.value)}
              placeholder="e.g., Tank A, Pump 1, Motor Housing"
            />
            <p className="text-xs text-muted-foreground">
              Give this 3D element a descriptive name
            </p>
          </div>

          {/* Device Selection Method */}
          <div className="space-y-2">
            <Label>Select Device</Label>
            <Tabs value={selectionMethod} onValueChange={(v) => setSelectionMethod(v as 'asset' | 'search')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="asset">By Asset</TabsTrigger>
                <TabsTrigger value="search">Search Devices</TabsTrigger>
              </TabsList>

              <TabsContent value="asset" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <AssetHierarchySelector
                    selectedAssetId={selectedAsset?.id}
                    onSelectAsset={setSelectedAsset}
                  />
                </div>

                {selectedAsset && (
                  <div className="space-y-2">
                    <Label>Devices in {selectedAsset.name}</Label>
                    {isLoadingDevices ? (
                      <p className="text-sm text-muted-foreground">Loading devices...</p>
                    ) : devices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No devices found in this asset</p>
                    ) : (
                      <Select
                        value={selectedDevice?.id}
                        onValueChange={(id) => {
                          const device = devices.find(d => d.id === id);
                          if (device) setSelectedDevice(device);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a device" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name} {device.deviceTypeName && `(${device.deviceTypeName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchDevices(e.target.value);
                    }}
                    placeholder="Search devices by name..."
                    className="pl-10"
                  />
                </div>

                {isLoadingDevices ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : devices.length === 0 && searchQuery ? (
                  <p className="text-sm text-muted-foreground">No devices found</p>
                ) : devices.length > 0 ? (
                  <Select
                    value={selectedDevice?.id}
                    onValueChange={(id) => {
                      const device = devices.find(d => d.id === id);
                      if (device) setSelectedDevice(device);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} {device.deviceTypeName && `(${device.deviceTypeName})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>

          {/* Field Selection */}
          {selectedDevice && (
            <div className="space-y-2">
              <Label>Select Data Field</Label>
              {isLoadingFields ? (
                <p className="text-sm text-muted-foreground">Loading fields...</p>
              ) : selectedDevice.fields && selectedDevice.fields.length > 0 ? (
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDevice.fields.map((field) => (
                      <SelectItem key={field.fieldName} value={field.fieldName}>
                        {field.friendlyName} {field.unit && `(${field.unit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">No queryable fields available</p>
              )}
            </div>
          )}

          {/* Chart Type Selection */}
          {selectedField && (
            <div className="space-y-3">
              <Label>Chart Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {chartTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setChartType(type.value as SensorMappingData['chartType'])}
                      className={`
                        flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left
                        ${chartType === type.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${chartType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
