/**
 * Device Type Types
 * 
 * TypeScript interfaces for Device Type entities from Device.API
 */

export interface DeviceType {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  customFields?: Record<string, unknown>;
  fields?: FieldMapping[];
  createdAt: string;
  updatedAt: string;
  deviceCount?: number; // From aggregation
}

export enum FieldSource {
  Schema = 'Schema',
  CustomField = 'CustomField',
  System = 'System',
}

export enum FieldDataType {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  DateTime = 'DateTime',
  Json = 'Json',
}

export interface FieldMapping {
  id: string;
  deviceTypeId: string;
  fieldName: string;
  fieldSource: FieldSource;
  friendlyName: string;
  description?: string;
  unit?: string;
  dataType: FieldDataType;
  isQueryable: boolean;
  isVisible: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceTypeListResponse {
  items: DeviceType[];
  totalCount: number;
}

export interface FieldMappingListResponse {
  items: FieldMapping[];
  totalCount: number;
}
