/**
 * Video Analytics Configuration Types
 * 
 * Types for configuring video analytics streams, models, and device integration
 */

// Video stream source types
export type VideoSourceType = 'rtsp' | 'azure-blob' | 'hls' | 'webrtc';

// Processing model types
export type ProcessingModelType = 
  | 'object-detection'
  | 'person-detection'
  | 'vehicle-detection'
  | 'behavior-analysis'
  | 'near-miss-detection'
  | 'custom';

// Model configuration based on type
export interface ObjectDetectionConfig {
  confidenceThreshold: number; // 0-1
  classes: string[]; // Classes to detect (person, vehicle, etc.)
  maxDetections: number;
  enableTracking: boolean;
}

export interface BehaviorAnalysisConfig {
  behaviorTypes: string[]; // running, loitering, etc.
  alertThreshold: number;
  trackingDuration: number; // seconds
}

export interface NearMissConfig {
  proximityThreshold: number; // meters
  speedThreshold: number; // km/h
  zoneDefinitions: Array<{
    name: string;
    coordinates: Array<{ x: number; y: number }>;
  }>;
}

export interface CustomModelConfig {
  modelUrl: string;
  inputShape: number[];
  outputShape: number[];
  preprocessingSteps: string[];
  postprocessingSteps: string[];
  customParameters: Record<string, unknown>;
}

export type ModelConfiguration = 
  | ObjectDetectionConfig
  | BehaviorAnalysisConfig
  | NearMissConfig
  | CustomModelConfig;

// Video stream source configuration
export interface RTSPStreamConfig {
  url: string;
  username?: string;
  password?: string;
  resolution?: string; // e.g., "1920x1080"
  fps?: number;
}

export interface AzureBlobConfig {
  containerName: string;
  blobPath: string;
  connectionString?: string;
  sasToken?: string;
}

export interface HLSStreamConfig {
  url: string;
  playlistType: 'vod' | 'live';
}

export interface WebRTCStreamConfig {
  signalServerUrl: string;
  streamId: string;
}

export type StreamSourceConfig = 
  | RTSPStreamConfig
  | AzureBlobConfig
  | HLSStreamConfig
  | WebRTCStreamConfig;

// Main video analytics configuration
export interface VideoAnalyticsConfiguration {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sourceType: VideoSourceType;
  sourceConfig: StreamSourceConfig;
  processingModel: ProcessingModelType;
  modelConfiguration: ModelConfiguration;
  enabled: boolean;
  deviceId?: string; // Generated device ID once configured
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// API request/response types
export interface CreateVideoAnalyticsRequest {
  name: string;
  description?: string;
  sourceType: VideoSourceType;
  sourceConfig: StreamSourceConfig;
  processingModel: ProcessingModelType;
  modelConfiguration: ModelConfiguration;
  enabled?: boolean;
  tags?: string[];
}

export interface UpdateVideoAnalyticsRequest {
  name?: string;
  description?: string;
  sourceConfig?: StreamSourceConfig;
  modelConfiguration?: ModelConfiguration;
  enabled?: boolean;
  tags?: string[];
}

export interface VideoAnalyticsListResponse {
  configurations: VideoAnalyticsConfiguration[];
  total: number;
  page: number;
  pageSize: number;
}

// Model options for UI
export interface ModelOption {
  type: ProcessingModelType;
  name: string;
  description: string;
  icon?: string;
  requiresGPU?: boolean;
  avgLatency?: number; // milliseconds
}

export const availableModels: ModelOption[] = [
  {
    type: 'object-detection',
    name: 'Object Detection',
    description: 'Detect and classify objects (people, vehicles, equipment)',
    requiresGPU: true,
    avgLatency: 100,
  },
  {
    type: 'person-detection',
    name: 'Person Detection',
    description: 'Specialized model for detecting people with high accuracy',
    requiresGPU: true,
    avgLatency: 80,
  },
  {
    type: 'vehicle-detection',
    name: 'Vehicle Detection',
    description: 'Detect and classify vehicles (cars, trucks, forklifts)',
    requiresGPU: true,
    avgLatency: 90,
  },
  {
    type: 'behavior-analysis',
    name: 'Behavior Analysis',
    description: 'Analyze human behavior patterns (running, falling, loitering)',
    requiresGPU: true,
    avgLatency: 150,
  },
  {
    type: 'near-miss-detection',
    name: 'Near-Miss Detection',
    description: 'Detect near-miss safety events in industrial environments',
    requiresGPU: true,
    avgLatency: 120,
  },
  {
    type: 'custom',
    name: 'Custom Model',
    description: 'Upload and deploy your own ONNX model',
    requiresGPU: false,
    avgLatency: undefined,
  },
];

// Stream health status
export interface StreamHealthStatus {
  configurationId: string;
  isConnected: boolean;
  lastFrameTimestamp?: string;
  currentFps?: number;
  errorCount: number;
  lastError?: string;
  uptime?: number; // seconds
}
