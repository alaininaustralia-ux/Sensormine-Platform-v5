/**
 * Map Widget
 * 
 * GIS map widget with device markers, clustering, and geofencing.
 * Displays devices on an interactive Leaflet map.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster'),
  { ssr: false }
);

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet to avoid SSR issues
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  
  // Fix for default marker icons in Next.js
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
function createCustomIcon(status: DeviceStatus): any {
  if (typeof window === 'undefined' || !L) return null;
  
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
 * Device popup content component with drill-down actions
 */
function DevicePopupContent({ 
  device, 
  onViewDetails, 
  onViewDashboard 
}: { 
  device: DeviceLocation;
  onViewDetails?: (deviceId: string) => void;
  onViewDashboard?: (deviceId: string) => void;
}) {
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
      
      {/* Action buttons */}
      {(onViewDetails || onViewDashboard) && (
        <div className="flex gap-2 mt-3 pt-2 border-t">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(device.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              View Details
            </button>
          )}
          {onViewDashboard && (
            <button
              onClick={() => onViewDashboard(device.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
            >
              Dashboard
            </button>
          )}
        </div>
      )}
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
  /** Optional device click handler for drill-down */
  onDeviceClick?: (deviceId: string) => void;
  /** Optional dashboard view handler */
  onViewDashboard?: (deviceId: string) => void;
}

export function MapWidget(baseProps: MapWidgetProps) {
  const { config = {}, onDeviceClick, onViewDashboard } = baseProps;
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

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

  // Drill-down handlers
  const handleViewDetails = (deviceId: string) => {
    if (onDeviceClick) {
      onDeviceClick(deviceId);
    } else {
      router.push(`/devices/${deviceId}`);
    }
  };

  const handleViewDashboard = (deviceId: string) => {
    if (onViewDashboard) {
      onViewDashboard(deviceId);
    } else {
      // Navigate to device detail dashboard if available, or device details page
      router.push(`/devices/${deviceId}/dashboard`);
    }
  };

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

          {/* Device Markers */}
          {enableClustering ? (
            <MarkerClusterGroup>
              {filteredDevices.map((device) => (
                <Marker
                  key={device.id}
                  position={[device.latitude, device.longitude]}
                  icon={createCustomIcon(device.status)}
                >
                  <Popup>
                    <DevicePopupContent 
                      device={device}
                      onViewDetails={handleViewDetails}
                      onViewDashboard={handleViewDashboard}
                    />
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
                    <DevicePopupContent 
                      device={device}
                      onViewDetails={handleViewDetails}
                      onViewDashboard={handleViewDashboard}
                    />
                  </Popup>
                </Marker>
              ))}
            </>
          )}

          {/* Geofences */}
          {showGeofences && geofences.map((geofence) => (
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
