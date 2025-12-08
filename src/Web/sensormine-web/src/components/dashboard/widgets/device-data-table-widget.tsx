/**
 * Device Data Table Widget
 * 
 * Displays devices of a specific type with configurable fields.
 * Clicking a row navigates to a detail dashboard with device context.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { serviceUrls } from '@/lib/api/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DeviceDataTableConfig {
  /** Device type ID to filter devices */
  deviceTypeId?: string;
  /** Device type name for display */
  deviceTypeName?: string;
  /** Fields to display as columns */
  fields?: Array<{
    fieldPath: string;
    fieldName: string;
    fieldType: string;
    width?: string;
  }>;
  /** Detail dashboard ID to navigate to on row click */
  detailDashboardId?: string;
  /** Maximum rows to display */
  maxRows?: number;
  /** Enable row click navigation */
  enableNavigation?: boolean;
  // Display options
  enablePagination?: boolean;
  pageSize?: number;
  compactMode?: boolean;
  stripedRows?: boolean;
  showBorders?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
}

interface DeviceDataTableWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  config: DeviceDataTableConfig;
  dashboardId?: string;
}

interface DeviceItem {
  id: string;
  deviceId: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName: string;
  status: string;
  lastSeen?: string;
  metadata?: Record<string, unknown>;
}

export function DeviceDataTableWidget({
  config,
  dashboardId,
  ...baseProps
}: DeviceDataTableWidgetProps) {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    deviceTypeId,
    fields = [],
    detailDashboardId,
    maxRows = 20,
    enableNavigation = true,
    enablePagination = false,
    pageSize = 10,
    compactMode = false,
    stripedRows = false,
    showBorders = true,
    enableSearch = false,
    enableExport = false,
  } = config;

  useEffect(() => {
    const fetchDevices = async () => {
      if (!deviceTypeId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('deviceTypeId', deviceTypeId);
        if (maxRows) {
          params.append('pageSize', maxRows.toString());
        }

        const url = `${serviceUrls.device}/api/Device?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch devices: ${response.statusText}`);
        }

        const data = await response.json();
        const deviceArray = Array.isArray(data) ? data : (data.devices || data.data || data.items || []);
        
        const deviceList: DeviceItem[] = deviceArray.map((device: any) => ({
          id: device.id || device.deviceId,
          deviceId: device.deviceId,
          name: device.name || device.deviceId,
          deviceTypeId: device.deviceTypeId,
          deviceTypeName: device.deviceTypeName || config.deviceTypeName || 'Unknown',
          status: device.status || 'Unknown',
          lastSeen: device.lastSeen,
          metadata: device.metadata,
        }));

        setDevices(deviceList);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, [deviceTypeId, maxRows, config.deviceTypeName]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (device: DeviceItem) => {
    if (!enableNavigation || !detailDashboardId) return;

    // Navigate to detail dashboard with device context
    router.push(`/dashboard/${detailDashboardId}?deviceId=${device.id}&deviceName=${encodeURIComponent(device.name)}`);
  };

  const handleExport = () => {
    const columns = [
      { key: 'deviceId', label: 'Device ID' },
      { key: 'name', label: 'Name' },
      ...fields.map(field => ({ key: field.fieldPath, label: field.fieldName })),
      { key: 'status', label: 'Status' },
    ];

    const csvHeaders = columns.map(c => c.label).join(',');
    const csvRows = filteredAndSortedDevices.map(device => {
      return columns.map(col => {
        let value = (device as any)[col.key];
        if (value === undefined && device.metadata) {
          value = device.metadata[col.key];
        }
        return value !== undefined && value !== null ? `"${String(value).replace(/"/g, '""')}"` : '';
      }).join(',');
    }).join('\n');

    const csv = `${csvHeaders}\n${csvRows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devices-${config.deviceTypeName || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter, sort, and paginate devices
  const filteredAndSortedDevices = useMemo(() => {
    let result = [...devices];

    // Apply search filter
    if (enableSearch && searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(device => {
        return (
          device.deviceId.toLowerCase().includes(lowerSearch) ||
          device.name.toLowerCase().includes(lowerSearch) ||
          device.status.toLowerCase().includes(lowerSearch) ||
          (device.metadata && Object.values(device.metadata).some(v => 
            String(v).toLowerCase().includes(lowerSearch)
          ))
        );
      });
    }

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [devices, searchTerm, sortKey, sortDirection, enableSearch]);

  // Paginate
  const paginatedDevices = useMemo(() => {
    if (enablePagination) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return filteredAndSortedDevices.slice(start, end);
    }
    return filteredAndSortedDevices.slice(0, maxRows);
  }, [filteredAndSortedDevices, enablePagination, currentPage, pageSize, maxRows]);

  const totalPages = enablePagination ? Math.ceil(filteredAndSortedDevices.length / pageSize) : 1;

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey, sortDirection]);

  // Build columns from configuration
  const columns = [
    { key: 'deviceId', label: 'Device ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    ...fields.map(field => ({
      key: field.fieldPath,
      label: field.fieldName,
      sortable: true,
    })),
    { key: 'status', label: 'Status', sortable: true },
  ];

  if (isLoading) {
    return (
      <BaseWidget {...baseProps}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget {...baseProps}>
        <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
          <p className="text-sm font-medium">Failed to load devices</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </BaseWidget>
    );
  }

  if (!deviceTypeId) {
    return (
      <BaseWidget {...baseProps}>
        <div className="flex items-center justify-center h-full text-muted-foreground p-4">
          <p className="text-sm">Please configure a device type to display</p>
        </div>
      </BaseWidget>
    );
  }

  const paddingClass = compactMode ? 'px-2 py-1' : 'px-3 py-2';
  const borderClass = showBorders ? 'border-r last:border-r-0' : '';

  return (
    <BaseWidget {...baseProps}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        {(enableSearch || enableExport) && (
          <div className="flex items-center gap-2 p-2 border-b">
            {enableSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            )}
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredAndSortedDevices.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b sticky top-0 bg-background z-10">
              <tr>
                {columns.map((column, idx) => {
                  const field = fields.find(f => f.fieldPath === column.key);
                  const width = field?.width;
                  return (
                    <th
                      key={column.key}
                      className={`text-left ${paddingClass} font-medium ${borderClass} ${
                        column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                      }`}
                      style={width ? { width } : undefined}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && (
                          <span className="text-muted-foreground">
                            {sortKey === column.key ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedDevices.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {enableSearch && searchTerm
                      ? 'No devices match your search'
                      : 'No devices found for this device type'}
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device, rowIndex) => (
                  <tr
                    key={device.id}
                    className={`border-b hover:bg-muted/50 ${
                      enableNavigation && detailDashboardId ? 'cursor-pointer' : ''
                    } ${
                      stripedRows && rowIndex % 2 === 1 ? 'bg-muted/20' : ''
                    }`}
                    onClick={() => handleRowClick(device)}
                  >
                    {columns.map((column) => {
                      let cellValue: any = (device as any)[column.key];
                      
                      // Try to get value from metadata if not found in device
                      if (cellValue === undefined && device.metadata) {
                        cellValue = device.metadata[column.key];
                      }

                      return (
                        <td key={`${rowIndex}-${column.key}`} className={`${paddingClass} ${borderClass}`}>
                          {cellValue !== undefined && cellValue !== null
                            ? String(cellValue)
                            : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {enablePagination && totalPages > 1 ? (
          <div className="flex items-center justify-between px-4 py-2 border-t text-sm">
            <div className="text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedDevices.length)} of {filteredAndSortedDevices.length} devices
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : !enablePagination && paginatedDevices.length >= maxRows && filteredAndSortedDevices.length > maxRows ? (
          <div className="text-xs text-muted-foreground text-center py-2 border-t">
            Showing {maxRows} of {filteredAndSortedDevices.length} devices. {enableSearch ? 'Use search to filter results.' : 'Enable pagination or increase max rows to see more.'}
          </div>
        ) : null}
      </div>
    </BaseWidget>
  );
}
