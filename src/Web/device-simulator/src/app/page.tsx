'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  PlayCircle, 
  StopCircle, 
  Cpu, 
  Wifi,
  Server,
  Globe,
  Network,
  Radio,
  FileJson
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceCard } from '@/components/device-card';
import { DeviceEditor } from '@/components/device-editor';
import { SchemaDeviceCreator } from '@/components/schema-device-creator';
import { LogViewer } from '@/components/log-viewer';
import { ApiDeviceLoader } from '@/components/api-device-loader';
import { useSimulatorStore } from '@/lib/store';
import { DeviceConfig, ProtocolType, PROTOCOL_DISPLAY_NAMES } from '@/types';

const PROTOCOL_ICONS: Record<ProtocolType, React.ReactNode> = {
  mqtt: <Wifi className="h-5 w-5" />,
  http: <Globe className="h-5 w-5" />,
  websocket: <Radio className="h-5 w-5" />,
  modbus: <Server className="h-5 w-5" />,
  opcua: <Network className="h-5 w-5" />,
};

export default function Home() {
  const { 
    devices, 
    simulations, 
    createSampleDevice,
    startAllSimulations,
    stopAllSimulations,
  } = useSimulatorStore();
  
  const [editingDevice, setEditingDevice] = useState<DeviceConfig | undefined>();
  const [showEditor, setShowEditor] = useState(false);

  const runningCount = Array.from(simulations.values()).filter(s => s.status === 'running').length;
  const totalDevices = devices.length;

  const handleCreateDevice = () => {
    setEditingDevice(undefined);
    setShowEditor(true);
  };

  const handleEditDevice = (device: DeviceConfig) => {
    setEditingDevice(device);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setEditingDevice(undefined);
    setShowEditor(false);
  };

  const [showSchemaCreator, setShowSchemaCreator] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Device Simulator</h1>
                <p className="text-xs text-gray-500">Sensormine Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={runningCount > 0 ? 'success' : 'secondary'}>
                  {runningCount} / {totalDevices} Running
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startAllSimulations}
                  disabled={runningCount === totalDevices || totalDevices === 0}
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Start All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopAllSimulations}
                  disabled={runningCount === 0}
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Stop All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Devices */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Device Loader */}
            <ApiDeviceLoader />

            {/* Quick Create */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Create</CardTitle>
                <CardDescription>
                  Create a sample device with pre-configured sensors or from JSON Schema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROTOCOL_DISPLAY_NAMES) as ProtocolType[]).map((protocol) => (
                      <Button
                        key={protocol}
                        variant="outline"
                        size="sm"
                        onClick={() => createSampleDevice(protocol)}
                      >
                        {PROTOCOL_ICONS[protocol]}
                        <span className="ml-1">{PROTOCOL_DISPLAY_NAMES[protocol]}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSchemaCreator(true)}
                      className="w-full"
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      Create from JSON Schema
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Devices Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Simulated Devices</h2>
                <Button onClick={handleCreateDevice}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Device
                </Button>
              </div>
              
              {devices.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Cpu className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No devices configured
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Create a device to start simulating telemetry data
                    </p>
                    <Button onClick={handleCreateDevice}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Your First Device
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onEdit={handleEditDevice}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Logs */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <LogViewer />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Sensormine Platform v5 - Device Simulator</p>
            <p>Supports: MQTT, HTTP/REST, WebSocket, Modbus TCP, OPC UA + JSON Schema</p>
          </div>
        </div>
      </footer>

      {/* Editors */}
      {showEditor && (
        <DeviceEditor
          device={editingDevice}
          onClose={handleCloseEditor}
        />
      )}

      {showSchemaCreator && (
        <SchemaDeviceCreator
          onClose={() => setShowSchemaCreator(false)}
        />
      )}
    </div>
  );
}
