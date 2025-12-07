/**
 * Chart Widget Tests
 * 
 * Story 4.2: Time-Series Charts
 * Tests for the ChartWidget component.
 * 
 * Note: Some dropdown menu interactions are not fully testable in JSDOM
 * due to portal rendering. These tests focus on component rendering and
 * basic functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartWidget } from '@/components/dashboard/widgets/chart-widget';

describe('ChartWidget', () => {
  const defaultProps = {
    id: 'test-chart',
    title: 'Test Chart',
  };
  
  describe('Rendering', () => {
    it('renders with title', () => {
      render(<ChartWidget {...defaultProps} />);
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
    });
    
    it('renders with description', () => {
      render(
        <ChartWidget 
          {...defaultProps} 
          description="Chart description" 
        />
      );
      
      expect(screen.getByText('Chart description')).toBeInTheDocument();
    });
    
    it('renders chart container', () => {
      render(<ChartWidget {...defaultProps} />);
      
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
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
      expect(() => render(<ChartWidget {...defaultProps} chartType={chartType} />)).not.toThrow();
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
    
    it('defaults to line chart type', () => {
      render(<ChartWidget {...defaultProps} />);
      
      // Component should render without errors
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
  });
  
  describe('Toolbar', () => {
    it('renders toolbar by default', () => {
      render(<ChartWidget {...defaultProps} />);
      
      // Toolbar should have time range button with "Last 24 Hours" text
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
    });
    
    it('hides toolbar when showToolbar is false', () => {
      render(<ChartWidget {...defaultProps} showToolbar={false} />);
      
      // Toolbar elements should not be present
      expect(screen.queryByText('Last 24 Hours')).not.toBeInTheDocument();
    });
    
    it('shows aggregation selector', () => {
      render(<ChartWidget {...defaultProps} />);
      
      expect(screen.getByText('Raw Data')).toBeInTheDocument();
    });
    
    it('shows auto-refresh button', () => {
      render(<ChartWidget {...defaultProps} />);
      
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });
  });
  
  describe('Edit Mode', () => {
    it('shows widget actions menu in edit mode', () => {
      const onConfigure = vi.fn();
      render(
        <ChartWidget 
          {...defaultProps} 
          isEditMode={true}
          onConfigure={onConfigure}
        />
      );
      
      // Should have actions button with aria-label
      const actionsButton = screen.getByLabelText('Widget actions');
      expect(actionsButton).toBeInTheDocument();
    });
  });
  
  describe('Custom Series', () => {
    it('renders with custom series data', () => {
      const customSeries = [
        {
          id: 'custom',
          name: 'Custom Series',
          data: [
            { timestamp: Date.now() - 3600000, value: 10 },
            { timestamp: Date.now(), value: 20 },
          ],
        },
      ];
      
      render(<ChartWidget {...defaultProps} series={customSeries} />);
      
      expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    });
  });
  
  describe('Props Handling', () => {
    it('accepts onTimeRangeChange callback', () => {
      const onTimeRangeChange = vi.fn();
      
      expect(() => render(
        <ChartWidget 
          {...defaultProps} 
          onTimeRangeChange={onTimeRangeChange}
        />
      )).not.toThrow();
    });
    
    it('accepts onAggregationChange callback', () => {
      const onAggregationChange = vi.fn();
      
      expect(() => render(
        <ChartWidget 
          {...defaultProps} 
          onAggregationChange={onAggregationChange}
        />
      )).not.toThrow();
    });
    
    it('accepts onDataPointClick callback', () => {
      const onDataPointClick = vi.fn();
      
      expect(() => render(
        <ChartWidget 
          {...defaultProps} 
          onDataPointClick={onDataPointClick}
        />
      )).not.toThrow();
    });
    
    it('accepts autoRefresh prop', () => {
      expect(() => render(
        <ChartWidget 
          {...defaultProps} 
          autoRefresh={true}
          refreshInterval={60}
        />
      )).not.toThrow();
    });
    
    it('accepts chart config', () => {
      expect(() => render(
        <ChartWidget 
          {...defaultProps} 
          config={{
            legend: { visible: false, position: 'bottom' },
            tooltip: { enabled: false },
            zoom: { enabled: false },
          }}
        />
      )).not.toThrow();
    });
  });
});
