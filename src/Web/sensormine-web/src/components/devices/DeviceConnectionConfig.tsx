/**
 * Device Connection Configuration Component
 * 
 * Displays protocol-specific connection details for devices.
 * Shows MQTT topics, HTTP endpoints, and other connection information
 * with copy-to-clipboard functionality.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CopyIcon, 
  CheckIcon, 
  DownloadIcon,
  QrCodeIcon,
  ActivityIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeviceConnectionConfigProps {
  deviceId: string;
  protocol?: string;
  brokerUrl?: string;
}

// Helper components defined outside render to avoid recreation
function CopyButton({ 
  text, 
  fieldName, 
  copiedField, 
  onCopy 
}: { 
  text: string; 
  fieldName: string; 
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onCopy(text, fieldName)}
      className="h-8 w-8 p-0"
    >
      {copiedField === fieldName ? (
        <CheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </Button>
  );
}

function ConnectionField({ 
  label, 
  value, 
  mono = false,
  copiedField,
  onCopy
}: { 
  label: string; 
  value: string; 
  mono?: boolean;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={`text-sm font-medium truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
      <CopyButton text={value} fieldName={label} copiedField={copiedField} onCopy={onCopy} />
    </div>
  );
}

export function DeviceConnectionConfig({ 
  deviceId, 
  protocol = 'MQTT',
  brokerUrl = 'mqtt.sensormine.io'
}: DeviceConnectionConfigProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generate connection details based on protocol
  const mqttTopic = `devices/${deviceId}/telemetry`;
  const mqttPort = 1883;
  const mqttTlsPort = 8883;
  const httpEndpoint = `https://api.sensormine.io/v1/devices/${deviceId}/telemetry`;
  const wsEndpoint = `wss://api.sensormine.io/v1/devices/${deviceId}/stream`;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: 'Copied!',
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const downloadConfigFile = () => {
    const config = {
      deviceId,
      mqtt: {
        broker: brokerUrl,
        port: mqttPort,
        tlsPort: mqttTlsPort,
        topic: mqttTopic,
        clientId: deviceId,
        qos: 1,
      },
      http: {
        endpoint: httpEndpoint,
        method: 'POST',
      },
      websocket: {
        endpoint: wsEndpoint,
      },
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-${deviceId}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Configuration file downloaded successfully',
    });
  };



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connection Configuration</CardTitle>
            <CardDescription>
              Use these details to configure your device
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">
            <ActivityIcon className="mr-1 h-3 w-3" />
            {protocol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MQTT Configuration */}
        {protocol === 'MQTT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">MQTT Settings</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadConfigFile}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Config
              </Button>
            </div>

            <ConnectionField label="Broker URL" value={brokerUrl} copiedField={copiedField} onCopy={copyToClipboard} />
            <ConnectionField label="Port (TCP)" value={mqttPort.toString()} copiedField={copiedField} onCopy={copyToClipboard} />
            <ConnectionField label="Port (TLS)" value={mqttTlsPort.toString()} copiedField={copiedField} onCopy={copyToClipboard} />
            <ConnectionField label="Topic" value={mqttTopic} mono copiedField={copiedField} onCopy={copyToClipboard} />
            <ConnectionField label="Client ID" value={deviceId} mono copiedField={copiedField} onCopy={copyToClipboard} />
            
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground mb-1">Quality of Service (QoS)</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">QoS 0: At most once</Badge>
                <Badge variant="default">QoS 1: At least once (Recommended)</Badge>
                <Badge variant="outline">QoS 2: Exactly once</Badge>
              </div>
            </div>
          </div>
        )}

        {/* HTTP Configuration */}
        {protocol === 'HTTP' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">HTTP Settings</h3>
            <ConnectionField label="Endpoint" value={httpEndpoint} mono copiedField={copiedField} onCopy={copyToClipboard} />
            <ConnectionField label="Method" value="POST" copiedField={copiedField} onCopy={copyToClipboard} />
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground mb-1">Headers</p>
              <code className="text-xs">Content-Type: application/json</code>
            </div>
          </div>
        )}

        {/* WebSocket Configuration */}
        {protocol === 'WebSocket' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">WebSocket Settings</h3>
            <ConnectionField label="Endpoint" value={wsEndpoint} mono copiedField={copiedField} onCopy={copyToClipboard} />
          </div>
        )}

        {/* Quick Setup Guide */}
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <h4 className="text-sm font-semibold">Quick Setup</h4>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Copy the connection details above</li>
            <li>Configure your device with these settings</li>
            <li>Start sending telemetry data</li>
            <li>Monitor device activity in the dashboard</li>
          </ol>
        </div>

        {/* Additional Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <QrCodeIcon className="mr-2 h-4 w-4" />
            Generate QR Code
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={downloadConfigFile}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
