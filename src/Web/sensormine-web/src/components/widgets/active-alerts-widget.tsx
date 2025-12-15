"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { alertInstancesApi } from '@/lib/api/alerts';
import type { AlertInstance } from '@/lib/api/alerts';
import Link from 'next/link';

interface ActiveAlertsWidgetProps {
  maxAlerts?: number;
}

export function ActiveAlertsWidget({ maxAlerts = 5 }: ActiveAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<AlertInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data = await alertInstancesApi.list(1, maxAlerts, undefined, undefined, 'Active');
        setAlerts(data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load alerts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [maxAlerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'Info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Active Alerts</CardTitle>
        <Link href="/alerts">
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-sm font-medium">No active alerts</p>
            <p className="text-xs text-gray-400 mt-1">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} 
                  hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.details}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeSince(alert.triggeredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
