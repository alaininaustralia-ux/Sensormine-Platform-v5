"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { alertInstancesApi } from '@/lib/api/alerts';
import type { AlertInstanceStatistics } from '@/lib/api/alerts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AlertHistoryChartWidgetProps {
  days?: number;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  Critical: number;
  Warning: number;
  Info: number;
}

export function AlertHistoryChartWidget({ days = 7, height = 300 }: AlertHistoryChartWidgetProps) {
  const [stats, setStats] = useState<AlertInstanceStatistics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load statistics
        const statistics = await alertInstancesApi.getStatistics();
        setStats(statistics);

        // Generate mock chart data (in production, this would come from a time-series endpoint)
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Critical: Math.floor(Math.random() * 10),
            Warning: Math.floor(Math.random() * 20),
            Info: Math.floor(Math.random() * 15)
          });
        }
        setChartData(data);
      } catch (err) {
        console.error('Failed to load alert history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert History ({days} days)</CardTitle>
        </CardHeader>
        <CardContent style={{ height }}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alert History ({days} days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Critical" fill="#dc2626" />
            <Bar dataKey="Warning" fill="#f59e0b" />
            <Bar dataKey="Info" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.totalActive}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.totalAcknowledged}</div>
              <div className="text-xs text-gray-600">Acknowledged</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.totalResolved}</div>
              <div className="text-xs text-gray-600">Resolved</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
