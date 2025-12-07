/**
 * Table Widget Configuration
 * 
 * Configuration panel for table widget-specific options including
 * column settings, pagination, sorting, and filtering.
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { WidgetConfigComponentProps } from './types';

export interface TableWidgetConfigType {
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  striped?: boolean;
  compact?: boolean;
  showHeader?: boolean;
}

export function TableWidgetConfig({
  config,
  onChange,
}: WidgetConfigComponentProps<TableWidgetConfigType>) {
  const updateConfig = (updates: Partial<TableWidgetConfigType>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Table Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-sorting">Enable Sorting</Label>
            <Switch
              id="enable-sorting"
              checked={config.enableSorting ?? true}
              onCheckedChange={(checked) => updateConfig({ enableSorting: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-filtering">Enable Filtering</Label>
            <Switch
              id="enable-filtering"
              checked={config.enableFiltering ?? false}
              onCheckedChange={(checked) => updateConfig({ enableFiltering: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-pagination">Enable Pagination</Label>
            <Switch
              id="enable-pagination"
              checked={config.enablePagination ?? true}
              onCheckedChange={(checked) => updateConfig({ enablePagination: checked })}
            />
          </div>
        </div>
      </div>

      {config.enablePagination && (
        <div>
          <h3 className="text-sm font-medium mb-4">Pagination</h3>
          <div className="space-y-2">
            <Label htmlFor="page-size">Rows Per Page</Label>
            <Input
              id="page-size"
              type="number"
              min="5"
              max="100"
              value={config.pageSize ?? 10}
              onChange={(e) => updateConfig({ pageSize: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="striped">Striped Rows</Label>
              <div className="text-xs text-muted-foreground">
                Alternate row background colors
              </div>
            </div>
            <Switch
              id="striped"
              checked={config.striped ?? true}
              onCheckedChange={(checked) => updateConfig({ striped: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact">Compact Mode</Label>
              <div className="text-xs text-muted-foreground">
                Reduce row height and padding
              </div>
            </div>
            <Switch
              id="compact"
              checked={config.compact ?? false}
              onCheckedChange={(checked) => updateConfig({ compact: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-header">Show Header</Label>
            <Switch
              id="show-header"
              checked={config.showHeader ?? true}
              onCheckedChange={(checked) => updateConfig({ showHeader: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
