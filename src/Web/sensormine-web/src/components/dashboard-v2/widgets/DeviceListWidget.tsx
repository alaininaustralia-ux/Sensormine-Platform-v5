'use client';

// Device List Widget

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getDevicesForWidget, type DeviceListItem } from '@/lib/api/widgetData';
import { formatDistanceToNow } from 'date-fns';

interface DeviceListWidgetProps {
  widget: Widget;
  mode: DashboardMode;
}

export function DeviceListWidget({ widget }: DeviceListWidgetProps) {
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Extract configuration
      const deviceTypeId = widget.dataSource.deviceTypeId;
      const assetId = widget.behavior?.links?.[0]?.targetWidgetId; // Asset selection if linked
      const fields = widget.dataSource.fieldMappings
        .filter(f => f.visible)
        .map(f => f.fieldName);
      
      if (!deviceTypeId && !assetId) {
        setLoading(false);
        return;
      }

      const pageSize = widget.config.pagination?.pageSize || 10;

      const response = await getDevicesForWidget({
        deviceTypeId,
        assetId,
        fields,
        page,
        pageSize,
      });

      setDevices(response.devices);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [widget, page]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchData();

    // Setup auto-refresh if enabled
    if (widget.behavior?.autoRefresh && widget.behavior?.refreshInterval) {
      const intervalMs = parseRefreshInterval(widget.behavior.refreshInterval);
      if (intervalMs > 0) {
        refreshIntervalRef.current = setInterval(fetchData, intervalMs);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData, widget.behavior?.autoRefresh, widget.behavior?.refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading && devices.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Error Loading Devices</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No devices found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              {widget.dataSource.fieldMappings
                .filter(f => f.visible)
                .map(field => (
                  <TableHead key={field.id}>{field.friendlyName}</TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.deviceId} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{device.serialNumber || '-'}</TableCell>
                <TableCell>
                  <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {device.lastSeenAt 
                    ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                {widget.dataSource.fieldMappings
                  .filter(f => f.visible)
                  .map(field => {
                    const value = device.customFields?.[field.fieldName];
                    const displayValue = value != null ? String(value) : '-';
                    return (
                      <TableCell key={field.id} className="text-sm">
                        {displayValue}
                        {field.unit && value != null && ` ${field.unit}`}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="border-t p-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to parse refresh interval string to milliseconds
function parseRefreshInterval(interval: string): number {
  const map: Record<string, number> = {
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
    '10m': 600000,
    '30m': 1800000,
    'never': 0,
  };
  return map[interval] || 0;
}
