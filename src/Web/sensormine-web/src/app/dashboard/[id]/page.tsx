/**
 * Dashboard View Page
 * 
 * Displays a single dashboard in read-only mode.
 */

'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DeviceContextBanner } from '@/components/dashboard/DeviceContextBanner';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api/dashboards';
import type { Dashboard, Widget as DashboardWidget } from '@/lib/types/dashboard';

export default function DashboardViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dashboardId = params.id as string;
  
  // Get device context from URL parameters
  const deviceId = searchParams.get('deviceId');
  const deviceName = searchParams.get('deviceName');
  
  const { currentDashboard: dashboard, setCurrentDashboard, getDashboard } = useDashboardStore();
  
  useEffect(() => {
    // First check if dashboard is already in store
    const storedDashboard = getDashboard(dashboardId);
    if (storedDashboard) {
      // Merge layout positions into widgets so DashboardGrid can render them
      const enrichedWidgets = storedDashboard.widgets.map((widget) => {
        const layoutItem = storedDashboard.layout.find((l) => l.i === widget.id);
        return {
          ...widget,
          position: layoutItem
            ? {
                x: layoutItem.x,
                y: layoutItem.y,
                width: layoutItem.w,
                height: layoutItem.h,
              }
            : { x: 0, y: 0, width: 6, height: 4 },
        };
      });
      setCurrentDashboard({ ...storedDashboard, widgets: enrichedWidgets });
      return;
    }
    
    // Load dashboard from API if not in store
    const fetchDashboard = async () => {
      try {
        const dashboardData = await dashboardApi.get(dashboardId, 'demo-user');
        if (dashboardData) {
          // Transform API response: merge layout positions into widgets
          // The API returns layout and widgets separately in react-grid-layout format
          interface LayoutItem {
            i: string;
            x: number;
            y: number;
            w: number;
            h: number;
          }
          
          const layout = (dashboardData.layout as LayoutItem[]) || [];
          const widgets = dashboardData.widgets;
          
          // Merge layout positions into widgets and extract dataConfig
          const enrichedWidgets: DashboardWidget[] = widgets.map((widget) => {
            const layoutItem = layout.find((l) => l.i === widget.id);
            
            // Extract dataSource from config if it exists
            const widgetConfig = widget.config as Record<string, unknown>;
            const dataConfig = widgetConfig?.dataSource ? { dataSource: widgetConfig.dataSource } : undefined;
            
            return {
              ...widget,
              position: layoutItem
                ? {
                    x: layoutItem.x,
                    y: layoutItem.y,
                    width: layoutItem.w,
                    height: layoutItem.h,
                  }
                : { x: 0, y: 0, width: 6, height: 4 },
              dataConfig: dataConfig,
            } as unknown as DashboardWidget;
          });
          
          // Transform to internal Dashboard format
          const transformedDashboard: Dashboard = {
            id: dashboardData.id,
            name: dashboardData.name,
            description: dashboardData.description,
            widgets: enrichedWidgets,
            layout: (dashboardData.layout as LayoutItem[]) || [],
            createdBy: dashboardData.userId || 'demo-user',
            createdAt: new Date(dashboardData.createdAt),
            updatedAt: new Date(dashboardData.updatedAt),
            isTemplate: dashboardData.isTemplate || false,
            displayOrder: 0,
            dashboardType: 3, // Custom
          };
          
          setCurrentDashboard(transformedDashboard);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
    };
    fetchDashboard();
  }, [dashboardId, getDashboard, setCurrentDashboard]);
  
  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground mb-4">Dashboard not found</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboards
          </Link>
        </Button>
      </div>
    );
  }
  
  // Handle clear device context
  const handleClearDeviceContext = () => {
    router.push(`/dashboard/${dashboardId}`);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b bg-background flex items-center px-4 gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-xs text-muted-foreground">{dashboard.description}</p>
          )}
        </div>
        
        <Button size="sm" asChild>
          <Link href={`/dashboard/${dashboard.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Dashboard
          </Link>
        </Button>
      </div>
      
      {/* Device context banner */}
      {deviceId && deviceName && (
        <DeviceContextBanner
          deviceId={deviceId}
          deviceName={deviceName}
          parentDashboardId={dashboard.parentDashboardId}
          onClear={handleClearDeviceContext}
        />
      )}
      
      <div className="flex-1 overflow-auto p-6 bg-muted/10">
        <DashboardGrid deviceId={deviceId} />
      </div>
    </div>
  );
}
