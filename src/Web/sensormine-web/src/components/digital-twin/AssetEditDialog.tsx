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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AssetType, AssetStatus, Asset } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { IconPicker } from './IconPicker';
import { Loader2 } from 'lucide-react';

const assetEditFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.nativeEnum(AssetType),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  tags: z.string().optional(),
});

type AssetEditFormValues = z.infer<typeof assetEditFormSchema>;

export interface AssetEditDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssetEditDialog: React.FC<AssetEditDialogProps> = ({
  asset,
  open,
  onOpenChange,
}) => {
  const { updateAsset, isLoading } = useDigitalTwinStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AssetEditFormValues>({
    resolver: zodResolver(assetEditFormSchema),
    defaultValues: {
      name: '',
      type: AssetType.Equipment,
      description: '',
      icon: undefined,
      status: AssetStatus.Active,
      tags: '',
    },
  });

  // Update form when asset changes
  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        type: asset.type,
        description: asset.description || '',
        icon: asset.icon,
        status: asset.status,
        tags: asset.tags ? asset.tags.join(', ') : '',
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: AssetEditFormValues) => {
    if (!asset) return;

    setIsSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await updateAsset(asset.id, {
        name: data.name,
        type: data.type,
        description: data.description,
        icon: data.icon,
        status: data.status,
        tags,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Update asset properties and configuration.
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
