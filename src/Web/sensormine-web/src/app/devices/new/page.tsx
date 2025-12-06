/**
 * New Device Page
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeviceRegistrationForm } from '@/components/devices/DeviceRegistrationForm';
import { ArrowLeftIcon } from 'lucide-react';

export default function NewDevicePage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/devices">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register New Device</h1>
          <p className="text-muted-foreground">
            Register a new device instance to start collecting telemetry data
          </p>
        </div>
      </div>

      <DeviceRegistrationForm />
    </div>
  );
}
