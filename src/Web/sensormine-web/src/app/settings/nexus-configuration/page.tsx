/**
 * Nexus Configuration List Page
 * 
 * Display, search, and manage Nexus device configurations
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Rocket,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { nexusConfigurationApi } from '@/lib/api';
import type { NexusConfiguration } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function NexusConfigurationPage() {
  const [configurations, setConfigurations] = useState<NexusConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Validated' | 'Deployed'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { toast } = useToast();

  // Load configurations
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      let result;

      if (searchTerm) {
        result = await nexusConfigurationApi.search(searchTerm, page, pageSize);
      } else {
        result = await nexusConfigurationApi.getAll(page, pageSize);
      }

      // Filter by status if needed
      if (statusFilter !== 'all') {
        result = result.filter(config => config.status === statusFilter);
      }

      setConfigurations(result);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configurations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await nexusConfigurationApi.delete(id);
      toast({
        title: 'Success',
        description: 'Configuration deleted successfully.',
      });
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Deployed':
        return 'default';
      case 'Validated':
        return 'secondary';
      case 'Draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nexus Configuration Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage device configurations for Nexus IoT devices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/nexus-configuration/templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/settings/nexus-configuration/new">
              <Plus className="mr-2 h-4 w-4" />
              New Configuration
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Configurations</CardTitle>
          <CardDescription>
            Manage your Nexus device configurations. Upload datasheets, configure probes, and deploy to the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'Draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Draft')}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'Validated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Validated')}
              >
                Validated
              </Button>
              <Button
                variant={statusFilter === 'Deployed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Deployed')}
              >
                Deployed
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading configurations...</div>
            </div>
          ) : configurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No configurations found</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Get started by creating your first Nexus configuration or upload a datasheet to parse automatically.
              </p>
              <Button asChild>
                <Link href="/settings/nexus-configuration/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Configuration
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Probes</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configurations.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <Link
                              href={`/settings/nexus-configuration/${config.id}`}
                              className="font-medium hover:underline"
                            >
                              {config.name}
                            </Link>
                            {config.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {config.description}
                              </p>
                            )}
                            {config.isTemplate && (
                              <Badge variant="outline" className="mt-1">
                                Template
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(config.status)}>
                            {config.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {config.probeConfigurations.slice(0, 3).map((probe, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {probe.probeType}
                              </Badge>
                            ))}
                            {config.probeConfigurations.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{config.probeConfigurations.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {config.communicationSettings.protocol}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/settings/nexus-configuration/${config.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/settings/nexus-configuration/${config.id}/deploy`}>
                                  <Rocket className="mr-2 h-4 w-4" />
                                  Deploy
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(config.id, config.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {configurations.length} configuration(s)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={configurations.length < pageSize}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
