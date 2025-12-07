/**
 * Nexus Configuration Templates Page
 * 
 * Browse and clone configuration templates
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, Copy, FileText, Radio } from 'lucide-react';
import { nexusConfigurationApi } from '@/lib/api';
import type { NexusConfiguration } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'All',
  'Temperature Monitoring',
  'Flow Measurement',
  'Environmental',
  'Industrial',
  'Energy Management',
  'Water Quality',
];

export default function NexusConfigurationTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NexusConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'All' ? undefined : selectedCategory;
      const result = await nexusConfigurationApi.getTemplates(category);
      setTemplates(result);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloneTemplate = async (template: NexusConfiguration) => {
    try {
      // Create a new configuration based on the template
      const newConfig = {
        name: `${template.name} (Copy)`,
        description: template.description,
        probeConfigurations: template.probeConfigurations,
        schemaFieldMappings: template.schemaFieldMappings,
        communicationSettings: template.communicationSettings,
        customLogic: template.customLogic,
        customLogicLanguage: template.customLogicLanguage,
        alertRuleTemplates: template.alertRuleTemplates,
        tags: template.tags,
        isTemplate: false,
      };

      const result = await nexusConfigurationApi.create(newConfig);

      toast({
        title: 'Success',
        description: 'Template cloned successfully.',
      });

      // Navigate to edit the new configuration
      router.push(`/settings/nexus-configuration/${result.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Templates</h1>
          <p className="text-muted-foreground mt-2">
            Browse and clone pre-configured templates for common IoT scenarios
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'No templates available in this category yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.templateCategory && (
                    <Badge variant="outline" className="ml-2">
                      {template.templateCategory}
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {/* Probes Info */}
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {template.probeConfigurations.length} probe(s)
                  </span>
                </div>

                {/* Probe Types */}
                <div className="flex flex-wrap gap-1">
                  {template.probeConfigurations.slice(0, 4).map((probe, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {probe.probeType}
                    </Badge>
                  ))}
                  {template.probeConfigurations.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.probeConfigurations.length - 4}
                    </Badge>
                  )}
                </div>

                {/* Communication Protocol */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Protocol: </span>
                  <Badge variant="outline">
                    {template.communicationSettings.protocol}
                  </Badge>
                </div>

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleCloneTemplate(template)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
