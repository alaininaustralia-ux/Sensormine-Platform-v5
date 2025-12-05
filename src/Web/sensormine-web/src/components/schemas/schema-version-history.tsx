/**
 * Schema Version History Component
 * 
 * Display schema version history
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SchemaVersion, Schema } from '@/lib/types/schema';

interface SchemaVersionHistoryProps {
  versions: SchemaVersion[];
  schema: Schema;
}

export function SchemaVersionHistory({ versions, schema }: SchemaVersionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>
          Complete history of schema versions and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No version history available
            </p>
          ) : (
            versions.map((version) => {
              const isCurrent = version.id === schema.currentVersionId;
              
              return (
                <div
                  key={version.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={isCurrent ? 'default' : 'outline'}>
                        v{version.version}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                      {version.isActive && !isCurrent && (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                    
                    {version.changeLog && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{version.changeLog}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{version.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {version.jsonSchema && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View schema definition
                        </summary>
                        <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(JSON.parse(version.jsonSchema), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
