'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Trash2, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationLog, PROTOCOL_DISPLAY_NAMES } from '@/types';
import { useSimulatorStore } from '@/lib/store';
import { simulationApi, SimulationLogEntry } from '@/lib/simulation-api';

export function LogViewer() {
  const { logs: localLogs, devices, clearLogs } = useSimulatorStore();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [apiLogs, setApiLogs] = useState<SimulationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const logs = await simulationApi.getLogs(deviceFilter !== 'all' ? deviceFilter : undefined, 100);
      setApiLogs(logs);
    } catch (err) {
      console.error('Failed to fetch simulation logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [deviceFilter]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Combine API logs with local logs for display
  const combinedLogs = useMemo(() => {
    // Convert API logs to SimulationLog format
    const converted: SimulationLog[] = apiLogs.map((log, idx) => ({
      id: `api-${idx}`,
      timestamp: new Date(log.timestamp),
      level: log.status === 'success' ? 'info' : 'error',
      protocol: 'mqtt',
      deviceId: log.deviceId,
      message: `Published to ${log.topic}`,
      data: JSON.parse(log.payload),
    }));

    // Merge with local logs and sort by timestamp
    return [...converted, ...localLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [apiLogs, localLogs]);

  const filteredLogs = useMemo(() => {
    return combinedLogs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (deviceFilter !== 'all' && log.deviceId !== deviceFilter) return false;
      return true;
    });
  }, [combinedLogs, levelFilter, deviceFilter]);

  const getLevelBadge = (level: SimulationLog['level']) => {
    const variants: Record<SimulationLog['level'], 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
      info: 'default',
      debug: 'secondary',
      warn: 'warning',
      error: 'destructive',
    };
    return <Badge variant={variants[level]}>{level.toUpperCase()}</Badge>;
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Device', 'Protocol', 'Message'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        devices.find(d => d.id === log.deviceId)?.name || log.deviceId,
        log.protocol,
        `"${log.message.replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Simulation Logs</CardTitle>
            {error && (
              <Badge variant="destructive" className="text-xs">
                {error}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLogs} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} disabled={localLogs.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Local
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="w-24 h-8 text-xs"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </Select>
          </div>
          <Select
            value={deviceFilter}
            onChange={e => setDeviceFilter(e.target.value)}
            className="flex-1 h-8 text-xs"
          >
            <option value="all">All Devices</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No logs to display
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map(log => {
                const device = devices.find(d => d.id === log.deviceId);
                return (
                  <div key={log.id} className="px-4 py-2 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      {getLevelBadge(log.level)}
                      <Badge variant="outline" className="text-xs">
                        {PROTOCOL_DISPLAY_NAMES[log.protocol]}
                      </Badge>
                      <span className="text-xs text-gray-600 truncate">
                        {device?.name || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-gray-700">{log.message}</p>
                    {log.data !== undefined && log.data !== null && (
                      <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
