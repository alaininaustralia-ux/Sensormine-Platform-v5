/**
 * Create Alert Rule Page
 * 
 * Form for creating a new alert rule
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { alertRulesApi, ApiAlertSeverity, AlertTargetType, AlertOperator, AlertCondition, CreateAlertRuleRequest, getAllDeviceTypes, getDevices, DeviceType, ApiDevice } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface FieldMapping {
  id: string;
  fieldName: string;
  friendlyName: string;
  dataType: 'String' | 'Number' | 'Boolean' | 'DateTime';
  unit?: string;
  description?: string;
}

export default function CreateAlertRulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [availableFields, setAvailableFields] = useState<FieldMapping[]>([]);
  const [loadingFields, setLoadingFields] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ApiAlertSeverity>(ApiAlertSeverity.Warning);
  const [targetType, setTargetType] = useState<AlertTargetType>(AlertTargetType.DeviceType);
  const [selectedDeviceTypeIds, setSelectedDeviceTypeIds] = useState<string[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [conditions, setConditions] = useState<AlertCondition[]>([
    { field: '', operator: AlertOperator.GreaterThan, value: '', level: ApiAlertSeverity.Warning }
  ]);
  const [conditionLogic, setConditionLogic] = useState('AND'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [timeWindowSeconds, setTimeWindowSeconds] = useState(300);
  const [evaluationFrequencySeconds, setEvaluationFrequencySeconds] = useState(60);
  const [cooldownMinutes, setCooldownMinutes] = useState(15);
  const [deliveryChannels, setDeliveryChannels] = useState<string[]>(['email']); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    loadDeviceTypes();
    loadDevices();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      const response = await getAllDeviceTypes();
      setDeviceTypes(response.items || []);
    } catch (error) {
      console.error('Failed to load device types:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await getDevices({ page: 1, pageSize: 1000 });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadFieldsForDeviceTypes = useCallback(async (deviceTypeIds: string[]) => {
    if (deviceTypeIds.length === 0) {
      setAvailableFields([]);
      return;
    }
    
    setLoadingFields(true);
    try {
      // Load fields for the first device type (if multiple selected, we could merge them)
      const response = await apiClient.get<FieldMapping[]>(`/api/devicetype/${deviceTypeIds[0]}/fields`);
      setAvailableFields(response.data || []);
    } catch (error) {
      console.error('Failed to load fields:', error);
      toast({ title: 'Error', description: 'Failed to load fields for selected device type', variant: 'destructive' });
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  }, [toast]);

  const loadFieldsForDevices = useCallback(async (deviceIds: string[]) => {
    if (deviceIds.length === 0) {
      setAvailableFields([]);
      return;
    }
    
    setLoadingFields(true);
    try {
      // Get the first device to determine its type
      const device = devices.find(d => d.id === deviceIds[0]);
      if (device?.deviceTypeId) {
        const response = await apiClient.get<FieldMapping[]>(`/api/devicetype/${device.deviceTypeId}/fields`);
        setAvailableFields(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
      toast({ title: 'Error', description: 'Failed to load fields for selected device', variant: 'destructive' });
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  }, [devices, toast]);

  const getOperatorsForField = (fieldName: string): AlertOperator[] => {
    const field = availableFields.find(f => f.fieldName === fieldName);
    if (!field) return [AlertOperator.GreaterThan, AlertOperator.LessThan, AlertOperator.Equal, AlertOperator.NotEqual];

    switch (field.dataType) {
      case 'Boolean':
        return [AlertOperator.Equal, AlertOperator.NotEqual];
      case 'Number':
        return [AlertOperator.GreaterThan, AlertOperator.LessThan, AlertOperator.Equal, AlertOperator.NotEqual];
      case 'String':
        return [AlertOperator.Equal, AlertOperator.NotEqual];
      case 'DateTime':
        return [AlertOperator.GreaterThan, AlertOperator.LessThan];
      default:
        return [AlertOperator.GreaterThan, AlertOperator.LessThan, AlertOperator.Equal, AlertOperator.NotEqual];
    }
  };

  const getOperatorLabel = (op: AlertOperator): string => {
    switch (op) {
      case AlertOperator.GreaterThan: return '>';
      case AlertOperator.LessThan: return '<';
      case AlertOperator.Equal: return '=';
      case AlertOperator.NotEqual: return '≠';
      default: return op;
    }
  };

  // Load fields when device type or device selection changes
  useEffect(() => {
    if (targetType === AlertTargetType.DeviceType && selectedDeviceTypeIds.length > 0) {
      loadFieldsForDeviceTypes(selectedDeviceTypeIds);
    } else if (targetType === AlertTargetType.Device && selectedDeviceIds.length > 0) {
      loadFieldsForDevices(selectedDeviceIds);
    } else {
      setAvailableFields([]);
      // Reset conditions when selection changes
      setConditions([{ field: '', operator: AlertOperator.GreaterThan, value: '', level: ApiAlertSeverity.Warning }]);
    }
  }, [targetType, selectedDeviceTypeIds, selectedDeviceIds, loadFieldsForDeviceTypes, loadFieldsForDevices]);

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: AlertOperator.GreaterThan, value: '', level: ApiAlertSeverity.Warning }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<AlertCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Alert rule name is required', variant: 'destructive' });
      return;
    }

    if (conditions.some(c => !c.field || !c.value)) {
      toast({ title: 'Error', description: 'All conditions must have a field and value', variant: 'destructive' });
      return;
    }

    const filteredRecipients = recipients.filter(r => r.trim());
    if (filteredRecipients.length === 0) {
      toast({ title: 'Error', description: 'At least one recipient is required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      // Convert condition field names to PascalCase for backend
      const mappedConditions = conditions.map(c => ({
        Field: c.field,
        Operator: c.operator,
        Value: c.value,
        SecondValue: c.secondValue,
        Unit: c.unit,
        Level: c.level,
      }));
      
      const request: CreateAlertRuleRequest = {
        name: name.trim(),
        description: description.trim(),
        severity,
        targetType,
        deviceTypeIds: targetType === AlertTargetType.DeviceType ? selectedDeviceTypeIds : [],
        deviceIds: targetType === AlertTargetType.Device ? selectedDeviceIds : [],
        conditions: mappedConditions,
        conditionLogic,
        timeWindowSeconds,
        evaluationFrequencySeconds,
        cooldownMinutes,
        deliveryChannels,
        recipients: filteredRecipients,
        isEnabled,
        tags: tags.filter(t => t.trim()),
      };

      await alertRulesApi.create(request);
      
      toast({
        title: 'Success',
        description: 'Alert rule created successfully',
      });
      
      router.push('/settings/alert-rules');
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create alert rule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/alert-rules">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Alert Rule</h1>
            <p className="text-muted-foreground">
              Configure a new alert rule for devices
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure the alert rule name and severity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., High Temperature Alert"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={severity} onValueChange={(value) => setSeverity(value as ApiAlertSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ApiAlertSeverity.Info}>Info</SelectItem>
                    <SelectItem value={ApiAlertSeverity.Warning}>Warning</SelectItem>
                    <SelectItem value={ApiAlertSeverity.Critical}>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe when this alert should trigger..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Target Selection</CardTitle>
            <CardDescription>Choose which devices this alert applies to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Type *</Label>
              <Select value={targetType} onValueChange={(value) => setTargetType(value as AlertTargetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AlertTargetType.DeviceType}>Device Type</SelectItem>
                  <SelectItem value={AlertTargetType.Device}>Specific Devices</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === AlertTargetType.DeviceType && (
              <div className="space-y-2">
                <Label>Device Types *</Label>
                <Select onValueChange={(value) => {
                  if (!selectedDeviceTypeIds.includes(value)) {
                    setSelectedDeviceTypeIds([...selectedDeviceTypeIds, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device types..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((dt) => (
                      <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {selectedDeviceTypeIds.map((id) => {
                    const dt = deviceTypes.find(d => d.id === id);
                    return dt ? (
                      <Badge key={id} variant="secondary">
                        {dt.name}
                        <button
                          type="button"
                          onClick={() => setSelectedDeviceTypeIds(selectedDeviceTypeIds.filter(dtId => dtId !== id))}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {targetType === AlertTargetType.Device && (
              <div className="space-y-2">
                <Label>Devices *</Label>
                <Select onValueChange={(value) => {
                  if (!selectedDeviceIds.includes(value)) {
                    setSelectedDeviceIds([...selectedDeviceIds, value]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select devices..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {selectedDeviceIds.map((id) => {
                    const device = devices.find(d => d.id === id);
                    return device ? (
                      <Badge key={id} variant="secondary">
                        {device.name}
                        <button
                          type="button"
                          onClick={() => setSelectedDeviceIds(selectedDeviceIds.filter(dId => dId !== id))}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Conditions</CardTitle>
            <CardDescription>
              {availableFields.length === 0 
                ? 'Select device type(s) or device(s) above to define conditions' 
                : 'Define when the alert should trigger'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableFields.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                Please select at least one device type or device to enable alert conditions.
              </div>
            ) : (
              <>
                {conditions.map((condition, index) => {
                  const selectedField = availableFields.find(f => f.fieldName === condition.field);
                  const allowedOperators = condition.field ? getOperatorsForField(condition.field) : [];
                  
                  return (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Field *</Label>
                        <Select 
                          value={condition.field}
                          onValueChange={(value) => {
                            const field = availableFields.find(f => f.fieldName === value);
                            const defaultOp = field?.dataType === 'Boolean' ? AlertOperator.Equal : AlertOperator.GreaterThan;
                            updateCondition(index, { field: value, operator: defaultOp });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.fieldName} value={field.fieldName}>
                                {field.friendlyName} {field.unit ? `(${field.unit})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedField?.description && (
                          <p className="text-xs text-muted-foreground">{selectedField.description}</p>
                        )}
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Operator *</Label>
                        <Select 
                          value={condition.operator} 
                          onValueChange={(value) => updateCondition(index, { operator: value as AlertOperator })}
                          disabled={!condition.field}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedOperators.map((op) => (
                              <SelectItem key={op} value={op}>{getOperatorLabel(op)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Value *</Label>
                        <Input
                          placeholder={selectedField?.dataType === 'Boolean' ? 'true or false' : 'Enter value'}
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          disabled={!condition.field}
                          type={selectedField?.dataType === 'Number' ? 'number' : 'text'}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                        disabled={conditions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCondition}
                  disabled={availableFields.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure who receives alerts and how</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipients (Email) *</Label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    type="email"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                    disabled={recipients.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Evaluation Frequency (seconds)</Label>
                <Input
                  type="number"
                  value={evaluationFrequencySeconds}
                  onChange={(e) => setEvaluationFrequencySeconds(parseInt(e.target.value) || 60)}
                  min={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Window (seconds)</Label>
                <Input
                  type="number"
                  value={timeWindowSeconds}
                  onChange={(e) => setTimeWindowSeconds(parseInt(e.target.value) || 300)}
                  min={60}
                />
              </div>
              <div className="space-y-2">
                <Label>Cooldown (minutes)</Label>
                <Input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 15)}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
              <Label htmlFor="enabled">Enable this alert rule</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link href="/settings/alert-rules">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Alert Rule'}
          </Button>
        </div>
      </form>
    </div>
  );
}
