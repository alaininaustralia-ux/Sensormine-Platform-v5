/**
 * API Client for fetching devices and schemas from Sensormine Platform
 */

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export interface ApiDevice {
  id: string;
  tenantId: string;
  deviceId: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName: string;
  status: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiDeviceType {
  id: string;
  name: string;
  description?: string;
  schemaId?: string;
  manufacturerName?: string;
  modelNumber?: string;
  protocol?: string;
}

export interface ApiSchema {
  id: string;
  name: string;
  description?: string;
  currentVersion?: {
    id: string;
    version: string;
    jsonSchema: string;
    status: string;
  };
}

export interface ApiDevicesResponse {
  devices: ApiDevice[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface ApiDeviceTypesResponse {
  deviceTypes: ApiDeviceType[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface ApiSchemasResponse {
  schemas: ApiSchema[];
  totalCount: number;
  skip: number;
  take: number;
}

export class SensormineApiClient {
  private deviceApiUrl: string;
  private schemaApiUrl: string;
  private tenantId: string;

  constructor(
    deviceApiUrl = 'http://localhost:5293',
    schemaApiUrl = 'http://localhost:5021',
    tenantId = DEFAULT_TENANT_ID
  ) {
    this.deviceApiUrl = deviceApiUrl;
    this.schemaApiUrl = schemaApiUrl;
    this.tenantId = tenantId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-Id': this.tenantId,
    };
  }

  /**
   * Fetch all devices with pagination
   */
  async fetchDevices(skip = 0, take = 100): Promise<ApiDevicesResponse> {
    const url = `${this.deviceApiUrl}/api/Device?skip=${skip}&take=${take}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch all devices (handles pagination automatically)
   */
  async fetchAllDevices(): Promise<ApiDevice[]> {
    const allDevices: ApiDevice[] = [];
    let skip = 0;
    const take = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.fetchDevices(skip, take);
      allDevices.push(...response.devices);
      
      skip += take;
      hasMore = allDevices.length < response.totalCount;
    }

    return allDevices;
  }

  /**
   * Fetch device types
   */
  async fetchDeviceTypes(skip = 0, take = 100): Promise<ApiDeviceTypesResponse> {
    const url = `${this.deviceApiUrl}/api/DeviceType?skip=${skip}&take=${take}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch device types: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch all device types (handles pagination)
   */
  async fetchAllDeviceTypes(): Promise<ApiDeviceType[]> {
    const allTypes: ApiDeviceType[] = [];
    let skip = 0;
    const take = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.fetchDeviceTypes(skip, take);
      allTypes.push(...response.deviceTypes);
      
      skip += take;
      hasMore = allTypes.length < response.totalCount;
    }

    return allTypes;
  }

  /**
   * Fetch schemas
   */
  async fetchSchemas(skip = 0, take = 100): Promise<ApiSchemasResponse> {
    const url = `${this.schemaApiUrl}/api/schemas?skip=${skip}&take=${take}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schemas: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch schema by ID
   */
  async fetchSchemaById(schemaId: string): Promise<ApiSchema> {
    const url = `${this.schemaApiUrl}/api/schemas/${schemaId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schema ${schemaId}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new SensormineApiClient();
