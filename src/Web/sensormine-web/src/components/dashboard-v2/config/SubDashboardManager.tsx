'use client';

// Sub-Dashboard Manager - Manage sub-dashboards for aggregate widgets

import { useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubDashboardConfig, SubDashboardParameterType } from '@/lib/types/dashboard-v2';
import { createDashboard } from '@/lib/api/dashboards-v2';

interface SubDashboardManagerProps {
  subDashboards: SubDashboardConfig[];
  onChange: (subDashboards: SubDashboardConfig[]) => void;
  widgetType: 'map' | 'device-list' | 'digital-twin-tree';
}

export function SubDashboardManager({
  subDashboards,
  onChange,
  widgetType,
}: SubDashboardManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubDashboard, setEditingSubDashboard] = useState<SubDashboardConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<SubDashboardConfig>>({
    parameterType: 'deviceId',
  });

  const getDefaultParameterType = (): SubDashboardParameterType => {
    if (widgetType === 'digital-twin-tree') return 'assetId';
    return 'deviceId';
  };

  const handleAdd = () => {
    setFormData({
      id: crypto.randomUUID(),
      name: '',
      parameterType: getDefaultParameterType(),
      dashboardId: '',
    });
    setEditingSubDashboard(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (subDashboard: SubDashboardConfig) => {
    setFormData(subDashboard);
    setEditingSubDashboard(subDashboard);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (subDashboardId: string) => {
    onChange(subDashboards.filter((sd) => sd.id !== subDashboardId));
  };

  const handleSave = async () => {
    if (!formData.name) {
      return;
    }

    setIsCreating(true);
    try {
      let dashboardId = formData.dashboardId;

      if (!editingSubDashboard) {
        // Create new dashboard automatically
        const newDashboard = await createDashboard({
          name: `${formData.name} (Sub-Dashboard)`,
          description: `Sub-dashboard for ${formData.parameterType}`,
          config: {
            layout: {
              columns: 12,
              rowHeight: 100,
              margin: [16, 16],
              containerPadding: [16, 16],
            },
            widgets: [],
          },
          isPublic: false,
        });
        dashboardId = newDashboard.id;
      }

      const newSubDashboard: SubDashboardConfig = {
        id: formData.id || crypto.randomUUID(),
        name: formData.name,
        parameterType: formData.parameterType!,
        dashboardId: dashboardId!,
      };

      if (editingSubDashboard) {
        // Update existing
        onChange(
          subDashboards.map((sd) =>
            sd.id === editingSubDashboard.id ? newSubDashboard : sd
          )
        );
      } else {
        // Add new
        onChange([...subDashboards, newSubDashboard]);
      }

      setIsAddDialogOpen(false);
      setFormData({ parameterType: getDefaultParameterType() });
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      alert('Failed to create dashboard. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDashboard = (dashboardId: string) => {
    window.open(`/dashboards/${dashboardId}`, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Sub-Dashboards</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Sub-Dashboard
        </Button>
      </div>

      {subDashboards.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No sub-dashboards configured. Add one to enable drill-through.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {subDashboards.map((subDashboard) => (
            <Card key={subDashboard.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{subDashboard.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {subDashboard.parameterType === 'deviceId' ? 'Device' : 'Asset'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dashboard ID: {subDashboard.dashboardId}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDashboard(subDashboard.dashboardId)}
                    className="h-8 w-8"
                    title="Open dashboard"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(subDashboard)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subDashboard.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubDashboard ? 'Edit' : 'Add'} Sub-Dashboard
            </DialogTitle>
            <DialogDescription>
              Configure a sub-dashboard for drill-through navigation. Sub-dashboards receive
              a {widgetType === 'digital-twin-tree' ? 'asset' : 'device'} parameter for contextual views.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subDashboardName">Name</Label>
              <Input
                id="subDashboardName"
                placeholder="Device Details"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameterType">Parameter Type</Label>
              <Select
                value={formData.parameterType}
                onValueChange={(value: SubDashboardParameterType) =>
                  setFormData({ ...formData, parameterType: value })
                }
              >
                <SelectTrigger id="parameterType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deviceId">Device ID</SelectItem>
                  <SelectItem value="assetId">Asset ID</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The parameter that will be passed to the sub-dashboard
              </p>
            </div>

            {editingSubDashboard && (
              <div className="space-y-2">
                <Label htmlFor="dashboardId">Dashboard ID</Label>
                <div className="text-sm font-mono bg-muted px-3 py-2 rounded border">
                  {formData.dashboardId}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dashboard ID cannot be changed after creation
                </p>
              </div>
            )}

            {!editingSubDashboard && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  💡 A new blank dashboard will be created automatically when you save.
                  You can configure it with widgets after creation.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || isCreating}
            >
              {isCreating ? 'Creating...' : editingSubDashboard ? 'Update' : 'Create Sub-Dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
