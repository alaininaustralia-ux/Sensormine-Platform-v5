/**
 * Example: Dashboard Widget with Field Selector Integration
 * 
 * This example shows how to create a chart widget that uses the field selector
 * to allow users to choose which device type fields to display.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { WidgetDataConfig, type WidgetDataConfigType } from '@/components/dashboard/builder';

// Example widget component
export function ExampleChartWidget() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetDataConfigType>({
    dataSource: {
      type: 'historical',
      fields: [],
      aggregation: 'avg',
      timeRange: {
        value: 24,
        unit: 'hours',
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Temperature Trends</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfiguring(!isConfiguring)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isConfiguring ? (
          <div>
            <h4 className="text-sm font-medium mb-4">Configure Data Source</h4>
            <WidgetDataConfig
              config={widgetConfig}
              onChange={setWidgetConfig}
              widgetType="chart"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsConfiguring(false)}>
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {widgetConfig.dataSource.fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields selected</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsConfiguring(true)}
                >
                  Configure Widget
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Displaying {widgetConfig.dataSource.fields.length} field(s):
                </p>
                <ul className="space-y-1">
                  {widgetConfig.dataSource.fields.map((field, index) => (
                    <li key={index} className="text-sm">
                      • {field.deviceTypeName}: {field.fieldName} ({field.fieldType})
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Data Source: {widgetConfig.dataSource.type}</p>
                  {widgetConfig.dataSource.timeRange && (
                    <p>
                      Time Range: Last {widgetConfig.dataSource.timeRange.value}{' '}
                      {widgetConfig.dataSource.timeRange.unit}
                    </p>
                  )}
                  {widgetConfig.dataSource.aggregation && (
                    <p>Aggregation: {widgetConfig.dataSource.aggregation}</p>
                  )}
                </div>
                {/* Here you would render your actual chart using the selected fields */}
                <div className="mt-4 h-64 border rounded flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Chart would render here with data from selected fields
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage in a page
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExampleChartWidget />
        {/* Add more widgets here */}
      </div>
    </div>
  );
}
