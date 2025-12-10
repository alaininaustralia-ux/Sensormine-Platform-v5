/**
 * Field Mapping Editor Component
 * 
 * Allows users to edit field mappings (friendly names, visibility, metadata)
 * for device type fields from schema, custom fields, and system fields
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getFieldMappings, updateFieldMappings, synchronizeFieldMappings } from '@/lib/api/fieldMappings';
import type { FieldMapping, FieldMappingRequest, FieldSource } from '@/lib/api/types';
import { 
  Edit2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Save,
  Settings2,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface FieldMappingEditorProps {
  deviceTypeId: string;
}

export function FieldMappingEditor({ deviceTypeId }: FieldMappingEditorProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingField, setEditingField] = useState<FieldMapping | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceTypeId]);

  const loadFields = async () => {
    try {
      setIsLoading(true);
      const data = await getFieldMappings(deviceTypeId);
      setFields(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load field mappings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const data = await synchronizeFieldMappings(deviceTypeId);
      setFields(data.sort((a, b) => a.displayOrder - b.displayOrder));
      toast({
        title: 'Success',
        description: 'Field mappings synchronized successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to synchronize fields',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleVisibility = async (field: FieldMapping) => {
    const updatedFields = fields.map(f =>
      f.id === field.id ? { ...f, isVisible: !f.isVisible } : f
    );
    setFields(updatedFields);

    try {
      await saveFields(updatedFields);
    } catch (error) {
      // Revert on error
      setFields(fields);
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  const handleEditField = (field: FieldMapping) => {
    setEditingField({ ...field });
    setIsDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    const updatedFields = fields.map(f =>
      f.id === editingField.id ? editingField : f
    );
    setFields(updatedFields);

    try {
      await saveFields(updatedFields);
      setIsDialogOpen(false);
      setEditingField(null);
      toast({
        title: 'Success',
        description: 'Field mapping updated successfully',
      });
    } catch (error) {
      // Revert on error
      setFields(fields);
      toast({
        title: 'Error',
        description: 'Failed to update field mapping',
        variant: 'destructive',
      });
    }
  };

  const saveFields = async (updatedFields: FieldMapping[]) => {
    setIsSaving(true);
    try {
      const request = {
        fieldMappings: updatedFields.map(f => ({
          fieldName: f.fieldName,
          friendlyName: f.friendlyName,
          description: f.description,
          unit: f.unit,
          minValue: f.minValue,
          maxValue: f.maxValue,
          isQueryable: f.isQueryable,
          isVisible: f.isVisible,
          displayOrder: f.displayOrder,
          category: f.category,
          tags: f.tags,
          defaultAggregation: f.defaultAggregation,
          supportsAggregations: f.supportsAggregations,
          formatString: f.formatString,
        } as FieldMappingRequest)),
      };
      
      const savedFields = await updateFieldMappings(deviceTypeId, request);
      setFields(savedFields.sort((a, b) => a.displayOrder - b.displayOrder));
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldSourceBadge = (source: FieldSource) => {
    const variants: Record<FieldSource, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      Schema: { variant: 'default', label: 'Schema' },
      CustomField: { variant: 'secondary', label: 'Custom' },
      System: { variant: 'outline', label: 'System' },
    };
    const config = variants[source];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
          <CardDescription>Loading field mappings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Mappings</CardTitle>
              <CardDescription>
                Configure field names, visibility, and metadata for dashboard and query use
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Fields
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Friendly Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                  <TableHead className="text-center">Queryable</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No fields available
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-mono text-sm">{field.fieldName}</TableCell>
                      <TableCell className="font-medium">{field.friendlyName}</TableCell>
                      <TableCell>{getFieldSourceBadge(field.fieldSource)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{field.dataType}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {field.unit || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(field)}
                        >
                          {field.isVisible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {field.isQueryable ? (
                          <Badge variant="default" className="text-xs">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(field)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Field Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Field Mapping</DialogTitle>
            <DialogDescription>
              Configure friendly name and metadata for {editingField?.fieldName}
            </DialogDescription>
          </DialogHeader>
          
          {editingField && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldName">Field Name (Read-only)</Label>
                  <Input
                    id="fieldName"
                    value={editingField.fieldName}
                    disabled
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldSource">Source (Read-only)</Label>
                  <div className="pt-2">
                    {getFieldSourceBadge(editingField.fieldSource)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="friendlyName">Friendly Name *</Label>
                <Input
                  id="friendlyName"
                  value={editingField.friendlyName}
                  onChange={(e) => setEditingField({ ...editingField, friendlyName: e.target.value })}
                  placeholder="Enter user-friendly name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingField.description || ''}
                  onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                  placeholder="Describe what this field represents"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={editingField.unit || ''}
                    onChange={(e) => setEditingField({ ...editingField, unit: e.target.value })}
                    placeholder="e.g., °C, %"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minValue">Min Value</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={editingField.minValue || ''}
                    onChange={(e) => setEditingField({ 
                      ...editingField, 
                      minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Max Value</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={editingField.maxValue || ''}
                    onChange={(e) => setEditingField({ 
                      ...editingField, 
                      maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingField.category || ''}
                    onChange={(e) => setEditingField({ ...editingField, category: e.target.value })}
                    placeholder="e.g., Sensor, Status"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={editingField.displayOrder}
                    onChange={(e) => setEditingField({ 
                      ...editingField, 
                      displayOrder: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultAggregation">Default Aggregation</Label>
                  <Select
                    value={editingField.defaultAggregation || 'none'}
                    onValueChange={(value) => setEditingField({ 
                      ...editingField, 
                      defaultAggregation: value === 'none' ? undefined : value 
                    })}
                  >
                    <SelectTrigger id="defaultAggregation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="first">First</SelectItem>
                      <SelectItem value="last">Last</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formatString">Format String</Label>
                  <Input
                    id="formatString"
                    value={editingField.formatString || ''}
                    onChange={(e) => setEditingField({ ...editingField, formatString: e.target.value })}
                    placeholder="e.g., {0:0.00}"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVisible"
                    checked={editingField.isVisible}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, isVisible: checked })}
                  />
                  <Label htmlFor="isVisible" className="cursor-pointer">
                    Visible in UI
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isQueryable"
                    checked={editingField.isQueryable}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, isQueryable: checked })}
                  />
                  <Label htmlFor="isQueryable" className="cursor-pointer">
                    Queryable
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
