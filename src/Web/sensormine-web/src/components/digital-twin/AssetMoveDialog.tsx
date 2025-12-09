'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Asset } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { Loader2, Move as MoveIcon, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const assetMoveFormSchema = z.object({
  newParentId: z.string().optional(),
});

type AssetMoveFormValues = z.infer<typeof assetMoveFormSchema>;

export interface AssetMoveDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssetMoveDialog: React.FC<AssetMoveDialogProps> = ({
  asset,
  open,
  onOpenChange,
}) => {
  const { moveAsset, assets, isLoading } = useDigitalTwinStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AssetMoveFormValues>({
    resolver: zodResolver(assetMoveFormSchema),
    defaultValues: {
      newParentId: undefined,
    },
  });

  // Update form when asset changes
  useEffect(() => {
    if (asset) {
      form.reset({
        newParentId: asset.parentId || undefined,
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: AssetMoveFormValues) => {
    if (!asset) return;

    // Check if parent actually changed
    if (data.newParentId === asset.parentId) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await moveAsset(asset.id, data.newParentId || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to move asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  // Get possible parent assets (exclude self and descendants)
  const getDescendantIds = (assetId: string): string[] => {
    const children = assets.filter((a) => a.parentId === assetId);
    const descendantIds = [assetId];
    children.forEach((child) => {
      descendantIds.push(...getDescendantIds(child.id));
    });
    return descendantIds;
  };

  const excludedIds = getDescendantIds(asset.id);
  const possibleParents = assets.filter((a) => !excludedIds.includes(a.id));

  // Count children that will move with this asset
  const childCount = assets.filter((a) => a.parentId === asset.id).length;
  const hasChildren = childCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveIcon className="h-5 w-5" />
            Move Asset
          </DialogTitle>
          <DialogDescription>
            Change the parent asset in the hierarchy. All child assets will move with this asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Asset:</span>
              <span className="font-medium">{asset.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">{asset.type}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Parent:</span>
              <span>
                {asset.parentId
                  ? assets.find((a) => a.id === asset.parentId)?.name || 'Unknown'
                  : 'None (Root)'}
              </span>
            </div>
          </div>

          {hasChildren && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                This asset has {childCount} child asset{childCount !== 1 ? 's' : ''} that will move with it.
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newParentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Parent Asset</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new parent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Make root asset)</SelectItem>
                        {possibleParents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the new parent asset or leave empty to make this a root asset.
                      Cannot move to itself or its descendants.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Move Asset
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
