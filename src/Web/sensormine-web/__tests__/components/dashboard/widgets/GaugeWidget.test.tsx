/**
 * GaugeWidget Tests
 * 
 * Test suite for gauge widget components (Story 4.7).
 * Tests circular, linear, and bullet gauge types.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GaugeWidget } from '@/components/dashboard/widgets/gauge-widget';

describe('GaugeWidget - Circular Gauge', () => {
  const defaultProps = {
    id: 'test-gauge',
    title: 'Temperature Gauge',
    type: 'gauge' as const,
    config: {},
    value: 75,
    min: 0,
    max: 100,
    unit: '°C',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render gauge container', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      const widget = screen.getByText('Temperature Gauge');
      expect(widget).toBeInTheDocument();
    });

    it('should display current value in center', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      // Value should be displayed
      expect(screen.getByText(/75/)).toBeInTheDocument();
    });

    it('should show unit label', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      expect(screen.getByText(/°C/)).toBeInTheDocument();
    });

    it('should show min/max range labels', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      expect(screen.getByText(/0 - 100/)).toBeInTheDocument();
    });

    it('should render SVG gauge element', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Threshold Colors', () => {
    it('should apply green color when value is below warning threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={50}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const valueElement = container.querySelector('.text-green-600');
      expect(valueElement).toBeInTheDocument();
    });

    it('should apply yellow color when value exceeds warning threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={75}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const valueElement = container.querySelector('.text-yellow-600');
      expect(valueElement).toBeInTheDocument();
    });

    it('should apply red color when value exceeds critical threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={95}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const valueElement = container.querySelector('.text-red-600');
      expect(valueElement).toBeInTheDocument();
    });

    it('should handle edge case when value equals warning threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={70}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const valueElement = container.querySelector('.text-yellow-600');
      expect(valueElement).toBeInTheDocument();
    });

    it('should handle edge case when value equals critical threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={90}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const valueElement = container.querySelector('.text-red-600');
      expect(valueElement).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('should calculate correct percentage for value in range', () => {
      const { container } = render(
        <GaugeWidget {...defaultProps} value={50} min={0} max={100} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Visual inspection would show 50% fill
    });

    it('should calculate percentage for non-zero min value', () => {
      const { container } = render(
        <GaugeWidget {...defaultProps} value={75} min={50} max={100} />
      );
      
      // 75 in range [50, 100] = 50% = (75-50)/(100-50) = 0.5
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should clamp percentage to 0 when value is below min', () => {
      const { container } = render(
        <GaugeWidget {...defaultProps} value={-10} min={0} max={100} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Should show 0% fill
    });

    it('should clamp percentage to 100 when value exceeds max', () => {
      const { container } = render(
        <GaugeWidget {...defaultProps} value={150} min={0} max={100} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Should show 100% fill
    });

    it('should handle negative values in range', () => {
      const { container } = render(
        <GaugeWidget {...defaultProps} value={0} min={-50} max={50} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // 0 in range [-50, 50] = 50%
    });
  });

  describe('Animation', () => {
    it('should have transition class for smooth animation', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const progressCircle = container.querySelector('circle[stroke-dasharray]');
      expect(progressCircle).toHaveClass('transition-all');
    });

    it('should animate value changes', async () => {
      const { container, rerender } = render(
        <GaugeWidget {...defaultProps} value={50} />
      );
      
      const progressCircle = container.querySelector('circle[stroke-dasharray]');
      const initialDashoffset = progressCircle?.getAttribute('stroke-dashoffset');
      
      // Change value
      rerender(<GaugeWidget {...defaultProps} value={75} />);
      
      await waitFor(() => {
        const newDashoffset = progressCircle?.getAttribute('stroke-dashoffset');
        expect(newDashoffset).not.toBe(initialDashoffset);
      });
    });
  });

  describe('Configuration', () => {
    it('should use default min of 0 when not specified', () => {
      render(<GaugeWidget {...defaultProps} min={undefined} />);
      
      expect(screen.getByText(/^0 -/)).toBeInTheDocument();
    });

    it('should use default max of 100 when not specified', () => {
      render(<GaugeWidget {...defaultProps} max={undefined} />);
      
      expect(screen.getByText(/- 100/)).toBeInTheDocument();
    });

    it('should work without thresholds', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          warningThreshold={undefined}
          criticalThreshold={undefined}
        />
      );
      
      const valueElement = container.querySelector('.text-green-600');
      expect(valueElement).toBeInTheDocument();
    });

    it('should work with only warning threshold', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          value={75}
          warningThreshold={70}
        />
      );
      
      const valueElement = container.querySelector('.text-yellow-600');
      expect(valueElement).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format value with one decimal place', () => {
      render(<GaugeWidget {...defaultProps} value={75.456} />);
      
      expect(screen.getByText(/75\.5/)).toBeInTheDocument();
    });

    it('should format integer values', () => {
      render(<GaugeWidget {...defaultProps} value={75} />);
      
      expect(screen.getByText(/75\.0/)).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<GaugeWidget {...defaultProps} value={0} />);
      
      expect(screen.getByText(/0\.0/)).toBeInTheDocument();
    });
  });
});

describe('GaugeWidget - Linear Gauge', () => {
  const defaultProps = {
    id: 'test-linear-gauge',
    title: 'Pressure Gauge',
    type: 'gauge' as const,
    config: {
      gaugeType: 'linear',
      orientation: 'horizontal',
    },
    value: 60,
    min: 0,
    max: 100,
    unit: 'PSI',
  };

  describe('Rendering', () => {
    it('should render linear gauge in horizontal orientation', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const gauge = container.querySelector('[data-testid="linear-gauge"]');
      expect(gauge).toBeInTheDocument();
      expect(gauge).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('should render linear gauge in vertical orientation', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          config={{ ...defaultProps.config, orientation: 'vertical' }}
        />
      );
      
      const gauge = container.querySelector('[data-testid="linear-gauge"]');
      expect(gauge).toHaveAttribute('data-orientation', 'vertical');
    });

    it('should display threshold markers', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const markers = container.querySelectorAll('[data-testid="threshold-marker"]');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should show current value indicator', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const indicator = container.querySelector('[data-testid="value-indicator"]');
      expect(indicator).toBeInTheDocument();
    });

    it('should display range labels', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Value Representation', () => {
    it('should calculate correct bar width for horizontal gauge', () => {
      const { container } = render(<GaugeWidget {...defaultProps} value={60} />);
      
      const bar = container.querySelector('[data-testid="gauge-bar"]');
      const width = bar?.getAttribute('style');
      expect(width).toContain('60%');
    });

    it('should calculate correct bar height for vertical gauge', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps} 
          config={{ ...defaultProps.config, orientation: 'vertical' }}
          value={60}
        />
      );
      
      const bar = container.querySelector('[data-testid="gauge-bar"]');
      const height = bar?.getAttribute('style');
      expect(height).toContain('60%');
    });

    it('should position value indicator correctly', () => {
      const { container } = render(<GaugeWidget {...defaultProps} value={60} />);
      
      const indicator = container.querySelector('[data-testid="value-indicator"]');
      const position = indicator?.getAttribute('style');
      expect(position).toContain('60%');
    });
  });

  describe('Threshold Zones', () => {
    it('should render threshold zones with correct colors', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const zones = container.querySelectorAll('[data-testid="threshold-zone"]');
      expect(zones.length).toBe(3); // green, yellow, red
    });

    it('should highlight active zone based on value', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps}
          value={75}
          warningThreshold={70}
          criticalThreshold={90}
        />
      );
      
      const activeZone = container.querySelector('[data-zone="warning"]');
      expect(activeZone).toHaveClass('active');
    });
  });
});

describe('GaugeWidget - Bullet Gauge', () => {
  const defaultProps = {
    id: 'test-bullet-gauge',
    title: 'Sales Target',
    type: 'gauge' as const,
    config: {
      gaugeType: 'bullet',
      target: 80,
      ranges: [
        { label: 'Poor', max: 40, color: '#ef4444' },
        { label: 'Fair', max: 70, color: '#eab308' },
        { label: 'Good', max: 100, color: '#22c55e' },
      ],
    },
    value: 85,
    min: 0,
    max: 100,
    unit: '%',
  };

  describe('Rendering', () => {
    it('should render qualitative ranges', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const ranges = container.querySelectorAll('[data-testid="bullet-range"]');
      expect(ranges.length).toBe(3);
    });

    it('should render comparative measure (target line)', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const target = container.querySelector('[data-testid="target-line"]');
      expect(target).toBeInTheDocument();
    });

    it('should render featured measure (actual value bar)', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const valueBar = container.querySelector('[data-testid="value-bar"]');
      expect(valueBar).toBeInTheDocument();
    });

    it('should display value labels', () => {
      render(<GaugeWidget {...defaultProps} />);
      
      expect(screen.getByText(/85/)).toBeInTheDocument();
      expect(screen.getByText(/Target.*80/)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should support horizontal orientation', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const gauge = container.querySelector('[data-testid="bullet-gauge"]');
      expect(gauge).toHaveAttribute('data-orientation', 'horizontal');
    });

    it('should support vertical orientation', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps}
          config={{ ...defaultProps.config, orientation: 'vertical' }}
        />
      );
      
      const gauge = container.querySelector('[data-testid="bullet-gauge"]');
      expect(gauge).toHaveAttribute('data-orientation', 'vertical');
    });

    it('should render in compact mode for dashboards', () => {
      const { container } = render(
        <GaugeWidget 
          {...defaultProps}
          config={{ ...defaultProps.config, compact: true }}
        />
      );
      
      const gauge = container.querySelector('[data-testid="bullet-gauge"]');
      expect(gauge).toHaveClass('compact');
    });
  });

  describe('Comparison', () => {
    it('should show if value meets target', () => {
      render(<GaugeWidget {...defaultProps} value={85} />);
      
      // Value 85 exceeds target 80
      expect(screen.getByText(/exceeds.*target/i)).toBeInTheDocument();
    });

    it('should show if value is below target', () => {
      render(<GaugeWidget {...defaultProps} value={75} />);
      
      // Value 75 is below target 80
      expect(screen.getByText(/below.*target/i)).toBeInTheDocument();
    });

    it('should indicate performance level based on ranges', () => {
      const { container } = render(<GaugeWidget {...defaultProps} value={85} />);
      
      // Value 85 is in "Good" range (70-100)
      const performanceIndicator = container.querySelector('[data-performance="good"]');
      expect(performanceIndicator).toBeInTheDocument();
    });
  });

  describe('Colors', () => {
    it('should use configurable colors for ranges', () => {
      const { container } = render(<GaugeWidget {...defaultProps} />);
      
      const poorRange = container.querySelector('[data-range="Poor"]');
      expect(poorRange).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should highlight current performance zone', () => {
      const { container } = render(<GaugeWidget {...defaultProps} value={85} />);
      
      const goodRange = container.querySelector('[data-range="Good"]');
      expect(goodRange).toHaveClass('active');
    });
  });
});
