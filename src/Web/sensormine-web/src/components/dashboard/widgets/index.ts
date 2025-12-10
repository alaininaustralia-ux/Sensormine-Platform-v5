/**
 * Dashboard Widgets - Barrel Export
 */

export { KPIWidget } from './kpi-widget';
export { GaugeWidget } from './gauge-widget';
export { TableWidget } from './table-widget';
export { ChartWidget } from './chart-widget';
export { MapWidget } from './map-widget';
export { VideoWidget } from './video-widget';
export { DeviceListWidget } from './device-list-widget';
export { PieChartWidget } from './pie-chart-widget';

// Connected widgets
export { ConnectedKPIWidget } from './kpi-widget-connected';
export { ConnectedChartWidget } from './chart-widget-connected';
export { ConnectedPieChartWidget } from './pie-chart-widget-connected';

// Asset-based widgets
export { ChartWidgetWithAsset } from './chart-widget-with-asset';
export { KPIWidgetWithAsset } from './kpi-widget-with-asset';
export { GaugeWidgetWithAsset } from './gauge-widget-with-asset';

// Base widget
export type { BaseWidgetProps } from './base-widget';
