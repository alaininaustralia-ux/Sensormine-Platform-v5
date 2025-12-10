/**
 * Device List Component - Compact expandable list with live telemetry panel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BatteryIcon,
  PlusIcon,
  SearchIcon,
  SignalIcon,
  WifiIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  ZapIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon,
  Square as StopIcon,
  PanelRightIcon,
} from 'lucide-react';
import { getDevices, type ApiDevice } from '@/lib/api';
import { getActiveSimulations, getSimulationLogs, stopSimulation, SimulationLogEntry } from '@/lib/api/simulation';
import { formatDistanceToNow } from 'date-fns';
import { DataGenerator } from './DataGenerator';

// Extended device type for UI display
interface DeviceDisplay extends Partial<ApiDevice> {
  id: string;
  deviceId: string;
  name: string;
  type?: string; // Device type name for display
  status: string;
  lastSeen?: string; // Formatted "X minutes ago" - overrides lastSeenAt for display
  battery?: number | null;
  signal?: number | null;
  sensors?: number;
  schemaName?: string;
}

// Mock data for demonstration (fallback)
const mockDevices: DeviceDisplay[] = [
  {
    id: '1',
    deviceId: 'NEXUS-001',
    name: 'Water Tank Sensor',
    type: 'NEXUS_PROBE',
    status: 'Active',
    lastSeen: '2 minutes ago',
    battery: 85,
    signal: 92,
    location: { latitude: 40.7128, longitude: -74.0060 },
    sensors: 3,
    schemaName: 'Water Tank Telemetry',
  },
  {
    id: '2',
    deviceId: 'NEXUS-002',
    name: 'HVAC Monitor',
    type: 'NEXUS_PROBE',
    status: 'Active',
    lastSeen: '5 minutes ago',
    battery: 72,
    signal: 88,
    location: { latitude: 40.7150, longitude: -74.0070 },
    sensors: 4,
    schemaName: 'HVAC Sensor Data',
  },
  {
    id: '3',
    deviceId: 'MODBUS-001',
    name: 'PLC Gateway',
    type: 'MODBUS_TCP',
    status: 'Maintenance',
    lastSeen: '1 hour ago',
    battery: null,
    signal: 95,
    location: { latitude: 40.7200, longitude: -74.0100 },
    sensors: 12,
    schemaName: 'Industrial PLC Schema',
  },
  {
    id: '4',
    deviceId: 'OPCUA-001',
    name: 'SCADA Interface',
    type: 'OPC_UA',
    status: 'Active',
    lastSeen: '30 seconds ago',
    battery: null,
    signal: 100,
    location: { latitude: 40.7180, longitude: -74.0090 },
    sensors: 24,
    schemaName: 'SCADA Telemetry',
  },
  {
    id: '5',
    deviceId: 'NEXUS-003',
    name: 'Environmental Monitor',
    type: 'NEXUS_PROBE',
    status: 'Inactive',
    lastSeen: '3 days ago',
    battery: 12,
    signal: 0,
    location: { latitude: 40.7160, longitude: -74.0050 },
    sensors: 2,
    schemaName: undefined,
  },
];

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  Active: 'success',
  Maintenance: 'warning',
  Inactive: 'destructive',
};

export function DeviceList() {
  const [devices, setDevices] = useState<DeviceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDeviceForSimulator, setSelectedDeviceForSimulator] = useState<DeviceDisplay | null>(null);
  const [simulatingDevices, setSimulatingDevices] = useState<Set<string>>(new Set());
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([]);
  const [showTelemetryPanel, setShowTelemetryPanel] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching devices from API...');
      const response = await getDevices();
      console.log('Devices API response:', response);
      
      // Map API devices to display format
      const displayDevices: DeviceDisplay[] = response.data.devices.map(device => ({
        ...device,
        // Extract metadata if available
        battery: device.metadata?.battery ? Number(device.metadata.battery) : null,
        signal: device.metadata?.signal ? Number(device.metadata.signal) : null,
        sensors: device.customFieldValues?.sensorCount ? Number(device.customFieldValues.sensorCount) : 0,
      }));
      
      console.log('Mapped devices:', displayDevices);
      setDevices(displayDevices);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      
      // Check if it's a 404 (no devices found) - treat as empty array
      if (err instanceof Error && err.message === 'Not Found') {
        console.log('Got 404, treating as empty device list');
        setDevices([]);
        setError(null); // Clear error - empty state is valid
      } else {
        const errorMsg = `Failed to load devices: ${err instanceof Error ? err.message : 'Unknown error'}. Using mock data.`;
        console.warn(errorMsg);
        setError(errorMsg);
        // Fallback to mock data on other errors
        setDevices(mockDevices);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    checkActiveSimulations();
  }, []);

  const checkActiveSimulations = async () => {
    try {
      const response = await getActiveSimulations();
      const activeDeviceIds = new Set(
        response.data
          .map(sim => {
            // Find device by deviceId string
            const device = devices.find(d => d.deviceId === sim.deviceId);
            return device?.id;
          })
          .filter(Boolean) as string[]
      );
      
      if (activeDeviceIds.size > 0) {
        setSimulatingDevices(activeDeviceIds);
        setShowTelemetryPanel(true);
      }
    } catch (error) {
      console.error('Failed to check active simulations:', error);
    }
  };

  // Poll for simulation logs when telemetry panel is open
  useEffect(() => {
    if (!showTelemetryPanel || simulatingDevices.size === 0) {
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await getSimulationLogs(undefined, 50);
        setSimulationLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch simulation logs:', error);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 2 seconds
    const interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, [showTelemetryPanel, simulatingDevices.size]);

  // Refresh active simulations periodically
  useEffect(() => {
    if (simulatingDevices.size === 0) return;

    const interval = setInterval(() => {
      checkActiveSimulations();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [simulatingDevices.size, devices]);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || device.deviceTypeName?.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique device types and statuses for filters
  const deviceTypes = Array.from(new Set(devices.map(d => d.deviceTypeName).filter(Boolean))) as string[];
  const deviceStatuses = Array.from(new Set(devices.map(d => d.status)));

  const toggleExpanded = (deviceId: string) => {
    setExpandedDevices(prev => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const handleSimulationStart = (deviceId: string) => {
    setSimulatingDevices(prev => new Set(prev).add(deviceId));
    if (!showTelemetryPanel) {
      setShowTelemetryPanel(true);
    }
  };

  const handleSimulationStop = (deviceId: string) => {
    setSimulatingDevices(prev => {
      const next = new Set(prev);
      next.delete(deviceId);
      return next;
    });
    
    // Close telemetry panel if no devices simulating
    if (simulatingDevices.size === 1 && simulatingDevices.has(deviceId)) {
      setShowTelemetryPanel(false);
      setSimulationLogs([]);
    }
  };

  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {deviceStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDevices}
              disabled={loading}
              title="Refresh devices"
            >
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {simulatingDevices.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTelemetryPanel(!showTelemetryPanel)}
              >
                <PanelRightIcon className="h-4 w-4 mr-2" />
                {showTelemetryPanel ? 'Hide' : 'Show'} Telemetry
                <Badge variant="secondary" className="ml-2">
                  {simulatingDevices.size}
                </Badge>
              </Button>
            )}
            <Link href="/devices/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCwIcon className="h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Loading devices...</h3>
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      {!loading && (
        <div className="flex gap-4">
          {/* Left: Device List */}
          <div className={`flex-1 space-y-2 transition-all ${showTelemetryPanel ? 'lg:mr-[400px]' : ''}`}>
            {filteredDevices.map((device) => {
              const isExpanded = expandedDevices.has(device.id);
              const isSimulating = simulatingDevices.has(device.id);
              
              return (
                <Card key={device.id} className="transition-shadow hover:shadow-sm">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(device.id)}>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Expand/Collapse Icon */}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        {/* Device Name & Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{device.name}</h3>
                            <Badge variant={statusColors[device.status] || 'secondary'} className="shrink-0">
                              {device.status}
                            </Badge>
                            {isSimulating && (
                              <Badge variant="default" className="shrink-0 animate-pulse">
                                <ZapIcon className="h-3 w-3 mr-1" />
                                Simulating
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{device.deviceId}</p>
                        </div>

                        {/* Quick Info */}
                        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="truncate max-w-[150px]">
                            {device.deviceTypeName || 'Unknown Type'}
                          </span>
                          <span className="truncate max-w-[150px]">
                            {device.schemaName || <span className="italic">No schema</span>}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/devices/${device.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {isSimulating ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await stopSimulation(device.deviceId);
                                  handleSimulationStop(device.id);
                                } catch (error) {
                                  console.error('Failed to stop simulation:', error);
                                }
                              }}
                            >
                              <StopIcon className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setSelectedDeviceForSimulator(device)}
                            >
                              <ZapIcon className="h-4 w-4 mr-1" />
                              Simulate
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <CollapsibleContent className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {device.location && (
                            <div>
                              <span className="text-muted-foreground">Location</span>
                              <p className="font-mono text-xs mt-1">
                                {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                              </p>
                            </div>
                          )}
                          {device.serialNumber && (
                            <div>
                              <span className="text-muted-foreground">Serial Number</span>
                              <p className="font-mono text-xs mt-1">{device.serialNumber}</p>
                            </div>
                          )}
                          {(device.battery !== null && device.battery !== undefined) && (
                            <div>
                              <span className="text-muted-foreground">Battery</span>
                              <div className="flex items-center gap-1 mt-1">
                                <BatteryIcon className="h-4 w-4" />
                                <span>{device.battery}%</span>
                              </div>
                            </div>
                          )}
                          {(device.signal !== null && device.signal !== undefined) && (
                            <div>
                              <span className="text-muted-foreground">Signal</span>
                              <div className="flex items-center gap-1 mt-1">
                                <SignalIcon className="h-4 w-4" />
                                <span>{device.signal}%</span>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Last Seen</span>
                            <p className="text-xs mt-1">
                              {device.lastSeen || (device.lastSeenAt ? formatLastSeen(device.lastSeenAt) : 'Never')}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created</span>
                            <p className="text-xs mt-1">
                              {device.createdAt ? formatLastSeen(device.createdAt) : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {/* Right: Telemetry Panel */}
          {showTelemetryPanel && (
            <div className="fixed right-0 top-16 bottom-0 w-[400px] bg-background border-l shadow-lg overflow-hidden flex flex-col z-40">
              <div className="p-4 border-b flex items-center justify-between bg-muted/50">
                <div>
                  <h3 className="font-semibold">Live Telemetry</h3>
                  <p className="text-xs text-muted-foreground">
                    {simulatingDevices.size} device{simulatingDevices.size !== 1 ? 's' : ''} simulating
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTelemetryPanel(false);
                    setSimulationLogs([]);
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {simulationLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Waiting for telemetry data...
                  </div>
                ) : (
                  [...simulationLogs].reverse().map((log, idx) => {
                    const timestamp = new Date(log.timestamp);
                    let payload;
                    try {
                      payload = JSON.parse(log.payload);
                    } catch {
                      payload = log.payload;
                    }
                    
                    return (
                      <div key={idx} className="bg-muted rounded-lg p-3 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                          <span>{timestamp.toLocaleTimeString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-semibold">{log.deviceId}</span>
                            <span className="truncate max-w-[150px]">{log.topic.split('/').pop()}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          log.status === 'Success' ? 'bg-green-500/10 text-green-700' : 
                          log.status === 'Error' ? 'bg-red-500/10 text-red-700' : 
                          'bg-blue-500/10 text-blue-700'
                        }`}>
                          {log.status}
                        </div>
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all mt-2">
                          {typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload}
                        </pre>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

          {!loading && filteredDevices.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <WifiIcon className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No devices found</h3>
                <p className="text-sm text-muted-foreground">
                  {devices.length === 0 
                    ? 'Get started by registering your first device'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {devices.length === 0 && (
                  <Link href="/devices/new" className="mt-4">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Register Device
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

      {/* Device Simulator Modal */}
      <Dialog open={selectedDeviceForSimulator !== null} onOpenChange={(open) => !open && setSelectedDeviceForSimulator(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Simulate Device: {selectedDeviceForSimulator?.name}</DialogTitle>
            <DialogDescription>
              Start or stop background simulation for device {selectedDeviceForSimulator?.deviceId}
            </DialogDescription>
          </DialogHeader>
          {selectedDeviceForSimulator && (
            <DataGenerator
              device={{
                id: selectedDeviceForSimulator.id,
                tenantId: selectedDeviceForSimulator.tenantId || 'test-tenant',
                deviceId: selectedDeviceForSimulator.deviceId,
                name: selectedDeviceForSimulator.name,
                deviceTypeId: selectedDeviceForSimulator.deviceTypeId || '',
                deviceTypeName: selectedDeviceForSimulator.type,
                serialNumber: selectedDeviceForSimulator.serialNumber,
                customFieldValues: selectedDeviceForSimulator.customFieldValues || {},
                location: selectedDeviceForSimulator.location,
                metadata: selectedDeviceForSimulator.metadata || {},
                status: selectedDeviceForSimulator.status,
                lastSeenAt: selectedDeviceForSimulator.lastSeenAt,
                createdAt: selectedDeviceForSimulator.createdAt || new Date().toISOString(),
                updatedAt: selectedDeviceForSimulator.updatedAt || new Date().toISOString(),
                schemaId: selectedDeviceForSimulator.schemaId,
                schemaName: selectedDeviceForSimulator.schemaName,
              }}
              onClose={() => setSelectedDeviceForSimulator(null)}
              onSimulationStart={handleSimulationStart}
              onSimulationStop={handleSimulationStop}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
