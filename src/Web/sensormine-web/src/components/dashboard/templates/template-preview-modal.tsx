/**
 * Template Preview Modal Component (Story 4.8)
 * 
 * Shows a detailed preview of a dashboard template before applying it.
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Grid, Layout, Sparkles } from 'lucide-react';
import type { DashboardTemplate } from '@/lib/types/dashboard';
import { cn } from '@/lib/utils';

interface TemplatePreviewModalProps {
  template: DashboardTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (templateId: string) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const handleUse = () => {
    onUseTemplate(template.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription className="text-base">
                {template.description}
              </DialogDescription>
              <div className="flex gap-2 pt-2">
                <Badge variant="secondary" className="capitalize">
                  {template.category}
                </Badge>
                <Badge variant="outline">
                  {template.widgets.length} Widgets
                </Badge>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-muted-foreground shrink-0" />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-6">
            {/* Widgets Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Grid className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Included Widgets</h3>
              </div>
              <div className="grid gap-3">
                {template.widgets.map((widget, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{widget.title}</div>
                      {widget.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {widget.description}
                        </div>
                      )}
                      <Badge variant="outline" className="mt-2 capitalize">
                        {widget.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Layout Preview Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layout className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Layout Preview</h3>
              </div>
              <div 
                className="relative border rounded-lg p-4 bg-muted/20 min-h-[300px]"
                data-testid="layout-preview"
              >
                <div className="grid grid-cols-12 gap-2 h-full">
                  {template.layout.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        'bg-primary/10 border-2 border-primary/30 rounded flex items-center justify-center text-xs font-medium text-primary',
                        'transition-colors hover:bg-primary/20'
                      )}
                      style={{
                        gridColumn: `span ${item.w}`,
                        gridRow: `span ${Math.max(1, Math.floor(item.h / 2))}`,
                        minHeight: '60px',
                      }}
                    >
                      <div className="text-center p-2">
                        <div className="font-semibold truncate">
                          {template.widgets[index]?.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {item.w}×{item.h}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is a simplified preview. The actual dashboard will be fully interactive.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUse}>
            <Sparkles className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
