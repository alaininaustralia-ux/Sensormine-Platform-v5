/**
 * Schema Selector Component
 * 
 * Allows users to select or create a schema for a device
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileJson, 
  Plus, 
  Search, 
  ExternalLink, 
  CheckCircle2,
  Info 
} from 'lucide-react';
import { getSchemas } from '@/lib/api/schemas';
import type { Schema } from '@/lib/types/schema';
import Link from 'next/link';
import { SchemaWizardEmbedded } from '@/components/schemas/schema-wizard-embedded';

interface SchemaSelectorProps {
  selectedSchemaId?: string;
  onSchemaSelect: (schemaId: string | undefined, schema?: Schema) => void;
  deviceType?: string;
}

export function SchemaSelector({ 
  selectedSchemaId, 
  onSchemaSelect,
  deviceType 
}: SchemaSelectorProps) {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [filteredSchemas, setFilteredSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<Schema | undefined>();

  useEffect(() => {
    loadSchemas();
  }, []);

  useEffect(() => {
    // Filter schemas based on search query and device type
    let filtered = schemas;

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (deviceType) {
      // Prioritize schemas with matching device type tag
      filtered = filtered.sort((a, b) => {
        const aHasDeviceType = (a.tags || []).some(tag => 
          tag.toLowerCase().includes(deviceType.toLowerCase().replace('_', ' '))
        );
        const bHasDeviceType = (b.tags || []).some(tag => 
          tag.toLowerCase().includes(deviceType.toLowerCase().replace('_', ' '))
        );
        if (aHasDeviceType && !bHasDeviceType) return -1;
        if (!aHasDeviceType && bHasDeviceType) return 1;
        return 0;
      });
    }

    // Show active and draft schemas (exclude archived/deprecated)
    filtered = filtered.filter((s) => !s.status || s.status === 'Active' || s.status === 'Draft');

    setFilteredSchemas(filtered);
  }, [searchQuery, schemas, deviceType]);

  useEffect(() => {
    if (selectedSchemaId) {
      const schema = schemas.find((s) => s.id === selectedSchemaId);
      setSelectedSchema(schema);
    } else {
      setSelectedSchema(undefined);
    }
  }, [selectedSchemaId, schemas]);

  const loadSchemas = async () => {
    try {
      setIsLoading(true);
      const response = await getSchemas({
        status: 'Active',
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      setSchemas(response.schemas);
      setFilteredSchemas(response.schemas);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchemaSelect = (schemaId: string) => {
    const schema = schemas.find((s) => s.id === schemaId);
    setSelectedSchema(schema);
    onSchemaSelect(schemaId, schema);
  };

  const handleClearSelection = () => {
    setSelectedSchema(undefined);
    onSchemaSelect(undefined);
  };

  const handleSchemaCreated = async (schema: Schema) => {
    // Refresh the schemas list
    await loadSchemas();
    // Select the newly created schema
    handleSchemaSelect(schema.id);
    // Close the create dialog
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Data Schema</Label>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Info className="h-4 w-4" />
                Browse Schemas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw]! max-h-[95vh]! w-[95vw]! h-[95vh]! overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle>Select Data Schema</DialogTitle>
                <DialogDescription>
                  Choose a schema that defines the data structure for this device
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search schemas by name, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Create New Schema Link */}
                <Alert>
                  <FileJson className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Can&apos;t find the right schema?</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Create New Schema
                    </Button>
                  </AlertDescription>
                </Alert>

                {/* Schema List */}
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading schemas...
                  </div>
                ) : filteredSchemas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active schemas found. Create one to get started.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSchemas.map((schema) => (
                      <div
                        key={schema.id}
                        className={`
                          rounded-lg border p-4 cursor-pointer transition-colors
                          ${selectedSchemaId === schema.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50 hover:bg-accent'
                          }
                        `}
                        onClick={() => {
                          handleSchemaSelect(schema.id);
                          setIsDialogOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileJson className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">{schema.name}</h4>
                              {selectedSchemaId === schema.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {schema.description}
                            </p>
                            {(schema.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(schema.tags || []).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            v{schema.currentVersion?.version || '1.0.0'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Schema Display */}
        {selectedSchema ? (
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">{selectedSchema.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    v{selectedSchema.currentVersion?.version || '1.0.0'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSchema.description}
                </p>
                {(selectedSchema.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(selectedSchema.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/settings/schemas/${selectedSchema.id}`} target="_blank">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSelection}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Select
            value={selectedSchemaId}
            onValueChange={handleSchemaSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a data schema (optional)" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading schemas...
                </SelectItem>
              ) : filteredSchemas.length === 0 ? (
                <SelectItem value="none" disabled>
                  No schemas available
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="none">None (use later)</SelectItem>
                  {filteredSchemas.slice(0, 10).map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.name} (v{schema.currentVersion?.version || '1.0.0'})
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        )}

        <p className="text-xs text-muted-foreground">
          The schema defines the structure of data this device will send. You can select one now or configure it later.
        </p>
      </div>

      {/* Create Schema Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw]! max-h-[95vh]! w-[95vw]! h-[95vh]! overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Create New Schema</DialogTitle>
            <DialogDescription>
              Define a data schema for your IoT devices and sensors
            </DialogDescription>
          </DialogHeader>
          <SchemaWizardEmbedded
            onSuccess={handleSchemaCreated}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
