'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { DataPointMapping, Asset, AggregationMethod } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Mock schema type
interface Schema {
  id: string;
  name: string;
  version: string;
  jsonSchema: {
    properties: Record<string, unknown>;
  };
}

const mappingFormSchema = z.object({
  schemaId: z.string().min(1, 'Schema is required'),
  assetId: z.string().min(1, 'Asset is required'),
  jsonPath: z.string().min(1, 'JSON path is required'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  unit: z.string().optional(),
  aggregationMethod: z.nativeEnum(AggregationMethod),
  enableRollup: z.boolean(),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

export const MappingEditor: React.FC = () => {
  const { 
    assets, 
    mappings, 
    fetchAssets, 
    fetchMappings, 
    createMapping, 
    deleteMapping 
  } = useDigitalTwinStore();
  
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<DataPointMapping | null>(null);

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      schemaId: '',
      assetId: '',
      jsonPath: '$.temperature',
      label: '',
      description: '',
      unit: '',
      aggregationMethod: AggregationMethod.Average,
      enableRollup: true,
    },
  });

  useEffect(() => {
    fetchAssets();
    fetchMappings();
    // Mock schemas - replace with actual API
    setSchemas([
      {
        id: 'schema-1',
        name: 'Temperature Sensor',
        version: '1.0',
        jsonSchema: {
          properties: {
            temperature: { type: 'number' },
            humidity: { type: 'number' },
          },
        },
      },
      {
        id: 'schema-2',
        name: 'Pressure Sensor',
        version: '1.0',
        jsonSchema: {
          properties: {
            pressure: { type: 'number' },
            altitude: { type: 'number' },
          },
        },
      },
    ]);
  }, [fetchAssets, fetchMappings]);

  const handleCreate = () => {
    form.reset();
    setEditingMapping(null);
    setDialogOpen(true);
  };

  const handleEdit = (mapping: DataPointMapping) => {
    setEditingMapping(mapping);
    form.reset({
      schemaId: mapping.schemaId,
      assetId: mapping.assetId,
      jsonPath: mapping.jsonPath,
      label: mapping.label,
      description: mapping.description || '',
      unit: mapping.unit || '',
      aggregationMethod: mapping.aggregationMethod,
      enableRollup: mapping.enableRollup,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this mapping?')) {
      await deleteMapping(id);
    }
  };

  const onSubmit = async (data: MappingFormValues) => {
    await createMapping({
      schemaId: data.schemaId,
      assetId: data.assetId,
      jsonPath: data.jsonPath,
      label: data.label,
      description: data.description,
      unit: data.unit,
      aggregationMethod: data.aggregationMethod,
      enableRollup: data.enableRollup,
    });
    setDialogOpen(false);
  };

  const filteredMappings = mappings.filter((mapping) =>
    mapping.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mapping.jsonPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Point Mappings</CardTitle>
              <CardDescription>
                Map device schema fields to asset properties for aggregation
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mappings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mappings Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>JSON Path</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Aggregation</TableHead>
                  <TableHead>Rollup</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => {
                  const asset = assets.find((a) => a.id === mapping.assetId);
                  const schema = schemas.find((s) => s.id === mapping.schemaId);

                  return (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.label}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {mapping.jsonPath}
                        </code>
                      </TableCell>
                      <TableCell>{asset?.name || 'Unknown'}</TableCell>
                      <TableCell>{schema?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.aggregationMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        {mapping.enableRollup ? (
                          <Badge variant="default">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(mapping)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No mappings found</p>
                        <p className="text-sm">Create your first mapping to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Edit Mapping' : 'Create Mapping'}
            </DialogTitle>
            <DialogDescription>
              Map a device schema field to an asset property
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schemaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schema *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schemas.map((schema) => (
                            <SelectItem key={schema.id} value={schema.id}>
                              {schema.name} v{schema.version}
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
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name} ({asset.type})
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
                name="jsonPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JSON Path *</FormLabel>
                    <FormControl>
                      <Input placeholder="$.temperature" {...field} />
                    </FormControl>
                    <FormDescription>
                      JSONPath expression to extract data (e.g., $.temperature, $.sensors[0].value)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label *</FormLabel>
                      <FormControl>
                        <Input placeholder="Temperature" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="°C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mapping description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="aggregationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aggregation Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(AggregationMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to aggregate child asset values
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableRollup"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 pt-8">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="mt-0!">Enable Rollup</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMapping ? 'Update' : 'Create'} Mapping
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
