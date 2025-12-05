/**
 * Device Type Form Component
 * 
 * Form for creating/editing device type configuration
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, FileJson, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSchemas } from '@/lib/api/schemas';
import type { Schema } from '@/lib/types/schema';
import type { DeviceTypeRequest } from '@/lib/api/deviceTypes';

interface DeviceTypeFormProps {
  data: DeviceTypeRequest;
  onChange: (data: DeviceTypeRequest) => void;
  isEdit?: boolean;
}

export function DeviceTypeForm({ data, onChange, isEdit = false }: DeviceTypeFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

  useEffect(() => {
    loadSchemas();
  }, []);

  useEffect(() => {
    if (data.schemaId && schemas.length > 0) {
      const schema = schemas.find(s => s.id === data.schemaId);
      setSelectedSchema(schema || null);
    }
  }, [data.schemaId, schemas]);

  const loadSchemas = async () => {
    try {
      const response = await getSchemas({ status: 'Active', pageSize: 100 });
      setSchemas(response.schemas);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setLoadingSchemas(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange({ ...data, tags: [...data.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ ...data, tags: data.tags.filter((t: string) => t !== tagToRemove) });
  };

  const handleSchemaChange = (schemaId: string) => {
    if (schemaId === 'none') {
      onChange({ ...data, schemaId: undefined });
      setSelectedSchema(null);
    } else {
      onChange({ ...data, schemaId });
      const schema = schemas.find(s => s.id === schemaId);
      setSelectedSchema(schema || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g., Temperature Sensor v2"
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            Device type name cannot be changed
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe this device type..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schema">Data Schema</Label>
        <Select
          value={data.schemaId || 'none'}
          onValueChange={handleSchemaChange}
          disabled={loadingSchemas}
        >
          <SelectTrigger id="schema">
            <SelectValue placeholder={loadingSchemas ? 'Loading schemas...' : 'Select a schema'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">No schema</span>
            </SelectItem>
            {schemas.map((schema) => (
              <SelectItem key={schema.id} value={schema.id}>
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  <span>{schema.name}</span>
                  {schema.currentVersion && (
                    <Badge variant="outline" className="text-xs">
                      v{schema.currentVersion.version}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSchema && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">{selectedSchema.name}</p>
            {selectedSchema.description && (
              <p className="text-xs text-muted-foreground">{selectedSchema.description}</p>
            )}
            {selectedSchema.currentVersion && (
              <Badge variant="secondary" className="text-xs">
                Version {selectedSchema.currentVersion.version}
              </Badge>
            )}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open(`/schemas/${selectedSchema.id}`, '_blank')}
            >
              <Search className="h-3 w-3 mr-1" />
              View Schema Details
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Select a schema to define the structure of data this device type will produce
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" onClick={handleAddTag}>
            <Tag className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground mt-4">
        <p>Additional configuration options (protocol, custom fields, alerts) will be added in future updates.</p>
      </div>
    </div>
  );
}
