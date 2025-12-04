/**
 * KPIWidget Tests
 * 
 * Test suite for KPI widget component (Story 4.7).
 * Tests KPI cards with trends, comparisons, and sparklines.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { KPIWidget } from '@/components/dashboard/widgets/kpi-widget';

describe('KPIWidget', () => {
  const defaultProps = {
    id: 'test-kpi',
    title: 'Active Devices',
    type: 'kpi' as const,
    config: {},
    value: 145,
    unit: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Display', () => {
    it('should display current value', () => {
      render(<KPIWidget {...defaultProps} />);
      
      expect(screen.getByText('145')).toBeInTheDocument();
    });

    it('should display value with unit', () => {
      render(<KPIWidget {...defaultProps} unit="devices" />);
      
      expect(screen.getByText(/145/)).toBeInTheDocument();
      expect(screen.getByText(/devices/)).toBeInTheDocument();
    });

    it('should display string values', () => {
      render(<KPIWidget {...defaultProps} value="Online" />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should show title', () => {
      render(<KPIWidget {...defaultProps} />);
      
      expect(screen.getByText('Active Devices')).toBeInTheDocument();
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate upward trend from previous value', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={150}
          previousValue={100}
        />
      );
      
      // Trend should be up (150 > 100)
      const upIcon = screen.getByTestId('trend-up-icon');
      expect(upIcon).toBeInTheDocument();
    });

    it('should calculate downward trend from previous value', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={80}
          previousValue={100}
        />
      );
      
      // Trend should be down (80 < 100)
      const downIcon = screen.getByTestId('trend-down-icon');
      expect(downIcon).toBeInTheDocument();
    });

    it('should show neutral trend when values are equal', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={100}
          previousValue={100}
        />
      );
      
      // Trend should be neutral (100 = 100)
      const neutralIcon = screen.getByTestId('trend-neutral-icon');
      expect(neutralIcon).toBeInTheDocument();
    });

    it('should handle zero previous value', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={150}
          previousValue={0}
        />
      );
      
      // Should not crash, show trend up
      const upIcon = screen.getByTestId('trend-up-icon');
      expect(upIcon).toBeInTheDocument();
    });

    it('should calculate correct trend percentage', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={150}
          previousValue={100}
        />
      );
      
      // (150-100)/100 = 50%
      expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
    });

    it('should display trend percentage for decrease', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={75}
          previousValue={100}
        />
      );
      
      // (75-100)/100 = -25%, displayed as 25.0%
      expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
    });
  });

  describe('Trend Icon Display', () => {
    it('should show up arrow for upward trend', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          trend="up"
        />
      );
      
      const upIcon = screen.getByTestId('trend-up-icon');
      expect(upIcon).toBeInTheDocument();
    });

    it('should show down arrow for downward trend', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          trend="down"
        />
      );
      
      const downIcon = screen.getByTestId('trend-down-icon');
      expect(downIcon).toBeInTheDocument();
    });

    it('should show minus icon for neutral trend', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          trend="neutral"
        />
      );
      
      const neutralIcon = screen.getByTestId('trend-neutral-icon');
      expect(neutralIcon).toBeInTheDocument();
    });
  });

  describe('Trend Color Coding', () => {
    it('should show green for positive upward trend', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps} 
          trend="up"
          trendIsPositive={true}
        />
      );
      
      const trendElement = container.querySelector('.text-green-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should show red for negative upward trend', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps} 
          trend="up"
          trendIsPositive={false}
        />
      );
      
      const trendElement = container.querySelector('.text-red-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should show red for negative downward trend', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps} 
          trend="down"
          trendIsPositive={true}
        />
      );
      
      const trendElement = container.querySelector('.text-red-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should show green for positive downward trend', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps} 
          trend="down"
          trendIsPositive={false}
        />
      );
      
      const trendElement = container.querySelector('.text-green-600');
      expect(trendElement).toBeInTheDocument();
    });

    it('should show gray for neutral trend', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps} 
          trend="neutral"
        />
      );
      
      const trendElement = container.querySelector('.text-muted-foreground');
      expect(trendElement).toBeInTheDocument();
    });
  });

  describe('Comparison Modes', () => {
    it('should compare against previous value', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          value={150}
          previousValue={100}
          config={{ comparisonMode: 'previous' }}
        />
      );
      
      expect(screen.getByText(/vs previous period/i)).toBeInTheDocument();
    });

    it('should compare against target value', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          value={150}
          config={{ 
            comparisonMode: 'target',
            targetValue: 200,
          }}
        />
      );
      
      expect(screen.getByText(/vs target/i)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it('should compare against historical average', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          value={150}
          config={{ 
            comparisonMode: 'average',
            averageValue: 120,
          }}
        />
      );
      
      expect(screen.getByText(/vs average/i)).toBeInTheDocument();
    });

    it('should display custom comparison label', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          trendLabel="vs last week"
        />
      );
      
      expect(screen.getByText(/vs last week/i)).toBeInTheDocument();
    });
  });

  describe('Sparkline Visualization', () => {
    const historyData = [
      { timestamp: '2025-12-01', value: 100 },
      { timestamp: '2025-12-02', value: 110 },
      { timestamp: '2025-12-03', value: 105 },
      { timestamp: '2025-12-04', value: 120 },
      { timestamp: '2025-12-05', value: 145 },
    ];

    it('should render sparkline when history data is provided', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          config={{ 
            showSparkline: true,
            historyData,
          }}
        />
      );
      
      const sparkline = container.querySelector('[data-testid="sparkline"]');
      expect(sparkline).toBeInTheDocument();
    });

    it('should not render sparkline when disabled', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          config={{ 
            showSparkline: false,
            historyData,
          }}
        />
      );
      
      const sparkline = container.querySelector('[data-testid="sparkline"]');
      expect(sparkline).not.toBeInTheDocument();
    });

    it('should highlight current value in sparkline', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          value={145}
          config={{ 
            showSparkline: true,
            historyData,
          }}
        />
      );
      
      const currentPoint = container.querySelector('[data-testid="current-value-point"]');
      expect(currentPoint).toBeInTheDocument();
    });

    it('should show last N data points based on config', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          config={{ 
            showSparkline: true,
            historyData,
            sparklinePoints: 3,
          }}
        />
      );
      
      const points = container.querySelectorAll('[data-testid="sparkline-point"]');
      expect(points.length).toBe(3);
    });
  });

  describe('Threshold Indicators', () => {
    it('should apply warning color when below threshold', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          value={50}
          config={{
            warningThreshold: 100,
            criticalThreshold: 150,
          }}
        />
      );
      
      const badge = container.querySelector('[data-testid="threshold-badge"]');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('should apply success color when meeting target', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          value={150}
          config={{
            targetValue: 100,
          }}
        />
      );
      
      const badge = container.querySelector('[data-testid="threshold-badge"]');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('should apply error color when critical', () => {
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          value={200}
          config={{
            warningThreshold: 100,
            criticalThreshold: 150,
          }}
        />
      );
      
      const badge = container.querySelector('[data-testid="threshold-badge"]');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('should show threshold label', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          value={50}
          config={{
            warningThreshold: 100,
            thresholdLabel: 'Below target',
          }}
        />
      );
      
      expect(screen.getByText(/Below target/i)).toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should poll data at configured interval', async () => {
      const onRefresh = vi.fn();
      
      render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: true,
            refreshInterval: 5000,
          }}
          onRefresh={onRefresh}
        />
      );
      
      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading indicator during refresh', async () => {
      const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      const { container } = render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: true,
            refreshInterval: 5000,
          }}
          onRefresh={onRefresh}
        />
      );
      
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        const loader = container.querySelector('[data-testid="loading-indicator"]');
        expect(loader).toBeInTheDocument();
      });
    });

    it('should handle refresh errors gracefully', async () => {
      const onRefresh = vi.fn(() => Promise.reject(new Error('Network error')));
      
      render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: true,
            refreshInterval: 5000,
          }}
          onRefresh={onRefresh}
        />
      );
      
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should allow manual refresh', async () => {
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn(() => Promise.resolve());
      
      render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: true,
            showRefreshButton: true,
          }}
          onRefresh={onRefresh}
        />
      );
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(onRefresh).toHaveBeenCalled();
    });

    it('should stop refresh when unmounted', () => {
      const onRefresh = vi.fn();
      
      const { unmount } = render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: true,
            refreshInterval: 5000,
          }}
          onRefresh={onRefresh}
        />
      );
      
      unmount();
      
      vi.advanceTimersByTime(10000);
      
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should not auto-refresh when disabled', () => {
      const onRefresh = vi.fn();
      
      render(
        <KPIWidget 
          {...defaultProps}
          config={{
            autoRefresh: false,
            refreshInterval: 5000,
          }}
          onRefresh={onRefresh}
        />
      );
      
      vi.advanceTimersByTime(10000);
      
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Value Formatting', () => {
    it('should format large numbers with commas', () => {
      render(<KPIWidget {...defaultProps} value={1234567} />);
      
      expect(screen.getByText(/1,234,567/)).toBeInTheDocument();
    });

    it('should format decimal values', () => {
      render(<KPIWidget {...defaultProps} value={123.456} />);
      
      expect(screen.getByText(/123\.5/)).toBeInTheDocument();
    });

    it('should format percentage values', () => {
      render(<KPIWidget {...defaultProps} value={0.856} unit="%" config={{ formatAsPercentage: true }} />);
      
      expect(screen.getByText(/85\.6%/)).toBeInTheDocument();
    });

    it('should use custom number format', () => {
      render(
        <KPIWidget 
          {...defaultProps} 
          value={1234.5}
          config={{ 
            numberFormat: {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          }}
        />
      );
      
      expect(screen.getByText(/1,234\.50/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<KPIWidget {...defaultProps} />);
      
      const widget = screen.getByRole('region', { name: /Active Devices/i });
      expect(widget).toBeInTheDocument();
    });

    it('should announce trend changes', () => {
      render(
        <KPIWidget 
          {...defaultProps}
          value={150}
          previousValue={100}
        />
      );
      
      const trendAnnouncement = screen.getByRole('status');
      expect(trendAnnouncement).toHaveTextContent(/50\.0%.*up/i);
    });
  });
});
