/**
 * Chart Types Tests
 * 
 * Story 4.2: Time-Series Charts
 * Tests for chart type definitions and utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CHART_CONFIG,
  TIME_RANGE_PRESETS,
  AGGREGATION_INTERVALS,
  CHART_COLORS,
  getSeriesColor,
} from '@/lib/types/chart';

describe('Chart Types', () => {
  describe('DEFAULT_CHART_CONFIG', () => {
    it('has default chart type of line', () => {
      expect(DEFAULT_CHART_CONFIG.chartType).toBe('line');
    });
    
    it('has legend enabled by default', () => {
      expect(DEFAULT_CHART_CONFIG.legend?.visible).toBe(true);
    });
    
    it('has legend positioned at bottom by default', () => {
      expect(DEFAULT_CHART_CONFIG.legend?.position).toBe('bottom');
    });
    
    it('has tooltip enabled by default', () => {
      expect(DEFAULT_CHART_CONFIG.tooltip?.enabled).toBe(true);
    });
    
    it('has shared tooltip by default', () => {
      expect(DEFAULT_CHART_CONFIG.tooltip?.shared).toBe(true);
    });
    
    it('has zoom enabled by default', () => {
      expect(DEFAULT_CHART_CONFIG.zoom?.enabled).toBe(true);
    });
    
    it('has animations enabled by default', () => {
      expect(DEFAULT_CHART_CONFIG.animate).toBe(true);
    });
    
    it('has animation duration of 300ms', () => {
      expect(DEFAULT_CHART_CONFIG.animationDuration).toBe(300);
    });
  });
  
  describe('TIME_RANGE_PRESETS', () => {
    it('has 1 hour preset', () => {
      expect(TIME_RANGE_PRESETS['1h']).toBeDefined();
      expect(TIME_RANGE_PRESETS['1h'].hours).toBe(1);
    });
    
    it('has 24 hour preset', () => {
      expect(TIME_RANGE_PRESETS['24h']).toBeDefined();
      expect(TIME_RANGE_PRESETS['24h'].hours).toBe(24);
    });
    
    it('has 7 day preset', () => {
      expect(TIME_RANGE_PRESETS['7d']).toBeDefined();
      expect(TIME_RANGE_PRESETS['7d'].hours).toBe(24 * 7);
    });
    
    it('has 30 day preset', () => {
      expect(TIME_RANGE_PRESETS['30d']).toBeDefined();
      expect(TIME_RANGE_PRESETS['30d'].hours).toBe(24 * 30);
    });
    
    it('has custom preset without hours', () => {
      expect(TIME_RANGE_PRESETS['custom']).toBeDefined();
      expect(TIME_RANGE_PRESETS['custom'].hours).toBeUndefined();
    });
    
    it('has labels for all presets', () => {
      Object.values(TIME_RANGE_PRESETS).forEach(preset => {
        expect(preset.label).toBeDefined();
        expect(typeof preset.label).toBe('string');
      });
    });
  });
  
  describe('AGGREGATION_INTERVALS', () => {
    it('has raw data option', () => {
      expect(AGGREGATION_INTERVALS['raw']).toBeDefined();
      expect(AGGREGATION_INTERVALS['raw'].minutes).toBe(0);
    });
    
    it('has 1 minute interval', () => {
      expect(AGGREGATION_INTERVALS['1m']).toBeDefined();
      expect(AGGREGATION_INTERVALS['1m'].minutes).toBe(1);
    });
    
    it('has 1 hour interval', () => {
      expect(AGGREGATION_INTERVALS['1h']).toBeDefined();
      expect(AGGREGATION_INTERVALS['1h'].minutes).toBe(60);
    });
    
    it('has 1 day interval', () => {
      expect(AGGREGATION_INTERVALS['1d']).toBeDefined();
      expect(AGGREGATION_INTERVALS['1d'].minutes).toBe(1440);
    });
    
    it('has labels for all intervals', () => {
      Object.values(AGGREGATION_INTERVALS).forEach(interval => {
        expect(interval.label).toBeDefined();
        expect(typeof interval.label).toBe('string');
      });
    });
  });
  
  describe('CHART_COLORS', () => {
    it('has at least 10 colors', () => {
      expect(CHART_COLORS.length).toBeGreaterThanOrEqual(10);
    });
    
    it('contains valid hex colors', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      CHART_COLORS.forEach(color => {
        expect(color).toMatch(hexRegex);
      });
    });
    
    it('has unique colors', () => {
      const uniqueColors = new Set(CHART_COLORS);
      expect(uniqueColors.size).toBe(CHART_COLORS.length);
    });
  });
  
  describe('getSeriesColor', () => {
    it('returns first color for index 0', () => {
      expect(getSeriesColor(0)).toBe(CHART_COLORS[0]);
    });
    
    it('returns second color for index 1', () => {
      expect(getSeriesColor(1)).toBe(CHART_COLORS[1]);
    });
    
    it('wraps around for indices >= color count', () => {
      const colorCount = CHART_COLORS.length;
      expect(getSeriesColor(colorCount)).toBe(CHART_COLORS[0]);
      expect(getSeriesColor(colorCount + 1)).toBe(CHART_COLORS[1]);
    });
    
    it('handles large indices', () => {
      const result = getSeriesColor(1000);
      expect(CHART_COLORS).toContain(result);
    });
  });
});
