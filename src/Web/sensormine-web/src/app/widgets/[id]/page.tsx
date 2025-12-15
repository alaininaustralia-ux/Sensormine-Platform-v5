'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Download, Calendar, User, Tag, ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface WidgetDetails {
  id: string;
  widgetId: string;
  name: string;
  description?: string;
  version: string;
  author?: {
    name?: string;
    email?: string;
    organization?: string;
  };
  category?: string;
  tags?: string[];
  iconUrl?: string;
  downloadCount: number;
  fileSizeBytes?: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
  manifest: any;
}

export default function WidgetDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [widget, setWidget] = useState<WidgetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadWidget();
  }, [params.id]);
  
  const loadWidget = async () => {
    try {
      const response = await fetch(`/api/widgets/${params.id}`, {
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWidget(data);
      }
    } catch (error) {
      console.error('Failed to load widget:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }
  
  if (!widget) {
    return <div className="container mx-auto py-8 text-center">Widget not found</div>;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Link href="/widgets">
        <Button variant="ghost" className="mb-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Gallery
        </Button>
      </Link>
      
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {widget.iconUrl ? (
          <img
            src={widget.iconUrl}
            alt={widget.name}
            className="w-24 h-24 rounded-lg"
          />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Package className="w-12 h-12 text-white" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{widget.name}</h1>
            <Badge variant="outline">{widget.version}</Badge>
          </div>
          
          <p className="text-gray-600 text-lg mb-4">
            {widget.description || 'No description available'}
          </p>
          
          <div className="flex gap-2">
            <Button className="gap-2" onClick={() => window.open(widget.downloadUrl, '_blank')}>
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button variant="outline">Install to Dashboard</Button>
          </div>
        </div>
      </div>
      
      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {widget.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {widget.author.name}
                  {widget.author.organization && ` (${widget.author.organization})`}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Created {new Date(widget.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{widget.downloadCount} downloads</span>
            </div>
            
            {widget.fileSizeBytes && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {(widget.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories & Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {widget.category && (
              <div className="mb-3">
                <Badge variant="secondary" className="text-sm">
                  {widget.category}
                </Badge>
              </div>
            )}
            
            {widget.tags && widget.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {widget.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Configuration */}
      {widget.manifest?.config?.inputs && widget.manifest.config.inputs.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration Options</CardTitle>
            <CardDescription>
              This widget can be configured with the following options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {widget.manifest.config.inputs.map((input: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{input.label}</span>
                      {input.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {input.description && (
                      <p className="text-sm text-gray-600">{input.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Type: <code className="bg-gray-200 px-1 rounded">{input.type}</code>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Permissions */}
      {widget.manifest?.permissions?.apis && widget.manifest.permissions.apis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              This widget requires the following API permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {widget.manifest.permissions.apis.map((api: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <code className="text-sm">{api}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
