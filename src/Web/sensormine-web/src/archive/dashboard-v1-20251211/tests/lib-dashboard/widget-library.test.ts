/**
 * Widget Registry Tests (Story 4.1)
 * Updated to use consolidated WIDGET_REGISTRY
 */

import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  getWidgetDefinition,
  getAvailableWidgets,
} from '@/lib/stores/widget-registry';
import {
  DASHBOARD_TEMPLATES,
  GRID_CONFIG,
  getTemplateById,
} from '@/lib/dashboard/widget-library';

describe('Widget Registry', () => {
  describe('WIDGET_REGISTRY', () => {
    it('contains expected widget types', () => {
      const types = WIDGET_REGISTRY.map((w) => w.type);
      
      expect(types).toContain('chart');
      expect(types).toContain('table');
      expect(types).toContain('map');
      expect(types).toContain('gauge');
      expect(types).toContain('kpi');
      expect(types).toContain('device-list');
    });

    it('all widgets have required properties', () => {
      WIDGET_REGISTRY.forEach((widget) => {
        expect(widget.type).toBeDefined();
        expect(widget.name).toBeDefined();
        expect(widget.description).toBeDefined();
        expect(widget.icon).toBeDefined();
        expect(widget.defaultSize).toBeDefined();
        expect(widget.minSize).toBeDefined();
        expect(widget.category).toBeDefined();
        expect(widget.defaultSize.w).toBeGreaterThan(0);
        expect(widget.defaultSize.h).toBeGreaterThan(0);
      });
    });

    it('chart widget is available', () => {
      const chartWidget = getWidgetDefinition('chart');
      
      expect(chartWidget).toBeDefined();
      expect(chartWidget?.type).toBe('chart');
      expect(chartWidget?.available).toBe(true);
    });

    it('gauge widget has correct properties', () => {
      const gaugeWidget = getWidgetDefinition('gauge');
      
      expect(gaugeWidget).toBeDefined();
      expect(gaugeWidget?.type).toBe('gauge');
      expect(gaugeWidget?.category).toBe('monitoring');
    });

    it('getAvailableWidgets returns only available widgets', () => {
      const available = getAvailableWidgets();
      
      expect(available.length).toBeGreaterThan(0);
      available.forEach(widget => {
        expect(widget.available).toBe(true);
      });
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

  describe('getWidgetDefinition', () => {
    it('returns widget for valid type', () => {
      const widget = getWidgetDefinition('chart');
      
      expect(widget).toBeDefined();
      expect(widget?.type).toBe('chart');
    });

    it('returns undefined for invalid type', () => {
      const widget = getWidgetDefinition('invalid');
      
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
