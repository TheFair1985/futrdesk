"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ geoData }: { geoData: any[] }) {
  // Fix for default markers in leaflet with nextjs
  useEffect(() => {
    // We only use CircleMarkers so we don't strictly need icon fixing, but good practice
  }, []);

  return (
    <MapContainer 
      center={[48.1371, 11.5754]} // Munich center
      zoom={8} 
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 0 }}
      attributionControl={false}
    >
      {/* Sleek light map theme via CartoDB */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {geoData.map((loc, idx) => (
        <CircleMarker 
          key={idx}
          center={[loc.lat, loc.lng]}
          radius={Math.max(8, (loc.value / 10000) * 3)}
          fillColor="#ef8354"
          color="#ffffff"
          weight={2}
          fillOpacity={0.6}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-sans font-bold border-none rounded-lg shadow-lg">
            <div className="text-xs text-gray-500">{loc.region}</div>
            <div className="text-sm text-gray-900">{loc.value.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})}</div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
