/**
 * Usage Statistics Component
 * 
 * Display device type usage metrics
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, Power, Zap } from 'lucide-react';
import type { DeviceTypeUsageStats } from '@/lib/api/deviceTypes';

interface UsageStatisticsProps {
  stats: DeviceTypeUsageStats;
}

export function UsageStatistics({ stats }: UsageStatisticsProps) {
  const statItems = [
    {
      label: 'Total Devices',
      value: stats.totalDevices,
      icon: Zap,
      color: 'text-blue-500',
    },
    {
      label: 'Active Devices',
      value: stats.activeDevices,
      icon: Activity,
      color: 'text-green-500',
    },
    {
      label: 'Offline Devices',
      value: stats.offlineDevices,
      icon: Power,
      color: 'text-gray-500',
    },
    {
      label: 'Error Devices',
      value: stats.errorDevices,
      icon: AlertCircle,
      color: 'text-red-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <CardDescription>
          Current device deployment and status metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center p-6 border rounded-lg"
              >
                <Icon className={`h-8 w-8 mb-2 ${item.color}`} />
                <div className="text-3xl font-bold">{item.value}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            );
          })}
        </div>
        
        {stats.lastDataReceived && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Last data received: {new Date(stats.lastDataReceived).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
