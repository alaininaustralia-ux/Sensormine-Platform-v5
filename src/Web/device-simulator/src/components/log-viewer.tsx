'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationLog, PROTOCOL_DISPLAY_NAMES } from '@/types';
import { useSimulatorStore } from '@/lib/store';

export function LogViewer() {
  const { logs, devices, clearLogs } = useSimulatorStore();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (deviceFilter !== 'all' && log.deviceId !== deviceFilter) return false;
      return true;
    });
  }, [logs, levelFilter, deviceFilter]);

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
          <CardTitle className="text-lg">Simulation Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
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
