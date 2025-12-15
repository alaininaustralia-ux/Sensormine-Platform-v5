'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { alertInstancesApi, AlertInstanceDto, ApiAlertStatus } from '@/lib/api/alert-instances';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

/**
 * Alert notification badge component for dashboard header
 * Shows count of active alerts and dropdown with recent alerts
 */
export function AlertBadge() {
  const router = useRouter();
  const [activeAlerts, setActiveAlerts] = useState<AlertInstanceDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveAlerts = async () => {
    try {
      const response = await alertInstancesApi.getAll({
        status: ApiAlertStatus.Active,
        pageSize: 5,
      });
      setActiveAlerts(response.data);
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(loadActiveAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 3: return 'bg-red-500';     // Critical
      case 2: return 'bg-orange-500';  // Error
      case 1: return 'bg-yellow-500';  // Warning
      default: return 'bg-blue-500';   // Info
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 3: return 'Critical';
      case 2: return 'Error';
      case 1: return 'Warning';
      default: return 'Info';
    }
  };

  const handleAcknowledge = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await alertInstancesApi.acknowledge(alertId, {});
      loadActiveAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {activeAlerts.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {activeAlerts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-semibold">Active Alerts</span>
          {activeAlerts.length > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push('/alerts')}
              className="h-auto p-0"
            >
              View All
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Loading alerts...
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No active alerts
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex flex-col items-start gap-2 p-3 cursor-pointer"
              onClick={() => router.push(`/alerts/${alert.id}`)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(alert.severity)} variant="default">
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                  <span className="font-medium">{alert.deviceName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleAcknowledge(alert.id, e)}
                  className="h-6 text-xs"
                >
                  Acknowledge
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
