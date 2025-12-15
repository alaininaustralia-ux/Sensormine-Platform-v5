'use client';

// Dashboard V2 List Page
// Browse, create, and manage dashboards

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutDashboard, Edit, Trash2, Copy, Star, Clock, User } from 'lucide-react';
import { useDashboardV2Store } from '@/lib/stores/dashboard-v2-store';
import type { DashboardListItem } from '@/lib/types/dashboard-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function DashboardsV2Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');

  const { dashboards, loadDashboards, createDashboard, deleteDashboard, loading } = useDashboardV2Store();

  useEffect(() => {
    // Load dashboards on mount
    loadDashboards().catch((error: unknown) => {
      console.error('Failed to load dashboards:', error);
    });
  }, [loadDashboards]);

  const filteredDashboards = dashboards.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) return;

    try {
      const dashboard = await createDashboard({
        name: newDashboardName,
        description: newDashboardDescription || undefined,
        tags: [],
      });
      setCreateDialogOpen(false);
      setNewDashboardName('');
      setNewDashboardDescription('');
      router.push(`/dashboards/${dashboard.id}/design`);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  const handleDeleteDashboard = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteDashboard(id);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  const handleDuplicateDashboard = async (id: string, name: string) => {
    try {
      const dashboard = await createDashboard({
        name: `${name} (Copy)`,
        description: 'Duplicate dashboard',
        tags: [],
      });
      router.push(`/dashboards/${dashboard.id}/design`);
    } catch (error) {
      console.error('Failed to duplicate dashboard:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Dashboards
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your custom dashboards
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
              <DialogDescription>
                Give your dashboard a name and optional description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dashboard Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Operations Overview"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateDashboard();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will this dashboard show?"
                  value={newDashboardDescription}
                  onChange={(e) => setNewDashboardDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDashboard} disabled={!newDashboardName.trim()}>
                Create Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search dashboards by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Dashboard Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboards...</p>
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search query' : 'Create your first dashboard to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard) => (
            <DashboardCard
              key={dashboard.id}
              dashboard={dashboard}
              onDelete={() => handleDeleteDashboard(dashboard.id, dashboard.name)}
              onDuplicate={() => handleDuplicateDashboard(dashboard.id, dashboard.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  dashboard,
  onDelete,
  onDuplicate,
}: {
  dashboard: DashboardListItem;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-1 truncate">{dashboard.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {dashboard.description || 'No description'}
            </CardDescription>
          </div>
          {dashboard.state === 'published' && (
            <Badge variant="default">Published</Badge>
          )}
          {dashboard.state === 'draft' && (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>{dashboard.widgetCount} widgets</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Updated {new Date(dashboard.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>v{dashboard.version}</span>
          </div>
        </div>

        {dashboard.tags && dashboard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {dashboard.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dashboard.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{dashboard.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/dashboards/${dashboard.id}`)}
        >
          <Star className="mr-2 h-3 w-3" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/dashboards/${dashboard.id}/design`)}
        >
          <Edit className="mr-2 h-3 w-3" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}
