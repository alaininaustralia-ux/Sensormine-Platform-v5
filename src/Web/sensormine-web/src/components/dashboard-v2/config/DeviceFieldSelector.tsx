/**
 * DeviceFieldSelector Component
 * 
 * Multi-select field selector for a specific device
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getDeviceById } from '@/lib/api/devices';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeviceFieldSelectorProps {
  deviceId: string;
  selectedFields: string[];
  onChange: (fields: string[]) => void;
}

interface FieldInfo {
  fieldName: string;
  friendlyName: string;
  dataType: string;
  unit?: string;
  description?: string;
}

export function DeviceFieldSelector({ deviceId, selectedFields, onChange }: DeviceFieldSelectorProps) {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeviceFields() {
      if (!deviceId) {
        setFields([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('[DeviceFieldSelector] Fetching device:', deviceId);
        const response = await getDeviceById(deviceId);
        console.log('[DeviceFieldSelector] Response:', response);
        
        if (response.data) {
          const device = response.data;
          
          // Use field mappings metadata if available (preferred)
          if (device.fieldMappings && device.fieldMappings.length > 0) {
            console.log('[DeviceFieldSelector] Using field mappings:', device.fieldMappings);
            const deviceFields: FieldInfo[] = device.fieldMappings
              .filter(fm => fm.isVisible && fm.isQueryable)
              .map(fm => ({
                fieldName: fm.fieldName,
                friendlyName: fm.friendlyName,
                dataType: fm.dataType,
                unit: fm.unit,
                description: fm.description,
              }));
            
            if (deviceFields.length === 0) {
              setError('No queryable fields found for this device type.');
            }
            setFields(deviceFields);
          }
          // Fallback to customFieldValues
          else if (device.customFieldValues && typeof device.customFieldValues === 'object') {
            console.log('[DeviceFieldSelector] Using customFieldValues:', device.customFieldValues);
            const deviceFields: FieldInfo[] = [];
            
            Object.keys(device.customFieldValues).forEach(fieldName => {
              deviceFields.push({
                fieldName,
                friendlyName: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                dataType: typeof device.customFieldValues[fieldName],
                unit: undefined,
                description: undefined,
              });
            });
            
            if (deviceFields.length === 0) {
              setError('No fields found for this device. The device may not have sent any telemetry yet.');
            }
            setFields(deviceFields);
          } else {
            setError('No field information available for this device.');
          }
        }
      } catch (err) {
        console.error('[DeviceFieldSelector] Error:', err);
        setError('Failed to load device fields');
      } finally {
        setLoading(false);
      }
    }

    fetchDeviceFields();
  }, [deviceId]);

  const handleToggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      onChange(selectedFields.filter(f => f !== fieldName));
    } else {
      onChange([...selectedFields, fieldName]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading fields...
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    );
  }

  if (fields.length === 0) {
    return (
      <Alert>
        <AlertDescription className="text-sm">
          No fields available. Make sure the device has sent telemetry data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">
        Select fields to display on the chart (multiple allowed)
      </div>
      {fields.map((field) => (
        <div key={field.fieldName} className="flex items-start space-x-2">
          <Checkbox
            id={`field-${field.fieldName}`}
            checked={selectedFields.includes(field.fieldName)}
            onCheckedChange={() => handleToggleField(field.fieldName)}
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor={`field-${field.fieldName}`}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {field.friendlyName}
            </Label>
            <p className="text-xs text-muted-foreground">
              {field.fieldName} {field.unit && `• ${field.unit}`} {field.dataType && `• ${field.dataType}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
