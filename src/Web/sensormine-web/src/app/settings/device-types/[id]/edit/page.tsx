/**
 * Device Type Edit Page
 * 
 * Edit existing device type configuration with version history and validation
 * Story 1.2 - Edit Device Type Configuration
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DeviceTypeEditor } from '@/components/device-types/device-type-editor';
import { Loader2 } from 'lucide-react';
import { getDeviceTypeById } from '@/lib/api/deviceTypes';
import type { DeviceType } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export default function EditDeviceTypePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deviceTypeId = params.id as string;

  useEffect(() => {
    async function loadDeviceType() {
      try {
        const data = await getDeviceTypeById(deviceTypeId);
        setDeviceType(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load device type',
          variant: 'destructive',
        });
        router.push('/settings/device-types');
      } finally {
        setIsLoading(false);
      }
    }

    loadDeviceType();
  }, [deviceTypeId, router, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!deviceType) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <DeviceTypeEditor deviceType={deviceType} />
    </div>
  );
}
