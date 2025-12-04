/**
 * Map Widget Types
 * 
 * Type definitions for GIS map widget functionality.
 */

export type DeviceStatus = 'online' | 'warning' | 'offline' | 'unknown';

export type DeviceType = 
  | 'sensor'
  | 'camera'
  | 'gateway'
  | 'controller'
  | 'actuator'
  | 'other';

/**
 * Device location data for map display
 */
export interface DeviceLocation {
  /** Unique device identifier */
  id: string;
  
  /** Device name/label */
  name: string;
  
  /** Type of device */
  deviceType: DeviceType;
  
  /** Current operational status */
  status: DeviceStatus;
  
  /** Latitude coordinate */
  latitude: number;
  
  /** Longitude coordinate */
  longitude: number;
  
  /** Last seen timestamp */
  lastSeen: Date;
  
  /** Additional device metadata */
  metadata?: {
    /** Serial number */
    serialNumber?: string;
    
    /** Firmware version */
    firmwareVersion?: string;
    
    /** Site/facility name */
    site?: string;
    
    /** Current value/reading */
    currentValue?: number;
    
    /** Unit of measurement */
    unit?: string;
    
    /** Custom properties */
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Geofence definition
 */
export interface Geofence {
  /** Unique geofence identifier */
  id: string;
  
  /** Geofence name */
  name: string;
  
  /** Center point [latitude, longitude] */
  center: [number, number];
  
  /** Radius in meters */
  radius: number;
  
  /** Geofence color */
  color?: string;
  
  /** Associated device types */
  deviceTypes?: DeviceType[];
}

/**
 * Map widget configuration
 */
export interface MapWidgetConfig {
  /** Map center point [latitude, longitude] */
  center?: [number, number];
  
  /** Initial zoom level (1-18) */
  zoom?: number;
  
  /** Enable marker clustering */
  enableClustering?: boolean;
  
  /** Enable heat map visualization */
  enableHeatMap?: boolean;
  
  /** Show geofences on map */
  showGeofences?: boolean;
  
  /** Filter by device types */
  deviceTypes?: DeviceType[];
  
  /** Filter by device status */
  deviceStatuses?: DeviceStatus[];
  
  /** Geofence definitions */
  geofences?: Geofence[];
  
  /** Auto-fit bounds to show all devices */
  autoFitBounds?: boolean;
}

/**
 * Map layer definition
 */
export interface MapLayer {
  /** Layer identifier */
  id: string;
  
  /** Layer name for display */
  name: string;
  
  /** Whether layer is visible */
  visible: boolean;
  
  /** Layer type */
  type: 'markers' | 'heatmap' | 'geofences';
  
  /** Layer-specific configuration */
  config?: Record<string, string | number | boolean>;
}

/**
 * Device marker click event
 */
export interface DeviceMarkerClickEvent {
  /** Clicked device */
  device: DeviceLocation;
  
  /** Mouse event */
  originalEvent?: MouseEvent;
}

/**
 * Map bounds
 */
export interface MapBounds {
  /** North-east corner [latitude, longitude] */
  northEast: [number, number];
  
  /** South-west corner [latitude, longitude] */
  southWest: [number, number];
}
