'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AssetTree } from '@/components/digital-twin/AssetTree';
import { DeviceAssignment } from '@/components/digital-twin/DeviceAssignment';
import { MappingEditor } from '@/components/digital-twin/MappingEditor';
import { AssetStateDashboard } from '@/components/digital-twin/AssetStateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical } from 'lucide-react';

export default function DigitalTwinPage() {
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit between 30% and 70%
      if (newLeftWidth >= 30 && newLeftWidth <= 70) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Asset Hierarchy</TabsTrigger>
          <TabsTrigger value="mappings">Data Point Mappings</TabsTrigger>
          <TabsTrigger value="state">Asset State</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div ref={containerRef} className="flex gap-0 relative">
            {/* Asset Tree - Left Side (resizable) */}
            <div style={{ width: `${leftWidth}%` }} className="pr-2">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Tree</CardTitle>
                  <CardDescription>
                    View and manage your hierarchical asset structure. Select an asset to assign devices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AssetTree height={700} />
                </CardContent>
              </Card>
            </div>

            {/* Resizer */}
            <div
              onMouseDown={handleMouseDown}
              className="w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group transition-colors"
            >
              <div className="absolute p-1 rounded bg-background border border-border group-hover:border-primary transition-colors">
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </div>

            {/* Device Assignment - Right Pane (resizable) */}
            <div style={{ width: `${100 - leftWidth}%` }} className="pl-2">
              <DeviceAssignment />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <MappingEditor />
        </TabsContent>

        <TabsContent value="state" className="space-y-4">
          <AssetStateDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
