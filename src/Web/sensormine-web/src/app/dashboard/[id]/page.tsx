/**
 * Dashboard View Page
 * 
 * Displays a single dashboard in read-only mode.
 */

'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardViewPage() {
  const params = useParams();
  const dashboardId = params.id as string;
  
  const { getDashboard, setCurrentDashboard } = useDashboardStore();
  const dashboard = getDashboard(dashboardId);
  
  useEffect(() => {
    if (dashboard) {
      setCurrentDashboard(dashboard);
    }
  }, [dashboard, setCurrentDashboard]);
  
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
      
      <div className="flex-1 overflow-auto p-6 bg-muted/10">
        <DashboardGrid
          dashboard={dashboard}
          isEditMode={false}
        />
      </div>
    </div>
  );
}
