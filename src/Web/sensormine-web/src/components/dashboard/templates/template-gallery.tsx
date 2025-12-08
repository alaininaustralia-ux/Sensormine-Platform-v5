/**
 * Template Gallery Component (Story 4.8)
 * 
 * Displays a grid of dashboard templates with category filtering and search.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { DASHBOARD_TEMPLATES, getTemplatesByCategory } from '@/lib/templates/dashboard-templates';
import { TemplateCard } from './template-card';
import type { DashboardTemplate } from '@/lib/types/dashboard';

const CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'operations', label: 'Operations' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'custom', label: 'Custom' },
];

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
  onPreviewTemplate?: (templateId: string) => void;
}

export function TemplateGallery({ onSelectTemplate, onPreviewTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let templates: DashboardTemplate[] = [];
    
    if (selectedCategory === 'all') {
      templates = DASHBOARD_TEMPLATES;
    } else {
      templates = getTemplatesByCategory(selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Template Gallery</h2>
        <p className="text-muted-foreground">
          Choose a pre-built template to quickly create your dashboard
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {CATEGORIES.map(category => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Template Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
              onPreview={onPreviewTemplate || (() => {})}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No templates found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or category filter
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Template Count */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredTemplates.length} of {DASHBOARD_TEMPLATES.length} templates
      </div>
    </div>
  );
}
