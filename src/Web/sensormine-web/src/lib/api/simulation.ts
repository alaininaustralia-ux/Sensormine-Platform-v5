import { ApiClient } from './client';
import { apiConfig, serviceUrls } from './config';
import type { ApiResponse } from './types';

export const simulationApiClient = new ApiClient(serviceUrls.simulation, apiConfig.timeout);

export interface SimulatedSensor {
  name: string;
  sensorType: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

export interface SimulatedDevice {
  deviceId: string;
  name: string;
  protocol?: string;
  interval: number;
  topic?: string;
  sensors: SimulatedSensor[];
  customPayload?: Record<string, unknown>;
}

export interface PublishTelemetryRequest {
  topic: string;
  payload: Record<string, unknown>;
  deviceId?: string;
}

export interface PublishTelemetryResponse {
  message: string;
  topic: string;
  deviceId?: string;
  timestamp: string;
}

export interface SimulationLogEntry {
  timestamp: string;
  deviceId: string;
  topic: string;
  payload: string;
  status: string;
}

export interface SimulationStartResponse {
  message: string;
  deviceId: string;
  topic: string;
  interval: number;
  sensorCount: number;
}

export interface SimulationStopResponse {
  message: string;
}

const publishPath = '/api/simulation/publish';
const startPath = '/api/simulation/start';
const stopPath = (deviceId: string) => `/api/simulation/stop/${deviceId}`;
const quickStartPath = '/api/simulation/quick-start';
const activePath = '/api/simulation/active';
const logsPath = '/api/simulation/logs';

export function publishTelemetry(
  request: PublishTelemetryRequest
): Promise<ApiResponse<PublishTelemetryResponse>> {
  return simulationApiClient.post<PublishTelemetryResponse>(publishPath, request);
}

export function startSimulation(
  device: SimulatedDevice
): Promise<ApiResponse<SimulationStartResponse>> {
  return simulationApiClient.post<SimulationStartResponse>(startPath, device);
}

export function stopSimulation(deviceId: string): Promise<ApiResponse<SimulationStopResponse>> {
  return simulationApiClient.post<SimulationStopResponse>(stopPath(deviceId));
}

export function quickStartSimulation(): Promise<ApiResponse<{ message: string; deviceId: string }>> {
  return simulationApiClient.post<{ message: string; deviceId: string }>(quickStartPath, {});
}

export function getActiveSimulations(): Promise<ApiResponse<SimulatedDevice[]>> {
  return simulationApiClient.get<SimulatedDevice[]>(activePath);
}

export function getSimulationLogs(
  deviceId?: string,
  limit: number = 50
): Promise<ApiResponse<SimulationLogEntry[]>> {
  const params = new URLSearchParams();
  if (deviceId) params.append('deviceId', deviceId);
  params.append('limit', limit.toString());

  return simulationApiClient.get<SimulationLogEntry[]>(`${logsPath}?${params}`);
}
