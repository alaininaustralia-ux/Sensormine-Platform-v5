/**
 * Asset Hierarchy Selector Component
 * Interactive tree view for selecting assets from the digital twin hierarchy
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AssetTreeNode } from './AssetTreeNode';
import { getAssetTree, getAssetChildren, type AssetWithChildren } from '@/lib/api/assets';

interface AssetHierarchySelectorProps {
  mode?: 'single' | 'multiple';
  selectedAssetIds?: string[];
  onSelectionChange?: (assetIds: string[]) => void;
  showDeviceCount?: boolean;
  enableSearch?: boolean;
  className?: string;
}

export function AssetHierarchySelector({
  mode = 'single',
  selectedAssetIds = [],
  onSelectionChange,
  enableSearch = true,
  className,
}: AssetHierarchySelectorProps) {
  const [assets, setAssets] = useState<AssetWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Load expanded state from localStorage
    const stored = localStorage.getItem('assetTreeExpanded');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Load asset tree on mount
  useEffect(() => {
    loadAssetTree();
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('assetTreeExpanded', JSON.stringify(Array.from(expandedIds)));
  }, [expandedIds]);

  const loadAssetTree = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tree = await getAssetTree();
      setAssets(tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildren = async (assetId: string) => {
    try {
      const children = await getAssetChildren(assetId);
      
      // Update the asset tree with loaded children
      const updateTree = (nodes: AssetWithChildren[]): AssetWithChildren[] => {
        return nodes.map(node => {
          if (node.id === assetId) {
            return { ...node, children: children as AssetWithChildren[] };
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };

      setAssets(updateTree(assets));
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  };

  const handleToggleExpand = useCallback((assetId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  const handleSelect = useCallback((assetId: string) => {
    if (mode === 'single') {
      onSelectionChange?.([assetId]);
    } else {
      // Multi-select mode
      const newSelection = selectedAssetIds.includes(assetId)
        ? selectedAssetIds.filter(id => id !== assetId)
        : [...selectedAssetIds, assetId];
      onSelectionChange?.(newSelection);
    }
  }, [mode, selectedAssetIds, onSelectionChange]);

  // Filter assets based on search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) {
      return assets;
    }

    const query = searchQuery.toLowerCase();
    
    const filterNode = (node: AssetWithChildren): AssetWithChildren | null => {
      const matchesSearch = node.name.toLowerCase().includes(query);
      const filteredChildren = node.children
        ?.map(child => filterNode(child))
        .filter((child): child is AssetWithChildren => child !== null);

      if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren || node.children,
        };
      }

      return null;
    };

    return assets
      .map(root => filterNode(root))
      .filter((root): root is AssetWithChildren => root !== null);
  }, [assets, searchQuery]);

  // Auto-expand filtered results
  useEffect(() => {
    if (searchQuery.trim()) {
      const collectIds = (nodes: AssetWithChildren[]): string[] => {
        return nodes.flatMap(node => [
          node.id,
          ...(node.children ? collectIds(node.children) : []),
        ]);
      };
      setExpandedIds(new Set(collectIds(filteredAssets)));
    }
  }, [searchQuery, filteredAssets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading asset hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircleIcon className="h-8 w-8 mx-auto text-destructive" />
          <div>
            <p className="font-medium">Failed to load assets</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={loadAssetTree} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      {enableSearch && (
        <div className="p-3 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Asset Tree */}
      <ScrollArea className="h-[400px]">
        {filteredAssets.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No assets found matching your search' : 'No assets available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredAssets.map(asset => (
              <AssetTreeNode
                key={asset.id}
                asset={asset}
                selectedIds={selectedAssetIds}
                expandedIds={expandedIds}
                onSelect={handleSelect}
                onToggleExpand={handleToggleExpand}
                onLoadChildren={loadChildren}
                multiSelect={mode === 'multiple'}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Selection Info */}
      {selectedAssetIds.length > 0 && (
        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {selectedAssetIds.length} asset{selectedAssetIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
