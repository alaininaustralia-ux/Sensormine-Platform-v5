'use client';

import React, { useMemo } from 'react';
import { Tree } from 'react-arborist';
import { 
  Building2, 
  Boxes, 
  Box, 
  MapPin, 
  Layers, 
  Cpu, 
  Component as ComponentIcon,
  Settings2,
  Gauge,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Move,
} from 'lucide-react';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { Asset, AssetType, AssetStatus } from '@/lib/api/digital-twin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssetCreateDialog } from './AssetCreateDialog';
import { AssetEditDialog } from './AssetEditDialog';
import { AssetDeleteDialog } from './AssetDeleteDialog';
import { AssetMoveDialog } from './AssetMoveDialog';

// Icon mapping based on AssetType
const getAssetTypeIcon = (type: AssetType, customIcon?: string) => {
  // If custom icon provided, try to use it (would need icon mapping)
  if (customIcon) {
    // For now, fallback to type-based icon
    // TODO: Implement custom icon lookup from lucide-react
  }

  const iconMap: Record<AssetType, React.ReactNode> = {
    [AssetType.Site]: <Building2 className="h-4 w-4" />,
    [AssetType.Building]: <Building2 className="h-4 w-4" />,
    [AssetType.Floor]: <Layers className="h-4 w-4" />,
    [AssetType.Area]: <MapPin className="h-4 w-4" />,
    [AssetType.Zone]: <Box className="h-4 w-4" />,
    [AssetType.Equipment]: <Boxes className="h-4 w-4" />,
    [AssetType.Subsystem]: <Cpu className="h-4 w-4" />,
    [AssetType.Component]: <ComponentIcon className="h-4 w-4" />,
    [AssetType.Subcomponent]: <Settings2 className="h-4 w-4" />,
    [AssetType.Sensor]: <Gauge className="h-4 w-4" />,
  };

  return iconMap[type] || <Box className="h-4 w-4" />;
};

const getStatusColor = (status: AssetStatus) => {
  const colorMap: Record<AssetStatus, string> = {
    [AssetStatus.Active]: 'bg-green-500',
    [AssetStatus.Inactive]: 'bg-gray-400',
    [AssetStatus.Maintenance]: 'bg-yellow-500',
    [AssetStatus.Decommissioned]: 'bg-red-500',
  };
  return colorMap[status] || 'bg-gray-400';
};

interface AssetNodeProps {
  node: {
    id: string;
    data: Asset;
    isOpen: boolean;
    isSelected: boolean;
    toggle: () => void;
  };
  style: React.CSSProperties;
  dragHandle?: (el: HTMLDivElement | null) => void;
  onEdit?: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

// Tree node component
const AssetNode: React.FC<AssetNodeProps> = ({ node, style, dragHandle, onEdit, onMove, onDelete }) => {
  const { selectAsset, assets } = useDigitalTwinStore();

  const handleClick = () => {
    node.toggle();
    selectAsset(node.data);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(node.data);
  };

  // Check if node has children
  const hasChildren = assets.some((a) => a.parentId === node.data.id);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md group',
        node.isSelected && 'bg-accent'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <span className="shrink-0">
        {hasChildren ? (
          node.isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )
        ) : (
          <span className="w-4" />
        )}
      </span>

      <span className="shrink-0">
        {getAssetTypeIcon(node.data.type, node.data.icon)}
      </span>

      <span className="flex-1 truncate text-sm font-medium">
        {node.data.name}
        {node.data.deviceCount > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({node.data.deviceCount})
          </span>
        )}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            getStatusColor(node.data.status)
          )}
          title={node.data.status}
        />
        
        <Badge variant="outline" className="text-xs">
          {node.data.type}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(node.data);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onMove?.(node.data);
              }}
            >
              <Move className="h-4 w-4 mr-2" />
              Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(node.data);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export interface AssetTreeProps {
  className?: string;
  height?: number;
}

export const AssetTree: React.FC<AssetTreeProps> = ({
  className,
  height = 600,
}) => {
  const {
    assets,
    rootAssets,
    isLoading,
    error,
    fetchAssets,
  } = useDigitalTwinStore();

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);
  const [selectedAssetForAction, setSelectedAssetForAction] = React.useState<Asset | null>(null);

  // Fetch assets on mount
  React.useEffect(() => {
    fetchAssets(); // Fetch all assets for children lookups
  }, [fetchAssets]);

  // Dialog handlers
  const handleEdit = (asset: Asset) => {
    setSelectedAssetForAction(asset);
    setEditDialogOpen(true);
  };

  const handleMove = (asset: Asset) => {
    setSelectedAssetForAction(asset);
    setMoveDialogOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    setSelectedAssetForAction(asset);
    setDeleteDialogOpen(true);
  };

  // Build tree data with children
  const treeData = useMemo(() => {
    const buildTree = (parentAssets: Asset[]): Asset[] => {
      return parentAssets.map(asset => {
        const children = assets.filter(a => a.parentId === asset.id);
        return {
          ...asset,
          children: buildTree(children),
        };
      });
    };

    return buildTree(rootAssets);
  }, [assets, rootAssets]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error loading assets: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Asset
        </Button>
      </div>

      {/* Tree */}
      <div className="border rounded-md overflow-hidden bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-muted-foreground">Loading assets...</div>
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No assets found</p>
              <p className="text-sm">Create your first asset to get started</p>
            </div>
          </div>
        ) : (
          <Tree
            data={treeData}
            idAccessor={(node) => node.id}
            childrenAccessor="children"
            width="100%"
            height={height}
            rowHeight={36}
            indent={24}
          >
            {(props) => (
              <AssetNode 
                {...props} 
                onEdit={handleEdit}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            )}
          </Tree>
        )}
      </div>

      {/* Dialogs */}
      <AssetCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <AssetEditDialog
        asset={selectedAssetForAction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <AssetMoveDialog
        asset={selectedAssetForAction}
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
      />
      <AssetDeleteDialog
        asset={selectedAssetForAction}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
};
