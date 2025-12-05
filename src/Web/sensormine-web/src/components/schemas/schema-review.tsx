/**
 * Schema Review Component
 * 
 * Third step of schema wizard - review and confirm
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SchemaReviewProps {
  data: {
    name: string;
    description: string;
    tags: string[];
    jsonSchema: string;
    changeLog: string;
  };
}

export function SchemaReview({ data }: SchemaReviewProps) {
  let parsedSchema: unknown = null;
  let schemaProperties: Array<{ name: string; type: string; required: boolean }> = [];

  try {
    parsedSchema = JSON.parse(data.jsonSchema);
    
    // Extract properties for preview
    if (
      parsedSchema &&
      typeof parsedSchema === 'object' &&
      'properties' in parsedSchema &&
      parsedSchema.properties &&
      typeof parsedSchema.properties === 'object'
    ) {
      const required = ('required' in parsedSchema && Array.isArray(parsedSchema.required))
        ? parsedSchema.required
        : [];
      
      schemaProperties = Object.entries(parsedSchema.properties).map(([name, prop]) => ({
        name,
        type: (prop && typeof prop === 'object' && 'type' in prop && typeof prop.type === 'string')
          ? prop.type
          : 'unknown',
        required: required.includes(name),
      }));
    }
  } catch {
    // Ignore parsing errors
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-lg font-semibold">{data.name}</dd>
          </div>
          <Separator />
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
            <dd className="mt-1">{data.description}</dd>
          </div>
          {data.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-2">Tags</dt>
                <dd className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Schema Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Structure</CardTitle>
          <CardDescription>
            {schemaProperties.length} {schemaProperties.length === 1 ? 'property' : 'properties'} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schemaProperties.length > 0 ? (
            <div className="space-y-2">
              {schemaProperties.map((prop) => (
                <div
                  key={prop.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono font-semibold">{prop.name}</code>
                    {prop.required && (
                      <Badge variant="outline" className="text-xs">
                        required
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{prop.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No properties defined</p>
          )}
        </CardContent>
      </Card>

      {/* JSON Schema */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Schema</CardTitle>
          <CardDescription>Raw schema definition</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm">
            <code>{data.jsonSchema}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Change Log */}
      {data.changeLog && (
        <Card>
          <CardHeader>
            <CardTitle>Change Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.changeLog}</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Message */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4">
        <p className="text-sm">
          <span className="font-medium">Ready to create:</span> Review the information above and
          click &quot;Create Schema&quot; to save your new schema. It will be created with status
          &quot;Draft&quot; and version 1.0.0.
        </p>
      </div>
    </div>
  );
}
