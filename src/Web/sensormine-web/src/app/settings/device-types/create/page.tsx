/**
 * Create Device Type Page
 * 
 * Multi-step form for creating a new device type
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { createDeviceType } from '@/lib/api/deviceTypes';
import type { DeviceTypeRequest, DeviceProtocol, ProtocolConfig, CustomFieldDefinition, CustomFieldType, AlertRuleTemplate, AlertSeverity } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const PROTOCOLS: DeviceProtocol[] = ['MQTT', 'HTTP', 'WebSocket', 'OPC_UA', 'Modbus_TCP', 'Modbus_RTU', 'BACnet', 'EtherNetIP'];
const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['Text', 'Number', 'Boolean', 'Date', 'DateTime', 'Select', 'MultiSelect', 'Email', 'URL'];
const ALERT_SEVERITIES: AlertSeverity[] = ['Info', 'Warning', 'Error', 'Critical'];

export default function CreateDeviceTypePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState<DeviceProtocol>('MQTT');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [alertTemplates, setAlertTemplates] = useState<AlertRuleTemplate[]>([]);

  // MQTT Config State
  const [mqttBroker, setMqttBroker] = useState('mqtt://localhost:1883');
  const [mqttTopic, setMqttTopic] = useState('');
  const [mqttQos, setMqttQos] = useState(1);

  // HTTP Config State
  const [httpEndpoint, setHttpEndpoint] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        name: '',
        label: '',
        type: 'Text',
        required: false,
      },
    ]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleAddAlertTemplate = () => {
    setAlertTemplates([
      ...alertTemplates,
      {
        name: '',
        condition: '',
        severity: 'Warning',
        enabled: true,
      },
    ]);
  };

  const handleRemoveAlertTemplate = (index: number) => {
    setAlertTemplates(alertTemplates.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Build protocol config based on selected protocol
      const config: ProtocolConfig = {};
      if (protocol === 'MQTT') {
        config.mqtt = {
          broker: mqttBroker,
          topic: mqttTopic,
          qos: mqttQos,
        };
      } else if (protocol === 'HTTP') {
        config.http = {
          endpoint: httpEndpoint,
          method: httpMethod,
        };
      }

      const request: DeviceTypeRequest = {
        name,
        description: description || undefined,
        protocol,
        protocolConfig: config,
        customFields: customFields,
        alertTemplates: alertTemplates,
        tags: tags,
      };

      console.log('Sending device type request:', JSON.stringify(request, null, 2));

      await createDeviceType(request);

      toast({
        title: 'Success',
        description: 'Device type created successfully',
      });

      router.push('/settings/device-types');
    } catch (error: unknown) {
      const err = error as { message?: string; details?: unknown };
      const errorMessage = err?.message || 'Failed to create device type';
      const errorDetails = err?.details ? JSON.stringify(err.details) : '';
      
      toast({
        title: 'Error',
        description: errorDetails || errorMessage,
        variant: 'destructive',
      });
      console.error('Error creating device type:', error);
      console.error('Error details:', err?.details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Device Type</h2>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for your device type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Temperature Sensor"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this device type..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol *</Label>
              <Select value={protocol} onValueChange={(v) => setProtocol(v as DeviceProtocol)}>
                <SelectTrigger id="protocol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleNext} disabled={!name}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Protocol Configuration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Protocol Configuration</CardTitle>
            <CardDescription>
              Configure {protocol} protocol settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {protocol === 'MQTT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mqttBroker">Broker URL *</Label>
                  <Input
                    id="mqttBroker"
                    placeholder="mqtt://localhost:1883"
                    value={mqttBroker}
                    onChange={(e) => setMqttBroker(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqttTopic">Topic *</Label>
                  <Input
                    id="mqttTopic"
                    placeholder="sensors/temperature"
                    value={mqttTopic}
                    onChange={(e) => setMqttTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqttQos">QoS Level</Label>
                  <Select value={mqttQos.toString()} onValueChange={(v) => setMqttQos(parseInt(v))}>
                    <SelectTrigger id="mqttQos">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - At most once</SelectItem>
                      <SelectItem value="1">1 - At least once</SelectItem>
                      <SelectItem value="2">2 - Exactly once</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {protocol === 'HTTP' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="httpEndpoint">Endpoint URL *</Label>
                  <Input
                    id="httpEndpoint"
                    placeholder="https://api.example.com/data"
                    value={httpEndpoint}
                    onChange={(e) => setHttpEndpoint(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="httpMethod">HTTP Method</Label>
                  <Select value={httpMethod} onValueChange={setHttpMethod}>
                    <SelectTrigger id="httpMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {!['MQTT', 'HTTP'].includes(protocol) && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {protocol} configuration will be available in a future update
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Custom Fields & Tags */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields & Tags</CardTitle>
            <CardDescription>
              Define custom fields and tags for this device type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField}>
                  Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[index].name = e.target.value;
                          setCustomFields(updated);
                        }}
                      />
                      <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[index].label = e.target.value;
                          setCustomFields(updated);
                        }}
                      />
                      <Select
                        value={field.type}
                        onValueChange={(v) => {
                          const updated = [...customFields];
                          updated[index].type = v as CustomFieldType;
                          setCustomFields(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CUSTOM_FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Alert Templates */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Templates</CardTitle>
            <CardDescription>
              Define alert rule templates for this device type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alert Rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAlertTemplate}>
                Add Alert
              </Button>
            </div>
            <div className="space-y-3">
              {alertTemplates.map((alert, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Alert name"
                      value={alert.name}
                      onChange={(e) => {
                        const updated = [...alertTemplates];
                        updated[index].name = e.target.value;
                        setAlertTemplates(updated);
                      }}
                      className="flex-1"
                    />
                    <Select
                      value={alert.severity}
                      onValueChange={(v) => {
                        const updated = [...alertTemplates];
                        updated[index].severity = v as AlertSeverity;
                        setAlertTemplates(updated);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_SEVERITIES.map((severity) => (
                          <SelectItem key={severity} value={severity}>
                            {severity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAlertTemplate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Condition (e.g., temperature > 80)"
                    value={alert.condition}
                    onChange={(e) => {
                      const updated = [...alertTemplates];
                      updated[index].condition = e.target.value;
                      setAlertTemplates(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !name}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Device Type'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
