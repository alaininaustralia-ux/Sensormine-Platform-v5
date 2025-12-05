/**
 * Version History Component
 * 
 * Display and manage device type version history
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DeviceTypeVersion, DeviceType } from '@/lib/api/deviceTypes';

interface VersionHistoryProps {
  versions: DeviceTypeVersion[];
  onRollback: (versionNumber: number) => void;
  currentDeviceType: DeviceType;
}

export function VersionHistory({ versions, onRollback }: VersionHistoryProps) {
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);

  const handleRollbackClick = (version: number) => {
    setRollbackVersion(version);
  };

  const confirmRollback = () => {
    if (rollbackVersion !== null) {
      onRollback(rollbackVersion);
      setRollbackVersion(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Complete history of changes to this device type configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No version history available
              </p>
            ) : (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        Version {version.version}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    
                    {version.changeSummary && (
                      <p className="text-sm">{version.changeSummary}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {version.createdBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{version.createdBy}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {index !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollbackClick(version.version)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={rollbackVersion !== null} onOpenChange={() => setRollbackVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback to version {rollbackVersion}? 
              This will create a new version with the configuration from version {rollbackVersion}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRollback}>
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
