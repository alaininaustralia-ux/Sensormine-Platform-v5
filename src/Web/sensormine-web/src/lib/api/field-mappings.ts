/**
 * Field Mappings API Client
 * 
 * API functions for retrieving field mappings from Device.API
 * Field mappings provide user-friendly names and metadata for schema/custom/system fields
 */

import { deviceApiClient } from './deviceTypes';

// =============================================================================
// Types & Interfaces
// =============================================================================

export enum FieldSource {
  Schema = 'Schema',
  CustomField = 'CustomField',
  System = 'System'
}

export enum FieldDataType {
  String = 'String',
  Integer = 'Integer',
  Float = 'Float',
  Boolean = 'Boolean',
  DateTime = 'DateTime',
  Json = 'Json'
}

export interface FieldMapping {
  id: string;
  fieldName: string;
  fieldSource: FieldSource;
  friendlyName: string;
  description?: string;
  unit?: string;
  dataType: FieldDataType;
  minValue?: number;
  maxValue?: number;
  isQueryable: boolean;
  isVisible: boolean;
  displayOrder: number;
  category?: string;
  tags: string[];
  defaultAggregation?: string;
  supportsAggregations: string[];
  formatString?: string;
}

export interface FieldMappingWithDeviceType extends FieldMapping {
  deviceTypeId: string;
  deviceTypeName: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get field mappings for a specific device type
 * Returns merged list of schema fields, custom fields, and system fields with friendly names
 */
export async function getFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const response = await deviceApiClient.get<FieldMapping[]>(
    `/api/devicetype/${deviceTypeId}/fields`
  );
  return response.data;
}

/**
 * Get field mappings for multiple device types (useful for dashboard field selection)
 */
export async function getFieldMappingsForDeviceTypes(
  deviceTypeIds: string[]
): Promise<FieldMappingWithDeviceType[]> {
  const allMappings: FieldMappingWithDeviceType[] = [];

  // Fetch field mappings for each device type in parallel
  const promises = deviceTypeIds.map(async (deviceTypeId) => {
    try {
      const mappings = await getFieldMappings(deviceTypeId);
      // Add device type context to each mapping
      return mappings.map(mapping => ({
        ...mapping,
        deviceTypeId,
        deviceTypeName: '', // Will be enriched if needed
      }));
    } catch (error) {
      console.error(`Failed to fetch field mappings for device type ${deviceTypeId}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach(mappings => allMappings.push(...mappings));

  return allMappings;
}

/**
 * Get only queryable field mappings for a device type
 */
export async function getQueryableFieldMappings(deviceTypeId: string): Promise<FieldMapping[]> {
  const mappings = await getFieldMappings(deviceTypeId);
  return mappings.filter(m => m.isQueryable && m.isVisible);
}

/**
 * Get field mappings grouped by category
 */
export async function getFieldMappingsByCategory(
  deviceTypeId: string
): Promise<Record<string, FieldMapping[]>> {
  const mappings = await getFieldMappings(deviceTypeId);
  const grouped: Record<string, FieldMapping[]> = {};

  mappings.forEach(mapping => {
    const category = mapping.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(mapping);
  });

  // Sort within each category by displayOrder
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  return grouped;
}
