/**
 * Dashboard Templates Tests
 * Unit tests for dashboard template library (Story 4.8)
 */

import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  createDashboardFromTemplate,
  exportTemplate,
  importTemplate,
  validateTemplate,
} from '@/lib/templates/dashboard-templates';
import type { DashboardTemplate } from '@/lib/types/dashboard';

describe('Dashboard Templates Library', () => {
  describe('DASHBOARD_TEMPLATES', () => {
    it('should have at least 5 templates', () => {
      expect(DASHBOARD_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it('should include required templates', () => {
      const templateIds = DASHBOARD_TEMPLATES.map(t => t.id);
      expect(templateIds).toContain('template-operations-overview');
      expect(templateIds).toContain('template-realtime-monitoring');
      expect(templateIds).toContain('template-analytics');
      expect(templateIds).toContain('template-maintenance');
      expect(templateIds).toContain('template-executive-summary');
    });

    it('should have all templates with valid structure', () => {
      DASHBOARD_TEMPLATES.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('icon');
        expect(template).toHaveProperty('widgets');
        expect(template).toHaveProperty('layout');
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(Array.isArray(template.widgets)).toBe(true);
        expect(Array.isArray(template.layout)).toBe(true);
      });
    });

    it('should have matching widget and layout counts', () => {
      DASHBOARD_TEMPLATES.forEach((template) => {
        expect(template.widgets.length).toBe(template.layout.length);
      });
    });

    it('should categorize templates correctly', () => {
      const validCategories = ['operations', 'maintenance', 'security', 'analytics', 'custom'];
      DASHBOARD_TEMPLATES.forEach((template) => {
        expect(validCategories).toContain(template.category);
      });
    });

    it('should have unique template IDs', () => {
      const ids = DASHBOARD_TEMPLATES.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getTemplate', () => {
    it('should find template by ID', () => {
      const template = getTemplate('template-operations-overview');
      expect(template).toBeDefined();
      expect(template?.id).toBe('template-operations-overview');
    });

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter templates by category', () => {
      const operationsTemplates = getTemplatesByCategory('operations');
      expect(operationsTemplates.length).toBeGreaterThan(0);
      operationsTemplates.forEach(t => {
        expect(t.category).toBe('operations');
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = getTemplatesByCategory('non-existent');
      expect(templates).toEqual([]);
    });

    it('should return all templates for "all" category', () => {
      const allTemplates = getTemplatesByCategory('all');
      expect(allTemplates.length).toBe(DASHBOARD_TEMPLATES.length);
    });
  });

  describe('createDashboardFromTemplate', () => {
    it('should create dashboard from template', () => {
      const dashboard = createDashboardFromTemplate(
        'template-operations-overview',
        'My Operations Dashboard',
        'user-123'
      );
      
      expect(dashboard).toBeDefined();
      expect(dashboard?.name).toBe('My Operations Dashboard');
      expect(dashboard?.createdBy).toBe('user-123');
      expect(dashboard?.isTemplate).toBe(false);
      expect(dashboard?.widgets.length).toBeGreaterThan(0);
      expect(dashboard?.layout.length).toBeGreaterThan(0);
    });

    it('should generate unique widget IDs', () => {
      const dashboard = createDashboardFromTemplate(
        'template-operations-overview',
        'Test Dashboard',
        'user-123'
      );
      
      const widgetIds = dashboard?.widgets.map(w => w.id) || [];
      const layoutIds = dashboard?.layout.map(l => l.i) || [];
      
      expect(new Set(widgetIds).size).toBe(widgetIds.length);
      expect(widgetIds).toEqual(layoutIds);
    });

    it('should return null for non-existent template', () => {
      const dashboard = createDashboardFromTemplate(
        'non-existent',
        'Test',
        'user-123'
      );
      expect(dashboard).toBeNull();
    });
  });

  describe('exportTemplate', () => {
    it('should export template as JSON', () => {
      const template = getTemplate('template-operations-overview');
      const json = exportTemplate(template!);
      
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('template-operations-overview');
      expect(parsed.widgets).toBeDefined();
      expect(parsed.layout).toBeDefined();
    });

    it('should include metadata in export', () => {
      const template = getTemplate('template-operations-overview');
      const json = exportTemplate(template!);
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('description');
      expect(parsed).toHaveProperty('category');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('version');
    });
  });

  describe('importTemplate', () => {
    it('should import template from JSON', () => {
      const originalTemplate = getTemplate('template-operations-overview');
      const json = exportTemplate(originalTemplate!);
      const imported = importTemplate(json);
      
      expect(imported).toBeDefined();
      expect(imported.name).toBe(originalTemplate?.name);
      expect(imported.widgets.length).toBe(originalTemplate?.widgets.length);
    });

    it('should validate imported template structure', () => {
      const invalidJson = JSON.stringify({ invalid: 'template' });
      expect(() => importTemplate(invalidJson)).toThrow();
    });

    it('should handle malformed JSON', () => {
      expect(() => importTemplate('invalid json')).toThrow();
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = getTemplate('template-operations-overview');
      const result = validateTemplate(template!);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should catch missing required fields', () => {
      const invalidTemplate = {
        id: 'test',
        // missing name, description, etc.
      } as unknown as DashboardTemplate;
      
      const result = validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should catch layout/widget count mismatch', () => {
      const template = getTemplate('template-operations-overview');
      const invalidTemplate = {
        ...template,
        layout: [], // Empty layout but has widgets
      } as DashboardTemplate;
      
      const result = validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Widget count must match layout count');
    });
  });

  describe('Template Categories', () => {
    it('should have operations templates', () => {
      const operations = getTemplatesByCategory('operations');
      expect(operations.length).toBeGreaterThan(0);
    });

    it('should have maintenance templates', () => {
      const maintenance = getTemplatesByCategory('maintenance');
      expect(maintenance.length).toBeGreaterThan(0);
    });

    it('should have analytics templates', () => {
      const analytics = getTemplatesByCategory('analytics');
      expect(analytics.length).toBeGreaterThan(0);
    });
  });
});
