/**
 * Schema Editor Component
 * 
 * Comprehensive editor for schemas with version history
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  History, 
  Settings,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  updateSchema, 
  getSchemaVersions,
  type Schema,
  type UpdateSchemaRequest,
  type SchemaVersion
} from '@/lib/api/schemas';
import { SchemaJsonEditorAI } from './schema-json-editor-ai';
import { SchemaVersionHistory } from './schema-version-history';

interface SchemaEditorProps {
  schema: Schema;
}

export function SchemaEditor({ schema }: SchemaEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [name] = useState(schema.name);
  const [description, setDescription] = useState(schema.description || '');
  const [tags, setTags] = useState<string[]>(schema.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [jsonSchema, setJsonSchema] = useState(
    schema.currentVersion?.jsonSchema || 
    JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', properties: {} }, null, 2)
  );
  const [changeLog, setChangeLog] = useState('');

  useEffect(() => {
    loadVersionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.id]);

  const loadVersionHistory = async () => {
    try {
      const data = await getSchemaVersions(schema.id);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!changeLog.trim()) {
      toast({
        title: 'Change Log Required',
        description: 'Please provide a change log describing your modifications.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const request: UpdateSchemaRequest = {
        description,
        jsonSchema,
        changeLog,
        tags,
      };

      const updated = await updateSchema(schema.id, request);
      
      toast({
        title: 'Success',
        description: `Schema "${updated.name}" updated successfully`,
      });

      await loadVersionHistory();
      setChangeLog('');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update schema',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = 
    description !== (schema.description || '') ||
    JSON.stringify(tags) !== JSON.stringify(schema.tags || []) ||
    jsonSchema !== (schema.currentVersion?.jsonSchema || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings/schemas')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Schema</h1>
          </div>
          <p className="text-muted-foreground">
            {schema.name} • {schema.currentVersion ? `v${schema.currentVersion.version}` : 'v1'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{versions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Schema metadata and tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Schema name cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this schema..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
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
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>JSON Schema Definition</CardTitle>
                <CardDescription>
                  Define or modify the JSON Schema structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchemaJsonEditorAI
                  value={jsonSchema}
                  onChange={setJsonSchema}
                  changeLog={changeLog}
                  onChangeLogUpdate={setChangeLog}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <SchemaVersionHistory versions={versions} schema={schema} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
