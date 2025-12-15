/**
 * Widget Field Selection Configuration
 * 
 * Widget-specific field selection components that handle different data patterns:
 * - Single value (KPI, Gauge)
 * - Multi-series time-based (Chart)
 * - Multi-field (Table)
 * - Geospatial (Map)
 * - Categorical (Pie/Bar)
 */

'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FieldSelector, type SelectedField } from '../field-selector';
import { Plus, X } from 'lucide-react';

// ============================================================================
// KPI Field Configuration - Single Value + Optional Trend
// ============================================================================

export interface KpiFieldConfig {
  primaryField?: SelectedField;
  aggregation: 'current' | 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeRange?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  enableTrend: boolean;
  trendComparisonPeriod?: 'previous' | 'hour' | 'day' | 'week' | 'month';
}

interface KpiFieldConfigProps {
  config: KpiFieldConfig;
  onChange: (config: KpiFieldConfig) => void;
}

export function KpiFieldSelection({ config, onChange }: KpiFieldConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const handleFieldSelect = (field: SelectedField) => {
    onChange({ ...config, primaryField: field });
    setShowFieldSelector(false);
  };

  const handleRemoveField = () => {
    onChange({ ...config, primaryField: undefined });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Data Pattern: Single Value</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select one numeric field to display as a KPI metric
        </p>
      </div>

      <div className="space-y-2">
        <Label>Primary Metric *</Label>
        {config.primaryField ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              {config.primaryField.fieldName}
              <span className="text-xs text-muted-foreground ml-2">
                ({config.primaryField.deviceTypeName})
              </span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveField}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFieldSelector(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Select Field
          </Button>
        )}
      </div>

      {showFieldSelector && (
        <FieldSelector
          onSelect={handleFieldSelect}
          onCancel={() => setShowFieldSelector(false)}
          allowMultiple={false}
        />
      )}

      <div className="space-y-2">
        <Label>Aggregation Method</Label>
        <Select
          value={config.aggregation}
          onValueChange={(value) =>
            onChange({ ...config, aggregation: value as KpiFieldConfig['aggregation'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Value (Latest)</SelectItem>
            <SelectItem value="avg">Average</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
            <SelectItem value="count">Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.aggregation !== 'current' && (
        <div className="space-y-2">
          <Label>Time Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={config.timeRange?.value || 24}
              onChange={(e) =>
                onChange({
                  ...config,
                  timeRange: {
                    value: parseInt(e.target.value) || 24,
                    unit: config.timeRange?.unit || 'hours',
                  },
                })
              }
              className="w-24"
            />
            <Select
              value={config.timeRange?.unit || 'hours'}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  timeRange: {
                    value: config.timeRange?.value || 24,
                    unit: value as 'minutes' | 'hours' | 'days' | 'weeks',
                  },
                })
              }
            >
              <SelectTrigger className="w-32">
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

      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <Label htmlFor="enable-trend">Include Trend Comparison</Label>
          <div className="text-xs text-muted-foreground">
            Compare to previous time period
          </div>
        </div>
        <Switch
          id="enable-trend"
          checked={config.enableTrend}
          onCheckedChange={(checked) => onChange({ ...config, enableTrend: checked })}
        />
      </div>

      {config.enableTrend && (
        <div className="space-y-2">
          <Label>Compare To</Label>
          <Select
            value={config.trendComparisonPeriod || 'previous'}
            onValueChange={(value) =>
              onChange({
                ...config,
                trendComparisonPeriod: value as KpiFieldConfig['trendComparisonPeriod'],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="hour">Previous Hour</SelectItem>
              <SelectItem value="day">Previous Day</SelectItem>
              <SelectItem value="week">Previous Week</SelectItem>
              <SelectItem value="month">Previous Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Chart Field Configuration - Multi-Series Time-Based
// ============================================================================

export interface ChartFieldConfig {
  fields: SelectedField[];
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'first' | 'last';
  timeBucket: 'auto' | '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '1w';
  timeRange: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
}

interface ChartFieldConfigProps {
  config: ChartFieldConfig;
  onChange: (config: ChartFieldConfig) => void;
}

export function ChartFieldSelection({ config, onChange }: ChartFieldConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const handleFieldsSelect = (fields: SelectedField[]) => {
    onChange({ ...config, fields });
    setShowFieldSelector(false);
  };

  const handleRemoveField = (index: number) => {
    const newFields = config.fields.filter((_, i) => i !== index);
    onChange({ ...config, fields: newFields });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Data Pattern: Multi-Series Time-Based</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select multiple numeric fields to plot over time (max 10)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Y-Axis Fields (1-10) *</Label>
        {config.fields && config.fields.length > 0 ? (
          <div className="space-y-2">
            {config.fields.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm py-1 flex-1">
                  {field.fieldName}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({field.deviceTypeName})
                  </span>
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFieldSelector(true)}
          disabled={config.fields?.length >= 10}
        >
          <Plus className="h-4 w-4 mr-2" />
          {config.fields?.length > 0 ? 'Add More Fields' : 'Select Fields'}
        </Button>
      </div>

      {showFieldSelector && (
        <div className="mt-4 border rounded-md p-4">
          <FieldSelector
            selectedFields={config.fields || []}
            onFieldsChange={handleFieldsSelect}
            multiSelect={true}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Aggregation Per Time Bucket</Label>
        <Select
          value={config.aggregation}
          onValueChange={(value) =>
            onChange({ ...config, aggregation: value as ChartFieldConfig['aggregation'] })
          }
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
            <SelectItem value="first">First Value</SelectItem>
            <SelectItem value="last">Last Value</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Time Bucket Size</Label>
        <Select
          value={config.timeBucket}
          onValueChange={(value) =>
            onChange({ ...config, timeBucket: value as ChartFieldConfig['timeBucket'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1m">1 Minute</SelectItem>
            <SelectItem value="5m">5 Minutes</SelectItem>
            <SelectItem value="15m">15 Minutes</SelectItem>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="6h">6 Hours</SelectItem>
            <SelectItem value="1d">1 Day</SelectItem>
            <SelectItem value="1w">1 Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Time Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={config.timeRange.value}
            onChange={(e) =>
              onChange({
                ...config,
                timeRange: {
                  ...config.timeRange,
                  value: parseInt(e.target.value) || 24,
                },
              })
            }
            className="w-24"
          />
          <Select
            value={config.timeRange.unit}
            onValueChange={(value) =>
              onChange({
                ...config,
                timeRange: {
                  ...config.timeRange,
                  unit: value as ChartFieldConfig['timeRange']['unit'],
                },
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Gauge Field Configuration - Single Value with Range
// ============================================================================

export interface GaugeFieldConfig {
  primaryField?: SelectedField;
  aggregation: 'current' | 'avg' | 'min' | 'max';
  minValue: number;
  maxValue: number;
  targetValue?: number;
}

interface GaugeFieldConfigProps {
  config: GaugeFieldConfig;
  onChange: (config: GaugeFieldConfig) => void;
}

export function GaugeFieldSelection({ config, onChange }: GaugeFieldConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const handleFieldSelect = (field: SelectedField) => {
    onChange({ ...config, primaryField: field });
    setShowFieldSelector(false);
  };

  const handleRemoveField = () => {
    onChange({ ...config, primaryField: undefined });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Data Pattern: Single Value with Range</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select one numeric field to display in gauge context
        </p>
      </div>

      <div className="space-y-2">
        <Label>Primary Metric *</Label>
        {config.primaryField ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              {config.primaryField.fieldName}
              <span className="text-xs text-muted-foreground ml-2">
                ({config.primaryField.deviceTypeName})
              </span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveField}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFieldSelector(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Select Field
          </Button>
        )}
      </div>

      {showFieldSelector && (
        <div className="mt-4 border rounded-md p-4">
          <FieldSelector
            selectedFields={config.primaryField ? [config.primaryField] : []}
            onFieldsChange={(fields) => {
              if (fields.length > 0) {
                handleFieldSelect(fields[0]);
              }
            }}
            multiSelect={false}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Aggregation Method</Label>
        <Select
          value={config.aggregation}
          onValueChange={(value) =>
            onChange({ ...config, aggregation: value as GaugeFieldConfig['aggregation'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Value (Latest)</SelectItem>
            <SelectItem value="avg">Average</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Value</Label>
          <Input
            type="number"
            value={config.minValue}
            onChange={(e) =>
              onChange({ ...config, minValue: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Maximum Value</Label>
          <Input
            type="number"
            value={config.maxValue}
            onChange={(e) =>
              onChange({ ...config, maxValue: parseFloat(e.target.value) || 100 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Value (Optional)</Label>
        <Input
          type="number"
          value={config.targetValue || ''}
          onChange={(e) =>
            onChange({
              ...config,
              targetValue: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder="Optional target indicator"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Table Field Configuration - Multi-Field Display
// ============================================================================

export interface TableFieldConfig {
  fields: SelectedField[];
  enableGrouping: boolean;
  groupByField?: SelectedField;
  aggregations?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
}

interface TableFieldConfigProps {
  config: TableFieldConfig;
  onChange: (config: TableFieldConfig) => void;
}

export function TableFieldSelection({ config, onChange }: TableFieldConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showGroupBySelector, setShowGroupBySelector] = useState(false);

  const handleFieldsSelect = (fields: SelectedField[]) => {
    onChange({ ...config, fields });
    setShowFieldSelector(false);
  };

  const handleRemoveField = (index: number) => {
    const newFields = config.fields.filter((_, i) => i !== index);
    onChange({ ...config, fields: newFields });
  };

  const handleGroupBySelect = (field: SelectedField) => {
    onChange({ ...config, groupByField: field });
    setShowGroupBySelector(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Data Pattern: Multi-Field Display</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select multiple fields to display as table columns
        </p>
      </div>

      <div className="space-y-2">
        <Label>Table Columns *</Label>
        {config.fields && config.fields.length > 0 ? (
          <div className="space-y-2">
            {config.fields.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm py-1 flex-1">
                  {field.fieldName}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({field.deviceTypeName})
                  </span>
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFieldSelector(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {config.fields?.length > 0 ? 'Add More Fields' : 'Select Fields'}
        </Button>
      </div>

      {showFieldSelector && (
        <div className="mt-4 border rounded-md p-4">
          <FieldSelector
            selectedFields={config.fields || []}
            onFieldsChange={handleFieldsSelect}
            multiSelect={true}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <Label htmlFor="enable-grouping">Enable Grouping</Label>
          <div className="text-xs text-muted-foreground">
            Group rows and show aggregated values
          </div>
        </div>
        <Switch
          id="enable-grouping"
          checked={config.enableGrouping}
          onCheckedChange={(checked) => onChange({ ...config, enableGrouping: checked })}
        />
      </div>

      {config.enableGrouping && (
        <div className="space-y-2">
          <Label>Group By Field</Label>
          {config.groupByField ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm py-1">
                {config.groupByField.fieldName}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...config, groupByField: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroupBySelector(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Field
            </Button>
          )}
        </div>
      )}

      {showGroupBySelector && (
        <div className="mt-4 border rounded-md p-4">
          <FieldSelector
            selectedFields={config.groupByField ? [config.groupByField] : []}
            onFieldsChange={(fields) => {
              if (fields.length > 0) {
                handleGroupBySelect(fields[0]);
              }
            }}
            multiSelect={false}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Map Field Configuration - Geospatial Points
// ============================================================================

export interface MapFieldConfig {
  latitudeField?: SelectedField;
  longitudeField?: SelectedField;
  labelField?: SelectedField;
  colorField?: SelectedField;
  sizeField?: SelectedField;
  tooltipFields: SelectedField[];
  enableClustering: boolean;
  enableHeatmap: boolean;
}

interface MapFieldConfigProps {
  config: MapFieldConfig;
  onChange: (config: MapFieldConfig) => void;
}

export function MapFieldSelection({ config, onChange }: MapFieldConfigProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'lat' | 'lng' | 'label' | 'color' | 'size' | 'tooltip'>('lat');

  const handleFieldSelect = (field: SelectedField | SelectedField[]) => {
    const singleField = Array.isArray(field) ? field[0] : field;
    
    switch (selectingFor) {
      case 'lat':
        onChange({ ...config, latitudeField: singleField });
        break;
      case 'lng':
        onChange({ ...config, longitudeField: singleField });
        break;
      case 'label':
        onChange({ ...config, labelField: singleField });
        break;
      case 'color':
        onChange({ ...config, colorField: singleField });
        break;
      case 'size':
        onChange({ ...config, sizeField: singleField });
        break;
      case 'tooltip':
        const fields = Array.isArray(field) ? field : [field];
        onChange({ ...config, tooltipFields: [...config.tooltipFields, ...fields] });
        break;
    }
    setShowFieldSelector(false);
  };

  const openSelector = (type: typeof selectingFor) => {
    setSelectingFor(type);
    setShowFieldSelector(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Data Pattern: Geospatial Points</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select latitude and longitude fields for map markers
        </p>
      </div>

      <div className="space-y-2">
        <Label>Latitude Field *</Label>
        {config.latitudeField ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              {config.latitudeField.fieldName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...config, latitudeField: undefined })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openSelector('lat')}>
            <Plus className="h-4 w-4 mr-2" />
            Select Field
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Longitude Field *</Label>
        {config.longitudeField ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              {config.longitudeField.fieldName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...config, longitudeField: undefined })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openSelector('lng')}>
            <Plus className="h-4 w-4 mr-2" />
            Select Field
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Marker Label (Optional)</Label>
        {config.labelField ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              {config.labelField.fieldName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...config, labelField: undefined })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openSelector('label')}>
            <Plus className="h-4 w-4 mr-2" />
            Select Field
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label>Enable Clustering</Label>
        <Switch
          checked={config.enableClustering}
          onCheckedChange={(checked) => onChange({ ...config, enableClustering: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Enable Heatmap</Label>
        <Switch
          checked={config.enableHeatmap}
          onCheckedChange={(checked) => onChange({ ...config, enableHeatmap: checked })}
        />
      </div>

      {showFieldSelector && (
        <div className="mt-4 border rounded-md p-4">
          <FieldSelector
            selectedFields={
              selectingFor === 'tooltip'
                ? config.tooltipFields
                : selectingFor === 'lat' && config.latitudeField
                ? [config.latitudeField]
                : selectingFor === 'lng' && config.longitudeField
                ? [config.longitudeField]
                : selectingFor === 'label' && config.labelField
                ? [config.labelField]
                : selectingFor === 'color' && config.colorField
                ? [config.colorField]
                : selectingFor === 'size' && config.sizeField
                ? [config.sizeField]
                : []
            }
            onFieldsChange={(fields) => handleFieldSelect(fields)}
            multiSelect={selectingFor === 'tooltip'}
          />
        </div>
      )}
    </div>
  );
}
