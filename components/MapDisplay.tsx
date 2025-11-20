import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates } from '../types';

// Fix Leaflet icon paths safely
const fixLeafletIcons = () => {
  try {
    // Check if L is defined (it might be undefined in some ESM environments depending on import)
    if (typeof L === 'undefined' || !L.Icon || !L.Icon.Default) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  } catch (e) {
    console.warn("Failed to fix Leaflet icons:", e);
  }
};

fixLeafletIcons();

interface MapDisplayProps {
  userLocation: Coordinates | null;
  targetLocation: Coordinates | null;
  radius: number;
  onMapClick: (coords: Coordinates) => void;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({
  userLocation,
  targetLocation,
  radius,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default view
    const initialCoords: L.LatLngExpression = userLocation 
      ? [userLocation.lat, userLocation.lng] 
      : [4.6097, -74.0817]; // Default to Bogota

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(initialCoords, 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Event Listener for Clicks
        map.on('click', (e: L.LeafletMouseEvent) => {
            onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        mapInstanceRef.current = map;
    } catch (err) {
        console.error("Error initializing map:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Update User Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    const icon = L.divIcon({
      className: 'bg-transparent',
      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/50 animate-pulse"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon }).addTo(mapInstanceRef.current);
    }
    
    // Auto-center only if we don't have a target set
    if (!targetLocation) {
        mapInstanceRef.current.panTo([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation, targetLocation]);

  // Update Target Marker & Radius
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (targetLocation) {
      // Target Icon
      const targetIcon = L.divIcon({
        className: 'bg-transparent',
        html: '<div class="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (targetMarkerRef.current) {
        targetMarkerRef.current.setLatLng([targetLocation.lat, targetLocation.lng]);
      } else {
        targetMarkerRef.current = L.marker([targetLocation.lat, targetLocation.lng], { icon: targetIcon }).addTo(mapInstanceRef.current);
      }

      // Radius Circle
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([targetLocation.lat, targetLocation.lng]);
        radiusCircleRef.current.setRadius(radius);
      } else {
        radiusCircleRef.current = L.circle([targetLocation.lat, targetLocation.lng], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          radius: radius,
          weight: 1,
          dashArray: '5, 10'
        }).addTo(mapInstanceRef.current);
      }

      // Fit bounds to include both user and target if possible
      if (userLocation) {
         const bounds = L.latLngBounds(
             [userLocation.lat, userLocation.lng],
             [targetLocation.lat, targetLocation.lng]
         );
         mapInstanceRef.current.fitBounds(bounds.pad(0.2));
      } else {
         mapInstanceRef.current.panTo([targetLocation.lat, targetLocation.lng]);
      }

    } else {
      // Cleanup if target removed
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
    }
  }, [targetLocation, radius, userLocation]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};
