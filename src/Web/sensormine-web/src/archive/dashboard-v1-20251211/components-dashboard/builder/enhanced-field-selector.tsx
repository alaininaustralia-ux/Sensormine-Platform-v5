/**
 * Enhanced Field Selector Component
 * 
 * Allows users to select fields using field mappings with friendly names.
 * Supports filtering by device type and asset hierarchy.
 * Integrates with Device.API field mappings and DigitalTwin.API asset structure.
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Check, X, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { getAllDeviceTypes } from '@/lib/api/deviceTypes';
import { getFieldMappings, getFieldMappingsByCategory, type FieldMapping } from '@/lib/api/field-mappings';
import { getAssets, type Asset } from '@/lib/api/digital-twin';
import type { DeviceType } from '@/lib/api/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface SelectedField {
  deviceTypeId: string;
  deviceTypeName: string;
  fieldName: string;
  friendlyName: string;
  fieldPath: string;
  dataType: string;
  unit?: string;
  aggregation?: string;
}

export interface FieldSelectorProps {
  selectedFields?: SelectedField[];
  onFieldsChange: (fields: SelectedField[]) => void;
  multiSelect?: boolean;
  showAssetFilter?: boolean;
  showAggregationOptions?: boolean;
  className?: string;
}

// =============================================================================
// Field Selector Component
// =============================================================================

export function EnhancedFieldSelector({
  selectedFields = [],
  onFieldsChange,
  multiSelect = true,
  showAssetFilter = false,
  showAggregationOptions = false,
  className = '',
}: FieldSelectorProps) {
  // State management
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [groupedFields, setGroupedFields] = useState<Record<string, FieldMapping[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Load device types on mount
  useEffect(() => {
    loadDeviceTypes();
    if (showAssetFilter) {
      loadAssets();
    }
  }, [showAssetFilter]);

  // Load field mappings when device type changes
  useEffect(() => {
    if (selectedDeviceType) {
      loadFieldMappings(selectedDeviceType.id);
    } else {
      setFieldMappings([]);
      setGroupedFields({});
    }
  }, [selectedDeviceType]);

  // =============================================================================
  // Data Loading Functions
  // =============================================================================

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

  const loadAssets = async () => {
    try {
      const response = await getAssets({ page: 1, pageSize: 100 });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const loadFieldMappings = async (deviceTypeId: string) => {
    try {
      setLoading(true);
      
      // Load field mappings grouped by category
      const grouped = await getFieldMappingsByCategory(deviceTypeId);
      setGroupedFields(grouped);
      
      // Also keep flat list for searching
      const allMappings = await getFieldMappings(deviceTypeId);
      setFieldMappings(allMappings.filter(m => m.isQueryable && m.isVisible));
      
      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(grouped)));
      
    } catch (error) {
      console.error('Failed to load field mappings:', error);
      setFieldMappings([]);
      setGroupedFields({});
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Field Selection Logic
  // =============================================================================

  const isFieldSelected = (fieldName: string): boolean => {
    return selectedFields.some(
      f => f.deviceTypeId === selectedDeviceType?.id && f.fieldName === fieldName
    );
  };

  const toggleField = (mapping: FieldMapping) => {
    if (!selectedDeviceType) return;

    const fieldKey = mapping.fieldName;
    const isSelected = isFieldSelected(fieldKey);

    if (isSelected) {
      // Remove field
      const newFields = selectedFields.filter(
        f => !(f.deviceTypeId === selectedDeviceType.id && f.fieldName === fieldKey)
      );
      onFieldsChange(newFields);
    } else {
      // Add field
      const newField: SelectedField = {
        deviceTypeId: selectedDeviceType.id,
        deviceTypeName: selectedDeviceType.name,
        fieldName: mapping.fieldName,
        friendlyName: mapping.friendlyName,
        fieldPath: mapping.fieldName,
        dataType: mapping.dataType,
        unit: mapping.unit,
        aggregation: mapping.defaultAggregation || 'avg',
      };

      if (multiSelect) {
        onFieldsChange([...selectedFields, newField]);
      } else {
        onFieldsChange([newField]);
      }
    }
  };

  const updateFieldAggregation = (fieldName: string, aggregation: string) => {
    const newFields = selectedFields.map(f =>
      f.fieldName === fieldName && f.deviceTypeId === selectedDeviceType?.id
        ? { ...f, aggregation }
        : f
    );
    onFieldsChange(newFields);
  };

  const removeField = (fieldName: string, deviceTypeId: string) => {
    const newFields = selectedFields.filter(
      f => !(f.fieldName === fieldName && f.deviceTypeId === deviceTypeId)
    );
    onFieldsChange(newFields);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // =============================================================================
  // Filtering Logic
  // =============================================================================

  const filteredMappings = fieldMappings.filter(mapping => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mapping.friendlyName.toLowerCase().includes(searchLower) ||
      mapping.fieldName.toLowerCase().includes(searchLower) ||
      mapping.description?.toLowerCase().includes(searchLower) ||
      mapping.category?.toLowerCase().includes(searchLower)
    );
  });

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Fields Summary */}
      {selectedFields.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Fields ({selectedFields.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedFields.map((field) => (
              <Badge key={`${field.deviceTypeId}-${field.fieldName}`} variant="secondary" className="gap-1">
                <span className="font-semibold">{field.friendlyName}</span>
                {field.unit && <span className="text-xs opacity-70">({field.unit})</span>}
                {showAggregationOptions && field.aggregation && (
                  <span className="text-xs opacity-70">• {field.aggregation}</span>
                )}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeField(field.fieldName, field.deviceTypeId)}
                />
              </Badge>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {/* Asset Filter (Optional) */}
      {showAssetFilter && (
        <div className="space-y-2">
          <Label htmlFor="asset-select">Filter by Asset</Label>
          <Select
            value={selectedAsset?.id || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                setSelectedAsset(null);
              } else {
                const asset = assets.find(a => a.id === value);
                setSelectedAsset(asset || null);
              }
            }}
          >
            <SelectTrigger id="asset-select">
              <SelectValue placeholder="All Assets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name} ({asset.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Device Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="device-type-select">Device Type</Label>
        <Select
          value={selectedDeviceType?.id || ''}
          onValueChange={(value) => {
            const deviceType = deviceTypes.find(dt => dt.id === value);
            setSelectedDeviceType(deviceType || null);
          }}
          disabled={loading}
        >
          <SelectTrigger id="device-type-select">
            <SelectValue placeholder="Select device type..." />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes.map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      {selectedDeviceType && (
        <div className="space-y-2">
          <Label htmlFor="field-search">Search Fields</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="field-search"
              placeholder="Search by name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Field List */}
      {selectedDeviceType && (
        <div className="space-y-2">
          <Label>Available Fields</Label>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading fields...
              </div>
            ) : searchTerm ? (
              // Flat list when searching
              <div className="space-y-2">
                {filteredMappings.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No fields match your search
                  </div>
                ) : (
                  filteredMappings.map((mapping) => (
                    <FieldItem
                      key={mapping.id}
                      mapping={mapping}
                      isSelected={isFieldSelected(mapping.fieldName)}
                      onToggle={() => toggleField(mapping)}
                      showAggregation={showAggregationOptions && isFieldSelected(mapping.fieldName)}
                      selectedAggregation={
                        selectedFields.find(f => f.fieldName === mapping.fieldName)?.aggregation
                      }
                      onAggregationChange={(agg) => updateFieldAggregation(mapping.fieldName, agg)}
                    />
                  ))
                )}
              </div>
            ) : (
              // Grouped by category
              <div className="space-y-3">
                {Object.keys(groupedFields).length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No queryable fields available
                  </div>
                ) : (
                  Object.entries(groupedFields).map(([category, mappings]) => (
                    <Collapsible
                      key={category}
                      open={expandedCategories.has(category)}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <div className="space-y-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between px-2 py-1 h-auto">
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(category) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Layers className="h-4 w-4" />
                              <span className="font-medium">{category}</span>
                              <Badge variant="outline" className="text-xs">
                                {mappings.length}
                              </Badge>
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pl-4">
                          {mappings.map((mapping) => (
                            <FieldItem
                              key={mapping.id}
                              mapping={mapping}
                              isSelected={isFieldSelected(mapping.fieldName)}
                              onToggle={() => toggleField(mapping)}
                              showAggregation={showAggregationOptions && isFieldSelected(mapping.fieldName)}
                              selectedAggregation={
                                selectedFields.find(f => f.fieldName === mapping.fieldName)?.aggregation
                              }
                              onAggregationChange={(agg) => updateFieldAggregation(mapping.fieldName, agg)}
                            />
                          ))}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Field Item Component
// =============================================================================

interface FieldItemProps {
  mapping: FieldMapping;
  isSelected: boolean;
  onToggle: () => void;
  showAggregation?: boolean;
  selectedAggregation?: string;
  onAggregationChange?: (aggregation: string) => void;
}

function FieldItem({
  mapping,
  isSelected,
  onToggle,
  showAggregation,
  selectedAggregation,
  onAggregationChange,
}: FieldItemProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{mapping.friendlyName}</span>
            {mapping.unit && (
              <Badge variant="outline" className="text-xs">
                {mapping.unit}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {mapping.dataType}
            </Badge>
          </div>
          {mapping.description && (
            <p className="text-xs text-muted-foreground">{mapping.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{mapping.fieldName}</span>
            {mapping.tags.length > 0 && (
              <>
                <span>•</span>
                <span>{mapping.tags.join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {showAggregation && onAggregationChange && (
        <div className="flex items-center gap-2 ml-7">
          <Label className="text-xs">Aggregation:</Label>
          <Select value={selectedAggregation} onValueChange={onAggregationChange}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mapping.supportsAggregations.map((agg) => (
                <SelectItem key={agg} value={agg} className="text-xs">
                  {agg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
