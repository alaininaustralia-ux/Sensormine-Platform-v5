/**
 * MapView Component
 * Leaflet map rendering with device markers
 */

'use client';

import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface Device {
  id: string;
  deviceId: string;
  name: string;
  deviceTypeId: string;
  deviceTypeName: string;
  location: Location;
  status: string;
  lastSeenAt?: string;
}

interface MapViewProps {
  devices: Device[];
}

export default function MapView({ devices }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for devices
    if (devices.length > 0) {
      const bounds = L.latLngBounds([]);

      devices.forEach((device) => {
        const { latitude, longitude } = device.location;
        const latlng: L.LatLngExpression = [latitude, longitude];

        // Create custom icon based on device status
        const iconColor = getStatusColor(device.status);
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${iconColor};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
            ">
              📍
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(latlng, { icon }).addTo(mapRef.current!);

        // Add popup with device info
        const lastSeen = device.lastSeenAt
          ? new Date(device.lastSeenAt).toLocaleString()
          : 'Never';

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${device.name}</h3>
            <p style="margin: 4px 0;"><strong>Type:</strong> ${device.deviceTypeName}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> 
              <span style="
                padding: 2px 6px;
                border-radius: 4px;
                background-color: ${iconColor}20;
                color: ${iconColor};
                font-weight: 500;
              ">${device.status}</span>
            </p>
            <p style="margin: 4px 0;"><strong>Device ID:</strong> ${device.deviceId}</p>
            <p style="margin: 4px 0;"><strong>Last Seen:</strong> ${lastSeen}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
            ${device.location.altitude ? `<p style="margin: 4px 0;"><strong>Altitude:</strong> ${device.location.altitude}m</p>` : ''}
            <a href="/devices/${device.id}" style="
              display: inline-block;
              margin-top: 8px;
              padding: 4px 12px;
              background-color: #0070f3;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 14px;
            ">View Details</a>
          </div>
        `);

        markersRef.current.push(marker);
        bounds.extend(latlng);
      });

      // Fit map to show all markers
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Cleanup
    return () => {
      // Don't destroy the map on device updates, just when component unmounts
    };
  }, [devices]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" />;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return '#22c55e'; // green
    case 'inactive':
      return '#ef4444'; // red
    case 'maintenance':
      return '#f59e0b'; // orange
    case 'warning':
      return '#eab308'; // yellow
    default:
      return '#6b7280'; // gray
  }
}
