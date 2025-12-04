/**
 * Mock Device Location Data
 * 
 * Generated device locations for testing and development.
 * Devices are distributed across industrial areas.
 */

import type { DeviceLocation, DeviceType, DeviceStatus, Geofence } from '@/lib/types/map';

/**
 * Industrial sites with coordinates (US-based for this example)
 */
const sites = [
  { name: 'Manufacturing Plant A', lat: 40.7128, lng: -74.0060 }, // NYC area
  { name: 'Warehouse District B', lat: 34.0522, lng: -118.2437 }, // LA area
  { name: 'Oil & Gas Facility C', lat: 29.7604, lng: -95.3698 }, // Houston area
  { name: 'Mining Site D', lat: 39.7392, lng: -104.9903 }, // Denver area
  { name: 'Chemical Plant E', lat: 41.8781, lng: -87.6298 }, // Chicago area
];

const deviceTypes: DeviceType[] = ['sensor', 'camera', 'gateway', 'controller', 'actuator'];

/**
 * Generate random device location within site bounds
 */
function generateDeviceLocation(
  siteIndex: number,
  deviceIndex: number
): DeviceLocation {
  const site = sites[siteIndex];
  
  // Add small random offset to create clusters around site
  const latOffset = (Math.random() - 0.5) * 0.1; // ~5-10 km radius
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
  
  // Bias toward 'online' status (70% online, 20% warning, 10% offline/unknown)
  const statusRandom = Math.random();
  let status: DeviceStatus;
  if (statusRandom < 0.7) status = 'online';
  else if (statusRandom < 0.9) status = 'warning';
  else if (statusRandom < 0.95) status = 'offline';
  else status = 'unknown';
  
  // Generate realistic last seen time (within last 24 hours for online/warning)
  const lastSeenMinutesAgo = status === 'online' 
    ? Math.floor(Math.random() * 60) // 0-60 minutes ago
    : status === 'warning'
    ? Math.floor(Math.random() * 240) // 0-4 hours ago
    : Math.floor(Math.random() * 1440); // 0-24 hours ago
  
  const lastSeen = new Date(Date.now() - lastSeenMinutesAgo * 60 * 1000);
  
  return {
    id: `device-${siteIndex}-${deviceIndex}`,
    name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}-${String(deviceIndex).padStart(3, '0')}`,
    deviceType,
    status,
    latitude: site.lat + latOffset,
    longitude: site.lng + lngOffset,
    lastSeen,
    metadata: {
      serialNumber: `SN${String(siteIndex)}${String(deviceIndex).padStart(4, '0')}`,
      firmwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      site: site.name,
      currentValue: Math.floor(Math.random() * 100),
      unit: deviceType === 'sensor' ? ['°C', 'Pa', 'ppm', 'kWh'][Math.floor(Math.random() * 4)] : undefined,
    },
  };
}

/**
 * Generate mock devices (10 devices per site = 50 total)
 */
export const mockDeviceLocations: DeviceLocation[] = sites.flatMap((_, siteIndex) =>
  Array.from({ length: 10 }, (_, deviceIndex) =>
    generateDeviceLocation(siteIndex, deviceIndex)
  )
);

/**
 * Mock geofences around each site
 */
export const mockGeofences: Geofence[] = sites.map((site, index) => ({
  id: `geofence-${index}`,
  name: `${site.name} Perimeter`,
  center: [site.lat, site.lng],
  radius: 5000, // 5 km radius
  color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index],
  deviceTypes: index % 2 === 0 ? ['sensor', 'camera'] : ['gateway', 'controller'],
}));

/**
 * Get devices by status
 */
export function getDevicesByStatus(status: DeviceStatus): DeviceLocation[] {
  return mockDeviceLocations.filter(device => device.status === status);
}

/**
 * Get devices by type
 */
export function getDevicesByType(type: DeviceType): DeviceLocation[] {
  return mockDeviceLocations.filter(device => device.deviceType === type);
}

/**
 * Get devices by site
 */
export function getDevicesBySite(siteName: string): DeviceLocation[] {
  return mockDeviceLocations.filter(device => device.metadata?.site === siteName);
}

/**
 * Get device by ID
 */
export function getDeviceById(id: string): DeviceLocation | undefined {
  return mockDeviceLocations.find(device => device.id === id);
}

/**
 * Calculate map bounds for all devices
 */
export function calculateDeviceBounds(devices: DeviceLocation[] = mockDeviceLocations): {
  northEast: [number, number];
  southWest: [number, number];
} {
  if (devices.length === 0) {
    return {
      northEast: [0, 0],
      southWest: [0, 0],
    };
  }
  
  const lats = devices.map(d => d.latitude);
  const lngs = devices.map(d => d.longitude);
  
  return {
    northEast: [Math.max(...lats), Math.max(...lngs)],
    southWest: [Math.min(...lats), Math.min(...lngs)],
  };
}

/**
 * Get center point for devices
 */
export function getDevicesCenter(devices: DeviceLocation[] = mockDeviceLocations): [number, number] {
  if (devices.length === 0) {
    return [0, 0];
  }
  
  const avgLat = devices.reduce((sum, d) => sum + d.latitude, 0) / devices.length;
  const avgLng = devices.reduce((sum, d) => sum + d.longitude, 0) / devices.length;
  
  return [avgLat, avgLng];
}
