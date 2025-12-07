/**
 * Create Subpage Dialog
 * 
 * Dialog for creating a new subpage under a parent dashboard
 * Supports selecting dashboard type and initial configuration
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboards';
import { DashboardType } from '@/lib/types/dashboard';

interface CreateSubPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  parentName: string;
  onSuccess?: (dashboardId: string) => void;
}

export function CreateSubPageDialog({
  open,
  onOpenChange,
  parentId,
  parentName,
  onSuccess,
}: CreateSubPageDialogProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dashboardType: DashboardType.Custom.toString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const userId = 'demo-user'; // TODO: Get from auth context

      const newDashboard = await dashboardApi.createSubPage(
        parentId,
        {
          name: formData.name,
          description: formData.description || undefined,
          layout: [],
          widgets: [],
          isTemplate: false,
          displayOrder: 0, // Will be set by backend based on existing subpages
          dashboardType: parseInt(formData.dashboardType),
        },
        userId
      );

      // Reset form
      setFormData({
        name: '',
        description: '',
        dashboardType: DashboardType.Custom.toString(),
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess(newDashboard.id);
      } else {
        // Navigate to new subpage
        router.push(`/dashboard/${newDashboard.id}/edit`);
      }
    } catch (err) {
      console.error('Failed to create subpage:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subpage');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      dashboardType: DashboardType.Custom.toString(),
    });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Subpage</DialogTitle>
            <DialogDescription>
              Create a new subpage under <strong>{parentName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Device Details, Temperature Trends"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of this subpage..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Dashboard Type field */}
            <div className="space-y-2">
              <Label htmlFor="dashboardType">Type</Label>
              <Select
                value={formData.dashboardType}
                onValueChange={(value) => setFormData({ ...formData, dashboardType: value })}
              >
                <SelectTrigger id="dashboardType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DashboardType.Custom.toString()}>
                    Custom Dashboard
                  </SelectItem>
                  <SelectItem value={DashboardType.DeviceDetail.toString()}>
                    Device Detail
                  </SelectItem>
                  <SelectItem value={DashboardType.DeviceTypeList.toString()}>
                    Device Type List
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {parseInt(formData.dashboardType) === DashboardType.DeviceDetail && 
                  'Shows detailed information for a specific device'}
                {parseInt(formData.dashboardType) === DashboardType.DeviceTypeList && 
                  'Shows a list of devices filtered by type'}
                {parseInt(formData.dashboardType) === DashboardType.Custom && 
                  'A customizable dashboard with your own widgets'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Subpage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
