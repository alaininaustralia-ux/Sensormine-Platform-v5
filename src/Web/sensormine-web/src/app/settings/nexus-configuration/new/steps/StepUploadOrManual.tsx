/**
 * Step 1: Upload Document or Manual Entry
 */

'use client';

import { useState } from 'react';
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
import { Upload, Edit3, ArrowRight } from 'lucide-react';
import type { CreateNexusConfigurationRequest } from '@/lib/api';

interface StepUploadOrManualProps {
  formData: Partial<CreateNexusConfigurationRequest>;
  updateFormData: (data: Partial<CreateNexusConfigurationRequest>) => void;
  onNext: () => void;
}

export function StepUploadOrManual({ formData, updateFormData, onNext }: StepUploadOrManualProps) {
  const [mode, setMode] = useState<'upload' | 'manual' | null>(null);

  const handleManualStart = () => {
    setMode('manual');
  };

  const handleNext = () => {
    if (formData.name) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Get Started</h2>
        <p className="text-muted-foreground">
          Upload a datasheet to parse automatically with AI, or enter configuration details manually.
        </p>
      </div>

      {mode === null && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Upload Option */}
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Datasheet
              </CardTitle>
              <CardDescription>
                AI-powered parsing of PDF or Markdown documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your device datasheet and let AI extract probe configurations, protocols, and settings
                automatically.
              </p>
              <Button className="w-full" disabled>
                <Upload className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Manual Option */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={handleManualStart}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Manual Configuration
              </CardTitle>
              <CardDescription>
                Enter configuration details step-by-step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manually configure your Nexus device with guided steps for probes, communication settings, and more.
              </p>
              <Button className="w-full" variant="default">
                <Edit3 className="mr-2 h-4 w-4" />
                Start Manual Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide a name and description for your configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Temperature Monitoring Station"
                value={formData.name || ''}
                onChange={(e) => updateFormData({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and setup of this configuration..."
                rows={4}
                value={formData.description || ''}
                onChange={(e) => updateFormData({ description: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!formData.name}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
