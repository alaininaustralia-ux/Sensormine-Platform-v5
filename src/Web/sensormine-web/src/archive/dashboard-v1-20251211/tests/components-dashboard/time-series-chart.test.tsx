/**
 * Time-Series Chart Component Tests
 * 
 * Story 4.2: Time-Series Charts
 * Tests for the TimeSeriesChart component.
 * 
 * Note: Some Recharts features can't be fully tested in JSDOM due to
 * the ResponsiveContainer requiring actual DOM dimensions. These tests
 * focus on component rendering and basic configuration.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSeriesChart } from '@/components/dashboard/charts/time-series-chart';
import type { ChartConfig, ChartSeries } from '@/lib/types/chart';

// Sample test data
const createMockSeries = (): ChartSeries[] => {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  return [
    {
      id: 'temp',
      name: 'Temperature',
      unit: '°C',
      data: Array.from({ length: 10 }, (_, i) => ({
        timestamp: now - (9 - i) * hourMs,
        value: 20 + Math.sin(i) * 5,
      })),
    },
    {
      id: 'humidity',
      name: 'Humidity',
      unit: '%',
      data: Array.from({ length: 10 }, (_, i) => ({
        timestamp: now - (9 - i) * hourMs,
        value: 50 + Math.cos(i) * 10,
      })),
    },
  ];
};

describe('TimeSeriesChart', () => {
  describe('Rendering', () => {
    it('renders a chart container', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      render(<TimeSeriesChart config={config} />);
      
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
    
    it('renders with custom height as number', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      render(<TimeSeriesChart config={config} height={400} />);
      
      const container = screen.getByTestId('time-series-chart');
      expect(container).toHaveStyle({ height: '400px' });
    });
    
    it('renders with custom height as string', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      render(<TimeSeriesChart config={config} height="50vh" />);
      
      const container = screen.getByTestId('time-series-chart');
      expect(container).toHaveStyle({ height: '50vh' });
    });
    
    it('renders with custom className', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      render(<TimeSeriesChart config={config} className="custom-chart" />);
      
      const container = screen.getByTestId('time-series-chart');
      expect(container).toHaveClass('custom-chart');
    });
    
    it('renders ResponsiveContainer', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      const { container } = render(<TimeSeriesChart config={config} />);
      
      // ResponsiveContainer adds this class
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });
  
  describe('Chart Types', () => {
    it.each([
      ['line'],
      ['bar'],
      ['area'],
      ['scatter'],
      ['step'],
    ] as const)('renders %s chart type without errors', (chartType) => {
      const config: ChartConfig = {
        chartType,
        series: createMockSeries(),
      };
      
      // Should not throw
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
  });
  
  describe('Configuration', () => {
    it('applies default configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      // Should not throw with minimal config
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles legend configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        legend: {
          visible: true,
          position: 'bottom',
        },
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles tooltip configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        tooltip: {
          enabled: true,
          shared: true,
          dateFormat: 'yyyy-MM-dd',
        },
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles zoom configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        zoom: {
          enabled: true,
          panEnabled: true,
        },
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles axis configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        xAxis: {
          label: 'Time',
          tickFormat: 'HH:mm',
        },
        yAxis: {
          label: 'Value',
          unit: '°C',
          min: 0,
          max: 100,
        },
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles animation configuration', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        animate: false,
        animationDuration: 0,
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
  });
  
  describe('Series', () => {
    it('handles empty series', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: [],
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
    
    it('handles single series', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: [createMockSeries()[0]],
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles multiple series', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles series with custom colors', () => {
      const series = createMockSeries();
      series[0].color = '#ff0000';
      series[1].color = '#00ff00';
      
      const config: ChartConfig = {
        chartType: 'line',
        series,
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles series with single data point', () => {
      const config: ChartConfig = {
        chartType: 'line',
        series: [
          {
            id: 'single',
            name: 'Single Point',
            data: [{ timestamp: Date.now(), value: 42 }],
          },
        ],
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
    
    it('handles series with different timestamp formats', () => {
      const now = Date.now();
      const config: ChartConfig = {
        chartType: 'line',
        series: [
          {
            id: 'mixed',
            name: 'Mixed Timestamps',
            data: [
              { timestamp: now - 3600000, value: 10 },
              { timestamp: new Date(now - 1800000), value: 15 },
              { timestamp: new Date().toISOString(), value: 20 },
            ],
          },
        ],
      };
      
      expect(() => render(<TimeSeriesChart config={config} />)).not.toThrow();
    });
  });
  
  describe('Callbacks', () => {
    it('accepts onTimeRangeChange callback', () => {
      const onTimeRangeChange = vi.fn();
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
        zoom: { enabled: true },
      };
      
      render(
        <TimeSeriesChart 
          config={config} 
          onTimeRangeChange={onTimeRangeChange} 
        />
      );
      
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
    
    it('accepts onDataPointClick callback', () => {
      const onDataPointClick = vi.fn();
      const config: ChartConfig = {
        chartType: 'line',
        series: createMockSeries(),
      };
      
      render(
        <TimeSeriesChart 
          config={config} 
          onDataPointClick={onDataPointClick} 
        />
      );
      
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
  });
});
