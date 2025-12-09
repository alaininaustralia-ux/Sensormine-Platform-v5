/**
 * Device Data Table Widget Configuration
 * 
 * Configuration panel for device-data-table widget including device type selection,
 * field selection, and detail dashboard navigation.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceUrls } from '@/lib/api/config';
import { Loader2, Columns } from 'lucide-react';
import type { WidgetConfigComponentProps } from './types';

export interface DeviceDataTableConfigType {
  deviceTypeId?: string;
  deviceTypeName?: string;
  fields?: Array<{
    fieldPath: string;
    fieldName: string;
    fieldType: string;
    width?: string; // Column width (e.g., '150px', '20%', 'auto')
  }>;
  detailDashboardId?: string;
  maxRows?: number;
  enableNavigation?: boolean;
  // Display options
  enablePagination?: boolean;
  pageSize?: number;
  compactMode?: boolean;
  stripedRows?: boolean;
  showBorders?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
}

interface DeviceType {
  id: string;
  name: string;
  description?: string;
  schemaId?: string;
  fields?: Array<{
    path: string;
    name: string;
    type: string;
  }>;
}

interface Dashboard {
  id: string;
  name: string;
  dashboardType: number;
}

interface DeviceDataTableWidgetConfigProps extends WidgetConfigComponentProps<DeviceDataTableConfigType> {
  mode?: 'data' | 'display'; // Controls which sections to show
}

export function DeviceDataTableWidgetConfig({
  config,
  onChange,
  mode = 'data', // Default to data mode
}: DeviceDataTableWidgetConfigProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [availableFields, setAvailableFields] = useState<Array<{ path: string; name: string; type: string }>>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);

  useEffect(() => {
    // Fetch device types
    const fetchDeviceTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const response = await fetch(`${serviceUrls.device}/api/DeviceType`);
        if (response.ok) {
          const data = await response.json();
          const types = Array.isArray(data) ? data : (data.items || data.data || []);
          setDeviceTypes(types);
        }
      } catch (error) {
        console.error('Failed to fetch device types:', error);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    // Fetch dashboards for detail navigation
    const fetchDashboards = async () => {
      try {
        setIsLoadingDashboards(true);
        const response = await fetch(`${serviceUrls.dashboard}/api/Dashboard`);
        if (response.ok) {
          const data = await response.json();
          const dashboardList = Array.isArray(data) ? data : (data.items || data.data || []);
          // Filter to device detail dashboards (type 1) or custom dashboards
          const detailDashboards = dashboardList.filter(
            (d: Dashboard) => d.dashboardType === 1 || d.dashboardType === 3
          );
          setDashboards(detailDashboards);
        }
      } catch (error) {
        console.error('Failed to fetch dashboards:', error);
      } finally {
        setIsLoadingDashboards(false);
      }
    };

    fetchDeviceTypes();
    fetchDashboards();
  }, []);

  useEffect(() => {
    // Fetch fields for selected device type
    if (config.deviceTypeId) {
      const fetchDeviceTypeFields = async () => {
        try {
          // Fetch device type with custom fields
          const deviceTypeResponse = await fetch(`${serviceUrls.device}/api/DeviceType/${config.deviceTypeId}`);
          if (!deviceTypeResponse.ok) {
            console.error('Failed to fetch device type');
            return;
          }

          const deviceType = await deviceTypeResponse.json();
          console.log('Device type data:', deviceType);
          
          let extractedFields: Array<{ path: string; name: string; type: string }> = [];
          
          // 1. Extract custom fields (device metadata fields)
          if (deviceType.customFields && Array.isArray(deviceType.customFields) && deviceType.customFields.length > 0) {
            const customFields = deviceType.customFields.map((field: { name: string; label: string; type: string }) => ({
              path: field.name,
              name: `${field.label || field.name} (Custom)`,
              type: field.type?.toLowerCase() || 'string',
            }));
            extractedFields.push(...customFields);
            console.log('Custom fields:', customFields);
          }
          
          // 2. Fetch schema fields if device type has a schema
          if (deviceType.schemaId) {
            try {
              const schemaResponse = await fetch(`${serviceUrls.schema}/api/Schemas/${deviceType.schemaId}`);
              if (schemaResponse.ok) {
                const schema = await schemaResponse.json();
                console.log('Schema data:', schema);
                
                // Extract fields from the current version's JSON schema
                if (schema.currentVersion?.jsonSchema) {
                  const jsonSchema = typeof schema.currentVersion.jsonSchema === 'string' 
                    ? JSON.parse(schema.currentVersion.jsonSchema) 
                    : schema.currentVersion.jsonSchema;
                  
                  if (jsonSchema.properties) {
                    const schemaFields = Object.entries(jsonSchema.properties).map(([key, prop]: [string, any]) => ({
                      path: key,
                      name: prop.title || key,
                      type: prop.type || 'string',
                    }));
                    extractedFields.push(...schemaFields);
                    console.log('Schema fields:', schemaFields);
                  }
                }
              }
            } catch (schemaError) {
              console.error('Failed to fetch schema:', schemaError);
            }
          }
          
          // 3. Add default device properties if no fields found
          if (extractedFields.length === 0) {
            console.log('No custom or schema fields found, using default device properties');
            extractedFields = [
              { path: 'name', name: 'Device Name', type: 'string' },
              { path: 'status', name: 'Status', type: 'string' },
              { path: 'lastSeen', name: 'Last Seen', type: 'datetime' },
              { path: 'location', name: 'Location', type: 'string' },
              { path: 'protocol', name: 'Protocol', type: 'string' },
            ];
          }
          
          setAvailableFields(extractedFields);
          console.log('Total available fields:', extractedFields);
        } catch (error) {
          console.error('Failed to fetch device type fields:', error);
        }
      };

      fetchDeviceTypeFields();
    } else {
      setAvailableFields([]);
    }
  }, [config.deviceTypeId]);

  const updateConfig = (updates: Partial<DeviceDataTableConfigType>) => {
    onChange({ ...config, ...updates });
  };

  const handleDeviceTypeChange = (deviceTypeId: string) => {
    const deviceType = deviceTypes.find(dt => dt.id === deviceTypeId);
    updateConfig({
      deviceTypeId,
      deviceTypeName: deviceType?.name,
      fields: [], // Reset fields when device type changes
    });
  };

  const toggleField = (field: { path: string; name: string; type: string }, checked: boolean) => {
    const currentFields = config.fields || [];
    if (checked) {
      updateConfig({
        fields: [...currentFields, { fieldPath: field.path, fieldName: field.name, fieldType: field.type }],
      });
    } else {
      updateConfig({
        fields: currentFields.filter(f => f.fieldPath !== field.path),
      });
    }
  };

  const isFieldSelected = (fieldPath: string) => {
    return (config.fields || []).some(f => f.fieldPath === fieldPath);
  };

  // Render data/fields sections
  if (mode === 'data') {
    return (
      <div className="space-y-6">
        {/* Data Source Section */}
        <div>
          <h3 className="text-sm font-medium mb-4">Data Source</h3>
          <div className="space-y-2">
            <Label htmlFor="device-type">Select Device Type</Label>
            {isLoadingTypes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading device types...
              </div>
            ) : (
              <Select
                value={config.deviceTypeId || ''}
                onValueChange={handleDeviceTypeChange}
              >
                <SelectTrigger id="device-type">
                  <SelectValue placeholder="Choose device type" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Only devices of this type will be displayed
            </p>
          </div>
        </div>

        {/* Fields Section */}
        {config.deviceTypeId && availableFields.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-4">Fields to Display</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-3">
              {availableFields.map((field) => {
                const selected = isFieldSelected(field.path);
                return (
                  <div
                    key={field.path}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      selected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted border border-transparent'
                    }`}
                    onClick={() => toggleField(field, !selected)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{field.name}</div>
                      <div className="text-xs text-muted-foreground">({field.type})</div>
                    </div>
                    {selected && (
                      <Switch checked={true} className="pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click fields to toggle. Selected fields will appear as columns in the table.
            </p>
          </div>
        )}

        {config.deviceTypeId && availableFields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            <Columns className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No fields available for this device type</p>
          </div>
        )}

        {/* Navigation Section */}
        <div>
          <h3 className="text-sm font-medium mb-4">Navigation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-navigation">Enable Row Click Navigation</Label>
                <div className="text-xs text-muted-foreground">
                  Navigate to detail dashboard when clicking a device row
                </div>
              </div>
              <Switch
                id="enable-navigation"
                checked={config.enableNavigation ?? true}
                onCheckedChange={(checked) => updateConfig({ enableNavigation: checked })}
              />
            </div>

            {config.enableNavigation && (
              <div className="space-y-2">
                <Label htmlFor="detail-dashboard">Detail Dashboard</Label>
                {isLoadingDashboards ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading dashboards...
                  </div>
                ) : (
                  <Select
                    value={config.detailDashboardId || ''}
                    onValueChange={(value) => updateConfig({ detailDashboardId: value })}
                  >
                    <SelectTrigger id="detail-dashboard">
                      <SelectValue placeholder="Choose detail dashboard" />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboards.map((dashboard) => (
                        <SelectItem key={dashboard.id} value={dashboard.id}>
                          {dashboard.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  The device ID and name will be passed as URL parameters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render display options sections
  return (
    <div className="space-y-6">
      {/* Display Options Section */}
      <div>
        <h3 className="text-sm font-medium mb-4">Table Display Options</h3>
        <div className="space-y-4">
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-pagination">Enable Pagination</Label>
              <div className="text-xs text-muted-foreground">
                Show page navigation controls
              </div>
            </div>
            <Switch
              id="enable-pagination"
              checked={config.enablePagination ?? false}
              onCheckedChange={(checked) => updateConfig({ enablePagination: checked })}
            />
          </div>

          {config.enablePagination && (
            <div className="space-y-2">
              <Label htmlFor="page-size">Rows Per Page</Label>
              <Select
                value={String(config.pageSize || 10)}
                onValueChange={(value) => updateConfig({ pageSize: parseInt(value) })}
              >
                <SelectTrigger id="page-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!config.enablePagination && (
            <div className="space-y-2">
              <Label htmlFor="max-rows">Maximum Rows</Label>
              <Input
                id="max-rows"
                type="number"
                min="1"
                max="1000"
                value={config.maxRows || 20}
                onChange={(e) => updateConfig({ maxRows: parseInt(e.target.value) || 20 })}
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of devices displayed
              </p>
            </div>
          )}

          {/* Styling Options */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <div className="text-xs text-muted-foreground">
                Reduce row height and padding
              </div>
            </div>
            <Switch
              id="compact-mode"
              checked={config.compactMode ?? false}
              onCheckedChange={(checked) => updateConfig({ compactMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="striped-rows">Striped Rows</Label>
              <div className="text-xs text-muted-foreground">
                Alternate row background colors
              </div>
            </div>
            <Switch
              id="striped-rows"
              checked={config.stripedRows ?? false}
              onCheckedChange={(checked) => updateConfig({ stripedRows: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-borders">Show Cell Borders</Label>
              <div className="text-xs text-muted-foreground">
                Display vertical borders between columns
              </div>
            </div>
            <Switch
              id="show-borders"
              checked={config.showBorders ?? true}
              onCheckedChange={(checked) => updateConfig({ showBorders: checked })}
            />
          </div>

          {/* Features */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-search">Enable Search</Label>
              <div className="text-xs text-muted-foreground">
                Add search box to filter table data
              </div>
            </div>
            <Switch
              id="enable-search"
              checked={config.enableSearch ?? false}
              onCheckedChange={(checked) => updateConfig({ enableSearch: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-export">Enable Export</Label>
              <div className="text-xs text-muted-foreground">
                Add button to export table to CSV
              </div>
            </div>
            <Switch
              id="enable-export"
              checked={config.enableExport ?? false}
              onCheckedChange={(checked) => updateConfig({ enableExport: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
