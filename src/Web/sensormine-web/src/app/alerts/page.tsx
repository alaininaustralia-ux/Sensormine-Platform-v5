/**
 * Alerts Page
 * 
 * View and manage triggered alert instances
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Bell, Settings } from 'lucide-react';
import { alertInstancesApi, AlertInstance, AlertStatus, AlertSeverity, AlertInstanceStatistics } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function AlertsPage() {
  const [instances, setInstances] = useState<AlertInstance[]>([]);
  const [statistics, setStatistics] = useState<AlertInstanceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AlertStatus>(AlertStatus.Active);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadInstances();
    loadStatistics();
  }, [activeTab, page]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await alertInstancesApi.list(page, 20, activeTab);
      setInstances(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await alertInstancesApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertInstancesApi.acknowledge(id);
      toast({
        title: 'Success',
        description: 'Alert acknowledged',
      });
      loadInstances();
      loadStatistics();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertInstancesApi.resolve(id);
      toast({
        title: 'Success',
        description: 'Alert resolved',
      });
      loadInstances();
      loadStatistics();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const colors: Record<AlertSeverity, string> = {
      Critical: 'bg-red-500',
      Warning: 'bg-yellow-500',
      Info: 'bg-blue-500',
      Error: 'bg-red-600',
    };
    return (
      <Badge className={colors[severity]}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts
          </p>
        </div>
        <Link href="/settings/alert-rules">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Manage Rules
          </Button>
        </Link>
      </div>

      {statistics && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalActive}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.criticalCount} critical, {statistics.warningCount} warning
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalAcknowledged}</div>
              <p className="text-xs text-muted-foreground">
                Being handled
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalResolved}</div>
              <p className="text-xs text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>
            View and manage triggered alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AlertStatus)}>
            <TabsList>
              <TabsTrigger value={AlertStatus.Active}>Active</TabsTrigger>
              <TabsTrigger value={AlertStatus.Acknowledged}>Acknowledged</TabsTrigger>
              <TabsTrigger value={AlertStatus.Resolved}>Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No alerts found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === AlertStatus.Active ? 'All clear! No active alerts at the moment.' : `No ${activeTab.toLowerCase()} alerts.`}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Triggered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instances.map((instance) => (
                        <TableRow key={instance.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{instance.alertRuleName}</div>
                              <div className="text-sm text-muted-foreground">
                                {instance.message}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{instance.deviceName}</span>
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(instance.severity)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(instance.triggeredAt), { addSuffix: true })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {instance.status === AlertStatus.Active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAcknowledge(instance.id)}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              {instance.status !== AlertStatus.Resolved && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResolve(instance.id)}
                                >
                                  Resolve
                                </Button>
                              )}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
