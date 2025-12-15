/**
 * Dashboard V2 Configuration Components
 * 
 * Exports all widget configuration components for dashboard v2.
 */

export { KpiWidgetConfig, type KpiWidgetConfig as KpiWidgetConfigType } from './KpiWidgetConfig';
export { GaugeWidgetConfig, type GaugeWidgetConfig as GaugeWidgetConfigType } from './GaugeWidgetConfig';
export { TimeSeriesChartConfig } from './TimeSeriesChartConfig';
export { MapWidgetConfig } from './MapWidgetConfig';
export { DeviceListConfig } from './DeviceListConfig';

// Selector Components
export { DeviceSelector } from './DeviceSelector';
export { DeviceTypeSelector } from './DeviceTypeSelector';
export { DeviceFieldSelector } from './DeviceFieldSelector';
export { FieldMappingSelector } from './FieldMappingSelector';
export { AssetTreeSelector } from './AssetTreeSelector';
export { SubDashboardManager } from './SubDashboardManager';
