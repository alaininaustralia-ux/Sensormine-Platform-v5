/**
 * 3D CAD Viewer Widget Demo
 * 
 * Example usage and interactive demonstration of the CAD 3D Viewer widget.
 */

'use client';

import React, { useState } from 'react';
import { CAD3DViewerWidget } from './cad-3d-viewer-widget';
import type { CAD3DViewerConfig } from './cad-3d-viewer-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';

export function CAD3DViewerDemo() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Example configuration with sensor mappings
  const exampleConfig: CAD3DViewerConfig = {
    modelType: 'stl',
    backgroundColor: '#1a1a1a',
    gridEnabled: true,
    cameraPosition: [5, 5, 5],
    defaultColor: '#6e7681',
    activeColor: '#2ea043',
    highlightColor: '#f85149',
    sensorMappings: [
      {
        elementId: 'mesh-1',
        elementName: 'Motor Housing',
        deviceId: 'temp-sensor-1',
        deviceName: 'Temperature Sensor 1',
        fieldName: 'temperature',
      },
      {
        elementId: 'mesh-2',
        elementName: 'Pump Body',
        deviceId: 'pressure-sensor-1',
        deviceName: 'Pressure Sensor 1',
        fieldName: 'pressure',
      },
      {
        elementId: 'mesh-3',
        elementName: 'Front Bearing',
        deviceId: 'vib-sensor-1',
        deviceName: 'Vibration Sensor 1',
        fieldName: 'vibration_rms',
      },
    ],
  };

  const codeExample = `import { CAD3DViewerWidget } from '@/components/dashboard-v2/widgets';

<CAD3DViewerWidget
  id="cad-viewer-1"
  title="Equipment 3D View"
  description="Motor assembly with temperature sensors"
  config={{
    modelUrl: '/models/motor-assembly.stl',
    modelType: 'stl',
    backgroundColor: '#1a1a1a',
    gridEnabled: true,
    sensorMappings: [
      {
        elementId: 'mesh-1',
        elementName: 'Motor Housing',
        deviceId: 'temp-sensor-1',
        deviceName: 'Temperature Sensor 1',
        fieldName: 'temperature',
      }
    ]
  }}
  isEditMode={false}
/>`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">3D CAD Viewer Widget</CardTitle>
              <CardDescription className="mt-2">
                Interactive 3D visualization with real-time sensor data integration
              </CardDescription>
            </div>
            <Badge variant="secondary">Dashboard V2</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCode(!showCode)}
            >
              <Code2 className="h-4 w-4 mr-2" />
              {showCode ? 'Hide' : 'Show'} Code
            </Button>
          </div>

          {showCode && (
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
              <code>{codeExample}</code>
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different scenarios */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Example</TabsTrigger>
          <TabsTrigger value="industrial">Industrial Motor</TabsTrigger>
          <TabsTrigger value="hvac">HVAC System</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic 3D Viewer</CardTitle>
              <CardDescription>
                Simple configuration with 3 sensor mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <CAD3DViewerWidget
                  id="demo-basic"
                  title="Basic Equipment"
                  description="Generic equipment with sensors"
                  config={exampleConfig}
                  isEditMode={isEditMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industrial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industrial Motor Assembly</CardTitle>
              <CardDescription>
                Pump motor with temperature, vibration, and pressure sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <CAD3DViewerWidget
                  id="demo-industrial"
                  title="Pump Motor Assembly"
                  description="3-phase industrial pump motor"
                  config={{
                    ...exampleConfig,
                    backgroundColor: '#0d1117',
                    sensorMappings: [
                      {
                        elementId: 'mesh-1',
                        elementName: 'Motor Housing',
                        deviceId: 'temp-001',
                        deviceName: 'Thermal Sensor A',
                        fieldName: 'temperature',
                      },
                      {
                        elementId: 'mesh-2',
                        elementName: 'Front Bearing',
                        deviceId: 'vib-001',
                        deviceName: 'Vibration Sensor 1',
                        fieldName: 'vibration_rms',
                      },
                      {
                        elementId: 'mesh-3',
                        elementName: 'Rear Bearing',
                        deviceId: 'vib-002',
                        deviceName: 'Vibration Sensor 2',
                        fieldName: 'vibration_rms',
                      },
                      {
                        elementId: 'mesh-4',
                        elementName: 'Pump Inlet',
                        deviceId: 'pressure-001',
                        deviceName: 'Inlet Pressure',
                        fieldName: 'pressure',
                      },
                    ],
                  }}
                  isEditMode={isEditMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hvac" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HVAC Air Handler</CardTitle>
              <CardDescription>
                Air handling unit with temperature and airflow sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <CAD3DViewerWidget
                  id="demo-hvac"
                  title="HVAC Air Handler"
                  description="Rooftop air handling unit"
                  config={{
                    ...exampleConfig,
                    cameraPosition: [10, 5, 10],
                    activeColor: '#0ea5e9',
                    sensorMappings: [
                      {
                        elementId: 'mesh-1',
                        elementName: 'Supply Air Duct',
                        deviceId: 'temp-supply',
                        deviceName: 'Supply Air Temp',
                        fieldName: 'temperature',
                      },
                      {
                        elementId: 'mesh-2',
                        elementName: 'Return Air Duct',
                        deviceId: 'temp-return',
                        deviceName: 'Return Air Temp',
                        fieldName: 'temperature',
                      },
                      {
                        elementId: 'mesh-3',
                        elementName: 'Cooling Coil',
                        deviceId: 'temp-coil',
                        deviceName: 'Coil Temperature',
                        fieldName: 'temperature',
                      },
                    ],
                  }}
                  isEditMode={isEditMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">View Mode</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click elements to see sensor data</li>
                <li>• Color-coded status indicators</li>
                <li>• Interactive 3D navigation</li>
                <li>• Real-time data updates</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Design Mode</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visual mapping inspection</li>
                <li>• Element name labels</li>
                <li>• Identify unmapped elements</li>
                <li>• Upload 3D models</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Configure Mode</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Associate sensors to elements</li>
                <li>• Select device and field</li>
                <li>• Name model elements</li>
                <li>• Save configurations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Supported Formats</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• STL (Binary/ASCII)</li>
                <li>• OBJ (Wavefront)</li>
                <li>• File size: up to 50MB</li>
                <li>• Automatic format detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
