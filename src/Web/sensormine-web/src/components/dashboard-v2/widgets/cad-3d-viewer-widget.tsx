/**
 * CAD 3D Viewer Widget - Clean Implementation
 * 
 * Dashboard widget for displaying 3D CAD models with interactive element selection.
 * Features:
 * - STL/OBJ file loading with authenticated requests
 * - Blob URL caching to prevent infinite re-renders
 * - Element selection and highlighting
 * - Sensor mapping configuration support
 * - Optimized React.memo with deep comparison
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html, Clone } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as THREE from 'three';
import { alertRulesApi } from '@/lib/api';
import { serviceUrls } from '@/lib/api/config';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SensorFieldMapping {
  fieldName: string;
  fieldFriendlyName?: string;
  chartType: 'line' | 'bar' | 'gauge' | 'value';
  timePeriod: '1h' | '6h' | '12h' | '24h' | '7d' | '30d';
}

export interface SensorElementMapping {
  elementId: string;
  elementName: string;
  sourceType: 'device' | 'alert';
  deviceId?: string;
  deviceName?: string;
  alertId?: string;
  alertName?: string;
  fields: SensorFieldMapping[]; // Max 2 fields per element
}

export interface CAD3DViewerConfig {
  modelUrl?: string;
  modelType?: 'stl' | 'obj';
  backgroundColor?: string;
  gridEnabled?: boolean;
  cameraPosition?: [number, number, number];
  sensorMappings?: SensorElementMapping[];
  defaultColor?: string;
  highlightColor?: string;
  activeColor?: string;
}

export interface CAD3DViewerWidgetProps {
  id: string;
  title: string;
  description?: string;
  config?: CAD3DViewerConfig;
  isEditMode?: boolean;
  onConfigure?: () => void;
  onDelete?: () => void;
  onElementSelected?: (elementId: string, elementName: string) => void;
  dashboardId?: string;
}

interface MeshInfo {
  id: string;
  name: string;
}

interface ElementDataPopupState {
  elementId: string;
  elementName: string;
  mapping: SensorElementMapping;
  data: Record<string, {
    value: number | string;
    timestamp: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
  loading: boolean;
}

// ============================================================================
// Blob URL Caching Hook (Prevents Infinite Re-renders)
// ============================================================================

const blobUrlCache = new Map<string, string>();

function useAuthenticatedFile(fileUrl: string | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setBlobUrl(null);
      return;
    }

    // Return cached blob URL if available
    if (blobUrlCache.has(fileUrl)) {
      setBlobUrl(blobUrlCache.get(fileUrl)!);
      return;
    }

    let cancelled = false;

    const fetchFile = async () => {
      try {
        const tenantId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
        const response = await fetch(fileUrl, {
          headers: { 'X-Tenant-Id': tenantId },
        });

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status}`);
        }

        const blob = await response.blob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          blobUrlCache.set(fileUrl, url); // Cache it
          setBlobUrl(url);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading 3D model:', err);
        }
      }
    };

    fetchFile();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return blobUrl;
}

// ============================================================================
// 3D Model Components
// ============================================================================

/**
 * STL Model Renderer
 */
function STLModel({
  blobUrl,
  selectedMeshId,
  onMeshClick,
  defaultColor,
  highlightColor,
}: {
  blobUrl: string;
  selectedMeshId: string | null;
  onMeshClick: (meshId: string) => void;
  defaultColor: string;
  highlightColor: string;
}) {
  const geometry = useLoader(STLLoader, blobUrl) as THREE.BufferGeometry;

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      event.stopPropagation?.();
      if (event.delta > 2) return; // Ignore drags
      onMeshClick('main-model');
    },
    [onMeshClick]
  );

  return (
    <mesh geometry={geometry} onClick={handleClick}>
      <meshStandardMaterial
        color={selectedMeshId === 'main-model' ? highlightColor : defaultColor}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

/**
 * OBJ Model Renderer with Element Selection
 */
function OBJModel({
  blobUrl,
  selectedMeshId,
  onMeshClick,
  onMeshesDiscovered,
  defaultColor,
  highlightColor,
  sensorMappings,
}: {
  blobUrl: string;
  selectedMeshId: string | null;
  onMeshClick: (meshId: string) => void;
  onMeshesDiscovered?: (meshes: MeshInfo[]) => void;
  defaultColor: string;
  highlightColor: string;
  sensorMappings?: SensorElementMapping[];
}) {
  const obj = useLoader(OBJLoader, blobUrl) as THREE.Group;
  const scene = useMemo(() => obj.clone(), [obj]);
  const onMeshesDiscoveredRef = useRef(onMeshesDiscovered);
  const meshesReportedRef = useRef(false);

  // Update ref without triggering re-render
  useEffect(() => {
    onMeshesDiscoveredRef.current = onMeshesDiscovered;
  }, [onMeshesDiscovered]);

  // Discover meshes and configure materials
  useEffect(() => {
    const meshes: MeshInfo[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Configure for clicking
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.transparent = false;
        }

        const meshId = child.name || child.uuid;
        const meshName = child.name || 'Unnamed Element';
        meshes.push({ id: meshId, name: meshName });

        // Apply colors based on selection and mappings
        const isSelected = meshId === selectedMeshId;
        const hasMapping = sensorMappings?.some(m => m.elementId === meshId);
        
        if (child.material instanceof THREE.Material) {
          let color = defaultColor;
          if (isSelected) {
            color = highlightColor;
          } else if (hasMapping) {
            color = '#10b981'; // Green-500 for configured elements
          }
          (child.material as THREE.MeshStandardMaterial).color = new THREE.Color(color);
        }
      }
    });

    // Report discovered meshes only once
    if (!meshesReportedRef.current && onMeshesDiscoveredRef.current && meshes.length > 0) {
      onMeshesDiscoveredRef.current(meshes);
      meshesReportedRef.current = true;
    }
  }, [scene, selectedMeshId, defaultColor, highlightColor, sensorMappings]);

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      event.stopPropagation?.();
      if (event.delta > 2) return; // Ignore drags

      const mesh = event.object as THREE.Mesh;
      const meshId = mesh.name || mesh.uuid;
      onMeshClick(meshId);
    },
    [onMeshClick]
  );

  return <Clone object={scene} onClick={handleClick} inject={<meshStandardMaterial />} />;
}

/**
 * Model Loader - Handles both STL and OBJ
 */
function ModelLoader({
  modelUrl,
  modelType,
  selectedMeshId,
  onMeshClick,
  onMeshesDiscovered,
  defaultColor,
  highlightColor,
  sensorMappings,
}: {
  modelUrl: string;
  modelType: 'stl' | 'obj';
  selectedMeshId: string | null;
  onMeshClick: (meshId: string) => void;
  onMeshesDiscovered?: (meshes: MeshInfo[]) => void;
  defaultColor: string;
  highlightColor: string;
  sensorMappings?: SensorElementMapping[];
}) {
  const blobUrl = useAuthenticatedFile(modelUrl);

  if (!blobUrl) {
    return (
      <Html center>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
          Loading {modelType.toUpperCase()}...
        </div>
      </Html>
    );
  }

  if (modelType === 'stl') {
    return (
      <STLModel
        blobUrl={blobUrl}
        selectedMeshId={selectedMeshId}
        onMeshClick={onMeshClick}
        defaultColor={defaultColor}
        highlightColor={highlightColor}
      />
    );
  }

  return (
    <OBJModel
      blobUrl={blobUrl}
      selectedMeshId={selectedMeshId}
      onMeshClick={onMeshClick}
      onMeshesDiscovered={onMeshesDiscovered}
      defaultColor={defaultColor}
      highlightColor={highlightColor}
      sensorMappings={sensorMappings}
    />
  );
}

// ============================================================================
// 3D Scene Component
// ============================================================================

function Scene({
  config,
  selectedMeshId,
  onMeshClick,
  onMeshesDiscovered,
}: {
  config: Required<CAD3DViewerConfig>;
  selectedMeshId: string | null;
  onMeshClick: (meshId: string) => void;
  onMeshesDiscovered?: (meshes: MeshInfo[]) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={config.cameraPosition as [number, number, number]}
        fov={50}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      
      {/* Grid */}
      {config.gridEnabled && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellColor="#6f6f6f"
          sectionColor="#9d9d9d"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      )}

      {/* 3D Model */}
      {config.modelUrl && config.modelType && (
        <React.Suspense
          fallback={
            <Html center>
              <div style={{ color: 'white' }}>Loading model...</div>
            </Html>
          }
        >
          <ModelLoader
            modelUrl={config.modelUrl}
            modelType={config.modelType}
            selectedMeshId={selectedMeshId}
            onMeshClick={onMeshClick}
            onMeshesDiscovered={onMeshesDiscovered}
            defaultColor={config.defaultColor}
            highlightColor={config.highlightColor}
            sensorMappings={config.sensorMappings}
          />
        </React.Suspense>
      )}
    </>
  );
}

// ============================================================================
// Main Widget Component
// ============================================================================

function CAD3DViewerWidgetInternal({
  config = {},
  isEditMode = false,
  onElementSelected,
}: CAD3DViewerWidgetProps) {
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [discoveredMeshes, setDiscoveredMeshes] = useState<MeshInfo[]>([]);
  const [popupData, setPopupData] = useState<ElementDataPopupState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize config with defaults to prevent unnecessary re-renders
  const defaultConfig = useMemo((): Required<CAD3DViewerConfig> => ({
    modelUrl: config.modelUrl || '',
    modelType: config.modelType || 'obj',
    backgroundColor: config.backgroundColor || '#1a1a1a',
    gridEnabled: config.gridEnabled ?? true,
    cameraPosition: config.cameraPosition || [5, 5, 5],
    sensorMappings: config.sensorMappings || [],
    defaultColor: config.defaultColor || '#888888',
    highlightColor: config.highlightColor || '#ff6b35',
    activeColor: config.activeColor || '#4ade80',
  }), [config]);

  // Fetch telemetry data for an element
  const fetchElementData = useCallback(async (mapping: SensorElementMapping) => {
    try {
      const data: Record<string, { value: number | string; timestamp: string; trend: 'up' | 'down' | 'stable' }> = {};

      if (mapping.sourceType === 'device' && mapping.deviceId) {
        // Use the same approach as sensor-data-chart-modal and TimeSeriesChart
        const tenantId = '00000000-0000-0000-0000-000000000001';
        
        console.log('[CAD Viewer] Fetching telemetry for device:', mapping.deviceId);
        
        // Fetch latest telemetry using Query API endpoint
        const endTime = new Date();
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - 5); // Last 5 minutes
        
        const response = await fetch(`${serviceUrls.query}/api/widgetdata/timeseries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': tenantId,
          },
          body: JSON.stringify({
            deviceIds: [mapping.deviceId],
            fields: mapping.fields.map(f => f.fieldName),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            aggregation: 'none',
            limit: 100,
          }),
        });

        console.log('[CAD Viewer] Response status:', response.status);

        if (response.ok) {
          const telemetryData = await response.json();
          console.log('[CAD Viewer] Telemetry data:', telemetryData);
          
          // Response format: { series: [{ field, dataPoints: [{ timestamp, value }] }] }
          if (telemetryData.series && Array.isArray(telemetryData.series)) {
            telemetryData.series.forEach((seriesItem: { field: string; dataPoints: Array<{ timestamp: string; value: number | string }> }) => {
              if (seriesItem.dataPoints && seriesItem.dataPoints.length > 0) {
                const latestPoint = seriesItem.dataPoints[seriesItem.dataPoints.length - 1];
                
                data[seriesItem.field] = {
                  value: typeof latestPoint.value === 'number' ? latestPoint.value.toFixed(2) : latestPoint.value,
                  timestamp: latestPoint.timestamp,
                  trend: 'stable' as const,
                };
              }
            });
          }
          
          console.log('[CAD Viewer] Extracted data:', data);
        } else {
          console.error('[CAD Viewer] API error:', response.status, response.statusText);
        }
      } else if (mapping.sourceType === 'alert' && mapping.alertId) {
        // Fetch alert status
        const alertRule = await alertRulesApi.get(mapping.alertId);
        
        if (alertRule) {
          data['alertStatus'] = {
            value: alertRule.isEnabled ? 'Active' : 'Inactive',
            timestamp: new Date().toISOString(),
            trend: 'stable' as const,
          };
          
          data['severity'] = {
            value: alertRule.severity,
            timestamp: new Date().toISOString(),
            trend: 'stable' as const,
          };
        }
      }

      return data;
    } catch (error) {
      console.error('[CAD Viewer] Failed to fetch element data:', error);
      return {};
    }
  }, []);

  const handleMeshClick = useCallback(async (meshId: string) => {
    setSelectedMeshId(meshId);
    console.log('🎯 Element selected:', meshId);
    
    // In edit mode, notify parent to open config panel
    if (isEditMode && onElementSelected) {
      const meshInfo = discoveredMeshes.find(m => m.id === meshId);
      const elementName = meshInfo?.name || meshId;
      onElementSelected(meshId, elementName);
    } 
    // In view mode, show data popup if element has mapping
    else if (!isEditMode) {
      const mapping = defaultConfig.sensorMappings.find(m => m.elementId === meshId);
      if (mapping) {
        const meshInfo = discoveredMeshes.find(m => m.id === meshId);
        const elementName = meshInfo?.name || meshId;
        
        // Show popup with loading state
        setPopupData({
          elementId: meshId,
          elementName,
          mapping,
          data: {},
          loading: true,
        });

        // Fetch data
        const data = await fetchElementData(mapping);
        
        // Update popup with data
        setPopupData({
          elementId: meshId,
          elementName,
          mapping,
          data,
          loading: false,
        });
      }
    }
  }, [isEditMode, onElementSelected, discoveredMeshes, defaultConfig.sensorMappings, fetchElementData]);

  const handleMeshesDiscovered = useCallback((meshes: MeshInfo[]) => {
    setDiscoveredMeshes(prevMeshes => {
      // Only update if meshes changed
      if (prevMeshes.length === meshes.length && 
          prevMeshes.every((pm, idx) => pm.id === meshes[idx]?.id)) {
        return prevMeshes;
      }
      console.log('📦 Discovered', meshes.length, 'elements in model');
      return meshes;
    });
  }, []);

  const mappedCount = defaultConfig.sensorMappings.length;
  const totalCount = discoveredMeshes.length || mappedCount;

  // Render value with trend indicator
  const renderFieldValue = (fieldName: string, fieldData: ElementDataPopupState['data'][string]) => {
    const field = popupData?.mapping.fields.find(f => f.fieldName === fieldName);
    const friendlyName = field?.fieldFriendlyName || fieldName;
    
    return (
      <div key={fieldName} className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{friendlyName}</span>
          <span className="text-lg font-semibold">{fieldData.value}</span>
        </div>
        <div className="flex items-center gap-2">
          {fieldData.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {fieldData.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          {fieldData.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 relative" style={{ backgroundColor: defaultConfig.backgroundColor }}>
          {!defaultConfig.modelUrl ? (
            // No model loaded state
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">No 3D model loaded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure this widget to upload a CAD file
                </p>
              </div>
            </div>
          ) : (
            // 3D Canvas
            <div ref={containerRef} className="w-full h-full">
              <Canvas
                style={{ pointerEvents: 'auto' }}
                onPointerMissed={() => {
                  setSelectedMeshId(null);
                }}
              >
                <Scene
                  config={defaultConfig}
                  selectedMeshId={selectedMeshId}
                  onMeshClick={handleMeshClick}
                  onMeshesDiscovered={handleMeshesDiscovered}
                />
              </Canvas>
            </div>
          )}

          {/* Status Badge */}
          {isEditMode && defaultConfig.modelUrl && totalCount > 0 && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="gap-1">
                <span className="text-xs">
                  {mappedCount}/{totalCount} Elements Mapped
                </span>
              </Badge>
            </div>
          )}

          {/* Selected Element Info */}
          {selectedMeshId && (
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
              <p className="text-xs font-medium">Selected Element</p>
              <p className="text-sm font-mono">{selectedMeshId}</p>
              {(() => {
                const mapping = defaultConfig.sensorMappings.find(m => m.elementId === selectedMeshId);
                if (mapping) {
                  return (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      <p>✓ {mapping.fields.length} field(s) configured</p>
                      <p className="text-muted-foreground">
                        {mapping.sourceType === 'device' ? `Device: ${mapping.deviceName}` : `Alert: ${mapping.alertName}`}
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Help Text */}
        {isEditMode && defaultConfig.modelUrl && (
          <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
            💡 Click any element in the 3D model to configure sensor mapping
          </div>
        )}
      </CardContent>

      {/* Data Popup (View Mode) */}
      {!isEditMode && popupData && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{popupData.elementName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {popupData.mapping.sourceType === 'device' 
                      ? `Device: ${popupData.mapping.deviceName}`
                      : `Alert: ${popupData.mapping.alertName}`
                    }
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPopupData(null);
                    setSelectedMeshId(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Loading State */}
              {popupData.loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading data...</p>
                  </div>
                </div>
              )}

              {/* Data Display */}
              {!popupData.loading && (
                <>
                  {Object.keys(popupData.data).length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No data available</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(popupData.data).map(([fieldName, fieldData]) =>
                        renderFieldValue(fieldName, fieldData)
                      )}
                    </div>
                  )}

                  {/* Field Chart Types Info */}
                  {!popupData.loading && Object.keys(popupData.data).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Configured Fields:</p>
                      <div className="flex flex-wrap gap-2">
                        {popupData.mapping.fields.map((field, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {field.fieldFriendlyName || field.fieldName} • {field.chartType} • {field.timePeriod}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {Object.values(popupData.data)[0]?.timestamp && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Last updated: {new Date(Object.values(popupData.data)[0].timestamp).toLocaleString()}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Optimized Export with Deep Comparison
// ============================================================================

function arePropsEqual(prev: CAD3DViewerWidgetProps, next: CAD3DViewerWidgetProps): boolean {
  if (prev.id !== next.id) return false;
  if (prev.isEditMode !== next.isEditMode) return false;

  const prevConfig = prev.config || {};
  const nextConfig = next.config || {};

  // Compare all config properties
  if (prevConfig.modelUrl !== nextConfig.modelUrl) return false;
  if (prevConfig.modelType !== nextConfig.modelType) return false;
  if (prevConfig.backgroundColor !== nextConfig.backgroundColor) return false;
  if (prevConfig.gridEnabled !== nextConfig.gridEnabled) return false;
  if (prevConfig.defaultColor !== nextConfig.defaultColor) return false;
  if (prevConfig.highlightColor !== nextConfig.highlightColor) return false;
  if (prevConfig.activeColor !== nextConfig.activeColor) return false;

  // Compare camera position array
  const prevCam = prevConfig.cameraPosition || [];
  const nextCam = nextConfig.cameraPosition || [];
  if (prevCam.length !== nextCam.length) return false;
  if (!prevCam.every((v, i) => v === nextCam[i])) return false;

  // Compare sensor mappings array
  const prevMappings = prevConfig.sensorMappings || [];
  const nextMappings = nextConfig.sensorMappings || [];
  if (prevMappings.length !== nextMappings.length) return false;

  return true;
}

export const CAD3DViewerWidget = React.memo(CAD3DViewerWidgetInternal, arePropsEqual);
