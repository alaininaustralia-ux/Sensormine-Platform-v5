'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface WidgetLoaderProps {
  widgetId: string;
  widgetUrl: string;
  config: Record<string, any>;
  size: { width: number; height: number };
  context: {
    instanceId: string;
    tenantId: string;
    userId?: string;
    dashboardId?: string;
  };
  onReady?: () => void;
  onError?: (error: string) => void;
}

type WidgetMessage =
  | { type: 'widget:ready' }
  | { type: 'widget:error'; error: string }
  | { type: 'widget:resize'; width: number; height: number }
  | { type: 'api:request'; id: string; method: string; params: any[] }
  | { type: 'api:response'; id: string; result: any }
  | { type: 'api:error'; id: string; error: string }
  | { type: 'config:updated'; config: Record<string, any> };

export function WidgetLoader({
  widgetId,
  widgetUrl,
  config,
  size,
  context,
  onReady,
  onError
}: WidgetLoaderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Handle messages from widget
  const handleMessage = useCallback(async (event: MessageEvent<WidgetMessage>) => {
    if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
      return;
    }
    
    const message = event.data;
    
    switch (message.type) {
      case 'widget:ready':
        setStatus('ready');
        onReady?.();
        break;
        
      case 'widget:error':
        setStatus('error');
        setErrorMessage(message.error);
        onError?.(message.error);
        break;
        
      case 'api:request':
        await handleAPIRequest(message.id, message.method, message.params);
        break;
    }
  }, [onReady, onError]);
  
  // Handle API requests from widget
  const handleAPIRequest = async (requestId: string, method: string, params: any[]) => {
    try {
      const result = await executeAPIMethod(method, params, context.tenantId);
      
      sendToWidget({
        type: 'api:response',
        id: requestId,
        result
      });
    } catch (error: any) {
      sendToWidget({
        type: 'api:error',
        id: requestId,
        error: error.message || 'API request failed'
      });
    }
  };
  
  // Execute API method
  const executeAPIMethod = async (method: string, params: any[], tenantId: string) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId
    };
    
    switch (method) {
      case 'queryTelemetry': {
        const [request] = params;
        const response = await fetch('/api/query/telemetry', {
          method: 'POST',
          headers,
          body: JSON.stringify(request)
        });
        if (!response.ok) throw new Error('Query failed');
        return await response.json();
      }
      
      case 'getDevice': {
        const [deviceId] = params;
        const response = await fetch(`/api/devices/${deviceId}`, { headers });
        if (!response.ok) throw new Error('Device not found');
        return await response.json();
      }
      
      case 'listDevices': {
        const [filters] = params;
        const queryParams = new URLSearchParams(filters || {});
        const response = await fetch(`/api/devices?${queryParams}`, { headers });
        if (!response.ok) throw new Error('Failed to list devices');
        return await response.json();
      }
      
      default:
        throw new Error(`Unknown API method: ${method}`);
    }
  };
  
  // Send message to widget
  const sendToWidget = (message: WidgetMessage) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  };
  
  // Initialize widget
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);
  
  // Send config updates to widget
  useEffect(() => {
    if (status === 'ready') {
      sendToWidget({
        type: 'config:updated',
        config
      });
    }
  }, [config, status]);
  
  // Generate widget HTML
  const widgetHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src *;">
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: system-ui, -apple-system, sans-serif;
          }
          #root {
            width: 100%;
            height: 100vh;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Widget context
          window.__WIDGET_CONTEXT__ = ${JSON.stringify({
            widgetId,
            instanceId: context.instanceId,
            tenantId: context.tenantId,
            userId: context.userId,
            dashboardId: context.dashboardId,
            config,
            size
          })};
        </script>
        <script src="${widgetUrl}" crossorigin="anonymous"></script>
      </body>
    </html>
  `;
  
  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading widget...</p>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-900">Widget Error</p>
            <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={widgetHTML}
        title={`Widget ${widgetId}`}
        style={{ display: status === 'error' ? 'none' : 'block' }}
      />
    </div>
  );
}
