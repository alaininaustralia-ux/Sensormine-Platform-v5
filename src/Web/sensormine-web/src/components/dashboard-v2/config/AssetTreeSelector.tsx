/**
 * AssetTreeSelector Component
 * 
 * Tree view component for selecting an asset from the digital twin hierarchy
 * Supports lazy loading of children and breadcrumb navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, Loader2, Building2, MapPin, Layers, Box, X } from 'lucide-react';
import { getRootAssets, getChildAssets, getAssetById, getAssetPathNames, AssetType } from '@/lib/api/assets';
import type { Asset } from '@/lib/api/assets';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AssetTreeSelectorProps {
  value?: string; // Selected asset ID
  onChange: (assetId?: string) => void;
  placeholder?: string;
}

export function AssetTreeSelector({
  value,
  onChange,
  placeholder = 'Select asset location (optional)...',
}: AssetTreeSelectorProps) {
  const [rootAssets, setRootAssets] = useState<Asset[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [childrenCache, setChildrenCache] = useState<Map<string, Asset[]>>(new Map());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssetPath, setSelectedAssetPath] = useState<string>('');

  // Load root assets on mount
  useEffect(() => {
    loadRootAssets();
  }, []);

  // Load selected asset details when value changes
  useEffect(() => {
    if (value && !selectedAsset) {
      loadSelectedAsset(value);
    } else if (!value) {
      setSelectedAsset(null);
      setSelectedAssetPath('');
    }
  }, [value, selectedAsset]);

  async function loadSelectedAsset(assetId: string) {
    try {
      const [asset, pathNames] = await Promise.all([
        getAssetById(assetId),
        getAssetPathNames(assetId)
      ]);
      setSelectedAsset(asset);
      setSelectedAssetPath(pathNames);
    } catch (err) {
      console.error('Failed to load selected asset:', err);
    }
  }

  async function loadRootAssets() {
    try {
      setLoading(true);
      setError(null);
      const assets = await getRootAssets();
      setRootAssets(assets);
    } catch (err) {
      console.error('Failed to load root assets:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }

  async function loadChildren(parentId: string) {
    // Check cache first
    if (childrenCache.has(parentId)) {
      return;
    }

    try {
      setLoadingNodes((prev) => new Set(prev).add(parentId));
      const children = await getChildAssets(parentId);
      setChildrenCache((prev) => new Map(prev).set(parentId, children));
    } catch (err) {
      console.error(`Failed to load children for asset ${parentId}:`, err);
    } finally {
      setLoadingNodes((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  }

  function handleNodeExpand(assetId: string) {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
      loadChildren(assetId);
    }
    setExpandedNodes(newExpanded);
  }

  async function handleNodeSelect(asset: Asset) {
    if (value === asset.id) {
      // Deselect
      setSelectedAsset(null);
      setSelectedAssetPath('');
      onChange(undefined);
    } else {
      setSelectedAsset(asset);
      onChange(asset.id);
      // Load the human-readable path
      try {
        const pathNames = await getAssetPathNames(asset.id);
        setSelectedAssetPath(pathNames);
      } catch (err) {
        console.error('Failed to load asset path:', err);
        // Fallback to just the name
        setSelectedAssetPath(asset.name);
      }
    }
  }

  function getAssetIcon(assetType: AssetType) {
    switch (assetType) {
      case 0: // Site
        return <MapPin className="h-4 w-4" />;
      case 1: // Building
        return <Building2 className="h-4 w-4" />;
      case 2: // Floor
      case 3: // Area
      case 4: // Zone
        return <Layers className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  }

  function renderAssetNode(asset: Asset, depth: number = 0) {
    const isExpanded = expandedNodes.has(asset.id);
    const isSelected = value === asset.id;
    const isLoading = loadingNodes.has(asset.id);
    const children = childrenCache.get(asset.id);
    const hasChildren = children && children.length > 0;

    return (
      <div key={asset.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
            isSelected ? 'bg-accent border border-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
          onClick={() => handleNodeSelect(asset)}
        >
          {/* Expand/Collapse button */}
          <button
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleNodeExpand(asset.id);
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasChildren || !childrenCache.has(asset.id) ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Asset icon */}
          <div className="text-muted-foreground">{getAssetIcon(asset.assetType)}</div>

          {/* Asset name */}
          <span className="flex-1 truncate font-medium">{asset.name}</span>

          {/* Asset type badge */}
          <Badge variant="outline" className="text-xs">
            {AssetType[asset.assetType]}
          </Badge>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {children.map((child) => renderAssetNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading asset tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 text-center border border-destructive rounded-lg">
        {error}
        <Button
          variant="link"
          size="sm"
          onClick={loadRootAssets}
          className="ml-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected asset breadcrumb */}
      {selectedAsset && (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-md">
          <span className="text-sm font-medium">Selected:</span>
          <Badge variant="secondary">
            {selectedAssetPath || selectedAsset.name}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => {
              setSelectedAsset(null);
              setSelectedAssetPath('');
              onChange(undefined);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Asset tree */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2">
          {rootAssets.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center p-4">
              No assets found
            </div>
          ) : (
            rootAssets.map((asset) => renderAssetNode(asset))
          )}
        </div>
      </ScrollArea>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        {placeholder}
      </p>
    </div>
  );
}
