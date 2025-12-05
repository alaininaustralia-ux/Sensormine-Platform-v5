/**
 * Device Types List Page
 * 
 * Display, search, and manage device types
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
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllDeviceTypes, deleteDeviceType, searchDeviceTypes } from '@/lib/api/deviceTypes';
import type { DeviceType, DeviceProtocol } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const PROTOCOLS: DeviceProtocol[] = ['MQTT', 'HTTP', 'WebSocket', 'OPC_UA', 'Modbus_TCP', 'Modbus_RTU', 'BACnet', 'EtherNetIP'];

export default function DeviceTypesPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<DeviceProtocol | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  const { toast } = useToast();

  // Load device types
  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      let result;

      if (searchTerm || protocolFilter !== 'all') {
        // Use search endpoint with filters
        result = await searchDeviceTypes({
          searchTerm: searchTerm || undefined,
          protocol: protocolFilter !== 'all' ? protocolFilter : undefined,
          page,
          pageSize,
        });
      } else {
        // Use getAll endpoint
        result = await getAllDeviceTypes(page, pageSize);
      }

      setDeviceTypes(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load device types',
        variant: 'destructive',
      });
      console.error('Error loading device types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, protocolFilter]);

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteDeviceType(id);
      toast({
        title: 'Success',
        description: 'Device type deleted successfully',
      });
      loadDeviceTypes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete device type',
        variant: 'destructive',
      });
      console.error('Error deleting device type:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Device Types</h2>
          <p className="text-muted-foreground">
            Manage device type templates for your IoT devices
          </p>
        </div>
        <Link href="/settings/device-types/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Device Type
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search device types..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={protocolFilter}
              onValueChange={(value) => {
                setProtocolFilter(value as DeviceProtocol | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Protocols</SelectItem>
                {PROTOCOLS.map((protocol) => (
                  <SelectItem key={protocol} value={protocol}>
                    {protocol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : deviceTypes.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">No device types found</p>
              <Link href="/settings/device-types/create">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first device type
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceTypes.map((deviceType) => (
                    <TableRow key={deviceType.id}>
                      <TableCell className="font-medium">
                        {deviceType.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {deviceType.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{deviceType.protocol}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {deviceType.tags.length > 0 ? (
                            deviceType.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {deviceType.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{deviceType.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deviceType.isActive ? 'default' : 'secondary'}>
                          {deviceType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/settings/device-types/${deviceType.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(deviceType.id, deviceType.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{' '}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
