/**
 * Alert Rules Settings Page
 * 
 * Manage alert rule configurations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Bell, BellOff, Edit, Search, Trash2, Plus } from 'lucide-react';
import { alertRulesApi, AlertRule, AlertSeverity, AlertTargetType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, [page, searchTerm]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await alertRulesApi.list(page, 20, searchTerm || undefined);
      setRules(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alert rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      await alertRulesApi.delete(id);
      toast({
        title: 'Success',
        description: 'Alert rule deleted successfully',
      });
      loadRules();
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert rule',
        variant: 'destructive',
      });
    }
  };

  const toggleEnabled = async (rule: AlertRule) => {
    try {
      await alertRulesApi.update(rule.id, { isEnabled: !rule.isEnabled });
      toast({
        title: 'Success',
        description: `Alert rule ${!rule.isEnabled ? 'enabled' : 'disabled'}`,
      });
      loadRules();
    } catch (error) {
      console.error('Failed to update alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert rule',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const variants: Record<AlertSeverity, string> = {
      Critical: 'destructive',
      Warning: 'default',
      Info: 'secondary',
    };
    return (
      <Badge variant={variants[severity] as any}>
        {severity}
      </Badge>
    );
  };

  const getTargetBadge = (rule: AlertRule) => {
    if (rule.targetType === AlertTargetType.DeviceType) {
      return (
        <Badge variant="outline">
          {rule.deviceTypeIds.length} Device Type{rule.deviceTypeIds.length !== 1 ? 's' : ''}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {rule.deviceIds.length} Device{rule.deviceIds.length !== 1 ? 's' : ''}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Rules</h1>
          <p className="text-muted-foreground">
            Configure alert rules for devices and device types
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Manage alert configurations and notification settings
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No alert rules found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first alert rule'}
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Alert Rule
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground">
                              {rule.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(rule.severity)}
                      </TableCell>
                      <TableCell>
                        {getTargetBadge(rule)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rule.isEnabled ? (
                          <Badge variant="default" className="bg-green-500">
                            <Bell className="mr-1 h-3 w-3" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <BellOff className="mr-1 h-3 w-3" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEnabled(rule)}
                          >
                            {rule.isEnabled ? (
                              <BellOff className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
