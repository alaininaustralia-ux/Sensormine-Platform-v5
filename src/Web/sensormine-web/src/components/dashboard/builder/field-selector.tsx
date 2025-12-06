/**
 * Field Selector Component
 * 
 * Allows users to browse device types and their schemas to select fields for dashboard widgets.
 * Used in widget configuration to select data sources.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import { getAllDeviceTypes } from '@/lib/api/deviceTypes';
import { getSchema } from '@/lib/api/schemas';
import type { DeviceType } from '@/lib/api/types';

interface SchemaField {
  path: string;
  name: string;
  type: string;
  description?: string;
  unit?: string;
  format?: string;
}

interface SchemaContent {
  type: string;
  properties?: Record<string, SchemaProperty>;
}

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  unit?: string;
  format?: string;
  properties?: Record<string, SchemaProperty>;
}

interface SchemaData {
  schemaContent?: string | SchemaContent;
}

export interface SelectedField {
  deviceTypeId: string;
  deviceTypeName: string;
  fieldPath: string;
  fieldName: string;
  fieldType: string;
}

interface FieldSelectorProps {
  selectedFields?: SelectedField[];
  onFieldsChange: (fields: SelectedField[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function FieldSelector({
  selectedFields = [],
  onFieldsChange,
  multiSelect = true,
  className = '',
}: FieldSelectorProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const loadSchemaFields = async (deviceType: DeviceType) => {
    if (!deviceType.schemaId) {
      setSchemaFields([]);
      return;
    }

    try {
      setLoading(true);
      const schema = await getSchema(deviceType.schemaId);
      
      // Parse schema to extract fields
      const fields = parseSchemaFields(schema as SchemaData);
      setSchemaFields(fields);
    } catch (error) {
      console.error('Failed to load schema:', error);
      setSchemaFields([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeviceType) {
      loadSchemaFields(selectedDeviceType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceType]);

  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllDeviceTypes(1, 100);
      setDeviceTypes(response.items);
    } catch (error) {
      console.error('Failed to load device types:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseSchemaFields = (schema: { schemaContent?: string | SchemaContent }): SchemaField[] => {
    const fields: SchemaField[] = [];

    if (!schema || !schema.schemaContent) {
      return fields;
    }

    try {
      const content = typeof schema.schemaContent === 'string' 
        ? JSON.parse(schema.schemaContent) 
        : schema.schemaContent;

      // Handle JSON Schema
      if (content.type === 'object' && content.properties) {
        Object.entries(content.properties).forEach(([key, value]) => {
          const prop = value as SchemaProperty;
          fields.push({
            path: key,
            name: prop.title || key,
            type: prop.type,
            description: prop.description,
            unit: prop.unit,
            format: prop.format,
          });

          // Handle nested objects
          if (prop.type === 'object' && prop.properties) {
            Object.entries(prop.properties).forEach(([nestedKey, nestedValue]) => {
              const nestedProp = nestedValue as SchemaProperty;
              fields.push({
                path: `${key}.${nestedKey}`,
                name: `${prop.title || key} > ${nestedProp.title || nestedKey}`,
                type: nestedProp.type,
                description: nestedProp.description,
                unit: nestedProp.unit,
                format: nestedProp.format,
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse schema:', error);
    }

    return fields;
  };

  const handleFieldToggle = (field: SchemaField) => {
    if (!selectedDeviceType) return;

    const selectedField: SelectedField = {
      deviceTypeId: selectedDeviceType.id,
      deviceTypeName: selectedDeviceType.name,
      fieldPath: field.path,
      fieldName: field.name,
      fieldType: field.type,
    };

    const isSelected = selectedFields.some(
      (f) => f.deviceTypeId === selectedField.deviceTypeId && f.fieldPath === selectedField.fieldPath
    );

    if (multiSelect) {
      if (isSelected) {
        onFieldsChange(
          selectedFields.filter(
            (f) => !(f.deviceTypeId === selectedField.deviceTypeId && f.fieldPath === selectedField.fieldPath)
          )
        );
      } else {
        onFieldsChange([...selectedFields, selectedField]);
      }
    } else {
      onFieldsChange(isSelected ? [] : [selectedField]);
    }
  };

  const isFieldSelected = (field: SchemaField) => {
    return selectedFields.some(
      (f) =>
        f.deviceTypeId === selectedDeviceType?.id &&
        f.fieldPath === field.path
    );
  };

  const filteredFields = schemaFields.filter((field) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
      case 'integer':
        return '🔢';
      case 'string':
        return '📝';
      case 'boolean':
        return '✓';
      case 'object':
        return '📦';
      case 'array':
        return '📋';
      default:
        return '•';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Device Type</Label>
        <Select
          value={selectedDeviceType?.id || ''}
          onValueChange={(value) => {
            const deviceType = deviceTypes.find((dt) => dt.id === value);
            setSelectedDeviceType(deviceType || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select device type" />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes.map((deviceType) => (
              <SelectItem key={deviceType.id} value={deviceType.id}>
                <div className="flex items-center gap-2">
                  <span>{deviceType.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {deviceType.protocol}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDeviceType && (
        <>
          <div className="space-y-2">
            <Label>Search Fields</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available Fields ({filteredFields.length})</Label>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading fields...</div>
              ) : filteredFields.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {schemaFields.length === 0
                    ? 'No schema assigned to this device type'
                    : 'No fields match your search'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFields.map((field) => (
                    <div
                      key={field.path}
                      className={`flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
                        isFieldSelected(field) ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleFieldToggle(field)}
                    >
                      {multiSelect && (
                        <input
                          type="checkbox"
                          checked={isFieldSelected(field)}
                          onChange={() => handleFieldToggle(field)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getFieldTypeIcon(field.type)}</span>
                          <span className="text-sm font-medium">{field.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {field.type}
                          </Badge>
                          {field.unit && (
                            <Badge variant="outline" className="text-xs">
                              {field.unit}
                            </Badge>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">{field.path}</p>
                      </div>
                      {isFieldSelected(field) && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedFields.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Fields ({selectedFields.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFields.map((field, index) => (
                  <Badge
                    key={`${field.deviceTypeId}-${field.fieldPath}-${index}`}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => {
                      onFieldsChange(selectedFields.filter((_, i) => i !== index));
                    }}
                  >
                    {field.deviceTypeName}: {field.fieldName}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
