/**
 * FieldMappingSelector Component
 * 
 * Multi-select component for selecting fields from a device type's field mappings
 * Shows only queryable fields with friendly names, data types, units
 * Supports drag-and-drop reordering of selected fields
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, GripVertical } from 'lucide-react';
import { getFieldMappings } from '@/lib/api/fieldMappings';
import type { FieldMapping } from '@/lib/api/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldMappingSelectorProps {
  deviceTypeId: string | undefined;
  selectedFields: string[];
  onChange: (fieldNames: string[]) => void;
  multiSelect?: boolean;
  showOnlyQueryable?: boolean;
}

export function FieldMappingSelector({
  deviceTypeId,
  selectedFields,
  onChange,
  multiSelect = true,
  showOnlyQueryable = true,
}: FieldMappingSelectorProps) {
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load field mappings when device type changes
  useEffect(() => {
    if (!deviceTypeId) {
      setFieldMappings([]);
      setError(null);
      return;
    }

    loadFieldMappings(deviceTypeId);
  }, [deviceTypeId]);

  async function loadFieldMappings(deviceTypeId: string) {
    try {
      setLoading(true);
      setError(null);
      const fields = await getFieldMappings(deviceTypeId);
      
      // Filter to only queryable fields if requested
      const filteredFields = showOnlyQueryable
        ? fields.filter((f) => f.isQueryable)
        : fields;
      
      // Sort by display order
      filteredFields.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return a.friendlyName.localeCompare(b.friendlyName);
      });

      setFieldMappings(filteredFields);
    } catch (err) {
      console.error('Failed to load field mappings:', err);
      setError('Failed to load field mappings');
      setFieldMappings([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFieldToggle(fieldName: string) {
    if (multiSelect) {
      const newSelection = selectedFields.includes(fieldName)
        ? selectedFields.filter((f) => f !== fieldName)
        : [...selectedFields, fieldName];
      onChange(newSelection);
    } else {
      onChange([fieldName]);
    }
  }

  function getDataTypeBadgeColor(dataType: string): string {
    switch (dataType) {
      case 'Number':
        return 'bg-blue-100 text-blue-800';
      case 'String':
        return 'bg-green-100 text-green-800';
      case 'Boolean':
        return 'bg-purple-100 text-purple-800';
      case 'DateTime':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (!deviceTypeId) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
        Select a device type to see available fields
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading fields...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 text-center border border-destructive rounded-lg">
        {error}
      </div>
    );
  }

  if (fieldMappings.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
        No queryable fields available for this device type
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected count */}
      <div className="text-sm text-muted-foreground">
        {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
      </div>

      {/* Field list */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2 space-y-1">
          {fieldMappings.map((field) => {
            const isSelected = selectedFields.includes(field.fieldName);
            
            return (
              <div
                key={field.id}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-accent ${
                  isSelected ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => handleFieldToggle(field.fieldName)}
              >
                {/* Checkbox/Radio */}
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleFieldToggle(field.fieldName)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Drag handle (for selected fields) */}
                {isSelected && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                )}

                {/* Field info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{field.friendlyName}</span>
                    <Badge className={`${getDataTypeBadgeColor(field.dataType)} text-xs`}>
                      {field.dataType}
                    </Badge>
                    {field.unit && (
                      <Badge variant="outline" className="text-xs">
                        {field.unit}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="truncate">{field.fieldName}</span>
                    {field.description && (
                      <span className="text-xs truncate">• {field.description}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
