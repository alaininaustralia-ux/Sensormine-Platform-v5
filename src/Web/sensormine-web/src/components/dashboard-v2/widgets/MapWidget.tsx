'use client';

// Map Widget - Interactive device map with GPS coordinates

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Widget, DashboardMode, SubDashboardConfig } from '@/lib/types/dashboard-v2';
import { MapPin, Loader2, AlertCircle, RefreshCw, Maximize2 } from 'lucide-react';
import { getDevices, getDevicesByType, getDeviceById, type Device } from '@/lib/api/devices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubDashboardViewer } from '../SubDashboardViewer';
import type { LatLngExpression, DivIcon } from 'leaflet';

// Dynamic import for Leaflet (client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Leaflet module reference
let L: any = null;

interface MapWidgetProps {
  widget: Widget;
  mode: DashboardMode;
}

interface DeviceWithLocation extends Device {
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export function MapWidget({ widget }: MapWidgetProps) {
  const [devices, setDevices] = useState<DeviceWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapContainerRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sub-dashboard state
  const [selectedSubDashboard, setSelectedSubDashboard] = useState<SubDashboardConfig | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showSubDashboard, setShowSubDashboard] = useState(false);

  const subDashboards = widget.behavior?.drillDown?.subDashboards || [];
  const hasSubDashboards = subDashboards.length > 0;

  // Ensure we're on the client side and load Leaflet
  useEffect(() => {
    setIsClient(true);
    
    // Load Leaflet dynamically
    if (typeof window !== 'undefined' && !L) {
      import('leaflet').then((leaflet) => {
        L = leaflet.default || leaflet;
        setLeafletReady(true);
      }).catch((err) => {
        console.error('Failed to load Leaflet:', err);
      });
    } else if (L) {
      setLeafletReady(true);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      setError(null);
      
      // Get device type from widget configuration
      const deviceTypeId = widget.dataSource.deviceTypeId;
      const specificDeviceIds = widget.dataSource.deviceIds;

      // Fetch devices
      let allDevices: Device[] = [];
      
      if (specificDeviceIds && specificDeviceIds.length > 0) {
        // Fetch specific devices
        const devicePromises = specificDeviceIds.map(id => 
          getDeviceById(id).then(r => r.data).catch(() => null)
        );
        const results = await Promise.all(devicePromises);
        allDevices = results.filter((d): d is Device => d !== null);
      } else if (deviceTypeId) {
        // Fetch all devices of a specific type
        const response = await getDevicesByType(deviceTypeId);
        allDevices = response.data || [];
      } else {
        // Fetch all devices
        const response = await getDevices({ page: 1, pageSize: 1000 });
        // getDevices returns DeviceListResponse which has a 'devices' property, not 'data'
        allDevices = response.data?.devices || [];
      }

      // Filter devices that have GPS coordinates
      const devicesWithLocation = (allDevices || []).filter(
        (device): device is DeviceWithLocation =>
          device.location != null &&
          typeof device.location.latitude === 'number' &&
          typeof device.location.longitude === 'number' &&
          !isNaN(device.location.latitude) &&
          !isNaN(device.location.longitude)
      );

      setDevices(devicesWithLocation);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      setLoading(false);
    }
  }, [widget.dataSource.deviceTypeId, widget.dataSource.deviceIds]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchDevices();

    // Setup auto-refresh if enabled
    if (widget.behavior?.autoRefresh && widget.behavior?.refreshInterval) {
      const intervalMs = parseRefreshInterval(widget.behavior.refreshInterval);
      if (intervalMs > 0) {
        refreshIntervalRef.current = setInterval(fetchDevices, intervalMs);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchDevices, widget.behavior?.autoRefresh, widget.behavior?.refreshInterval]);

  // Calculate map center and bounds
  const { center, zoom } = useMemo(() => {
    if (devices.length === 0) {
      // Default to world view
      return { center: [0, 0] as LatLngExpression, zoom: 2 };
    }

    if (devices.length === 1) {
      // Single device - zoom in
      const device = devices[0];
      return {
        center: [device.location.latitude, device.location.longitude] as LatLngExpression,
        zoom: 13,
      };
    }

    // Multiple devices - calculate center
    const latSum = devices.reduce((sum, d) => sum + d.location.latitude, 0);
    const lngSum = devices.reduce((sum, d) => sum + d.location.longitude, 0);
    
    return {
      center: [latSum / devices.length, lngSum / devices.length] as LatLngExpression,
      zoom: 10,
    };
  }, [devices]);

  const getDeviceStatusColor = (device: Device): string => {
    if (!device.lastSeenAt) return '#6B7280'; // gray - unknown
    
    const lastSeen = new Date(device.lastSeenAt);
    const minutesAgo = (Date.now() - lastSeen.getTime()) / 1000 / 60;
    
    if (minutesAgo < 5) return '#10B981'; // green - online
    if (minutesAgo < 60) return '#F59E0B'; // yellow - warning
    

  // Force map re-render when devices change
  useEffect(() => {
    if (devices.length > 0) {
      setMapKey(prev => prev + 1);
    }
  }, [devices.length]);return '#EF4444'; // red - offline
  };

  const getDeviceStatusLabel = (device: Device): string => {
    if (!device.lastSeenAt) return 'Unknown';
    
    const lastSeen = new Date(device.lastSeenAt);
    const minutesAgo = (Date.now() - lastSeen.getTime()) / 1000 / 60;
    
    if (minutesAgo < 5) return 'Online';
    if (minutesAgo < 60) return 'Warning';
    return 'Offline';
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDevices();
  };

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <p className="text-sm font-medium text-destructive">Error Loading Map</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">No Devices with GPS Coordinates</p>
        <p className="text-xs text-muted-foreground">
          Add location data to devices to see them on the map
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: '300px' }}>
      {/* Map Controls */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <Button
          onClick={handleRefresh}
          variant="secondary"
          size="sm"
          disabled={loading}
          className="shadow-md"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Device Count Badge */}
      <div className="absolute top-2 left-2 z-[1000]">
        <Badge variant="secondary" className="shadow-md">
          <MapPin className="h-3 w-3 mr-1" />
          {devices.length} {devices.length === 1 ? 'Device' : 'Devices'}
        </Badge>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        className="rounded-lg"
        scrollWheelZoom={true}
        ref={(mapInstance) => {
          if (mapInstance && mapContainerRef.current !== mapInstance) {
            mapContainerRef.current = mapInstance;
            // Invalidate size after map is mounted
            setTimeout(() => {
              try {
                mapInstance.invalidateSize();
              } catch (error) {
                console.warn('Failed to invalidate map size:', error);
              }
            }, 150);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={2}
          keepBuffer={2}
          updateWhenIdle={false}
          updateWhenZooming={false}
          crossOrigin={true}
        />
        {leafletReady && devices.map((device) => {
          // Create custom icon using divIcon
          const iconHtml = `
            <div style="
              background-color: ${getDeviceStatusColor(device)};
              width: 24px;
              height: 24px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `;

          // Create icon only if Leaflet is available
          let customIcon: DivIcon | undefined;
          if (L && L.divIcon) {
            customIcon = L.divIcon({
              html: iconHtml,
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              popupAnchor: [0, -24],
            });
          }

          return (
            <Marker
              key={device.id}
              position={[device.location.latitude, device.location.longitude]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">{device.name}</h3>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={getDeviceStatusLabel(device) === 'Online' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getDeviceStatusLabel(device)}
                      </Badge>
                    </div>
                    
                    {device.serialNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial:</span>
                        <span className="font-mono">{device.serialNumber}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-mono text-xs">
                        {device.location.latitude.toFixed(6)}, {device.location.longitude.toFixed(6)}
                      </span>
                    </div>
                    
                    {device.location.altitude !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Altitude:</span>
                        <span>{device.location.altitude}m</span>
                      </div>
                    )}
                    
                    {device.lastSeenAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen:</span>
                        <span>{new Date(device.lastSeenAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Sub-Dashboard Links */}
                  {hasSubDashboards && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        View Details:
                      </div>
                      {subDashboards
                        .filter(sd => sd.parameterType === 'deviceId')
                        .map(sd => (
                          <button
                            key={sd.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubDashboard(sd);
                              setSelectedDeviceId(device.id);
                              setShowSubDashboard(true);
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group"
                          >
                            <span>{sd.name}</span>
                            <svg
                              className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Sub-Dashboard Viewer - Inline */}
      {showSubDashboard && selectedSubDashboard && selectedDeviceId && (
        <div className="absolute inset-0 z-[1000] bg-background">
          <SubDashboardViewer
            subDashboard={selectedSubDashboard}
            parameterId={selectedDeviceId}
            parameterType={selectedSubDashboard.parameterType}
            onClose={() => {
              setShowSubDashboard(false);
              setSelectedSubDashboard(null);
              setSelectedDeviceId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to parse refresh interval
function parseRefreshInterval(interval: string): number {
  const intervals: Record<string, number> = {
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
    '10m': 600000,
    '30m': 1800000,
    'never': 0,
  };
  return intervals[interval] || 0;
}
