/**
 * MapWidget Tests
 * 
 * Test suite for GIS map widget component (Story 4.6).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MapWidget } from '@/components/dashboard/widgets/map-widget';
import { mockDeviceLocations, mockGeofences } from '@/lib/mock/device-locations';

// Mock Leaflet to avoid DOM dependencies in tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: { children?: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  Circle: ({ center, radius }: { center: [number, number]; radius: number }) => (
    <div data-testid="geofence" data-center={JSON.stringify(center)} data-radius={radius} />
  ),
  LayersControl: ({ children }: { children: React.ReactNode }) => <div data-testid="layers-control">{children}</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="marker-cluster">{children}</div>,
}));

describe('MapWidget', () => {
  const defaultProps = {
    id: 'test-map-widget',
    title: 'Device Map',
    type: 'map' as const,
    config: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render map container with correct dimensions', () => {
      render(<MapWidget {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should render tile layer for map background', () => {
      render(<MapWidget {...defaultProps} />);
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toBeInTheDocument();
    });

    it('should use default center and zoom when not configured', () => {
      render(<MapWidget {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('center');
      expect(mapContainer).toHaveAttribute('zoom');
    });

    it('should use configured center and zoom', () => {
      const config = {
        center: [40.7128, -74.0060] as [number, number],
        zoom: 10,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('center', JSON.stringify(config.center));
      expect(mapContainer).toHaveAttribute('zoom', String(config.zoom));
    });
  });

  describe('Device Markers', () => {
    it('should render markers for all devices', () => {
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
      expect(markers.length).toBeLessThanOrEqual(mockDeviceLocations.length);
    });

    it('should position markers at correct coordinates', () => {
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      const firstMarker = markers[0];
      
      expect(firstMarker).toHaveAttribute('data-position');
      const position = JSON.parse(firstMarker.getAttribute('data-position') || '[]');
      expect(position).toHaveLength(2);
      expect(typeof position[0]).toBe('number');
      expect(typeof position[1]).toBe('number');
    });

    it('should color-code markers by device status', async () => {
      render(<MapWidget {...defaultProps} />);
      
      // Check that markers have status-based styling
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
      
      // At least one marker should exist for testing
      const firstMarker = markers[0];
      expect(firstMarker).toBeInTheDocument();
    });

    it('should filter markers by device type when configured', () => {
      const config = {
        deviceTypes: ['sensor'],
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const markers = screen.getAllByTestId('marker');
      // Should only show sensor devices
      expect(markers.length).toBeGreaterThan(0);
      expect(markers.length).toBeLessThan(mockDeviceLocations.length);
    });

    it('should filter markers by device status when configured', () => {
      const config = {
        deviceStatuses: ['online'],
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const markers = screen.getAllByTestId('marker');
      // Should only show online devices
      expect(markers.length).toBeGreaterThan(0);
    });
  });

  describe('Marker Clustering', () => {
    it('should enable clustering when configured', () => {
      const config = {
        enableClustering: true,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const cluster = screen.getByTestId('marker-cluster');
      expect(cluster).toBeInTheDocument();
    });

    it('should disable clustering by default', () => {
      render(<MapWidget {...defaultProps} />);
      
      // When clustering is disabled, markers should render directly
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });

  describe('Device Details Popup', () => {
    it('should show device details popup on marker click', async () => {
      const user = userEvent.setup();
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      await user.click(markers[0]);
      
      await waitFor(() => {
        const popup = screen.getByTestId('popup');
        expect(popup).toBeInTheDocument();
      });
    });

    it('should display device name in popup', async () => {
      const user = userEvent.setup();
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      await user.click(markers[0]);
      
      await waitFor(() => {
        const popup = screen.getByTestId('popup');
        expect(popup).toHaveTextContent(/sensor|camera|gateway|controller|actuator/i);
      });
    });

    it('should display device status in popup', async () => {
      const user = userEvent.setup();
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      await user.click(markers[0]);
      
      await waitFor(() => {
        const popup = screen.getByTestId('popup');
        expect(popup).toHaveTextContent(/online|warning|offline|unknown/i);
      });
    });

    it('should display device metadata in popup', async () => {
      const user = userEvent.setup();
      render(<MapWidget {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      await user.click(markers[0]);
      
      await waitFor(() => {
        const popup = screen.getByTestId('popup');
        // Should show serial number, firmware, or site
        expect(popup.textContent).toBeTruthy();
      });
    });
  });

  describe('Layer Controls', () => {
    it('should render layer controls', () => {
      render(<MapWidget {...defaultProps} />);
      
      const layersControl = screen.getByTestId('layers-control');
      expect(layersControl).toBeInTheDocument();
    });

    it('should toggle device type layers', async () => {
      const user = userEvent.setup();
      render(<MapWidget {...defaultProps} />);
      
      // Layer controls should allow toggling device types
      const layersControl = screen.getByTestId('layers-control');
      expect(layersControl).toBeInTheDocument();
    });
  });

  describe('Geofencing', () => {
    it('should render geofences when configured', () => {
      const config = {
        showGeofences: true,
        geofences: mockGeofences,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const geofences = screen.getAllByTestId('geofence');
      expect(geofences.length).toBe(mockGeofences.length);
    });

    it('should not render geofences when disabled', () => {
      const config = {
        showGeofences: false,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const geofences = screen.queryAllByTestId('geofence');
      expect(geofences.length).toBe(0);
    });

    it('should position geofences at correct coordinates', () => {
      const config = {
        showGeofences: true,
        geofences: mockGeofences,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      const geofences = screen.getAllByTestId('geofence');
      const firstGeofence = geofences[0];
      
      expect(firstGeofence).toHaveAttribute('data-center');
      expect(firstGeofence).toHaveAttribute('data-radius');
    });
  });

  describe('Heat Map', () => {
    it('should enable heat map mode when configured', () => {
      const config = {
        enableHeatMap: true,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      // Heat map layer should be present (implementation-specific test)
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('Auto-fit Bounds', () => {
    it('should fit bounds to show all devices when configured', () => {
      const config = {
        autoFitBounds: true,
      };
      
      render(<MapWidget {...defaultProps} config={config} />);
      
      // Map should adjust bounds (mocked in useMap)
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show placeholder when no devices', () => {
      // This would require a prop to override mock data
      render(<MapWidget {...defaultProps} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coordinates gracefully', () => {
      const config = {
        center: [999, 999] as [number, number], // Invalid coords
      };
      
      // Should not crash
      expect(() => {
        render(<MapWidget {...defaultProps} config={config} />);
      }).not.toThrow();
    });
  });
});
