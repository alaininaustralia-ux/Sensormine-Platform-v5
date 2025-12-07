/**
 * Device List Widget
 * 
 * Dashboard widget that displays a list of devices with drill-down navigation
 * to device detail subpages.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { DeviceList, type DeviceListItem } from '../device-list';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { serviceUrls } from '@/lib/api/config';

interface DeviceListWidgetConfig {
  /** Optional device type filter */
  deviceTypeId?: string;
  /** ID of the subpage to navigate to on device click */
  detailSubPageId?: string;
  /** Whether to show device status filter */
  showStatusFilter?: boolean;
  /** Whether to show device type filter */
  showTypeFilter?: boolean;
  /** Maximum number of devices to display */
  maxDevices?: number;
}

interface DeviceListWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Widget configuration */
  config: DeviceListWidgetConfig;
  /** Current dashboard ID */
  dashboardId: string;
}

export function DeviceListWidget({
  config,
  dashboardId,
  ...baseProps
}: DeviceListWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Build query parameters
        const params = new URLSearchParams();
        if (config.deviceTypeId) {
          params.append('deviceTypeId', config.deviceTypeId);
        }
        if (config.maxDevices) {
          params.append('limit', config.maxDevices.toString());
        }

        const url = `${serviceUrls.device}/api/Device?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch devices: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform API response to DeviceListItem format
        interface DeviceApiResponse {
          id: string;
          deviceId: string;
          name: string;
          deviceTypeName?: string;
          deviceType?: string;
          deviceTypeId: string;
          status: string;
          location?: string;
          lastSeen?: string;
        }
        
        // Handle paginated response from Device.API
        const deviceArray = Array.isArray(data) ? data : (data.devices || data.data || data.items || []);
        
        const deviceList: DeviceListItem[] = (deviceArray as DeviceApiResponse[]).map((device) => ({
          id: device.id,
          deviceId: device.deviceId,
          name: device.name,
          deviceType: device.deviceTypeName || device.deviceType || 'Unknown',
          deviceTypeId: device.deviceTypeId,
          status: device.status === 'Active' ? 'online' : 'offline',
          location: device.location,
          lastSeen: device.lastSeen ? new Date(device.lastSeen) : undefined,
          hasDetailDashboard: !!config.detailSubPageId,
        }));

        setDevices(deviceList);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, [config.deviceTypeId, config.maxDevices, config.detailSubPageId]);

  // Handle device click - navigate to detail subpage
  const handleDeviceClick = (device: DeviceListItem) => {
    if (config.detailSubPageId) {
      // Navigate to subpage with device context
      router.push(
        `/dashboard/${dashboardId}/subpages/${config.detailSubPageId}?deviceId=${device.id}&deviceName=${encodeURIComponent(device.name)}`
      );
    } else {
      // Fallback to device details page
      router.push(`/devices/${device.id}`);
    }
  };

  // Handle view dashboard action
  const handleViewDashboard = (deviceId: string) => {
    if (config.detailSubPageId) {
      const device = devices.find(d => d.id === deviceId);
      router.push(
        `/dashboard/${dashboardId}/subpages/${config.detailSubPageId}?deviceId=${deviceId}&deviceName=${device ? encodeURIComponent(device.name) : 'Device'}`
      );
    }
  };

  return (
    <BaseWidget {...baseProps} isLoading={isLoading} error={error}>
      {devices.length === 0 && !isLoading && !error ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No devices found
        </div>
      ) : (
        <DeviceList
          devices={devices}
          onDeviceClick={handleDeviceClick}
          onViewDashboard={config.detailSubPageId ? handleViewDashboard : undefined}
          className="h-full"
        />
      )}
    </BaseWidget>
  );
}
