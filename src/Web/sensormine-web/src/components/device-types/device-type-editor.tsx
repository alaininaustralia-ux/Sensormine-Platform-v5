/**
 * Device Type Editor Component
 * 
 * Comprehensive editor for device types with version history and validation
 * Story 1.2 - Edit Device Type Configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ArrowLeft, 
  History, 
  BarChart3,
  FileText,
  Settings,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  updateDeviceType, 
  validateDeviceTypeUpdate,
  getDeviceTypeVersionHistory,
  getDeviceTypeUsageStatistics,
  getDeviceTypeAuditLogs,
  rollbackDeviceType
} from '@/lib/api/deviceTypes';
import type { DeviceType, DeviceTypeRequest } from '@/lib/api/types';
import type {
  DeviceTypeValidationResult,
  DeviceTypeVersion,
  DeviceTypeUsageStats,
  DeviceTypeAuditLog
} from '@/lib/api/deviceTypes';
import { DeviceTypeForm } from '@/components/device-types/device-type-form';
import { VersionHistory } from '@/components/device-types/version-history';
import { UsageStatistics } from '@/components/device-types/usage-statistics';
import { AuditLogs } from '@/components/device-types/audit-logs';
import { FieldMappingEditor } from '@/components/device-types/field-mapping-editor';

interface DeviceTypeEditorProps {
  deviceType: DeviceType;
}

export function DeviceTypeEditor({ deviceType }: DeviceTypeEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<DeviceTypeValidationResult | null>(null);
  const [versions, setVersions] = useState<DeviceTypeVersion[]>([]);
  const [usageStats, setUsageStats] = useState<DeviceTypeUsageStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<DeviceTypeAuditLog[]>([]);
  const [formData, setFormData] = useState<DeviceTypeRequest>({
    name: deviceType.name || '',
    description: deviceType.description || '',
    protocol: deviceType.protocol,
    protocolConfig: deviceType.protocolConfig || {},
    schemaId: deviceType.schemaId,
    customFields: deviceType.customFields || [],
    alertTemplates: deviceType.alertTemplates || [],
    tags: deviceType.tags || [],
    isActive: deviceType.isActive,
  });

  useEffect(() => {
    loadVersionHistory();
    loadUsageStatistics();
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceType.id]);

  const loadVersionHistory = async () => {
    try {
      const data = await getDeviceTypeVersionHistory(deviceType.id);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
  };

  const loadUsageStatistics = async () => {
    try {
      const data = await getDeviceTypeUsageStatistics(deviceType.id);
      setUsageStats(data);
    } catch (error) {
      console.error('Failed to load usage statistics:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await getDeviceTypeAuditLogs(deviceType.id, 1, 50);
      setAuditLogs(response.logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await validateDeviceTypeUpdate(deviceType.id, formData);
      setValidationResult(result);
      
      if (!result.isValid) {
        toast({
          title: 'Validation Failed',
          description: 'This update contains breaking changes that would affect existing devices.',
          variant: 'destructive',
        });
      } else if (result.warnings.length > 0) {
        toast({
          title: 'Validation Warnings',
          description: `${result.warnings.length} warning(s) detected. Review before saving.`,
        });
      } else {
        toast({
          title: 'Validation Passed',
          description: 'No issues detected with this update.',
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'Failed to validate update',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Validate first
      const result = await validateDeviceTypeUpdate(deviceType.id, formData);
      
      if (!result.isValid) {
        toast({
          title: 'Cannot Save',
          description: 'This update contains breaking changes. Please fix the issues first.',
          variant: 'destructive',
        });
        return;
      }

      const updated = await updateDeviceType(deviceType.id, formData);
      
      toast({
        title: 'Success',
        description: `Device type "${updated.name}" updated successfully`,
      });

      // Reload data
      await loadVersionHistory();
      await loadAuditLogs();
      setValidationResult(null);

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update device type',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    try {
      const updated = await rollbackDeviceType(deviceType.id, versionNumber);
      
      toast({
        title: 'Rollback Successful',
        description: `Rolled back to version ${versionNumber}`,
      });

      // Update form with rolled back data
      setFormData({
        name: updated.name,
        description: updated.description,
        protocol: updated.protocol,
        protocolConfig: updated.protocolConfig,
        schemaId: updated.schemaId,
        customFields: updated.customFields,
        alertTemplates: updated.alertTemplates,
        tags: updated.tags,
        isActive: updated.isActive,
      });

      await loadVersionHistory();
      await loadAuditLogs();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Rollback Failed',
        description: error instanceof Error ? error.message : 'Failed to rollback device type',
        variant: 'destructive',
      });
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: deviceType.name || '',
    description: deviceType.description || '',
    protocol: deviceType.protocol,
    protocolConfig: deviceType.protocolConfig || {},
    schemaId: deviceType.schemaId,
    customFields: deviceType.customFields || [],
    alertTemplates: deviceType.alertTemplates || [],
    tags: deviceType.tags || [],
    isActive: deviceType.isActive,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings/device-types')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Device Type</h1>
          </div>
          <p className="text-muted-foreground">
            {deviceType.name} • {versions.length > 0 ? `Version ${versions[0].version}` : 'v1'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleValidate}>
            Validate Changes
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Breaking Changes Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.breakingChanges.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
            {validationResult.affectedDeviceCount > 0 && (
              <p className="mt-2 font-medium">
                This would affect {validationResult.affectedDeviceCount} active device(s).
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {validationResult && validationResult.isValid && validationResult.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="fields">
            <Settings2 className="h-4 w-4 mr-2" />
            Field Mappings
            {deviceType.fields && deviceType.fields.length > 0 && (
              <Badge variant="secondary" className="ml-2">{deviceType.fields.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Version History
            {versions && versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{versions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Usage Statistics
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
            {auditLogs && auditLogs.length > 0 && (
              <Badge variant="secondary" className="ml-2">{auditLogs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Device Type Configuration</CardTitle>
              <CardDescription>
                Modify protocol settings, custom fields, and alert templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceTypeForm
                data={formData}
                onChange={setFormData}
                isEdit={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <FieldMappingEditor deviceTypeId={deviceType.id} />
        </TabsContent>

        <TabsContent value="history">
          <VersionHistory
            versions={versions}
            onRollback={handleRollback}
            currentDeviceType={deviceType}
          />
        </TabsContent>

        <TabsContent value="usage">
          {usageStats && <UsageStatistics stats={usageStats} />}
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs logs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
