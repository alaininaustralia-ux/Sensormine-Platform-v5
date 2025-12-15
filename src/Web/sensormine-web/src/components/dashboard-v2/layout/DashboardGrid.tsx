'use client';

import { ReactNode } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  layouts: { [key: string]: Layout[] };
  breakpoints: { [key: string]: number };
  cols: { [key: string]: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  onLayoutChange?: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
  children: ReactNode;
}

/**
 * DashboardGrid - Manages responsive grid layout using react-grid-layout
 * Responsibility: Grid configuration and layout change handling
 */
export function DashboardGrid({
  layouts,
  breakpoints,
  cols,
  isDraggable = false,
  isResizable = false,
  onLayoutChange,
  children,
}: DashboardGridProps) {
  // Strip out minW and minH from layouts - these are stored in database but prevent resize
  // Users should be able to resize freely, with minimums only enforced on save
  const layoutsWithoutConstraints = Object.keys(layouts).reduce((acc, breakpoint) => {
    acc[breakpoint] = layouts[breakpoint].map(item => {
      const { minW, minH, maxW, maxH, ...rest } = item;
      return rest;
    });
    return acc;
  }, {} as { [key: string]: Layout[] });

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layoutsWithoutConstraints}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={80}
      onLayoutChange={onLayoutChange}
      isDraggable={isDraggable}
      isResizable={isResizable}
      draggableHandle=".drag-handle"
      compactType="vertical"
      preventCollision={false}
      allowOverlap={true}
      margin={[16, 16]}
      containerPadding={[0, 0]}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
