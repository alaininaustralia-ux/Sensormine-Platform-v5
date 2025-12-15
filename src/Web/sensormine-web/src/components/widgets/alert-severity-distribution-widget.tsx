"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { alertInstancesApi } from '@/lib/api/alerts';
import type { AlertInstanceStatistics } from '@/lib/api/alerts';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AlertSeverityDistributionWidgetProps {
  size?: number;
}

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  Warning: '#f59e0b',
  Info: '#3b82f6'
};

export function AlertSeverityDistributionWidget({ size = 200 }: AlertSeverityDistributionWidgetProps) {
  const [stats, setStats] = useState<AlertInstanceStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const statistics = await alertInstancesApi.getStatistics();
        setStats(statistics);
      } catch (err) {
        console.error('Failed to load alert statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent style={{ height: size + 100 }}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-gray-500">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Critical', value: stats.criticalCount || 0, color: SEVERITY_COLORS.Critical },
    { name: 'Warning', value: stats.warningCount || 0, color: SEVERITY_COLORS.Warning },
    { name: 'Info', value: stats.infoCount || 0, color: SEVERITY_COLORS.Info }
  ].filter(item => item.value > 0);

  const total = stats.totalActive + stats.totalAcknowledged + stats.totalResolved;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alert Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p className="text-sm font-medium">No alerts to display</p>
            <p className="text-xs text-gray-400 mt-1">All systems operating normally</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={size}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={size / 2.5}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-900">{stats.criticalCount || 0}</div>
                <div className="text-xs text-red-600">Critical</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="text-2xl font-bold text-yellow-900">{stats.warningCount || 0}</div>
                <div className="text-xs text-yellow-600">Warning</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-900">{stats.infoCount || 0}</div>
                <div className="text-xs text-blue-600">Info</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
