/**
 * Devices Page
 */

'use client';

import { DeviceList } from '@/components/devices/DeviceList';

export default function DevicesPage() {
  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        <p className="text-sm text-muted-foreground">
          Manage and monitor your connected devices
        </p>
      </div>

      <DeviceList />
    </div>
  );
}
