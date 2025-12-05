/**
 * Schema List Component
 * 
 * Displays a table of schemas with search, filters, and pagination
 * Story 2.2 - Schema Definition Frontend
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSchemas, deleteSchema } from '@/lib/api/schemas';
import type { Schema, SchemaStatus, GetSchemasParams } from '@/lib/types/schema';
import { Search, MoreVertical, Edit, Trash2, Eye, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_COLORS: Record<SchemaStatus, string> = {
  Draft: 'bg-gray-500',
  Active: 'bg-green-500',
  Deprecated: 'bg-yellow-500',
  Archived: 'bg-red-500',
};

export function SchemaList() {
  const router = useRouter();
  const { toast } = useToast();
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SchemaStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<Schema | null>(null);

  // Fetch schemas
  const fetchSchemas = useCallback(async () => {
    try {
      setLoading(true);
      const params: GetSchemasParams = {
        page,
        pageSize,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      };

      const response = await getSchemas(params);
      setSchemas(response.schemas);
      setTotal(response.total);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch schemas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toast]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  // Handle delete
  const handleDelete = async () => {
    if (!schemaToDelete) return;

    try {
      await deleteSchema(schemaToDelete.id);
      toast({
        title: 'Success',
        description: `Schema "${schemaToDelete.name}" deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setSchemaToDelete(null);
      fetchSchemas();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete schema',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (schema: Schema) => {
    setSchemaToDelete(schema);
    setDeleteDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schemas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SchemaStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Deprecated">Deprecated</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading schemas...
                </TableCell>
              </TableRow>
            ) : schemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No schemas found. Create your first schema to get started.
                </TableCell>
              </TableRow>
            ) : (
              schemas.map((schema) => (
                <TableRow
                  key={schema.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/schemas/${schema.id}`)}
                >
                  <TableCell className="font-medium">{schema.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {schema.description}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[schema.status]}>
                      {schema.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schema.currentVersion?.version || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {schema.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {schema.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{schema.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(schema.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/settings/schemas/${schema.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/settings/schemas/${schema.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Schema
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/settings/schemas/${schema.id}/versions`)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(schema)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, total)} of {total} schemas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{schemaToDelete?.name}&rdquo;? This action
              can be undone (soft delete), but the schema will no longer be available
              for new devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
