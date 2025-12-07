/**
 * Device List with Drill-Down
 * 
 * Displays a list of devices with the ability to drill down to device details
 * Supports filtering, sorting, and navigation to device-specific dashboards
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Search, 
  Filter,
  ArrowUpDown,
  LayoutDashboard,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeviceListItem {
  id: string;
  deviceId: string;
  name: string;
  deviceType: string;
  deviceTypeId: string;
  status: 'online' | 'offline' | 'error';
  location?: string;
  lastSeen?: Date;
  hasDetailDashboard?: boolean;
}

interface DeviceListProps {
  devices: DeviceListItem[];
  onDeviceClick?: (device: DeviceListItem) => void;
  onViewDashboard?: (deviceId: string) => void;
  onCreateDashboard?: (deviceId: string) => void;
  className?: string;
}

export function DeviceList({
  devices,
  onDeviceClick,
  onViewDashboard,
  onCreateDashboard,
  className,
}: DeviceListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'lastSeen'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique device types for filter
  const deviceTypes = Array.from(new Set(devices.map(d => d.deviceType)));

  // Filter devices
  const filteredDevices = devices.filter(device => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !device.name.toLowerCase().includes(query) &&
        !device.deviceId.toLowerCase().includes(query) &&
        !device.location?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && device.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && device.deviceType !== typeFilter) {
      return false;
    }

    return true;
  });

  // Sort devices
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.deviceType.localeCompare(b.deviceType);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'lastSeen':
        const aTime = a.lastSeen?.getTime() || 0;
        const bTime = b.lastSeen?.getTime() || 0;
        comparison = aTime - bTime;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDeviceClick = (device: DeviceListItem) => {
    if (onDeviceClick) {
      onDeviceClick(device);
    } else {
      // Default: navigate to device details
      router.push(`/devices/${device.id}`);
    }
  };

  const handleViewDashboard = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDashboard) {
      onViewDashboard(deviceId);
    }
  };

  const handleCreateDashboard = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateDashboard) {
      onCreateDashboard(deviceId);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Device Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {deviceTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {sortedDevices.length} {sortedDevices.length === 1 ? 'device' : 'devices'}
        {filteredDevices.length !== devices.length && ` (filtered from ${devices.length})`}
      </div>

      {/* Device Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Name
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Type
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Status
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('lastSeen')}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Last Seen
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              sortedDevices.map(device => (
                <TableRow
                  key={device.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleDeviceClick(device)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{device.name}</div>
                      <div className="text-xs text-muted-foreground">{device.deviceId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{device.deviceType}</TableCell>
                  <TableCell>
                    <StatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>{device.location || '-'}</TableCell>
                  <TableCell>
                    {device.lastSeen ? (
                      <span className="text-sm">
                        {formatRelativeTime(device.lastSeen)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {device.hasDetailDashboard ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleViewDashboard(device.id, e)}
                          title="View Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                        </Button>
                      ) : onCreateDashboard ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleCreateDashboard(device.id, e)}
                          title="Create Dashboard"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/devices/${device.id}`);
                        }}
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DeviceListItem['status'] }) {
  const config = {
    online: {
      label: 'Online',
      variant: 'default' as const,
      icon: Activity,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    offline: {
      label: 'Offline',
      variant: 'secondary' as const,
      icon: Activity,
      className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    },
    error: {
      label: 'Error',
      variant: 'destructive' as const,
      icon: AlertCircle,
      className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
