/**
 * Schema Wizard Component
 * 
 * Multi-step wizard for creating schemas
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SchemaBasicInfo } from './schema-basic-info';
import { SchemaJsonEditorAI } from './schema-json-editor-ai';
import { SchemaReview } from './schema-review';
import { createSchema } from '@/lib/api/schemas';
import { useToast } from '@/hooks/use-toast';
import type { CreateSchemaRequest } from '@/lib/types/schema';

interface WizardData {
  name: string;
  description: string;
  tags: string[];
  jsonSchema: string;
  changeLog: string;
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Schema name, description, and tags' },
  { id: 2, title: 'JSON Schema', description: 'Define the schema structure' },
  { id: 3, title: 'Review', description: 'Review and create schema' },
];

export function SchemaWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    description: '',
    tags: [],
    jsonSchema: JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {},
        required: [],
      },
      null,
      2
    ),
    changeLog: 'Initial version',
  });

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push('/settings/schemas');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const request: CreateSchemaRequest = {
        name: wizardData.name,
        description: wizardData.description,
        initialVersion: {
          version: '1.0.0', // Default first version
          jsonSchema: wizardData.jsonSchema,
          deviceTypes: [],
          setAsDefault: true,
        },
      };

      const schema = await createSchema(request);

      toast({
        title: 'Success',
        description: `Schema "${schema.name}" created successfully`,
      });

      router.push(`/settings/schemas/${schema.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create schema',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return wizardData.name.trim() !== '' && wizardData.description.trim() !== '';
    }
    if (currentStep === 2) {
      try {
        JSON.parse(wizardData.jsonSchema);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Schema</h1>
        <p className="text-muted-foreground">
          Define a data schema for your IoT devices and sensors
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${
                step.id === currentStep
                  ? 'text-primary font-medium'
                  : step.id < currentStep
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-current text-xs">
                  {step.id}
                </span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <SchemaBasicInfo data={wizardData} onChange={updateWizardData} />
          )}
          {currentStep === 2 && (
            <SchemaJsonEditorAI
              value={wizardData.jsonSchema}
              onChange={(value) => updateWizardData({ jsonSchema: value })}
              changeLog={wizardData.changeLog}
              onChangeLogUpdate={(log) => updateWizardData({ changeLog: log })}
            />
          )}
          {currentStep === 3 && <SchemaReview data={wizardData} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceedToNext()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceedToNext()}>
              {isSubmitting ? 'Creating...' : 'Create Schema'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
