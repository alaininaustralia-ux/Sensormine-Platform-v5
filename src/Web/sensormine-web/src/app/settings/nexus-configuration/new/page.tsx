/**
 * New Nexus Configuration Wizard
 * 
 * Multi-step wizard for creating Nexus device configurations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Upload, FileText, Check, Radio } from 'lucide-react';
import { nexusConfigurationApi } from '@/lib/api';
import type { 
  CreateNexusConfigurationRequest,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Import step components
import { StepUploadOrManual } from './steps/StepUploadOrManual';
import { StepProbeConfiguration } from './steps/StepProbeConfiguration';
import { StepCommunicationSettings } from './steps/StepCommunicationSettings';
import { StepReviewAndSave } from './steps/StepReviewAndSave';

const STEPS = [
  { id: 1, title: 'Upload or Manual', icon: Upload },
  { id: 2, title: 'Probes', icon: Radio },
  { id: 3, title: 'Communication', icon: FileText },
  { id: 4, title: 'Review', icon: Check },
];

export default function NewNexusConfigurationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateNexusConfigurationRequest>>({
    name: '',
    description: '',
    probeConfigurations: [],
    schemaFieldMappings: {},
    communicationSettings: {
      protocol: 'MQTT',
      transmissionIntervalSeconds: 300,
      enableBatching: true,
      maxBatchSize: 10,
      enableCompression: false,
    },
    customLogic: '',
    customLogicLanguage: 'CSharp',
    alertRuleTemplates: [],
    tags: [],
    isTemplate: false,
  });

  const updateFormData = (data: Partial<CreateNexusConfigurationRequest>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name) {
        toast({
          title: 'Validation Error',
          description: 'Configuration name is required.',
          variant: 'destructive',
        });
        return;
      }

      // Create configuration
      await nexusConfigurationApi.create(formData as CreateNexusConfigurationRequest);

      toast({
        title: 'Success',
        description: 'Configuration created successfully.',
      });

      // Navigate to the configuration list
      router.push('/settings/nexus-configuration');
    } catch (error) {
      console.error('Error creating configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to create configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Nexus Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Create a new device configuration for Nexus IoT devices
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 ${
                      isActive
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : isCompleted
                          ? 'border-green-600 bg-green-600/10'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-12 h-0.5 bg-muted-foreground/20 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <StepUploadOrManual
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <StepProbeConfiguration
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <StepCommunicationSettings
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <StepReviewAndSave
              formData={formData}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep > 1 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={saving}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
