'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Asset, AssetState, AlarmStatus } from '@/lib/api/digital-twin';
import useDigitalTwinStore from '@/lib/stores/digital-twin-store';
import { cn } from '@/lib/utils';

const getAlarmColor = (status: AlarmStatus) => {
  const colorMap: Record<AlarmStatus, string> = {
    [AlarmStatus.Normal]: 'bg-green-500',
    [AlarmStatus.Warning]: 'bg-yellow-500',
    [AlarmStatus.Critical]: 'bg-red-500',
  };
  return colorMap[status];
};

const getAlarmBadgeVariant = (status: AlarmStatus) => {
  const variantMap: Record<AlarmStatus, 'default' | 'destructive' | 'secondary'> = {
    [AlarmStatus.Normal]: 'secondary',
    [AlarmStatus.Warning]: 'default',
    [AlarmStatus.Critical]: 'destructive',
  };
  return variantMap[status];
};

interface AssetStateCardProps {
  asset: Asset;
  state: AssetState | null;
  onRefresh: () => void;
}

const AssetStateCard: React.FC<AssetStateCardProps> = ({ asset, state, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription>{asset.type}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {state && (
              <>
                <span
                  className={cn(
                    'w-3 h-3 rounded-full',
                    getAlarmColor(state.alarmStatus)
                  )}
                  title={state.alarmStatus}
                />
                <Badge variant={getAlarmBadgeVariant(state.alarmStatus)}>
                  {state.alarmStatus}
                </Badge>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {state ? (
          <div className="space-y-4">
            {/* Alarm Count */}
            {state.alarmCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">
                  {state.alarmCount} active alarm{state.alarmCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Calculated Metrics */}
            {Object.keys(state.calculatedMetrics).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Calculated Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(state.calculatedMetrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 border rounded-md bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {value > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : value < 0 ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-lg font-semibold mt-1">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom State */}
            {Object.keys(state.state).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Custom State</h4>
                <div className="p-3 border rounded-md bg-muted/30">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(state.state, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>
                Last updated: {new Date(state.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No state data available</p>
            <p className="text-sm">State will appear once devices report data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AssetStateDashboard: React.FC = () => {
  const { 
    assets, 
    selectedAsset,
    selectedAssetState,
    fetchAssets, 
    fetchAssetState,
    selectAsset,
  } = useDigitalTwinStore();
  
  const [filterAlarm, setFilterAlarm] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (selectedAsset) {
      fetchAssetState(selectedAsset.id);
    }
  }, [selectedAsset, fetchAssetState]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedAsset) return;

    const interval = setInterval(() => {
      fetchAssetState(selectedAsset.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedAsset, fetchAssetState]);

  const handleRefresh = () => {
    if (selectedAsset) {
      fetchAssetState(selectedAsset.id);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filterAlarm === 'all' || !filterAlarm) return true;
    // This would need actual state data for each asset
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset State Dashboard</CardTitle>
              <CardDescription>
                Monitor real-time state and metrics for your assets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4"
                />
                Auto-refresh (30s)
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Asset</label>
              <Select
                value={selectedAsset?.id || ''}
                onValueChange={(value) => {
                  const asset = assets.find((a) => a.id === value);
                  selectAsset(asset || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Alarm</label>
              <Select value={filterAlarm} onValueChange={setFilterAlarm}>
                <SelectTrigger>
                  <SelectValue placeholder="All alarms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All alarms</SelectItem>
                  <SelectItem value={AlarmStatus.Normal}>Normal</SelectItem>
                  <SelectItem value={AlarmStatus.Warning}>Warning</SelectItem>
                  <SelectItem value={AlarmStatus.Critical}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Asset State */}
      {selectedAsset ? (
        <AssetStateCard
          asset={selectedAsset}
          state={selectedAssetState}
          onRefresh={handleRefresh}
        />
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Asset Selected</p>
              <p className="text-sm">Select an asset to view its state and metrics</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.slice(0, 6).map((asset) => (
          <Card
            key={asset.id}
            className={cn(
              'cursor-pointer transition-colors hover:border-primary',
              selectedAsset?.id === asset.id && 'border-primary bg-primary/5'
            )}
            onClick={() => selectAsset(asset)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{asset.name}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {asset.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Click to view details
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
