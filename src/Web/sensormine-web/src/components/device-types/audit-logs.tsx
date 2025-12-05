/**
 * Audit Logs Component
 * 
 * Display device type audit trail
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DeviceTypeAuditLog } from '@/lib/api/deviceTypes';

interface AuditLogsProps {
  logs: DeviceTypeAuditLog[];
}

const ACTION_COLORS: Record<string, string> = {
  Created: 'bg-green-500/10 text-green-500 border-green-500/20',
  Updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SchemaChanged: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
  Rollback: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export function AuditLogs({ logs }: AuditLogsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Complete audit trail of all changes to this device type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No audit logs available
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={ACTION_COLORS[log.action] || ''}
                    >
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.changeTimestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {log.changedBy && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.changedBy}</span>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{log.ipAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(log.changeTimestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {log.oldValue && log.newValue && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View changes
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded space-y-2">
                        <div>
                          <strong>Before:</strong>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <strong>After:</strong>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
