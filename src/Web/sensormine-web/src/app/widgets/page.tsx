'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Upload, Search, Filter, Download, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Widget {
  id: string;
  widgetId: string;
  name: string;
  description?: string;
  version: string;
  author?: {
    name?: string;
    organization?: string;
  };
  category?: string;
  tags?: string[];
  iconUrl?: string;
  downloadCount: number;
  createdAt: string;
  downloadUrl: string;
}

export default function WidgetGalleryPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Load widgets
  const loadWidgets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20'
      });
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      const response = await fetch(`/api/widgets?${params}`, {
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.widgets);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load widgets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete widget
  const deleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;
    
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        }
      });
      
      if (response.ok) {
        loadWidgets();
      }
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };
  
  // Filter widgets by search
  const filteredWidgets = widgets.filter(widget =>
    widget.name.toLowerCase().includes(search.toLowerCase()) ||
    widget.description?.toLowerCase().includes(search.toLowerCase()) ||
    widget.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Widget Gallery
          </h1>
          <p className="text-gray-600 mt-2">
            Browse and manage custom dashboard widgets
          </p>
        </div>
        
        <Link href="/widgets/upload">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Widget
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="chart">Charts</SelectItem>
            <SelectItem value="kpi">KPIs</SelectItem>
            <SelectItem value="gauge">Gauges</SelectItem>
            <SelectItem value="map">Maps</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="control">Controls</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Widget Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading widgets...</p>
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No widgets found</p>
          <Link href="/widgets/upload">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Your First Widget
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWidgets.map((widget) => (
              <Card key={widget.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    {widget.iconUrl ? (
                      <img
                        src={widget.iconUrl}
                        alt={widget.name}
                        className="w-12 h-12 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    <Badge variant="outline">{widget.version}</Badge>
                  </div>
                  
                  <CardTitle className="text-lg">{widget.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {widget.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {widget.category && (
                    <Badge variant="secondary" className="mb-2">
                      {widget.category}
                    </Badge>
                  )}
                  
                  {widget.tags && widget.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {widget.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-3">
                    {widget.author?.name && (
                      <p>By {widget.author.name}</p>
                    )}
                    <p>{widget.downloadCount} downloads</p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex gap-2">
                  <Link href={`/widgets/${widget.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <ExternalLink className="w-3 h-3" />
                      Details
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(widget.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWidget(widget.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
