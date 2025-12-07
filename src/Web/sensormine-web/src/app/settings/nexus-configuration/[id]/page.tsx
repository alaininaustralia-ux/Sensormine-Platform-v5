/**
 * View/Edit Nexus Configuration Page
 * 
 * View and edit existing configuration
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Rocket,
  Radio,
  Wifi,
  Code,
  Bell,
  Tag,
} from 'lucide-react';
import { nexusConfigurationApi } from '@/lib/api';
import type { NexusConfiguration, UpdateNexusConfigurationRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ViewEditConfigurationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<NexusConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Validated' | 'Deployed'>('Draft');

  useEffect(() => {
    loadConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const result = await nexusConfigurationApi.getById(params.id);
      setConfig(result);
      setName(result.name);
      setDescription(result.description || '');
      setStatus(result.status);
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration. Please try again.',
        variant: 'destructive',
      });
      router.push('/settings/nexus-configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const updateData: UpdateNexusConfigurationRequest = {
        name,
        description,
        status,
      };

      await nexusConfigurationApi.update(config.id, updateData);

      toast({
        title: 'Success',
        description: 'Configuration updated successfully.',
      });

      loadConfiguration();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config) return;

    try {
      await nexusConfigurationApi.delete(config.id);
      toast({
        title: 'Success',
        description: 'Configuration deleted successfully.',
      });
      router.push('/settings/nexus-configuration');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeploy = async () => {
    if (!config) return;

    try {
      const result = await nexusConfigurationApi.deploy({
        configurationId: config.id,
        createDeviceType: true,
        createSchema: true,
        deviceTypeName: `${config.name} Device Type`,
        schemaName: `${config.name} Schema`,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: `Deployed successfully. Device Type ID: ${result.deviceTypeId}`,
        });
        
        // Update status to Deployed
        const updateData: UpdateNexusConfigurationRequest = {
          status: 'Deployed',
        };
        await nexusConfigurationApi.update(config.id, updateData);
        
        loadConfiguration();
      } else {
        toast({
          title: 'Deployment Failed',
          description: result.errorMessage || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deploying configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to deploy configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowDeployDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{config.name}</h1>
            <Badge variant={
              config.status === 'Deployed' ? 'default' :
              config.status === 'Validated' ? 'secondary' : 'outline'
            }>
              {config.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Last updated {formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="default" onClick={() => setShowDeployDialog(true)}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="probes">
            <Radio className="mr-2 h-4 w-4" />
            Probes ({config.probeConfigurations.length})
          </TabsTrigger>
          <TabsTrigger value="communication">
            <Wifi className="mr-2 h-4 w-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="logic">
            <Code className="mr-2 h-4 w-4" />
            Custom Logic
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the name and description of this configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving || !name}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{config.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(config.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {config.deviceTypeId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Device Type ID</p>
                    <p className="text-sm font-mono">{config.deviceTypeId}</p>
                  </div>
                )}
                {config.schemaId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schema ID</p>
                    <p className="text-sm font-mono">{config.schemaId}</p>
                  </div>
                )}
              </div>

              {config.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {config.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Probes Tab */}
        <TabsContent value="probes">
          <Card>
            <CardHeader>
              <CardTitle>Probe Configuration</CardTitle>
              <CardDescription>
                {config.probeConfigurations.length} probe(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.probeConfigurations.map((probe, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{probe.probeName}</CardTitle>
                      <Badge variant="secondary">{probe.probeType}</Badge>
                    </div>
                    <CardDescription>
                      {probe.sensorType} · {probe.unit}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Probe ID</dt>
                        <dd className="font-mono">{probe.probeId}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Sampling Interval</dt>
                        <dd>{probe.samplingIntervalSeconds}s</dd>
                      </div>
                      {probe.transformationFormula && (
                        <div className="md:col-span-2">
                          <dt className="text-muted-foreground">Transformation</dt>
                          <dd className="font-mono text-xs">{probe.transformationFormula}</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>
                Protocol and transmission configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Protocol</p>
                  <Badge className="mt-1">{config.communicationSettings.protocol}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transmission Interval</p>
                  <p className="mt-1">{config.communicationSettings.transmissionIntervalSeconds}s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batching</p>
                  <p className="mt-1">
                    {config.communicationSettings.enableBatching
                      ? `Enabled (max ${config.communicationSettings.maxBatchSize})`
                      : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compression</p>
                  <p className="mt-1">
                    {config.communicationSettings.enableCompression ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {config.communicationSettings.mqttSettings && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">MQTT Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Broker URL</dt>
                        <dd className="font-mono">{config.communicationSettings.mqttSettings.brokerUrl}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Port</dt>
                        <dd>{config.communicationSettings.mqttSettings.port}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">QoS Level</dt>
                        <dd>{config.communicationSettings.mqttSettings.qoS}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">TLS</dt>
                        <dd>{config.communicationSettings.mqttSettings.useTls ? 'Enabled' : 'Disabled'}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-muted-foreground">Topic Pattern</dt>
                        <dd className="font-mono text-xs">{config.communicationSettings.mqttSettings.topicPattern}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Logic Tab */}
        <TabsContent value="logic">
          <Card>
            <CardHeader>
              <CardTitle>Custom Logic</CardTitle>
              <CardDescription>
                Custom data transformation and processing logic
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.customLogic ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Language: {config.customLogicLanguage || 'CSharp'}</Label>
                  </div>
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                    <code>{config.customLogic}</code>
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">No custom logic configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rule Templates</CardTitle>
              <CardDescription>
                {config.alertRuleTemplates.length} alert rule(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.alertRuleTemplates.length > 0 ? (
                <div className="space-y-3">
                  {config.alertRuleTemplates.map((alert, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{alert.name}</CardTitle>
                          <Badge variant={
                            alert.severity === 'Critical' ? 'destructive' :
                            alert.severity === 'High' ? 'default' :
                            alert.severity === 'Medium' ? 'secondary' : 'outline'
                          }>
                            {alert.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Condition</p>
                          <p className="text-sm font-mono">{alert.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Message</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant="outline">
                            {alert.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No alert rules configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the configuration
              &quot;{config.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deploy Dialog */}
      <AlertDialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deploy Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a Device Type and Schema in the platform based on this configuration.
              The configuration will be marked as Deployed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeploy}>
              Deploy Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
