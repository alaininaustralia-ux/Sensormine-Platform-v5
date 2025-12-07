/**
 * Dashboard List/Home Page
 * 
 * Displays all dashboards with options to create, edit, or delete.
 */

'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, LayoutDashboard, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardListPage() {
  const router = useRouter();
  const { dashboards, deleteDashboard, setCurrentDashboard, loadFromServer, isLoading } = useDashboardStore();
  const { 
    isFavoriteDashboard, 
    addFavoriteDashboard, 
    removeFavoriteDashboard
  } = usePreferencesStore();
  
  // Load dashboards from server on mount
  useEffect(() => {
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    loadFromServer(userId);
  }, [loadFromServer]);
  
  // Filter out templates
  const userDashboards = dashboards.filter(d => !d.isTemplate);
  
  // Sort by favorites first, then by updated date
  const sortedDashboards = [...userDashboards].sort((a, b) => {
    const aIsFav = isFavoriteDashboard(a.id);
    const bIsFav = isFavoriteDashboard(b.id);
    
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  const handleToggleFavorite = (dashboardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavoriteDashboard(dashboardId)) {
      removeFavoriteDashboard(dashboardId);
    } else {
      addFavoriteDashboard(dashboardId);
    }
  };
  
  const handleCreateNew = () => {
    setCurrentDashboard(null);
    router.push('/dashboard/builder');
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      // TODO: Get userId from auth context when available
      const userId = 'demo-user';
      deleteDashboard(id, userId);
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage your custom dashboards
          </p>
        </div>
        
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Dashboard
        </Button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading dashboards...</p>
          </CardContent>
        </Card>
      ) : userDashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Get started by creating your first dashboard or choosing from our templates
            </p>
            <div className="flex gap-4">
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Dashboard
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/templates">Browse Templates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDashboards.map((dashboard) => {
            const isFavorite = isFavoriteDashboard(dashboard.id);
            
            return (
              <Card key={dashboard.id} className={cn(
                "hover:border-primary transition-colors",
                isFavorite && "border-yellow-500/50 bg-yellow-50/5"
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Link 
                      href={`/dashboard/${dashboard.id}`}
                      className="hover:underline flex-1 truncate"
                    >
                      {dashboard.name}
                    </Link>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          isFavorite && "text-yellow-500 hover:text-yellow-600"
                        )}
                        onClick={(e) => handleToggleFavorite(dashboard.id, e)}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link href={`/dashboard/${dashboard.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(dashboard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  {dashboard.description && (
                    <CardDescription className="line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{dashboard.widgets.length} widgets</span>
                    <span>
                      Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
