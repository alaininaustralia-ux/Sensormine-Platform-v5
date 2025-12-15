'use client';

// Digital Twin Tree Widget

import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { TreePine, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DigitalTwinTreeWidgetProps {
  widget: Widget;
  mode: DashboardMode;
}

export function DigitalTwinTreeWidget({ }: DigitalTwinTreeWidgetProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root', 'building-a']));

  const tree = {
    id: 'root',
    name: 'Facility',
    children: [
      {
        id: 'building-a',
        name: 'Building A',
        children: [
          { id: 'floor-1', name: 'Floor 1', children: [] },
          { id: 'floor-2', name: 'Floor 2', children: [] },
        ],
      },
      {
        id: 'building-b',
        name: 'Building B',
        children: [
          { id: 'floor-3', name: 'Floor 1', children: [] },
        ],
      },
    ],
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  interface TreeNode {
    id: string;
    name: string;
    children: TreeNode[];
  }

  const renderNode = (node: TreeNode, level = 0) => (
    <div key={node.id}>
      <div
        className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 cursor-pointer rounded"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => toggleExpand(node.id)}
      >
        {node.children.length > 0 ? (
          expanded.has(node.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )
        ) : (
          <div className="w-4" />
        )}
        <TreePine className="h-4 w-4 text-primary" />
        <span className="text-sm">{node.name}</span>
      </div>
      {expanded.has(node.id) && node.children.map((child) => renderNode(child, level + 1))}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-2">
      {renderNode(tree)}
    </div>
  );
}
