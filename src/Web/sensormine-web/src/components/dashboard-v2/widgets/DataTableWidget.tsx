'use client';

// Data Table Widget

import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableWidgetProps {
  widget: Widget;
  mode: DashboardMode;
}

export function DataTableWidget({ widget }: DataTableWidgetProps) {
  const data = [
    { time: '2025-12-11 10:00', temperature: 22.5, humidity: 65, pressure: 1013 },
    { time: '2025-12-11 10:15', temperature: 23.1, humidity: 64, pressure: 1013 },
    { time: '2025-12-11 10:30', temperature: 23.8, humidity: 63, pressure: 1012 },
    { time: '2025-12-11 10:45', temperature: 24.2, humidity: 62, pressure: 1012 },
  ];

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Temperature (°C)</TableHead>
            <TableHead>Humidity (%)</TableHead>
            <TableHead>Pressure (hPa)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{row.time}</TableCell>
              <TableCell>{row.temperature.toFixed(1)}</TableCell>
              <TableCell>{row.humidity}</TableCell>
              <TableCell>{row.pressure}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
