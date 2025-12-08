/**
 * Dashboard Templates Page (Story 4.8)
 * 
 * Browse, preview, and manage dashboard templates.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
import { TemplateGallery } from '@/components/dashboard/templates/template-gallery';
import { TemplatePreviewModal } from '@/components/dashboard/templates/template-preview-modal';
import { TemplateImportDialog } from '@/components/dashboard/templates/template-import-dialog';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { getTemplate, createDashboardFromTemplate } from '@/lib/templates/dashboard-templates';
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createDashboard, setCurrentDashboard } = useDashboardStore();
  
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const previewTemplate = previewTemplateId ? getTemplate(previewTemplateId) || null : null;

  const handleSelectTemplate = async (templateId: string) => {
    setIsCreating(true);
    try {
      // TODO: Get userId from auth context when available
      const userId = 'demo-user';
      
      const template = getTemplate(templateId);
      if (!template) {
        toast({
          title: 'Error',
          description: 'Template not found',
          variant: 'destructive',
        });
        return;
      }

      const dashboard = createDashboardFromTemplate(
        templateId,
        template.name,
        userId,
        template.description
      );

      if (!dashboard) {
        toast({
          title: 'Error',
          description: 'Failed to create dashboard from template',
          variant: 'destructive',
        });
        return;
      }

      // Save dashboard
      const created = await createDashboard(dashboard, userId);
      setCurrentDashboard(created);
      
      toast({
        title: 'Success',
        description: `Dashboard created from "${template.name}" template`,
      });
      router.push(`/dashboard/${created.id}`);
    } catch (error) {
      console.error('Failed to create dashboard from template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dashboard from template',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };



  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dashboard Templates</h1>
            <p className="text-muted-foreground mt-1">
              Choose from pre-built templates or create your own
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Template
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/builder')}
          >
            Create from Scratch
          </Button>
        </div>
      </div>

      {/* Template Gallery */}
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        onPreviewTemplate={setPreviewTemplateId}
      />

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplateId}
        onOpenChange={(open) => !open && setPreviewTemplateId(null)}
        onUseTemplate={handleSelectTemplate}
      />

      {/* Import Dialog */}
      <TemplateImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={() => {
          toast({
            title: 'Success',
            description: 'Template imported successfully',
          });
          setShowImportDialog(false);
        }}
      />

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Creating dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
