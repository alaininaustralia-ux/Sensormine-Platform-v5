/**
 * Widget Data Configuration
 * 
 * Configure data sources and fields for dashboard widgets using device types and schemas.
 * Integrates with FieldSelector to allow schema-driven field selection.
 */

'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldSelector, type SelectedField } from './field-selector';
import { Plus, X } from 'lucide-react';

export interface DataSourceConfig {
  type: 'realtime' | 'historical' | 'aggregated';
  fields: SelectedField[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeRange?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  refreshInterval?: number; // seconds
}

export interface WidgetDataConfig {
  dataSource: DataSourceConfig;
  filters?: Record<string, unknown>;
}

interface WidgetDataConfigProps {
  config: WidgetDataConfig;
  onChange: (config: WidgetDataConfig) => void;
  widgetType: 'chart' | 'gauge' | 'kpi' | 'table' | 'map' | 'video';
}

export function WidgetDataConfig({ config, onChange, widgetType }: WidgetDataConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const handleFieldsChange = (fields: SelectedField[]) => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        fields,
      },
    });
  };

  const handleDataSourceTypeChange = (type: DataSourceConfig['type']) => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        type,
      },
    });
  };

  const handleAggregationChange = (aggregation: DataSourceConfig['aggregation']) => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        aggregation,
      },
    });
  };

  const handleTimeRangeChange = (value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks') => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        timeRange: { value, unit },
      },
    });
  };

  const handleRefreshIntervalChange = (interval: number) => {
    onChange({
      ...config,
      dataSource: {
        ...config.dataSource,
        refreshInterval: interval,
      },
    });
  };

  const getRecommendedConfig = () => {
    switch (widgetType) {
      case 'gauge':
      case 'kpi':
        return {
          dataSourceType: 'realtime' as const,
          aggregation: 'avg' as const,
          maxFields: 1,
          hint: 'Select a single numeric field to display',
        };
      case 'chart':
        return {
          dataSourceType: 'historical' as const,
          aggregation: 'avg' as const,
          maxFields: 5,
          hint: 'Select up to 5 fields to plot over time',
        };
      case 'table':
        return {
          dataSourceType: 'realtime' as const,
          aggregation: undefined,
          maxFields: 10,
          hint: 'Select multiple fields to display in a table',
        };
      default:
        return {
          dataSourceType: 'realtime' as const,
          aggregation: undefined,
          maxFields: 5,
          hint: 'Select fields to display',
        };
    }
  };

  const recommended = getRecommendedConfig();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Data Source</h4>
          <p className="text-xs text-muted-foreground mb-4">{recommended.hint}</p>
        </div>

        <div className="space-y-2">
          <Label>Data Type</Label>
          <Select
            value={config.dataSource.type}
            onValueChange={handleDataSourceTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time Data</SelectItem>
              <SelectItem value="historical">Historical Data</SelectItem>
              <SelectItem value="aggregated">Aggregated Data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.dataSource.type === 'historical' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Input
                type="number"
                value={config.dataSource.timeRange?.value || 24}
                onChange={(e) =>
                  handleTimeRangeChange(
                    parseInt(e.target.value),
                    config.dataSource.timeRange?.unit || 'hours'
                  )
                }
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={config.dataSource.timeRange?.unit || 'hours'}
                onValueChange={(value: 'minutes' | 'hours' | 'days' | 'weeks') =>
                  handleTimeRangeChange(config.dataSource.timeRange?.value || 24, value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {(config.dataSource.type === 'historical' || config.dataSource.type === 'aggregated') && (
          <div className="space-y-2">
            <Label>Aggregation</Label>
            <Select
              value={config.dataSource.aggregation || 'avg'}
              onValueChange={(value) => handleAggregationChange(value as DataSourceConfig['aggregation'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {config.dataSource.type === 'realtime' && (
          <div className="space-y-2">
            <Label>Refresh Interval (seconds)</Label>
            <Input
              type="number"
              value={config.dataSource.refreshInterval || 5}
              onChange={(e) => handleRefreshIntervalChange(parseInt(e.target.value))}
              min={1}
              max={300}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Selected Fields ({config.dataSource.fields.length})</Label>
          {!showFieldSelector && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFieldSelector(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Fields
            </Button>
          )}
        </div>

        {config.dataSource.fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.dataSource.fields.map((field, index) => (
              <Badge
                key={`${field.deviceTypeId}-${field.fieldPath}-${index}`}
                variant="default"
                className="cursor-pointer"
                onClick={() => {
                  handleFieldsChange(config.dataSource.fields.filter((_, i) => i !== index));
                }}
              >
                {field.deviceTypeName}: {field.fieldName}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {showFieldSelector && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Select Fields</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFieldSelector(false)}
              >
                Done
              </Button>
            </div>
            <FieldSelector
              selectedFields={config.dataSource.fields}
              onFieldsChange={handleFieldsChange}
              multiSelect={recommended.maxFields > 1}
            />
          </div>
        )}

        {!showFieldSelector && config.dataSource.fields.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            No fields selected. Click &quot;Add Fields&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
