'use client';

import React from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AssetType, AssetStatus, Asset } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { IconPicker } from './IconPicker';
import { Loader2 } from 'lucide-react';

const assetFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.nativeEnum(AssetType),
  description: z.string().max(500, 'Description too long').optional(),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  tags: z.string().optional(), // Comma-separated tags
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitude: z.number().optional(),
  }).optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export interface AssetCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentAsset?: Asset | null;
}

export const AssetCreateDialog: React.FC<AssetCreateDialogProps> = ({
  open,
  onOpenChange,
  parentAsset,
}) => {
  const { createAsset, assets, isLoading } = useDigitalTwinStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      type: AssetType.Equipment,
      description: '',
      parentId: parentAsset?.id || undefined,
      icon: undefined,
      status: AssetStatus.Active,
      tags: '',
    },
  });

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await createAsset({
        name: data.name,
        type: data.type,
        description: data.description,
        parentId: data.parentId,
        icon: data.icon,
        status: data.status,
        tags,
        location: data.location,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get possible parent assets (filter by hierarchy rules)
  const possibleParents = assets.filter((asset) => {
    // Implement hierarchy rules based on AssetType
    return true; // For now, allow any parent
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your digital twin hierarchy.
            {parentAsset && ` Parent: ${parentAsset.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Asset name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssetType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssetStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Asset</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                    defaultValue={field.value || 'none'}
                    disabled={!!parentAsset}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent (root asset)</SelectItem>
                      {possibleParents.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave empty to create a root-level asset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <IconPicker
                    value={field.value}
                    onChange={field.onChange}
                    label="Custom Icon"
                  />
                  <FormDescription>
                    Choose a custom icon (optional, defaults to type-based icon)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Asset description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="tag1, tag2, tag3" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated tags for categorization
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
                Create Asset
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
