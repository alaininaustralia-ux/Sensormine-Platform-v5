import {
  WidgetAPI,
  TelemetryQueryRequest,
  TelemetryQueryResponse,
  Device,
  DeviceListResponse,
  TelemetryDataPoint,
  WidgetMessage
} from './types';

/**
 * Create a widget API instance that communicates via postMessage
 */
export function createWidgetAPI(): WidgetAPI {
  const pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  
  // Listen for API responses
  window.addEventListener('message', (event: MessageEvent<WidgetMessage>) => {
    if (event.data.type === 'api:response') {
      const pending = pendingRequests.get(event.data.id);
      if (pending) {
        pending.resolve(event.data.result);
        pendingRequests.delete(event.data.id);
      }
    } else if (event.data.type === 'api:error') {
      const pending = pendingRequests.get(event.data.id);
      if (pending) {
        pending.reject(new Error(event.data.error));
        pendingRequests.delete(event.data.id);
      }
    }
  });
  
  /**
   * Make an API request via postMessage
   */
  function apiRequest<T>(method: string, ...params: any[]): Promise<T> {
    const id = generateRequestId();
    
    return new Promise<T>((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      
      const message: WidgetMessage = {
        type: 'api:request',
        id,
        method,
        params
      };
      
      window.parent.postMessage(message, '*');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error(`API request timeout: ${method}`));
        }
      }, 30000);
    });
  }
  
  return {
    async queryTelemetry(request: TelemetryQueryRequest): Promise<TelemetryQueryResponse> {
      return apiRequest('queryTelemetry', request);
    },
    
    async getDevice(deviceId: string): Promise<Device> {
      return apiRequest('getDevice', deviceId);
    },
    
    async listDevices(filters?: { deviceTypeId?: string }): Promise<DeviceListResponse> {
      return apiRequest('listDevices', filters);
    },
    
    subscribeTelemetry(deviceIds: string[], callback: (data: TelemetryDataPoint) => void): () => void {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'telemetry:data') {
          callback(event.data.data);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Subscribe
      apiRequest('subscribeTelemetry', deviceIds);
      
      // Return unsubscribe function
      return () => {
        window.removeEventListener('message', handleMessage);
        apiRequest('unsubscribeTelemetry', deviceIds);
      };
    }
  };
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
