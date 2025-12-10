'use client';

import React, { useState } from 'react';
import { Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulatorStore } from '@/lib/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ApiDeviceLoader() {
  const { loadDevicesFromApi, devices } = useSimulatorStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const loadResult = await loadDevicesFromApi();
      setResult(loadResult);
      
      // Clear result message after 5 seconds on success
      if (loadResult.success) {
        setTimeout(() => setResult(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Load from Platform
        </CardTitle>
        <CardDescription>
          Import devices and their schemas from Sensormine Platform APIs. Automatically creates simulator configurations with proper sensors, protocols, and intervals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">API Endpoints:</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>Device API: <code className="text-xs bg-gray-100 px-1 rounded">http://localhost:5293</code></li>
              <li>Schema Registry: <code className="text-xs bg-gray-100 px-1 rounded">http://localhost:5021</code></li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Tenant ID:</p>
            <p className="pl-2"><code className="text-xs bg-gray-100 px-1 rounded">00000000-0000-0000-0000-000000000001</code></p>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Successfully loaded {result.count} devices from API
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Failed to load devices</p>
                    {result.error && (
                      <p className="text-xs text-red-700 mt-1">{result.error}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading devices...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Load All Devices from API
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace all devices?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all {devices.length} existing devices with devices loaded from the Sensormine Platform API.
                All running simulations will be stopped. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoad}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground text-center">
          Devices will be automatically configured with sensors from their schemas
        </p>
      </CardContent>
    </Card>
  );
}
