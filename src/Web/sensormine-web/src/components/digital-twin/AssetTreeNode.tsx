/**
 * Asset Tree Node Component
 * Individual node in the asset hierarchy tree
 */

'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, Building2Icon, BuildingIcon, LayersIcon, GridIcon, BoxIcon, CpuIcon, ComponentIcon, PlugIcon, CircleDotIcon, ActivityIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AssetWithChildren, AssetType } from '@/lib/api/assets';

interface AssetTreeNodeProps {
  asset: AssetWithChildren;
  level?: number;
  selectedIds?: string[];
  expandedIds?: Set<string>;
  onSelect?: (assetId: string) => void;
  onToggleExpand?: (assetId: string) => void;
  onLoadChildren?: (assetId: string) => Promise<void>;
  multiSelect?: boolean;
}

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  0: Building2Icon, // Site
  1: BuildingIcon,  // Building
  2: LayersIcon,    // Floor
  3: GridIcon,      // Area
  4: BoxIcon,       // Zone
  5: CpuIcon,       // Equipment
  6: ComponentIcon, // Subsystem
  7: PlugIcon,      // Component
  8: CircleDotIcon, // Subcomponent
  9: ActivityIcon,  // Sensor
};

export function AssetTreeNode({
  asset,
  level = 0,
  selectedIds = [],
  expandedIds = new Set(),
  onSelect,
  onToggleExpand,
  onLoadChildren,
  multiSelect = false,
}: AssetTreeNodeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isSelected = selectedIds.includes(asset.id);
  const isExpanded = expandedIds.has(asset.id);
  const hasChildren = (asset.children && asset.children.length > 0) || asset.deviceCount !== undefined;

  const IconComponent = ASSET_TYPE_ICONS[asset.assetType] || ActivityIcon;

  const handleToggle = async () => {
    if (!hasChildren) return;

    onToggleExpand?.(asset.id);

    // Load children if not already loaded
    if (!isExpanded && onLoadChildren && (!asset.children || asset.children.length === 0)) {
      setIsLoading(true);
      try {
        await onLoadChildren(asset.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelect = () => {
    onSelect?.(asset.id);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors hover:bg-accent',
          isSelected && 'bg-primary/10 hover:bg-primary/15',
          'group'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={cn(
            'shrink-0 h-4 w-4 flex items-center justify-center rounded hover:bg-accent',
            !hasChildren && 'invisible'
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Node Content */}
        <div
          onClick={handleSelect}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          {/* Icon */}
          <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />

          {/* Name */}
          <span className={cn(
            'truncate text-sm',
            isSelected && 'font-medium text-primary'
          )}>
            {asset.name}
          </span>

          {/* Device Count Badge */}
          {asset.deviceCount !== undefined && asset.deviceCount > 0 && (
            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
              {asset.deviceCount} device{asset.deviceCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Status Indicator */}
          {asset.status === 1 && ( // Inactive
            <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" title="Inactive" />
          )}
          {asset.status === 2 && ( // Maintenance
            <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" title="Maintenance" />
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && asset.children && asset.children.length > 0 && (
        <div>
          {asset.children.map((child) => (
            <AssetTreeNode
              key={child.id}
              asset={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onLoadChildren={onLoadChildren}
              multiSelect={multiSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
