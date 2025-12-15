'use client';

// Dashboard V2 View Mode - Read-only dashboard display

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Edit, RefreshCw } from 'lucide-react';
import { useDashboardV2Store } from '@/lib/stores/dashboard-v2-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardCanvas } from '@/components/dashboard-v2/layout/DashboardCanvas';

interface DashboardViewProps {
  params: Promise<{ id: string }>;
}

export default function DashboardViewPage({ params }: DashboardViewProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    currentDashboard,
    loading,
    loadDashboard,
    setMode,
  } = useDashboardV2Store();

  useEffect(() => {
    if (resolvedParams.id) {
      loadDashboard(resolvedParams.id).then(() => {
        console.log('[View Mode] Dashboard loaded');
      }).catch(() => {
        router.push('/dashboards');
      });
      setMode('view');
    }
  }, [resolvedParams.id, loadDashboard, router, setMode]);

  // Log layout when dashboard changes
  useEffect(() => {
    if (currentDashboard) {
      console.log('[View Mode] Current dashboard layout:', currentDashboard.layout);
      console.log('[View Mode] Widgets:', currentDashboard.widgets.map(w => ({
        id: w.id,
        title: w.title,
        position: w.position
      })));
    }
  }, [currentDashboard]);

  const handleRefresh = () => {
    if (resolvedParams.id) {
      loadDashboard(resolvedParams.id);
    }
  };

  if (loading || !currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-xl">{currentDashboard.name}</h1>
          {currentDashboard.description && (
            <p className="text-sm text-muted-foreground">{currentDashboard.description}</p>
          )}
          <Badge variant={currentDashboard.state === 'published' ? 'default' : 'secondary'}>
            {currentDashboard.state}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/dashboards/${currentDashboard.id}/design`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto bg-muted/20 p-4">
        {currentDashboard.widgets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No widgets on this dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Click Edit to add widgets
              </p>
              <Button onClick={() => router.push(`/dashboards/${currentDashboard.id}/design`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <DashboardCanvas
            widgets={currentDashboard.widgets}
            layouts={currentDashboard.layout.layouts}
            mode="view"
          />
        )}
      </div>
    </div>
  );
}
