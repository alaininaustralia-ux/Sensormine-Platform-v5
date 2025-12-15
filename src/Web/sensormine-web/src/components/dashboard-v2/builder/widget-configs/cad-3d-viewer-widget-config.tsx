/**
 * CAD 3D Viewer Widget Configuration
 * 
 * Configuration panel for 3D CAD viewer widget settings including
 * model upload, camera settings, colors, and sensor mappings.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Upload, Trash2, X } from 'lucide-react';
import type { SensorElementMapping, SensorFieldMapping } from '../../widgets/cad-3d-viewer-widget';
import { getDevices, type Device } from '@/lib/api/devices';
import { alertRulesApi, type AlertRule } from '@/lib/api/alerts';
import { useToast } from '@/hooks/use-toast';

export interface CAD3DViewerConfigType {
  modelUrl?: string;
  modelType?: 'stl' | 'obj';
  backgroundColor?: string;
  gridEnabled?: boolean;
  cameraPosition?: [number, number, number];
  sensorMappings?: SensorElementMapping[];
  defaultColor?: string;
  highlightColor?: string;
  activeColor?: string;
}

export interface CAD3DViewerWidgetConfigProps {
  config: CAD3DViewerConfigType;
  onChange: (config: CAD3DViewerConfigType) => void;
  selectedElementId?: string | null;
  selectedElementName?: string | null;
}

export function CAD3DViewerWidgetConfig({
  config,
  onChange,
  selectedElementId: externalSelectedElementId,
  selectedElementName: externalSelectedElementName,
}: CAD3DViewerWidgetConfigProps) {
  const [activeTab, setActiveTab] = useState('model');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  // Mapping configuration state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [expandedMappingId, setExpandedMappingId] = useState<string | null>(null);
  
  // New field form state (keyed by mapping elementId)
  const [newFieldForms, setNewFieldForms] = useState<Record<string, {
    fieldName: string;
    chartType: string;
    timePeriod: string;
  }>>({});
  
  // Data from APIs
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch devices and alerts on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [devicesResponse, alertsResponse] = await Promise.all([
          getDevices({ pageSize: 100 }),
          alertRulesApi.list(1, 100)
        ]);
        setDevices(devicesResponse.data.devices);
        setAlerts(alertsResponse.data);
      } catch (error) {
        console.error('Failed to fetch devices/alerts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load devices and alerts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  // When element is selected in widget, switch to mappings tab
  useEffect(() => {
    if (externalSelectedElementId) {
      setSelectedElementId(externalSelectedElementId);
      setActiveTab('mappings');
      // Auto-expand if mapping already exists
      const existingMapping = config.sensorMappings?.find(m => m.elementId === externalSelectedElementId);
      if (existingMapping) {
        setExpandedMappingId(externalSelectedElementId);
      } else {
        // Initialize new mapping form for unmapped element
        setNewMapping({
          elementId: externalSelectedElementId,
          elementName: externalSelectedElementName || externalSelectedElementId,
          sourceType: 'device',
          deviceId: '',
          deviceName: '',
          alertId: '',
          alertName: '',
          fieldName: '',
          fieldFriendlyName: '',
          chartType: 'line',
          timePeriod: '24h',
        });
      }
    }
  }, [externalSelectedElementId, externalSelectedElementName, config.sensorMappings]);
  const [newMapping, setNewMapping] = useState<{
    elementId: string;
    elementName: string;
    sourceType: 'device' | 'alert';
    deviceId: string;
    deviceName: string;
    alertId: string;
    alertName: string;
    fieldName: string;
    fieldFriendlyName: string;
    chartType: 'line' | 'bar' | 'gauge' | 'value';
    timePeriod: '1h' | '6h' | '12h' | '24h' | '7d' | '30d';
  } | null>(null);

  const updateConfig = (updates: Partial<CAD3DViewerConfigType>) => {
    const newConfig = { ...config, ...updates };
    console.log('[CAD3DViewerConfig] Calling onChange with:', newConfig);
    onChange(newConfig);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleFileUpload triggered');
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file ? { name: file.name, size: file.size, type: file.type } : 'NO FILE');
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to backend API
      const formData = new FormData();
      formData.append('file', file);

      const tenantId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(
        `${apiBase}/api/files/upload?category=cad-models`,
        {
          method: 'POST',
          headers: {
            'X-Tenant-Id': tenantId,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const modelType = fileExtension === 'stl' ? 'stl' : 'obj';

      const newModelUrl = result.url || `${apiBase}/api/files/${result.fileId}`;
      console.log('📦 Upload result:', result);
      console.log('🔗 Setting modelUrl to:', newModelUrl);
      console.log('🎨 Setting modelType to:', modelType);

      // Use the file URL from the backend - this triggers onChange which saves to dashboard
      const newConfig = { 
        modelUrl: newModelUrl,
        modelType: modelType as 'stl' | 'obj'
      };
      
      console.log('📤 Calling updateConfig with:', newConfig);
      updateConfig(newConfig);

      console.log('✅ File uploaded successfully, config should be saved automatically');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveModel = () => {
    updateConfig({ 
      modelUrl: undefined,
      modelType: undefined
    });
  };

  const handleRemoveMapping = (elementId: string) => {
    const updatedMappings = config.sensorMappings?.filter(
      m => m.elementId !== elementId
    );
    updateConfig({ sensorMappings: updatedMappings });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="model">Model</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="mappings">Mappings</TabsTrigger>
      </TabsList>

      {/* Model Tab */}
      <TabsContent value="model" className="space-y-4 pt-4">
        <div className="space-y-3">
          <div>
            <Label>3D Model File</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload STL or OBJ file for 3D visualization
            </p>
            
            {config.modelUrl ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">Model Loaded</p>
                  <p className="text-xs text-muted-foreground">
                    Type: {config.modelType?.toUpperCase()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveModel}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl,.obj"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-2 border-dashed"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Button clicked');
                    console.log('📌 fileInputRef.current:', fileInputRef.current);
                    fileInputRef.current?.click();
                    console.log('✅ file input click() called');
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Uploading...' : 'Click to upload STL or OBJ file'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MAX. 100MB
                    </p>
                  </div>
                </Button>
                {uploadError && (
                  <p className="text-xs text-destructive mt-2">{uploadError}</p>
                )}
              </>
            )}
          </div>

          <div>
            <Label htmlFor="model-type">Model Type</Label>
            <Select
              value={config.modelType || 'stl'}
              onValueChange={(value: 'stl' | 'obj') => updateConfig({ modelType: value })}
            >
              <SelectTrigger id="model-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stl">STL</SelectItem>
                <SelectItem value="obj">OBJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* Appearance Tab */}
      <TabsContent value="appearance" className="space-y-4 pt-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="bg-color"
                type="color"
                value={config.backgroundColor || '#1a1a1a'}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.backgroundColor || '#1a1a1a'}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="default-color">Default Element Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="default-color"
                type="color"
                value={config.defaultColor || '#888888'}
                onChange={(e) => updateConfig({ defaultColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.defaultColor || '#888888'}
                onChange={(e) => updateConfig({ defaultColor: e.target.value })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Color for elements without sensor data
            </p>
          </div>

          <div>
            <Label htmlFor="active-color">Active Element Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="active-color"
                type="color"
                value={config.activeColor || '#4ade80'}
                onChange={(e) => updateConfig({ activeColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.activeColor || '#4ade80'}
                onChange={(e) => updateConfig({ activeColor: e.target.value })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Color for elements with sensor data
            </p>
          </div>

          <div>
            <Label htmlFor="highlight-color">Highlight Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="highlight-color"
                type="color"
                value={config.highlightColor || '#ff6b35'}
                onChange={(e) => updateConfig({ highlightColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={config.highlightColor || '#ff6b35'}
                onChange={(e) => updateConfig({ highlightColor: e.target.value })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Color when element is selected
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="grid-enabled">Show Grid</Label>
              <p className="text-xs text-muted-foreground">
                Display ground grid for reference
              </p>
            </div>
            <Switch
              id="grid-enabled"
              checked={config.gridEnabled ?? true}
              onCheckedChange={(checked) => updateConfig({ gridEnabled: checked })}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label>Camera Zoom</Label>
                <p className="text-xs text-muted-foreground">
                  Adjust the default viewing distance
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {config.cameraPosition?.[0] ?? 5}
              </span>
            </div>
            <Slider
              value={[config.cameraPosition?.[0] ?? 5]}
              onValueChange={(values) => {
                const zoom = values[0];
                updateConfig({ cameraPosition: [zoom, zoom, zoom] });
              }}
              min={3}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Close (3)</span>
              <span>Far (100)</span>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Mappings Tab */}
      <TabsContent value="mappings" className="space-y-4 pt-4 max-h-[600px] overflow-y-auto">
        <div>
          <Label>Element Mappings</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Click an element in the 3D viewer to configure sensor data
          </p>

          {config.sensorMappings && config.sensorMappings.length > 0 ? (
            <div className="space-y-2">
              {config.sensorMappings.map((mapping) => {
                const isExpanded = expandedMappingId === mapping.elementId;
                return (
                  <div
                    key={mapping.elementId}
                    className="border rounded-lg bg-card overflow-hidden"
                  >
                    {/* Mapping Header */}
                    <div
                      className="flex items-start justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedMappingId(isExpanded ? null : mapping.elementId)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {mapping.elementName}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {mapping.fields.length}/2 fields
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mapping.sourceType === 'device' 
                            ? `Device: ${mapping.deviceName}` 
                            : `Alert: ${mapping.alertName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMapping(mapping.elementId);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Mapping Details */}
                    {isExpanded && (
                      <div className="border-t p-3 space-y-3 bg-muted/20">
                        {/* Existing Fields */}
                        {mapping.fields.map((field, idx) => (
                          <div key={idx} className="p-2 border rounded bg-background space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">
                                Field {idx + 1}: {field.fieldFriendlyName || field.fieldName}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const updatedFields = mapping.fields.filter((_, i) => i !== idx);
                                  const updatedMappings = config.sensorMappings!.map(m =>
                                    m.elementId === mapping.elementId
                                      ? { ...m, fields: updatedFields }
                                      : m
                                  );
                                  updateConfig({ sensorMappings: updatedMappings });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Chart:</span>{' '}
                                <span className="font-medium">{field.chartType}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Period:</span>{' '}
                                <span className="font-medium">{field.timePeriod}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add New Field (max 2) */}
                        {mapping.fields.length < 2 && mapping.sourceType === 'device' && (() => {
                          const device = devices.find(d => d.id === mapping.deviceId);
                          const availableFields = device?.deviceType?.fieldMappings?.filter(
                            fm => !mapping.fields.some(f => f.fieldName === fm.fieldName)
                          ) || [];
                          
                          const currentForm = newFieldForms[mapping.elementId] || {
                            fieldName: '',
                            chartType: 'line',
                            timePeriod: '24h',
                          };
                          
                          return (
                            <div className="pt-2 border-t space-y-2">
                              <Label className="text-xs">Add Field to {mapping.elementName}</Label>
                              
                              {availableFields.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">All device fields are already mapped</p>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor={`field-${mapping.elementId}`} className="text-xs">Field</Label>
                                      <Select 
                                        value={currentForm.fieldName}
                                        onValueChange={(value) => {
                                          setNewFieldForms(prev => ({
                                            ...prev,
                                            [mapping.elementId]: { ...currentForm, fieldName: value }
                                          }));
                                        }}
                                      >
                                        <SelectTrigger id={`field-${mapping.elementId}`} className="h-8">
                                          <SelectValue placeholder="Choose field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableFields.map(field => (
                                            <SelectItem key={field.fieldName} value={field.fieldName}>
                                              {field.friendlyName || field.fieldName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label htmlFor={`chart-${mapping.elementId}`} className="text-xs">Chart Type</Label>
                                      <Select 
                                        value={currentForm.chartType}
                                        onValueChange={(value) => {
                                          setNewFieldForms(prev => ({
                                            ...prev,
                                            [mapping.elementId]: { ...currentForm, chartType: value }
                                          }));
                                        }}
                                      >
                                        <SelectTrigger id={`chart-${mapping.elementId}`} className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="line">Line</SelectItem>
                                          <SelectItem value="bar">Bar</SelectItem>
                                          <SelectItem value="gauge">Gauge</SelectItem>
                                          <SelectItem value="value">Value</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor={`period-${mapping.elementId}`} className="text-xs">Time Period</Label>
                                    <Select 
                                      value={currentForm.timePeriod}
                                      onValueChange={(value) => {
                                        setNewFieldForms(prev => ({
                                          ...prev,
                                          [mapping.elementId]: { ...currentForm, timePeriod: value }
                                        }));
                                      }}
                                    >
                                      <SelectTrigger id={`period-${mapping.elementId}`} className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1h">Last Hour</SelectItem>
                                        <SelectItem value="6h">Last 6 Hours</SelectItem>
                                        <SelectItem value="12h">Last 12 Hours</SelectItem>
                                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                        <SelectItem value="30d">Last 30 Days</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full h-8"
                                    disabled={!currentForm.fieldName}
                                    onClick={() => {
                                      const selectedField = availableFields.find(f => f.fieldName === currentForm.fieldName);
                                      if (!selectedField) return;
                                      
                                      const newField: SensorFieldMapping = {
                                        fieldName: selectedField.fieldName,
                                        fieldFriendlyName: selectedField.friendlyName || selectedField.fieldName,
                                        chartType: currentForm.chartType,
                                        timePeriod: currentForm.timePeriod,
                                      };
                                      
                                      const updatedMappings = config.sensorMappings!.map(m =>
                                        m.elementId === mapping.elementId
                                          ? { ...m, fields: [...m.fields, newField] }
                                          : m
                                      );
                                      
                                      updateConfig({ sensorMappings: updatedMappings });
                                      
                                      // Reset form
                                      setNewFieldForms(prev => {
                                        const updated = { ...prev };
                                        delete updated[mapping.elementId];
                                        return updated;
                                      });
                                      
                                      toast({
                                        title: 'Field Added',
                                        description: `${selectedField.friendlyName || selectedField.fieldName} added to ${mapping.elementName}`,
                                      });
                                    }}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Add Field
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                No element mappings configured yet
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Click elements in the 3D viewer to start configuring
              </p>
            </div>
          )}

          {/* New Mapping Form */}
          {selectedElementId && !config.sensorMappings?.find(m => m.elementId === selectedElementId) && (
            <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Configure: {externalSelectedElementName || selectedElementId}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedElementId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label htmlFor="source-type" className="text-xs">Data Source</Label>
                <Select 
                  value={newMapping?.sourceType || 'device'}
                  onValueChange={(value: 'device' | 'alert') => 
                    setNewMapping({ 
                      elementId: selectedElementId || '',
                      elementName: externalSelectedElementName || selectedElementId || '',
                      sourceType: value,
                      deviceId: '',
                      deviceName: '',
                      alertId: '',
                      alertName: '',
                      fieldName: '',
                      fieldFriendlyName: '',
                      chartType: 'line',
                      timePeriod: '24h'
                    })
                  }
                >
                  <SelectTrigger id="source-type" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="device">Device</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="device-select" className="text-xs">
                  {newMapping?.sourceType === 'alert' ? 'Select Alert' : 'Select Device'}
                </Label>
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : (
                  <Select 
                    value={newMapping?.sourceType === 'alert' ? newMapping?.alertId : newMapping?.deviceId}
                    onValueChange={(value) => {
                      if (newMapping?.sourceType === 'alert') {
                        const alert = alerts.find(a => a.id === value);
                        setNewMapping(prev => ({ ...prev!, alertId: value, alertName: alert?.name || '' }));
                      } else {
                        const device = devices.find(d => d.id === value);
                        setNewMapping(prev => ({ ...prev!, deviceId: value, deviceName: device?.name || '' }));
                      }
                    }}
                  >
                    <SelectTrigger id="device-select" className="h-8">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {newMapping?.sourceType === 'alert' ? (
                        alerts.length > 0 ? (
                          alerts.map(alert => (
                            <SelectItem key={alert.id} value={alert.id}>
                              {alert.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No alerts available</SelectItem>
                        )
                      ) : (
                        devices.length > 0 ? (
                          devices.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No devices available</SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="new-field" className="text-xs">Field</Label>
                  <Select 
                    value={newMapping?.fieldName}
                    onValueChange={(value) => setNewMapping(prev => ({ ...prev!, fieldName: value, fieldFriendlyName: value }))}
                  >
                    <SelectTrigger id="new-field" className="h-8">
                      <SelectValue placeholder="Choose field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="pressure">Pressure</SelectItem>
                      <SelectItem value="vibration">Vibration</SelectItem>
                      <SelectItem value="humidity">Humidity</SelectItem>
                      <SelectItem value="flow">Flow Rate</SelectItem>
                      <SelectItem value="level">Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-chart" className="text-xs">Chart Type</Label>
                  <Select 
                    value={newMapping?.chartType}
                    onValueChange={(value: 'line' | 'bar' | 'gauge' | 'value') => setNewMapping(prev => ({ ...prev!, chartType: value }))}
                  >
                    <SelectTrigger id="new-chart" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="gauge">Gauge</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="new-period" className="text-xs">Time Period</Label>
                <Select 
                  value={newMapping?.timePeriod}
                  onValueChange={(value: '1h' | '6h' | '12h' | '24h' | '7d' | '30d') => setNewMapping(prev => ({ ...prev!, timePeriod: value }))}
                >
                  <SelectTrigger id="new-period" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="6h">Last 6 Hours</SelectItem>
                    <SelectItem value="12h">Last 12 Hours</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  if (!newMapping || !newMapping.fieldName) {
                    toast({
                      title: 'Validation Error',
                      description: 'Please fill in all fields',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  const field: SensorFieldMapping = {
                    fieldName: newMapping.fieldName,
                    fieldFriendlyName: newMapping.fieldFriendlyName,
                    chartType: newMapping.chartType,
                    timePeriod: newMapping.timePeriod,
                  };
                  
                  const mapping: SensorElementMapping = {
                    elementId: selectedElementId,
                    elementName: externalSelectedElementName || selectedElementId,
                    sourceType: newMapping.sourceType,
                    deviceId: newMapping.deviceId,
                    deviceName: newMapping.deviceName,
                    alertId: newMapping.alertId,
                    alertName: newMapping.alertName,
                    fields: [field],
                  };
                  
                  const updatedMappings = [...(config.sensorMappings || []), mapping];
                  updateConfig({ sensorMappings: updatedMappings });
                  
                  // Reset form and expand the new mapping
                  setNewMapping(null);
                  setExpandedMappingId(selectedElementId);
                  setSelectedElementId(null);
                  
                  toast({
                    title: 'Success',
                    description: 'Mapping added successfully',
                  });
                }}
                disabled={!newMapping || !newMapping.fieldName || (newMapping.sourceType === 'device' ? !newMapping.deviceId : !newMapping.alertId)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Add Mapping
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
