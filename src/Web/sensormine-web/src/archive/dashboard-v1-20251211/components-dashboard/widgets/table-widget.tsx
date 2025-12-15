/**
 * Table Widget
 * 
 * Displays tabular data with sortable columns.
 */

'use client';

import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface TableColumn {
  /** Column key (must match data object keys) */
  key: string;
  /** Column header label */
  label: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface TableWidgetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Table columns */
  columns: TableColumn[];
  /** Table data */
  data: Record<string, unknown>[];
  /** Maximum rows to display before scrolling */
  maxRows?: number;
}

export function TableWidget({
  columns,
  data,
  maxRows = 10,
  ...baseProps
}: TableWidgetProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Handle column sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  // Sort data
  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      })
    : data;
  
  const displayData = sortedData.slice(0, maxRows);
  
  return (
    <BaseWidget {...baseProps}>
      <div className="h-full">
        <table className="w-full text-sm">
          <thead className="border-b sticky top-0 bg-background">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left px-3 py-2 font-medium ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <span className="text-muted-foreground">
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b hover:bg-muted/50">
                  {columns.map((column, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}-${column.key}`} className="px-3 py-2">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {data.length > maxRows && (
          <div className="text-xs text-muted-foreground text-center py-2 border-t">
            Showing {maxRows} of {data.length} rows
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
