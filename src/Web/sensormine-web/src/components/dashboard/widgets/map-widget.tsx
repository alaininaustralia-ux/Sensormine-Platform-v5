/**
 * Map Widget
 * 
 * GIS map widget with device markers, clustering, and geofencing.
 * Displays devices on an interactive Leaflet map.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { mockDeviceLocations, mockGeofences } from '@/lib/mock/device-locations';
import type { DeviceLocation, DeviceStatus, DeviceType, Geofence, MapWidgetConfig } from '@/lib/types/map';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> }
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

const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

const LayersControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.LayersControl),
  { ssr: false }
);

const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster'),
  { ssr: false }
);

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

/**
 * Create custom colored marker icon based on status
 */
function createCustomIcon(status: DeviceStatus): L.DivIcon {
  const colors = {
    online: '#10b981', // green
    warning: '#f59e0b', // yellow/orange
    offline: '#ef4444', // red
    unknown: '#6b7280', // gray
  };

  const color = colors[status];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * Device popup content component
 */
function DevicePopupContent({ device }: { device: DeviceLocation }) {
  const statusColors = {
    online: 'text-green-600',
    warning: 'text-yellow-600',
    offline: 'text-red-600',
    unknown: 'text-gray-600',
  };

  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-semibold text-base mb-2">{device.name}</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium capitalize">{device.deviceType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={`font-medium capitalize ${statusColors[device.status]}`}>
            {device.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location:</span>
          <span className="font-mono text-xs">
            {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
          </span>
        </div>
        {device.metadata?.serialNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serial:</span>
            <span className="font-mono text-xs">{device.metadata.serialNumber}</span>
          </div>
        )}
        {device.metadata?.site && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Site:</span>
            <span className="text-xs">{device.metadata.site}</span>
          </div>
        )}
        {device.metadata?.currentValue !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">
              {device.metadata.currentValue}
              {device.metadata.unit && ` ${device.metadata.unit}`}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs pt-1 border-t">
          <span className="text-muted-foreground">Last Seen:</span>
          <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Map bounds adjustment hook
 */
function useMapBounds(devices: DeviceLocation[], autoFit: boolean) {
  return useMemo(() => {
    if (!autoFit || devices.length === 0) return null;

    const lats = devices.map(d => d.latitude);
    const lngs = devices.map(d => d.longitude);

    return L.latLngBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]);
  }, [devices, autoFit]);
}

export interface MapWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Map widget configuration */
  config?: MapWidgetConfig;
}

export function MapWidget(baseProps: MapWidgetProps) {
  const { config = {} } = baseProps;
  const [isMounted, setIsMounted] = useState(false);

  // Default configuration
  const {
    center = [39.8283, -98.5795], // Center of USA
    zoom = 4,
    enableClustering = true,
    enableHeatMap = false,
    showGeofences = false,
    deviceTypes = [],
    deviceStatuses = [],
    geofences = mockGeofences,
    autoFitBounds = true,
  } = config;

  // Filter devices based on configuration
  const filteredDevices = useMemo(() => {
    let devices = mockDeviceLocations;

    if (deviceTypes.length > 0) {
      devices = devices.filter(d => deviceTypes.includes(d.deviceType));
    }

    if (deviceStatuses.length > 0) {
      devices = devices.filter(d => deviceStatuses.includes(d.status));
    }

    return devices;
  }, [deviceTypes, deviceStatuses]);

  const bounds = useMapBounds(filteredDevices, autoFitBounds);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <BaseWidget {...baseProps}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget {...baseProps}>
      <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
        <MapContainer
          center={center as [number, number]}
          zoom={zoom}
          className="h-full w-full rounded-lg"
          bounds={bounds || undefined}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LayersControl position="topright">
            {/* Device Markers Layer */}
            <LayersControl.Overlay checked name="Devices">
              <>
                {enableClustering ? (
                  <MarkerClusterGroup>
                    {filteredDevices.map((device) => (
                      <Marker
                        key={device.id}
                        position={[device.latitude, device.longitude]}
                        icon={createCustomIcon(device.status)}
                      >
                        <Popup>
                          <DevicePopupContent device={device} />
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                ) : (
                  <>
                    {filteredDevices.map((device) => (
                      <Marker
                        key={device.id}
                        position={[device.latitude, device.longitude]}
                        icon={createCustomIcon(device.status)}
                      >
                        <Popup>
                          <DevicePopupContent device={device} />
                        </Popup>
                      </Marker>
                    ))}
                  </>
                )}
              </>
            </LayersControl.Overlay>

            {/* Geofences Layer */}
            {showGeofences && (
              <LayersControl.Overlay checked name="Geofences">
                <>
                  {geofences.map((geofence) => (
                    <Circle
                      key={geofence.id}
                      center={geofence.center as [number, number]}
                      radius={geofence.radius}
                      pathOptions={{
                        color: geofence.color || '#3b82f6',
                        fillColor: geofence.color || '#3b82f6',
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">{geofence.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Radius: {(geofence.radius / 1000).toFixed(1)} km
                          </p>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                </>
              </LayersControl.Overlay>
            )}

            {/* Device Type Layers */}
            {(['sensor', 'camera', 'gateway', 'controller', 'actuator'] as DeviceType[]).map(
              (type) => {
                const typeDevices = filteredDevices.filter((d) => d.deviceType === type);
                if (typeDevices.length === 0) return null;

                return (
                  <LayersControl.Overlay key={type} name={`${type}s (${typeDevices.length})`}>
                    <>
                      {typeDevices.map((device) => (
                        <Marker
                          key={`${type}-${device.id}`}
                          position={[device.latitude, device.longitude]}
                          icon={createCustomIcon(device.status)}
                        >
                          <Popup>
                            <DevicePopupContent device={device} />
                          </Popup>
                        </Marker>
                      ))}
                    </>
                  </LayersControl.Overlay>
                );
              }
            )}
          </LayersControl>
        </MapContainer>

        {/* Device count badge */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-1000">
          <p className="text-sm font-medium">
            {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-green-600">
              ● {filteredDevices.filter(d => d.status === 'online').length}
            </span>
            <span className="text-yellow-600">
              ● {filteredDevices.filter(d => d.status === 'warning').length}
            </span>
            <span className="text-red-600">
              ● {filteredDevices.filter(d => d.status === 'offline').length}
            </span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
