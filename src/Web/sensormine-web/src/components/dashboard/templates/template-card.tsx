/**
 * Template Card Component (Story 4.8)
 * 
 * Displays a single dashboard template with preview and selection options.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles } from 'lucide-react';
import type { DashboardTemplate } from '@/lib/types/dashboard';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: DashboardTemplate;
  onSelect: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  className?: string;
}

export function TemplateCard({ template, onSelect, onPreview, className }: TemplateCardProps) {
  const widgetCount = template.widgets.length;
  
  // Category color mapping
  const categoryColors: Record<string, string> = {
    operations: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
    maintenance: 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20',
    security: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
    analytics: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
    custom: 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20',
  };

  return (
    <Card 
      className={cn('flex flex-col hover:shadow-lg transition-shadow', className)}
      data-testid="template-card"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* Preview Image or Placeholder */}
          {template.previewImage ? (
            <div className="relative w-full h-32">
              <Image
                src={template.previewImage}
                alt={`${template.name} preview`}
                fill
                className="object-cover rounded-md border"
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-muted rounded-md border flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm">
                <div className="font-medium">{widgetCount} Widgets</div>
                <div className="text-xs mt-1">Pre-configured layout</div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className={cn('capitalize', categoryColors[template.category])}
            >
              {template.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {widgetCount} {widgetCount === 1 ? 'widget' : 'widgets'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(template.id)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={() => onSelect(template.id)}
          className="flex-1"
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
