'use client';

import React from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Trash2, 
  Copy, 
  Wifi, 
  WifiOff,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceConfig, DeviceStatus, PROTOCOL_DISPLAY_NAMES } from '@/types';
import { useSimulatorStore } from '@/lib/store';

interface DeviceCardProps {
  device: DeviceConfig;
  onEdit: (device: DeviceConfig) => void;
}

export function DeviceCard({ device, onEdit }: DeviceCardProps) {
  const { 
    simulations, 
    setSimulationStatus,
    deleteDevice,
    duplicateDevice,
  } = useSimulatorStore();
  
  const simulation = simulations.get(device.id);
  const status: DeviceStatus = simulation?.status || 'idle';
  
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge variant="success">Running</Badge>;
      case 'connecting':
        return <Badge variant="warning">Connecting</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleToggleSimulation = async () => {
    const { startSimulation, stopSimulation } = useSimulatorStore.getState();
    
    try {
      if (status === 'running' || status === 'connecting') {
        await stopSimulation(device.id);
        console.log(`Simulation stopped: ${device.name}`);
      } else {
        await startSimulation(device.id);
        console.log(`Simulation started: ${device.name}`);
      }
    } catch (error) {
      setSimulationStatus(device.id, 'error');
      console.error('Simulation error:', error instanceof Error ? error.message : 'Failed to toggle simulation');
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{device.name}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-gray-500">{device.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Protocol info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Protocol</span>
            <Badge variant="outline">{PROTOCOL_DISPLAY_NAMES[device.protocol]}</Badge>
          </div>
          
          {/* Sensors count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Sensors</span>
            <span className="font-medium">{device.sensors.length}</span>
          </div>
          
          {/* Interval */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Interval</span>
            <span className="font-medium">{device.intervalMs / 1000}s</span>
          </div>
          
          {/* Stats when running */}
          {simulation && status === 'running' && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Messages</span>
                  <p className="font-mono font-medium">{simulation.messageCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Errors</span>
                  <p className="font-mono font-medium text-red-600">{simulation.errorCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Last reading */}
          {simulation?.lastMessage && 'sensors' in simulation.lastMessage && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Last Reading</p>
              <div className="space-y-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(simulation.lastMessage.sensors as any[]).slice(0, 3).map((sensor: any) => (
                  <div key={sensor.sensorId} className="flex justify-between text-sm">
                    <span className="text-gray-600">{sensor.name}</span>
                    <span className="font-mono font-medium">
                      {sensor.value} {sensor.unit}
                    </span>
                  </div>
                ))}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(simulation.lastMessage.sensors as any[]).length > 3 && (
                  <p className="text-xs text-gray-400">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    +{(simulation.lastMessage.sensors as any[]).length - 3} more sensors
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Error message */}
          {simulation?.lastError && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600">{simulation.lastError}</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={status === 'running' ? 'destructive' : 'success'}
              size="sm"
              className="flex-1"
              onClick={handleToggleSimulation}
              disabled={status === 'connecting'}
            >
              {status === 'running' || status === 'connecting' ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(device)}
              disabled={status === 'running'}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => duplicateDevice(device.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => deleteDevice(device.id)}
              disabled={status === 'running'}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
