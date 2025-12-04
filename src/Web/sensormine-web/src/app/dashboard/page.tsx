/**
 * Dashboard List/Home Page
 * 
 * Displays all dashboards with options to create, edit, or delete.
 */

'use client';

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardListPage() {
  const router = useRouter();
  const { dashboards, deleteDashboard, setCurrentDashboard } = useDashboardStore();
  
  // Filter out templates
  const userDashboards = dashboards.filter(d => !d.isTemplate);
  
  const handleCreateNew = () => {
    setCurrentDashboard(null);
    router.push('/dashboard/builder');
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      deleteDashboard(id);
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
      
      {userDashboards.length === 0 ? (
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
          {userDashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:border-primary transition-colors">
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
          ))}
        </div>
      )}
    </div>
  );
}
