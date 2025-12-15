'use client';

// Sub-Dashboard Viewer - Inline viewer for sub-dashboards with parameters

import { useEffect, useState } from 'react';
import { ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SubDashboardConfig, SubDashboardParameterType, Dashboard, Widget } from '@/lib/types/dashboard-v2';
import { getDashboard } from '@/lib/api/dashboards-v2';
import { getDeviceById } from '@/lib/api/devices';
import { getAssetById } from '@/lib/api/digital-twin';
import { SubDashboardProvider } from './SubDashboardContext';
import { WidgetRenderer } from './WidgetRenderer';

interface SubDashboardViewerProps {
  subDashboard: SubDashboardConfig;
  parameterId: string;
  parameterType: SubDashboardParameterType;
  onClose: () => void;
}

export function SubDashboardViewer({
  subDashboard,
  parameterId,
  parameterType,
  onClose,
}: SubDashboardViewerProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [parameterName, setParameterName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadParameterName();
  }, [subDashboard.dashboardId, parameterId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboard = await getDashboard(subDashboard.dashboardId);
      setDashboard(dashboard);
    } catch (error) {
      console.error('Failed to load sub-dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParameterName = async () => {
    try {
      if (parameterType === 'deviceId') {
        const response = await getDeviceById(parameterId);
        setParameterName(response.data.name);
      } else if (parameterType === 'assetId') {
        const response = await getAssetById(parameterId);
        setParameterName(response.data.name);
      }
    } catch (error) {
      console.error('Failed to load parameter name:', error);
      setParameterName(parameterId);
    }
  };

  const handleOpenInNewTab = () => {
    const url = `/dashboards/${subDashboard.dashboardId}?${parameterType}=${parameterId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Failed to load dashboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              title="Back to parent view"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {subDashboard.name}
                <Badge variant="secondary" className="text-xs font-normal">
                  {parameterType === 'deviceId' ? 'Device' : 'Asset'}: {parameterName}
                </Badge>
              </h3>
              {dashboard.description && (
                <p className="text-sm text-muted-foreground mt-1">{dashboard.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
            className="h-8 w-8"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <SubDashboardProvider
          parameterId={parameterId}
          parameterType={parameterType}
          parameterName={parameterName}
        >
          <div className="grid gap-4">
            {dashboard.widgets.map((widget) => (
              <Card key={widget.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <h4 className="text-sm font-medium">{widget.title}</h4>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <WidgetRenderer widget={widget} mode="view" />
                </CardContent>
              </Card>
            ))}
          </div>
        </SubDashboardProvider>
      </CardContent>
    </Card>
  );
}
