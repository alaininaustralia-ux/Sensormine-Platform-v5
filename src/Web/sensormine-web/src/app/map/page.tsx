/**
 * Map Page
 * Displays devices with GPS coordinates on an interactive map
 */

'use client';

import { DeviceMap } from '@/components/map/DeviceMap';

export default function MapPage() {
  return (
    <div className="container py-4 h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Device Map</h1>
        <p className="text-sm text-muted-foreground">
          View all devices with GPS coordinates on an interactive map
        </p>
      </div>

      <DeviceMap />
    </div>
  );
}
