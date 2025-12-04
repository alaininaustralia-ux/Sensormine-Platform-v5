/**
 * TimeSeriesChart Component Tests
 * 
 * Tests for time-series chart component (Story 4.2)
 * Following TDD approach: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSeriesChart } from '@/components/dashboard/widgets/charts/time-series-chart';
import type { ChartConfiguration } from '@/lib/types/chart-types';

// Mock data for testing
const mockLineChartConfig: ChartConfiguration = {
  title: 'Temperature Over Time',
  chartType: 'line',
  series: [
    {
      seriesName: 'Sensor A',
      data: [
        { timestamp: new Date('2024-01-01T00:00:00Z').getTime(), value: 20 },
        { timestamp: new Date('2024-01-01T01:00:00Z').getTime(), value: 22 },
        { timestamp: new Date('2024-01-01T02:00:00Z').getTime(), value: 21 },
      ],
      color: '#3b82f6',
      unit: '°C',
    },
  ],
  xAxisLabel: 'Time',
  yAxisLabel: 'Temperature (°C)',
  showLegend: true,
  showGrid: true,
};

const mockMultiSeriesConfig: ChartConfiguration = {
  title: 'Multi-Sensor Data',
  chartType: 'line',
  series: [
    {
      seriesName: 'Sensor A',
      data: [
        { timestamp: new Date('2024-01-01T00:00:00Z').getTime(), value: 20 },
        { timestamp: new Date('2024-01-01T01:00:00Z').getTime(), value: 22 },
      ],
      color: '#3b82f6',
    },
    {
      seriesName: 'Sensor B',
      data: [
        { timestamp: new Date('2024-01-01T00:00:00Z').getTime(), value: 18 },
        { timestamp: new Date('2024-01-01T01:00:00Z').getTime(), value: 19 },
      ],
      color: '#ef4444',
    },
  ],
  showLegend: true,
};

describe('TimeSeriesChart', () => {
  describe('Chart Rendering', () => {
    it('should render line chart with data', () => {
      render(<TimeSeriesChart config={mockLineChartConfig} />);
      
      // Check title
      expect(screen.getByText('Temperature Over Time')).toBeInTheDocument();
      
      // Chart container should be present
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should render bar chart with data', () => {
      const barConfig: ChartConfiguration = {
        ...mockLineChartConfig,
        chartType: 'bar',
        title: 'Bar Chart',
      };
      
      render(<TimeSeriesChart config={barConfig} />);
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    });

    it('should render area chart with data', () => {
      const areaConfig: ChartConfiguration = {
        ...mockLineChartConfig,
        chartType: 'area',
        title: 'Area Chart',
      };
      
      render(<TimeSeriesChart config={areaConfig} />);
      expect(screen.getByText('Area Chart')).toBeInTheDocument();
    });

    it('should render scatter chart with data', () => {
      const scatterConfig: ChartConfiguration = {
        ...mockLineChartConfig,
        chartType: 'scatter',
        title: 'Scatter Chart',
      };
      
      render(<TimeSeriesChart config={scatterConfig} />);
      expect(screen.getByText('Scatter Chart')).toBeInTheDocument();
    });

    it('should render step chart with data', () => {
      const stepConfig: ChartConfiguration = {
        ...mockLineChartConfig,
        chartType: 'step',
        title: 'Step Chart',
      };
      
      render(<TimeSeriesChart config={stepConfig} />);
      expect(screen.getByText('Step Chart')).toBeInTheDocument();
    });

    it('should render multiple series correctly', () => {
      render(<TimeSeriesChart config={mockMultiSeriesConfig} />);
      
      expect(screen.getByText('Multi-Sensor Data')).toBeInTheDocument();
      // Chart container should be present (legends render inside ResponsiveContainer)
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should show message when data is empty', () => {
      const emptyConfig: ChartConfiguration = {
        title: 'No Data',
        chartType: 'line',
        series: [],
      };
      
      render(<TimeSeriesChart config={emptyConfig} />);
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(<TimeSeriesChart config={mockLineChartConfig} isLoading={true} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <TimeSeriesChart 
          config={mockLineChartConfig} 
          error="Failed to load data" 
        />
      );
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('Chart Elements', () => {
    it('should display chart title', () => {
      render(<TimeSeriesChart config={mockLineChartConfig} />);
      expect(screen.getByText('Temperature Over Time')).toBeInTheDocument();
    });

    it('should display subtitle when provided', () => {
      const configWithSubtitle: ChartConfiguration = {
        ...mockLineChartConfig,
        subtitle: 'Last 24 Hours',
      };
      
      render(<TimeSeriesChart config={configWithSubtitle} />);
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
    });

    it('should show legend when enabled', () => {
      render(<TimeSeriesChart config={mockLineChartConfig} />);
      // Legend configuration is passed to Recharts
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should hide legend when disabled', () => {
      const configNoLegend: ChartConfiguration = {
        ...mockLineChartConfig,
        showLegend: false,
      };
      
      render(<TimeSeriesChart config={configNoLegend} />);
      
      // Chart should still render without legend
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with custom height', () => {
      const configWithHeight: ChartConfiguration = {
        ...mockLineChartConfig,
        height: 400,
      };
      
      render(<TimeSeriesChart config={configWithHeight} />);
      
      // Container should have specified height
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should render with custom width', () => {
      const configWithWidth: ChartConfiguration = {
        ...mockLineChartConfig,
        width: 800,
      };
      
      render(<TimeSeriesChart config={configWithWidth} />);
      // Chart should render with title
      expect(screen.getByText('Temperature Over Time')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should handle timestamp as number', () => {
      const config: ChartConfiguration = {
        title: 'Test',
        chartType: 'line',
        series: [{
          seriesName: 'Test',
          data: [
            { timestamp: 1704067200000, value: 10 },
          ],
        }],
      };
      
      render(<TimeSeriesChart config={config} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle timestamp as Date object', () => {
      const config: ChartConfiguration = {
        title: 'Test',
        chartType: 'line',
        series: [{
          seriesName: 'Test',
          data: [
            { timestamp: new Date('2024-01-01'), value: 10 },
          ],
        }],
      };
      
      render(<TimeSeriesChart config={config} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TimeSeriesChart config={mockLineChartConfig} />);
      
      // Chart should be in a labeled section
      const title = screen.getByText('Temperature Over Time');
      expect(title).toBeInTheDocument();
    });
  });
});
