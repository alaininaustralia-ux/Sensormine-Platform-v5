/**
 * Widget Library Tests (Story 4.1)
 */

import { describe, it, expect } from 'vitest';
import {
  WIDGET_LIBRARY,
  DASHBOARD_TEMPLATES,
  GRID_CONFIG,
  getWidgetByType,
  getTemplateById,
} from '@/lib/dashboard/widget-library';

describe('Widget Library', () => {
  describe('WIDGET_LIBRARY', () => {
    it('contains expected widget types', () => {
      const types = WIDGET_LIBRARY.map((w) => w.type);
      
      expect(types).toContain('chart');
      expect(types).toContain('table');
      expect(types).toContain('map');
      expect(types).toContain('video');
      expect(types).toContain('gauge');
      expect(types).toContain('kpi');
      expect(types).toContain('text');
    });

    it('all widgets have required properties', () => {
      WIDGET_LIBRARY.forEach((widget) => {
        expect(widget.type).toBeDefined();
        expect(widget.name).toBeDefined();
        expect(widget.description).toBeDefined();
        expect(widget.icon).toBeDefined();
        expect(widget.defaultConfig).toBeDefined();
        expect(widget.defaultSize).toBeDefined();
        expect(widget.defaultSize.width).toBeGreaterThan(0);
        expect(widget.defaultSize.height).toBeGreaterThan(0);
      });
    });

    it('chart widget has correct config type', () => {
      const chartWidget = WIDGET_LIBRARY.find((w) => w.type === 'chart');
      
      expect(chartWidget?.defaultConfig.type).toBe('chart');
      expect(chartWidget?.defaultConfig.config).toHaveProperty('type');
    });

    it('gauge widget has min/max config', () => {
      const gaugeWidget = WIDGET_LIBRARY.find((w) => w.type === 'gauge');
      
      expect(gaugeWidget?.defaultConfig.type).toBe('gauge');
      expect(gaugeWidget?.defaultConfig.config).toHaveProperty('min');
      expect(gaugeWidget?.defaultConfig.config).toHaveProperty('max');
    });
  });

  describe('DASHBOARD_TEMPLATES', () => {
    it('contains blank template', () => {
      const blankTemplate = DASHBOARD_TEMPLATES.find((t) => t.id === 'blank');
      
      expect(blankTemplate).toBeDefined();
      expect(blankTemplate?.widgets).toEqual([]);
    });

    it('all templates have required properties', () => {
      DASHBOARD_TEMPLATES.forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.widgets).toBeDefined();
        expect(template.layoutType).toBeDefined();
      });
    });

    it('device-overview template has widgets', () => {
      const deviceTemplate = DASHBOARD_TEMPLATES.find((t) => t.id === 'device-overview');
      
      expect(deviceTemplate).toBeDefined();
      expect(deviceTemplate?.widgets.length).toBeGreaterThan(0);
    });

    it('template widgets have valid positions', () => {
      DASHBOARD_TEMPLATES.forEach((template) => {
        template.widgets.forEach((widget) => {
          expect(widget.position.x).toBeGreaterThanOrEqual(0);
          expect(widget.position.y).toBeGreaterThanOrEqual(0);
          expect(widget.position.width).toBeGreaterThan(0);
          expect(widget.position.height).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('GRID_CONFIG', () => {
    it('has valid column count', () => {
      expect(GRID_CONFIG.columns).toBeGreaterThan(0);
      expect(GRID_CONFIG.columns).toBeLessThanOrEqual(12);
    });

    it('has valid row height', () => {
      expect(GRID_CONFIG.rowHeight).toBeGreaterThan(0);
    });

    it('has valid widget size constraints', () => {
      expect(GRID_CONFIG.minWidgetWidth).toBeGreaterThan(0);
      expect(GRID_CONFIG.minWidgetHeight).toBeGreaterThan(0);
      expect(GRID_CONFIG.maxWidgetWidth).toBeGreaterThanOrEqual(GRID_CONFIG.minWidgetWidth);
      expect(GRID_CONFIG.maxWidgetHeight).toBeGreaterThanOrEqual(GRID_CONFIG.minWidgetHeight);
    });
  });

  describe('getWidgetByType', () => {
    it('returns widget for valid type', () => {
      const widget = getWidgetByType('chart');
      
      expect(widget).toBeDefined();
      expect(widget?.type).toBe('chart');
    });

    it('returns undefined for invalid type', () => {
      const widget = getWidgetByType('invalid');
      
      expect(widget).toBeUndefined();
    });
  });

  describe('getTemplateById', () => {
    it('returns template for valid id', () => {
      const template = getTemplateById('blank');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('blank');
    });

    it('returns undefined for invalid id', () => {
      const template = getTemplateById('invalid');
      
      expect(template).toBeUndefined();
    });
  });
});
