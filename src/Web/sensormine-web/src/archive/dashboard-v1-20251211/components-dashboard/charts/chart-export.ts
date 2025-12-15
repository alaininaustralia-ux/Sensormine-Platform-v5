/**
 * Chart Export Utilities
 * 
 * Story 4.2: Time-Series Charts
 * Functions for exporting chart data and images.
 */

import { format as formatDate } from 'date-fns';
import type { ChartSeries, ExportConfig } from '@/lib/types/chart';

/** Scale factor for high-resolution PNG export */
const PNG_EXPORT_SCALE = 2;

/**
 * Export chart as PNG image
 */
export async function exportChartAsPng(
  chartElement: HTMLElement,
  filename: string = 'chart'
): Promise<void> {
  try {
    // Find the SVG element inside the chart
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in chart');
    }
    
    // Clone the SVG for manipulation
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Get SVG dimensions
    const { width, height } = svgElement.getBoundingClientRect();
    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create canvas and draw SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Use higher resolution for better quality
    canvas.width = width * PNG_EXPORT_SCALE;
    canvas.height = height * PNG_EXPORT_SCALE;
    ctx.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Draw SVG
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = svgUrl;
    });
    
    // Clean up blob URL
    URL.revokeObjectURL(svgUrl);
    
    // Download PNG
    const pngUrl = canvas.toDataURL('image/png');
    downloadFile(pngUrl, `${filename}.png`);
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    throw error;
  }
}

/**
 * Export chart as SVG image
 */
export function exportChartAsSvg(
  chartElement: HTMLElement,
  filename: string = 'chart'
): void {
  try {
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in chart');
    }
    
    // Clone and prepare SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    const { width, height } = svgElement.getBoundingClientRect();
    clonedSvg.setAttribute('width', String(width));
    clonedSvg.setAttribute('height', String(height));
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);
    
    // Convert to blob and download
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    downloadFile(svgUrl, `${filename}.svg`);
    URL.revokeObjectURL(svgUrl);
  } catch (error) {
    console.error('Failed to export chart as SVG:', error);
    throw error;
  }
}

/**
 * Export chart data as CSV
 */
export function exportChartAsCsv(
  series: ChartSeries[],
  filename: string = 'chart-data'
): void {
  try {
    // Build header row
    const headers = ['timestamp', ...series.map(s => s.name || s.id)];
    
    // Merge all data points by timestamp
    const dataMap = new Map<number, Record<string, number | null>>();
    
    series.forEach(s => {
      s.data.forEach(point => {
        const timestamp = normalizeTimestamp(point.timestamp);
        const existing = dataMap.get(timestamp) || { timestamp };
        existing[s.id] = point.value;
        dataMap.set(timestamp, existing);
      });
    });
    
    // Sort by timestamp
    const sortedData = Array.from(dataMap.values()).sort(
      (a, b) => (a.timestamp as number) - (b.timestamp as number)
    );
    
    // Build CSV content
    const rows = sortedData.map(row => {
      const formattedTimestamp = formatDate(
        new Date(row.timestamp as number),
        'yyyy-MM-dd HH:mm:ss'
      );
      const values = series.map(s => row[s.id] ?? '');
      return [formattedTimestamp, ...values].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.csv`);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart as CSV:', error);
    throw error;
  }
}

/**
 * Export chart data as JSON
 */
export function exportChartAsJson(
  series: ChartSeries[],
  filename: string = 'chart-data'
): void {
  try {
    // Format data for export
    const exportData = {
      exportedAt: new Date().toISOString(),
      series: series.map(s => ({
        id: s.id,
        name: s.name,
        unit: s.unit,
        dataPoints: s.data.map(point => ({
          timestamp: new Date(normalizeTimestamp(point.timestamp)).toISOString(),
          value: point.value,
          ...(point.metadata && { metadata: point.metadata }),
        })),
      })),
    };
    
    // Download JSON
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${filename}.json`);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart as JSON:', error);
    throw error;
  }
}

/**
 * Export chart based on format
 */
export async function exportChart(
  chartElement: HTMLElement,
  series: ChartSeries[],
  format: 'png' | 'svg' | 'csv' | 'json',
  config?: ExportConfig
): Promise<void> {
  const filename = config?.filename || `chart-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}`;
  
  switch (format) {
    case 'png':
      await exportChartAsPng(chartElement, filename);
      break;
    case 'svg':
      exportChartAsSvg(chartElement, filename);
      break;
    case 'csv':
      exportChartAsCsv(series, filename);
      break;
    case 'json':
      exportChartAsJson(series, filename);
      break;
  }
}

/**
 * Normalize timestamp to number (milliseconds)
 */
function normalizeTimestamp(timestamp: Date | string | number): number {
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }
  return timestamp;
}

/**
 * Helper to download a file
 */
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
