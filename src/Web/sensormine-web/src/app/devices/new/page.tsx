/**
 * New Device Page
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DeviceConfigurationForm, DeviceConfig } from '@/components/devices/DeviceConfigurationForm';
import { ArrowLeftIcon } from 'lucide-react';

export default function NewDevicePage() {
  const router = useRouter();

  const handleSave = (config: DeviceConfig) => {
    console.log('Creating device:', config);
    // In production, this would call the API
    alert('Device created successfully!');
    router.push('/devices');
  };

  const handleCancel = () => {
    router.push('/devices');
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/devices">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Device</h1>
          <p className="text-muted-foreground">
            Register a new device and configure its connection settings
          </p>
        </div>
      </div>

      <DeviceConfigurationForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
