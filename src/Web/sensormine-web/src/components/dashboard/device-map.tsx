/**
 * Device Map Component
 * 
 * Map component with device drill-down integration.
 * Automatically navigates to device dashboards or creates them if needed.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapWidget, type MapWidgetProps } from './widgets/map-widget';
import { CreateSubPageDialog } from './create-subpage-dialog';
import { DashboardType } from '@/lib/types/dashboard';
import { dashboardApi } from '@/lib/api/dashboards';

interface DeviceMapProps extends Omit<MapWidgetProps, 'onDeviceClick' | 'onViewDashboard'> {
  /** Current dashboard ID for creating subpages */
  currentDashboardId?: string;
  /** Current dashboard name for dialog */
  currentDashboardName?: string;
  /** Whether to enable auto-dashboard creation */
  enableAutoCreate?: boolean;
}

export function DeviceMap({ 
  currentDashboardId, 
  currentDashboardName = 'Current Dashboard',
  enableAutoCreate = true,
  ...mapProps 
}: DeviceMapProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  /**
   * Handle device details view
   */
  const handleViewDetails = (deviceId: string) => {
    router.push(`/devices/${deviceId}`);
  };

  /**
   * Handle device dashboard view/creation
   */
  const handleViewDashboard = async (deviceId: string) => {
    try {
      // TODO: Check if device detail dashboard already exists
      // For now, check if currentDashboardId has subpages for this device
      
      if (currentDashboardId && enableAutoCreate) {
        // Get subpages to check if dashboard exists
        const subPages = await dashboardApi.getSubPages(currentDashboardId);
        const existingDashboard = subPages.find(
          page => page.dashboardType === DashboardType.DeviceDetail 
            // TODO: Add deviceId filter metadata when implemented
        );

        if (existingDashboard) {
          // Navigate to existing dashboard
          router.push(`/dashboard/view/${existingDashboard.id}`);
        } else {
          // Offer to create new dashboard
          setSelectedDeviceId(deviceId);
          setCreateDialogOpen(true);
        }
      } else {
        // Navigate to device details page
        router.push(`/devices/${deviceId}`);
      }
    } catch (error) {
      console.error('Error handling device dashboard:', error);
      // Fallback to device details
      router.push(`/devices/${deviceId}`);
    }
  };

  /**
   * Handle dashboard creation completion
   */
  const handleDashboardCreated = (dashboardId: string) => {
    setCreateDialogOpen(false);
    setSelectedDeviceId(null);
    router.push(`/dashboard/view/${dashboardId}`);
  };

  return (
    <>
      <MapWidget
        {...mapProps}
        onDeviceClick={handleViewDetails}
        onViewDashboard={handleViewDashboard}
      />

      {/* Dashboard creation dialog */}
      {currentDashboardId && selectedDeviceId && (
        <CreateSubPageDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          parentId={currentDashboardId}
          parentName={currentDashboardName}
          onSuccess={handleDashboardCreated}
        />
      )}
    </>
  );
}
