'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Asset } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface AssetDeleteDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssetDeleteDialog: React.FC<AssetDeleteDialogProps> = ({
  asset,
  open,
  onOpenChange,
}) => {
  const { deleteAsset, assets, isLoading } = useDigitalTwinStore();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!asset) return;

    setIsDeleting(true);
    try {
      await deleteAsset(asset.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!asset) return null;

  // Count children that will be affected
  const childCount = assets.filter((a) => a.parentId === asset.id).length;
  const hasChildren = childCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Asset?
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{asset.name}</strong>?
          </p>

          <div className="space-y-2 bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">{asset.type}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline">{asset.status}</Badge>
            </div>
            {asset.description && (
              <div className="text-sm">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{asset.description}</p>
              </div>
            )}
          </div>

          {hasChildren && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md space-y-2">
              <p className="text-destructive font-semibold text-sm">
                ⚠️ Warning: This asset has {childCount} child asset{childCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Deleting this asset will also delete all child assets in the hierarchy.
                This action cannot be undone.
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All associated data, mappings, and historical
            records will be permanently deleted.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {hasChildren ? `(${childCount + 1} assets)` : 'Asset'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
