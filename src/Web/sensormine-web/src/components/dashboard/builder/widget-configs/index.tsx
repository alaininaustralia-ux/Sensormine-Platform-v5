/**
 * Widget Configuration Components
 * 
 * Exports all widget-specific configuration components.
 * Each widget type has its own configuration panel with
 * widget-specific options and settings.
 */

export { KpiWidgetConfig } from './kpi-widget-config';
export { ChartWidgetConfig } from './chart-widget-config';
export { GaugeWidgetConfig } from './gauge-widget-config';
export { TableWidgetConfig } from './table-widget-config';
export { MapWidgetConfig } from './map-widget-config';
export { DeviceListWidgetConfig } from './device-list-widget-config';
export { DeviceDataTableWidgetConfig } from './device-data-table-widget-config';

export type { WidgetConfigComponentProps } from './types';

// Field selection components
export {
  KpiFieldSelection,
  ChartFieldSelection,
  GaugeFieldSelection,
  TableFieldSelection,
  MapFieldSelection,
  type KpiFieldConfig,
  type ChartFieldConfig,
  type GaugeFieldConfig,
  type TableFieldConfig,
  type MapFieldConfig,
} from './field-selection-config';
