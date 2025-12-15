/**
 * Custom Navigation Manager Component
 * 
 * Allows users to add, edit, delete, and reorder custom navigation items
 * that appear in the sidebar.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { useToast } from '@/hooks/use-toast';
import type { CustomNavigationItem, NavigationTargetType } from '@/lib/types/preferences';
import { getDevices } from '@/lib/api/devices';
import { getDashboards } from '@/lib/api/dashboards-v2';
import type { Device } from '@/lib/types/device';
import type { DashboardListItem } from '@/lib/types/dashboard';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ExternalLink,
  LayoutDashboard,
  Cpu,
  Layers,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon options for navigation items
const ICON_OPTIONS = [
  { value: 'LayoutDashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { value: 'Cpu', label: 'Device', Icon: Cpu },
  { value: 'Layers', label: 'Asset', Icon: Layers },
  { value: 'FileText', label: 'Form', Icon: FileText },
  { value: 'LinkIcon', label: 'Link', Icon: LinkIcon },
  { value: 'ExternalLink', label: 'External', Icon: ExternalLink },
];

// Target type options
const TARGET_TYPE_OPTIONS: { value: NavigationTargetType; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'device', label: 'Device' },
  { value: 'asset', label: 'Asset' },
  { value: 'form', label: 'Form (Coming Soon)' },
  { value: 'url', label: 'Custom URL' },
];

export function CustomNavigationManager() {
  const { toast } = useToast();
  const getCustomNavItems = usePreferencesStore((state) => state.getCustomNavItems);
  const addCustomNavItem = usePreferencesStore((state) => state.addCustomNavItem);
  const updateCustomNavItem = usePreferencesStore((state) => state.updateCustomNavItem);
  const removeCustomNavItem = usePreferencesStore((state) => state.removeCustomNavItem);
  const reorderCustomNavItems = usePreferencesStore((state) => state.reorderCustomNavItems);

  // Prevent localStorage access during SSR to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Fetch devices and dashboards for pickers
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [devicesResponse, dashboardsData] = await Promise.all([
          getDevices({ pageSize: 1000 }),
          getDashboards()
        ]);
        
        if (devicesResponse.success && devicesResponse.data) {
          setDevices(devicesResponse.data.items);
        }
        setDashboards(dashboardsData);
      } catch (error) {
        console.error('Failed to fetch devices/dashboards:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const customNavItems = isClient ? getCustomNavItems() : [];

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomNavigationItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    icon: 'LinkIcon',
    targetType: 'dashboard' as NavigationTargetType,
    targetId: '',
    url: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      icon: 'LinkIcon',
      targetType: 'dashboard',
      targetId: '',
      url: '',
    });
  };

  // Helper to get display name for device/dashboard
  const getTargetDisplayName = (item: CustomNavigationItem): string => {
    if (item.targetType === 'device' && item.targetId) {
      const device = devices.find(d => d.id === item.targetId);
      return device ? device.name : item.targetId;
    }
    if (item.targetType === 'dashboard' && item.targetId) {
      const dashboard = dashboards.find(d => d.id === item.targetId);
      return dashboard ? dashboard.name : item.targetId;
    }
    if (item.targetType === 'url' && item.url) {
      return item.url;
    }
    return item.targetId || '';
  };

  const handleAdd = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    if (formData.targetType === 'url' && !formData.url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a URL',
        variant: 'destructive',
      });
      return;
    }

    if (formData.targetType !== 'url' && !formData.targetId.trim()) {
      toast({
        title: 'Error',
        description: `Please enter a ${formData.targetType} ID`,
        variant: 'destructive',
      });
      return;
    }

    addCustomNavItem({
      title: formData.title.trim(),
      icon: formData.icon,
      targetType: formData.targetType,
      targetId: formData.targetType === 'url' ? undefined : formData.targetId.trim(),
      url: formData.targetType === 'url' ? formData.url.trim() : undefined,
    });

    toast({
      title: 'Success',
      description: 'Custom navigation item added',
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingItem) return;

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    updateCustomNavItem(editingItem.id, {
      title: formData.title.trim(),
      icon: formData.icon,
      targetType: formData.targetType,
      targetId: formData.targetType === 'url' ? undefined : formData.targetId.trim(),
      url: formData.targetType === 'url' ? formData.url.trim() : undefined,
    });

    toast({
      title: 'Success',
      description: 'Custom navigation item updated',
    });

    resetForm();
    setEditingItem(null);
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteItemId) {
      removeCustomNavItem(deleteItemId);
      toast({
        title: 'Success',
        description: 'Custom navigation item deleted',
      });
      setDeleteItemId(null);
    }
  };

  const handleOpenEdit = (item: CustomNavigationItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      icon: item.icon || 'LinkIcon',
      targetType: item.targetType,
      targetId: item.targetId || '',
      url: item.url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...customNavItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    reorderCustomNavItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === customNavItems.length - 1) return;
    const newItems = [...customNavItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    reorderCustomNavItems(newItems);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Navigation</CardTitle>
            <CardDescription>
              Add custom quick links to the sidebar for easy access to dashboards, devices, assets, or external pages.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {customNavItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No custom navigation items yet. Click "Add Link" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {customNavItems.map((item, index) => {
              const IconComponent = ICON_OPTIONS.find(opt => opt.value === item.icon)?.Icon || LinkIcon;
              const targetLabel = TARGET_TYPE_OPTIONS.find(opt => opt.value === item.targetType)?.label || item.targetType;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {targetLabel}: {getTargetDisplayName(item)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === customNavItems.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Navigation Link</DialogTitle>
              <DialogDescription>
                Create a quick link to appear in your sidebar navigation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-title">Title</Label>
                <Input
                  id="add-title"
                  placeholder="My Dashboard"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger id="add-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-target-type">Target Type</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value) => setFormData({ ...formData, targetType: value as NavigationTargetType })}
                >
                  <SelectTrigger id="add-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.targetType === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="add-url">URL</Label>
                  <Input
                    id="add-url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              ) : formData.targetType === 'device' ? (
                <div className="space-y-2">
                  <Label htmlFor="add-device">Select Device</Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                  >
                    <SelectTrigger id="add-device">
                      <SelectValue placeholder={isLoadingData ? "Loading devices..." : "Choose a device"} />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.length === 0 ? (
                        <SelectItem value="no-devices" disabled>No devices available</SelectItem>
                      ) : (
                        devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({device.serialNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : formData.targetType === 'dashboard' ? (
                <div className="space-y-2">
                  <Label htmlFor="add-dashboard">Select Dashboard</Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                  >
                    <SelectTrigger id="add-dashboard">
                      <SelectValue placeholder={isLoadingData ? "Loading dashboards..." : "Choose a dashboard"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboards.length === 0 ? (
                        <SelectItem value="no-dashboards" disabled>No dashboards available</SelectItem>
                      ) : (
                        dashboards.map((dashboard) => (
                          <SelectItem key={dashboard.id} value={dashboard.id}>
                            {dashboard.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="add-target-id">{formData.targetType} ID</Label>
                  <Input
                    id="add-target-id"
                    placeholder="Enter ID (GUID)"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Navigate to the {formData.targetType} and copy its ID from the URL
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Navigation Link</DialogTitle>
              <DialogDescription>
                Update your custom navigation link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="My Dashboard"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger id="edit-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-target-type">Target Type</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value) => setFormData({ ...formData, targetType: value as NavigationTargetType })}
                >
                  <SelectTrigger id="edit-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.targetType === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              ) : formData.targetType === 'device' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-device">Select Device</Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                  >
                    <SelectTrigger id="edit-device">
                      <SelectValue placeholder={isLoadingData ? "Loading devices..." : "Choose a device"} />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.length === 0 ? (
                        <SelectItem value="no-devices" disabled>No devices available</SelectItem>
                      ) : (
                        devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({device.serialNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : formData.targetType === 'dashboard' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-dashboard">Select Dashboard</Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData({ ...formData, targetId: value })}
                  >
                    <SelectTrigger id="edit-dashboard">
                      <SelectValue placeholder={isLoadingData ? "Loading dashboards..." : "Choose a dashboard"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboards.length === 0 ? (
                        <SelectItem value="no-dashboards" disabled>No dashboards available</SelectItem>
                      ) : (
                        dashboards.map((dashboard) => (
                          <SelectItem key={dashboard.id} value={dashboard.id}>
                            {dashboard.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-target-id">{formData.targetType} ID</Label>
                  <Input
                    id="edit-target-id"
                    placeholder="Enter ID (GUID)"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setEditingItem(null); setIsEditDialogOpen(false); }}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Navigation Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this navigation item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
