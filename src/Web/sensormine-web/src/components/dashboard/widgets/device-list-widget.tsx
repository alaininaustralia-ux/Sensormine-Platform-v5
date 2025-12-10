/**
 * Device List Widget
 * 
 * Dashboard widget that displays a list of devices with drill-down navigation
 * to device detail subpages. Supports asset-based filtering with telemetry display.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { DeviceList, type DeviceListItem } from '../device-list';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { serviceUrls } from '@/lib/api/config';
import { getDevicesWithTelemetryByAsset, type DeviceWithLatestTelemetry } from '@/lib/api/assets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface DeviceListWidgetConfig {
  /** Optional device type filter */
  deviceTypeId?: string;
  /** Optional asset filter for asset-based device listing */
  assetId?: string;
  /** Include devices from descendant assets */
  includeDescendants?: boolean;
  /** Fields to display as telemetry columns */
  telemetryFields?: string[];
  /** Show latest telemetry values */
  showTelemetry?: boolean;
  /** ID of the subpage to navigate to on device click */
  detailSubPageId?: string;
  /** Whether to show device status filter */
  showStatusFilter?: boolean;
  /** Whether to show device type filter */
  showTypeFilter?: boolean;
  /** Maximum number of devices to display */
  maxDevices?: number;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
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
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [devicesWithTelemetry, setDevicesWithTelemetry] = useState<DeviceWithLatestTelemetry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Determine if we're using asset-based mode with telemetry
  const useAssetMode = config.assetId && config.showTelemetry;

  // Fetch devices (traditional mode or asset-based with telemetry)
  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      if (useAssetMode && config.assetId) {
        // Asset-based mode with telemetry
        const telemetryData = await getDevicesWithTelemetryByAsset({
          assetId: config.assetId,
          includeDescendants: config.includeDescendants ?? true,
          fields: config.telemetryFields,
          limit: config.maxDevices,
        });
        
        setDevicesWithTelemetry(telemetryData);
      } else {
        // Traditional device list mode
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
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, [useAssetMode, config]);

  // Initial fetch
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Auto-refresh if configured
  useEffect(() => {
    if (!config.refreshInterval || config.refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchDevices();
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [config.refreshInterval, fetchDevices]);

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

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDevices();
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (useAssetMode && devicesWithTelemetry.length > 0) {
      // Export telemetry data
      const headers = ['Device ID', 'Device Name', 'Device Type', 'Last Seen', 
        ...(config.telemetryFields || devicesWithTelemetry[0]?.latestTelemetry.map(t => t.field) || [])];
      
      const rows = devicesWithTelemetry.map(device => [
        device.deviceId,
        device.deviceName,
        device.deviceType,
        device.lastSeen || '',
        ...device.latestTelemetry.map(t => `${t.value}${t.unit ? ' ' + t.unit : ''}`),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devices-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <BaseWidget {...baseProps} isLoading={isLoading} error={error}>
      {useAssetMode ? (
        // Asset-based mode with telemetry table
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">
              {devicesWithTelemetry.length} device{devicesWithTelemetry.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {devicesWithTelemetry.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {devicesWithTelemetry.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              No devices found
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Seen</TableHead>
                    {devicesWithTelemetry[0]?.latestTelemetry.map((t, idx) => (
                      <TableHead key={idx}>{t.field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesWithTelemetry.map((device) => (
                    <TableRow key={device.deviceId}>
                      <TableCell className="font-medium">{device.deviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{device.deviceType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {device.lastSeen ? formatTimestamp(device.lastSeen) : 'Never'}
                      </TableCell>
                      {device.latestTelemetry.map((t, idx) => (
                        <TableCell key={idx}>
                          {t.value} {t.unit && <span className="text-muted-foreground">{t.unit}</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        // Traditional device list mode
        <>
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
        </>
      )}
    </BaseWidget>
  );
}
