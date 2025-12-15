'use client';

// Custom Widget Configuration - Dynamic form based on widget manifest

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Widget } from '@/lib/types/dashboard-v2';

interface WidgetManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  config?: {
    inputs?: Array<{
      name: string;
      label: string;
      type: 'text' | 'number' | 'boolean' | 'select';
      required?: boolean;
      default?: unknown;
      description?: string;
      options?: Array<{ label: string; value: string }>;
    }>;
  };
}

interface WidgetDetails {
  id: string;
  name: string;
  manifest: WidgetManifest;
}

interface CustomWidgetConfigProps {
  widget: Widget;
  onChange: (config: Partial<typeof widget.config>) => void;
}

export function CustomWidgetConfig({ widget, onChange }: CustomWidgetConfigProps) {
  const [widgetDetails, setWidgetDetails] = useState<WidgetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customWidgetId = (widget.config as any)?.customWidgetId;
  const currentConfig = (widget.config as any)?.customWidgetConfig || {};

  useEffect(() => {
    if (!customWidgetId) {
      setError('No custom widget ID configured');
      setLoading(false);
      return;
    }

    loadWidgetDetails();
  }, [customWidgetId]);

  const loadWidgetDetails = async () => {
    if (!customWidgetId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/widgets/${customWidgetId}`);
      if (!response.ok) {
        throw new Error('Failed to load widget details');
      }

      const data = await response.json();
      setWidgetDetails(data);
    } catch (err) {
      console.error('Error loading widget details:', err);
      setError('Failed to load widget configuration options');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: unknown) => {
    const updatedConfig = {
      ...currentConfig,
      [name]: value,
    };

    onChange({
      customWidgetConfig: updatedConfig,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!widgetDetails?.manifest?.config?.inputs || widgetDetails.manifest.config.inputs.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>This widget has no configurable options.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Widget Info */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Custom Widget</Label>
        <div className="text-sm">
          <div className="font-medium">{widgetDetails.name}</div>
          <div className="text-muted-foreground">v{widgetDetails.manifest.version}</div>
        </div>
      </div>

      {/* Dynamic Configuration Inputs */}
      {widgetDetails.manifest.config.inputs.map((input) => {
        const value = currentConfig[input.name] ?? input.default;

        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {input.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}

            {input.type === 'text' && (
              <Input
                id={input.name}
                type="text"
                value={String(value || '')}
                onChange={(e) => handleInputChange(input.name, e.target.value)}
                placeholder={input.description}
              />
            )}

            {input.type === 'number' && (
              <Input
                id={input.name}
                type="number"
                value={Number(value || 0)}
                onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value))}
                placeholder={input.description}
              />
            )}

            {input.type === 'boolean' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id={input.name}
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => handleInputChange(input.name, checked)}
                />
                <Label htmlFor={input.name} className="font-normal cursor-pointer">
                  {input.description || input.label}
                </Label>
              </div>
            )}

            {input.type === 'select' && input.options && (
              <Select
                value={String(value || '')}
                onValueChange={(newValue) => handleInputChange(input.name, newValue)}
              >
                <SelectTrigger id={input.name}>
                  <SelectValue placeholder={`Select ${input.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {input.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
