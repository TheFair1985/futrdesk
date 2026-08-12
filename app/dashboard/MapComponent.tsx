import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';

export default function MapComponent({ geoData, logoUrl }: { geoData: any[], logoUrl: string }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const hqIcon = useMemo(() => {
    return divIcon({
      className: 'custom-hq-marker',
      html: `<div style="background-color: white; border: 2px solid #2d3142; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); overflow: hidden; padding: 2px;">
               <img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; transform: scale(0.95);" />
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }, [logoUrl]);

  if (!mounted) return null;

  return (
    <MapContainer 
      center={[48.1371, 11.5754]} // Munich center
      zoom={8} 
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '16px', zIndex: 0 }}
      attributionControl={false}
    >
      {/* Sleek light map theme via CartoDB */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* HQ Pin */}
      <Marker position={[48.1466, 11.5670]} icon={hqIcon}>
        <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-sans font-bold border-none rounded-lg shadow-lg">
          FutrDesk GmbH - Hauptquartier
        </Tooltip>
      </Marker>

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
