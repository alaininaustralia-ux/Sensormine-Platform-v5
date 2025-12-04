/**
 * Devices Page
 */

'use client';

import { DeviceList } from '@/components/devices/DeviceList';

export default function DevicesPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">
          Manage and monitor your connected devices
        </p>
      </div>

      <DeviceList />
    </div>
  );
}
