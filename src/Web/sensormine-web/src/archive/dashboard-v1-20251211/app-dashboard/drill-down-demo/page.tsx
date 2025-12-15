/**
 * Device Drill-Down Demo Page
 * 
 * Demonstrates the dashboard hierarchy and device drill-down features
 */

'use client';

export const dynamic = 'force-dynamic';

import { DeviceList, type DeviceListItem } from '@/components/dashboard/device-list';
import { BreadcrumbNav } from '@/components/dashboard/breadcrumb-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DrillDownDemoPage() {
  const currentDashboard = {
    id: 'demo-root-dashboard',
    name: 'Fleet Overview',
  };

  // Example breadcrumb trail
  const breadcrumbs = [
    { id: 'home', name: 'Home', href: '/' },
    { id: 'dashboards', name: 'Dashboards', href: '/dashboard' },
    { id: currentDashboard.id, name: currentDashboard.name, href: `/dashboard/${currentDashboard.id}` },
  ];

  // Mock device data for demonstration
  const mockDevices: DeviceListItem[] = [
    {
      id: 'dev-001',
      name: 'Pump Station Alpha',
      deviceId: 'PS-001',
      deviceType: 'Pump',
      deviceTypeId: 'type-pump',
      status: 'online',
      location: 'North Facility',
      lastSeen: new Date('2024-12-06T18:00:00Z'),
      hasDetailDashboard: false,
    },
    {
      id: 'dev-002',
      name: 'Temperature Sensor B12',
      deviceId: 'TS-B12',
      deviceType: 'Temperature Sensor',
      deviceTypeId: 'type-temp',
      status: 'online',
      location: 'Warehouse 2',
      lastSeen: new Date('2024-12-06T17:55:00Z'),
      hasDetailDashboard: true,
    },
    {
      id: 'dev-003',
      name: 'Flow Meter 7',
      deviceId: 'FM-007',
      deviceType: 'Flow Meter',
      deviceTypeId: 'type-flow',
      status: 'error',
      location: 'Pipeline Section C',
      lastSeen: new Date('2024-12-06T17:45:00Z'),
      hasDetailDashboard: false,
    },
    {
      id: 'dev-004',
      name: 'Pressure Gauge Main',
      deviceId: 'PG-MAIN',
      deviceType: 'Pressure Sensor',
      deviceTypeId: 'type-pressure',
      status: 'offline',
      location: 'Central Station',
      lastSeen: new Date('2024-12-06T16:00:00Z'),
      hasDetailDashboard: false,
    },
    {
      id: 'dev-005',
      name: 'Vibration Monitor A1',
      deviceId: 'VM-A1',
      deviceType: 'Vibration Sensor',
      deviceTypeId: 'type-vibration',
      status: 'online',
      location: 'Generator Room',
      lastSeen: new Date('2024-12-06T18:00:00Z'),
      hasDetailDashboard: true,
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Device Drill-Down Demo</h1>
          <p className="text-muted-foreground mt-1">
            Interactive demonstration of dashboard hierarchy and device navigation
          </p>
        </div>
        <BreadcrumbNav items={breadcrumbs} currentPage="Demo" />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Features Demonstrated</CardTitle>
              <CardDescription>
                This page showcases the new dashboard drill-down capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>Map Widget with Device Drill-Down:</strong> Click device markers to view details or navigate to device-specific dashboards
                </li>
                <li>
                  <strong>Device List Navigation:</strong> Browse, search, and filter devices with direct dashboard access
                </li>
                <li>
                  <strong>Dashboard Hierarchy:</strong> Tree view of nested dashboards with expandable sections
                </li>
                <li>
                  <strong>Automatic Dashboard Creation:</strong> Create device-specific dashboards on demand
                </li>
                <li>
                  <strong>Breadcrumb Navigation:</strong> Track your location in the dashboard hierarchy
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Device List Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Device List with Drill-Down</CardTitle>
              <CardDescription>
                Search, filter, and sort devices. Click action buttons to navigate to device dashboards or details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceList devices={mockDevices} />
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Device List:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Use the search box to filter devices by name, ID, or location</li>
                  <li>Filter by status or device type using dropdown menus</li>
                  <li>Click column headers to sort</li>
                  <li>Use action buttons to view dashboards or device details</li>
                  <li>Devices with existing dashboards show a Dashboard button, others show Create Dashboard</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Dashboard Hierarchy:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Dashboards can have subpages for organized drill-down navigation</li>
                  <li>Device Detail dashboards are automatically linked to specific devices</li>
                  <li>Device Type List dashboards show all devices of a specific type</li>
                  <li>Breadcrumb navigation shows your current location in the hierarchy</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
