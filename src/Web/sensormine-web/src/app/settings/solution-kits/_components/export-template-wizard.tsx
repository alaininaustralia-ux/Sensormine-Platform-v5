/**
 * Export Template Wizard
 * 
 * Multi-step wizard for exporting configuration templates
 * Includes resource selection and automatic dependency detection
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Download, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

interface ResourceSelection {
  schemas: boolean;
  deviceTypeIds: string[];
  dashboardIds: string[];
  alertRuleIds: string[];
  assetIds: string[];
  nexusConfigurationIds: string[];
}

interface AvailableResources {
  deviceTypes: Array<{ id: string; name: string }>;
  dashboards: Array<{ id: string; name: string }>;
  alertRules: Array<{ id: string; name: string }>;
  assets: Array<{ id: string; name: string }>;
  nexusConfigurations: Array<{ id: string; name: string }>;
}

interface Dependency {
  type: string;
  id: string;
  name: string;
  reason: string;
}

export function ExportTemplateWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Template metadata
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateAuthor, setTemplateAuthor] = useState('');
  const [templateEmail, setTemplateEmail] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');

  // Resource selection
  const [availableResources, setAvailableResources] = useState<AvailableResources>({
    deviceTypes: [],
    dashboards: [],
    alertRules: [],
    assets: [],
    nexusConfigurations: [],
  });

  const [selection, setSelection] = useState<ResourceSelection>({
    schemas: true,
    deviceTypeIds: [],
    dashboardIds: [],
    alertRuleIds: [],
    assetIds: [],
    nexusConfigurationIds: [],
  });

  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [validating, setValidating] = useState(false);

  // Load available resources
  useEffect(() => {
    loadAvailableResources();
  }, []);

  async function loadAvailableResources() {
    try {
      setLoadingResources(true);
      
      const [deviceTypesRes, dashboardsRes, alertRulesRes, assetsRes] = await Promise.all([
        apiClient.get<{ items: Array<{ id: string; name: string }> }>('/devicetype'),
        apiClient.get<Array<{ id: string; name: string }>>('/dashboards'),
        apiClient.get<Array<{ id: string; name: string }>>('/alert-rules'),
        apiClient.get<Array<{ id: string; name: string }>>('/assets'),
      ]);

      setAvailableResources({
        deviceTypes: deviceTypesRes.data?.items || [],
        dashboards: dashboardsRes.data || [],
        alertRules: alertRulesRes.data || [],
        assets: assetsRes.data || [],
        nexusConfigurations: [],
      });
    } catch (error) {
      console.error('Error loading resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available resources',
        variant: 'destructive',
      });
    } finally {
      setLoadingResources(false);
    }
  }

  // Validate dependencies when selection changes
  useEffect(() => {
    if (step === 2) {
      validateDependencies();
    }
  }, [selection, step]);

  async function validateDependencies() {
    // Check for missing dependencies
    const deps: Dependency[] = [];

    // Check dashboard dependencies
    for (const dashboardId of selection.dashboardIds) {
      const dashboard = availableResources.dashboards.find(d => d.id === dashboardId);
      if (!dashboard) continue;

      // In a real implementation, you'd fetch the dashboard config and check for device type references
      // For now, we'll add a placeholder
      // TODO: Fetch dashboard config and extract device type IDs from widgets
    }

    // Check alert rule dependencies
    for (const alertRuleId of selection.alertRuleIds) {
      const alertRule = availableResources.alertRules.find(a => a.id === alertRuleId);
      if (!alertRule) continue;

      // TODO: Fetch alert rule and check if it references a device type
    }

    setDependencies(deps);
  }

  async function handleExport() {
    try {
      setLoading(true);

      const exportRequest = {
        name: templateName,
        description: templateDescription,
        author: templateAuthor,
        authorEmail: templateEmail,
        tags: templateTags.split(',').map(t => t.trim()).filter(Boolean),
        category: templateCategory,
        includeResources: {
          schemas: selection.schemas,
          deviceTypeIds: selection.deviceTypeIds,
          dashboardIds: selection.dashboardIds,
          alertRuleIds: selection.alertRuleIds,
          assetIds: selection.assetIds,
          nexusConfigurationIds: selection.nexusConfigurationIds,
          includeDevices: false,
        },
        exportOptions: {
          includeData: false,
          anonymize: false,
        },
      };

      const response = await apiClient.post('/api/templates/export', exportRequest);
      
      // Download the template as a JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Template exported successfully',
      });

      // Reset form
      setStep(1);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateAuthor('');
      setTemplateEmail('');
      setTemplateTags('');
      setTemplateCategory('');
      setSelection({
        schemas: true,
        deviceTypeIds: [],
        dashboardIds: [],
        alertRuleIds: [],
        assetIds: [],
        nexusConfigurationIds: [],
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleResourceSelection(type: keyof ResourceSelection, id: string) {
    if (type === 'schemas') return;
    
    setSelection(prev => {
      const current = prev[type] as string[];
      const updated = current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id];
      
      return { ...prev, [type]: updated };
    });
  }

  function selectAllOfType(type: keyof ResourceSelection) {
    if (type === 'schemas') return;
    
    const resourceKey = type.replace('Ids', '') + 's';
    const allIds = (availableResources as any)[resourceKey]?.map((r: any) => r.id) || [];
    
    setSelection(prev => ({
      ...prev,
      [type]: allIds,
    }));
  }

  function deselectAllOfType(type: keyof ResourceSelection) {
    if (type === 'schemas') return;
    
    setSelection(prev => ({
      ...prev,
      [type]: [],
    }));
  }

  const canProceed = () => {
    if (step === 1) {
      return templateName.trim().length > 0 && templateDescription.trim().length > 0;
    }
    if (step === 2) {
      const hasSelection = 
        selection.deviceTypeIds.length > 0 ||
        selection.dashboardIds.length > 0 ||
        selection.alertRuleIds.length > 0 ||
        selection.assetIds.length > 0 ||
        selection.nexusConfigurationIds.length > 0;
      return hasSelection;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          1
        </div>
        <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          2
        </div>
        <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          3
        </div>
      </div>

      {/* Step 1: Template Metadata */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Template Information</h3>
            <p className="text-sm text-muted-foreground">
              Provide basic information about your solution kit
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="Industrial Monitoring Solution"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Complete monitoring solution for industrial facilities..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Your Name"
                  value={templateAuthor}
                  onChange={(e) => setTemplateAuthor(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={templateEmail}
                  onChange={(e) => setTemplateEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Industrial, Energy, etc."
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="monitoring, industrial, iot"
                value={templateTags}
                onChange={(e) => setTemplateTags(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Resource Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Select Resources</h3>
            <p className="text-sm text-muted-foreground">
              Choose what to include in your solution kit. Dependencies will be detected automatically.
            </p>
          </div>

          {loadingResources ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Schemas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="schemas"
                    checked={selection.schemas}
                    onCheckedChange={(checked) => setSelection(prev => ({ ...prev, schemas: !!checked }))}
                  />
                  <Label htmlFor="schemas" className="font-medium">Include All Schemas</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  All data schemas will be included to ensure compatibility
                </p>
              </div>

              <Separator />

              {/* Device Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Device Types ({selection.deviceTypeIds.length} selected)</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => selectAllOfType('deviceTypeIds')}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deselectAllOfType('deviceTypeIds')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {availableResources.deviceTypes.map(dt => (
                    <div key={dt.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dt-${dt.id}`}
                        checked={selection.deviceTypeIds.includes(dt.id)}
                        onCheckedChange={() => toggleResourceSelection('deviceTypeIds', dt.id)}
                      />
                      <Label htmlFor={`dt-${dt.id}`} className="text-sm">{dt.name}</Label>
                    </div>
                  ))}
                  {availableResources.deviceTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No device types available</p>
                  )}
                </div>
              </div>

              {/* Dashboards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Dashboards ({selection.dashboardIds.length} selected)</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => selectAllOfType('dashboardIds')}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deselectAllOfType('dashboardIds')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {availableResources.dashboards.map(d => (
                    <div key={d.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dash-${d.id}`}
                        checked={selection.dashboardIds.includes(d.id)}
                        onCheckedChange={() => toggleResourceSelection('dashboardIds', d.id)}
                      />
                      <Label htmlFor={`dash-${d.id}`} className="text-sm">{d.name}</Label>
                    </div>
                  ))}
                  {availableResources.dashboards.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No dashboards available</p>
                  )}
                </div>
              </div>

              {/* Alert Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Alert Rules ({selection.alertRuleIds.length} selected)</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => selectAllOfType('alertRuleIds')}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deselectAllOfType('alertRuleIds')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {availableResources.alertRules.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`alert-${a.id}`}
                        checked={selection.alertRuleIds.includes(a.id)}
                        onCheckedChange={() => toggleResourceSelection('alertRuleIds', a.id)}
                      />
                      <Label htmlFor={`alert-${a.id}`} className="text-sm">{a.name}</Label>
                    </div>
                  ))}
                  {availableResources.alertRules.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No alert rules available</p>
                  )}
                </div>
              </div>

              {/* Assets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Assets ({selection.assetIds.length} selected)</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => selectAllOfType('assetIds')}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deselectAllOfType('assetIds')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {availableResources.assets.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`asset-${a.id}`}
                        checked={selection.assetIds.includes(a.id)}
                        onCheckedChange={() => toggleResourceSelection('assetIds', a.id)}
                      />
                      <Label htmlFor={`asset-${a.id}`} className="text-sm">{a.name}</Label>
                    </div>
                  ))}
                  {availableResources.assets.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No assets available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Export */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Review & Export</h3>
            <p className="text-sm text-muted-foreground">
              Review your selection and export the solution kit
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">{templateName}</h4>
              <p className="text-sm text-muted-foreground">{templateDescription}</p>
              {templateAuthor && (
                <p className="text-sm">Author: {templateAuthor}</p>
              )}
              {templateTags && (
                <div className="flex flex-wrap gap-1">
                  {templateTags.split(',').map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Resources Included</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Schemas:</span>
                  <span className="font-medium">{selection.schemas ? 'All' : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Device Types:</span>
                  <span className="font-medium">{selection.deviceTypeIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dashboards:</span>
                  <span className="font-medium">{selection.dashboardIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alert Rules:</span>
                  <span className="font-medium">{selection.alertRuleIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assets:</span>
                  <span className="font-medium">{selection.assetIds.length}</span>
                </div>
              </div>
            </div>

            {dependencies.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Additional dependencies detected:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {dependencies.map((dep, i) => (
                        <li key={i} className="text-sm">
                          {dep.name} ({dep.type}) - {dep.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1 || loading}
        >
          Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleExport}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Solution Kit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
