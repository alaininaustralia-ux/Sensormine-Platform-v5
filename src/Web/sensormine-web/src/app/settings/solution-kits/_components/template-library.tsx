/**
 * Template Library Component
 * 
 * Browse, search, and manage saved solution kit templates
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Download, Trash2, Eye, CheckCircle, AlertCircle, Loader2, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  authorEmail?: string;
  tags?: string[];
  category?: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  resourceCounts: {
    schemas: number;
    deviceTypes: number;
    dashboards: number;
    alertRules: number;
    assets: number;
    nexusConfigurations: number;
  };
}

export function TemplateLibrary() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const response = await apiClient.get<Template[]>('/api/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(template: Template) {
    try {
      const response = await apiClient.get(`/api/templates/${template.id}`);
      const fullTemplate = response.data;
      
      const blob = new Blob([JSON.stringify(fullTemplate, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: `${template.name} has been downloaded`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download template',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(template: Template) {
    try {
      await apiClient.delete(`/api/templates/${template.id}`);
      
      toast({
        title: 'Deleted',
        description: `${template.name} has been deleted`,
      });

      // Reload templates
      loadTemplates();
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    }
  }

  function showDetails(template: Template) {
    setSelectedTemplate(template);
    setShowDetailsDialog(true);
  }

  function confirmDelete(template: Template) {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  }

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query) ||
      template.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const totalResources = (template: Template) => {
    const counts = template.resourceCounts;
    return counts.schemas + counts.deviceTypes + counts.dashboards + 
           counts.alertRules + counts.assets + counts.nexusConfigurations;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, category, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={loadTemplates} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            {searchQuery ? 'No templates match your search.' : 'No templates available. Create one using the Export tab.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {template.isVerified && (
                      <Badge variant="default" className="shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {template.isPublic && (
                      <Badge variant="secondary" className="shrink-0">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Version & Author */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>v{template.version}</span>
                  {template.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{template.author}</span>
                    </div>
                  )}
                </div>

                {/* Resource Counts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Resources:</span>
                    <span className="font-medium">{totalResources(template)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {template.resourceCounts.schemas > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schemas</span>
                        <span>{template.resourceCounts.schemas}</span>
                      </div>
                    )}
                    {template.resourceCounts.deviceTypes > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Device Types</span>
                        <span>{template.resourceCounts.deviceTypes}</span>
                      </div>
                    )}
                    {template.resourceCounts.dashboards > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dashboards</span>
                        <span>{template.resourceCounts.dashboards}</span>
                      </div>
                    )}
                    {template.resourceCounts.alertRules > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alerts</span>
                        <span>{template.resourceCounts.alertRules}</span>
                      </div>
                    )}
                    {template.resourceCounts.assets > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assets</span>
                        <span>{template.resourceCounts.assets}</span>
                      </div>
                    )}
                    {template.resourceCounts.nexusConfigurations > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nexus Configs</span>
                        <span>{template.resourceCounts.nexusConfigurations}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
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

                {/* Category */}
                {template.category && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-medium">{template.category}</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {format(new Date(template.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showDetails(template)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(template)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDelete(template)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Template Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex gap-2">
                <Badge variant="outline">v{selectedTemplate.version}</Badge>
                {selectedTemplate.isVerified && (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {selectedTemplate.isPublic && (
                  <Badge variant="secondary">Public</Badge>
                )}
              </div>

              <Separator />

              {/* Author Info */}
              {selectedTemplate.author && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Author</h4>
                  <p className="text-sm">{selectedTemplate.author}</p>
                  {selectedTemplate.authorEmail && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.authorEmail}</p>
                  )}
                </div>
              )}

              {/* Category & Tags */}
              {(selectedTemplate.category || (selectedTemplate.tags && selectedTemplate.tags.length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {selectedTemplate.category && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Category</h4>
                        <Badge variant="outline">{selectedTemplate.category}</Badge>
                      </div>
                    )}
                    {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedTemplate.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Resource Counts */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resources Included</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Schemas</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.schemas}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Device Types</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.deviceTypes}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Dashboards</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.dashboards}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Alert Rules</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.alertRules}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Assets</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.assets}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span>Nexus Configs</span>
                    <span className="font-medium">{selectedTemplate.resourceCounts.nexusConfigurations}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(selectedTemplate.createdAt), 'PPpp')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(selectedTemplate.updatedAt), 'PPpp')}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedTemplate && (
              <Button onClick={() => handleDownload(selectedTemplate)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => templateToDelete && handleDelete(templateToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
