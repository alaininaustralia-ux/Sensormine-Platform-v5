/**
 * Chart Export Utility
 * 
 * Functions for exporting charts as images or data files.
 * Story 4.2 - Time-Series Charts
 */

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import type { TimeSeriesData, ExportOptions } from '@/lib/types/chart-types';

/**
 * Export chart as PNG image
 */
export async function exportChartAsPNG(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const filename = generateFilename(options, 'png');
        saveAs(blob, filename);
      }
    });
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    throw new Error('Failed to export chart as PNG');
  }
}

/**
 * Export chart as SVG
 */
export function exportChartAsSVG(
  element: HTMLElement,
  options: ExportOptions
): void {
  try {
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in chart');
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const filename = generateFilename(options, 'svg');
    saveAs(svgBlob, filename);
  } catch (error) {
    console.error('Failed to export chart as SVG:', error);
    throw new Error('Failed to export chart as SVG');
  }
}

/**
 * Export chart data as CSV
 */
export function exportChartAsCSV(
  series: TimeSeriesData[],
  options: ExportOptions
): void {
  try {
    // Build CSV header
    const headers = ['Timestamp', ...series.map((s) => s.seriesName)];
    const csvRows: string[] = [headers.join(',')];

    // Collect all unique timestamps
    const timestamps = new Set<number>();
    series.forEach((s) => {
      s.data.forEach((point) => {
        const ts =
          typeof point.timestamp === 'number'
            ? point.timestamp
            : point.timestamp.getTime();
        timestamps.add(ts);
      });
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

    // Build data rows
    sortedTimestamps.forEach((timestamp) => {
      const row: (string | number)[] = [
        new Date(timestamp).toISOString(),
      ];

      series.forEach((s) => {
        const dataPoint = s.data.find((p) => {
          const ts =
            typeof p.timestamp === 'number'
              ? p.timestamp
              : p.timestamp.getTime();
          return ts === timestamp;
        });
        row.push(dataPoint ? dataPoint.value : '');
      });

      csvRows.push(row.join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

    const filename = generateFilename(options, 'csv');
    saveAs(csvBlob, filename);
  } catch (error) {
    console.error('Failed to export chart as CSV:', error);
    throw new Error('Failed to export chart as CSV');
  }
}

/**
 * Generate filename with optional timestamp
 */
function generateFilename(options: ExportOptions, extension: string): string {
  const baseName = options.filename || 'chart';
  const timestamp = options.includeTimestamp
    ? `-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
    : '';

  return `${baseName}${timestamp}.${extension}`;
}
