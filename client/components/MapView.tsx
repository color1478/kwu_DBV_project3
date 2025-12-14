'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 아이콘 설정 (Next.js에서 필요)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Station {
  station_id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bikes_available: number;
  docks_available: number;
  baseline_demand?: number;
  load_factor?: number;
  color?: string;
}

interface MapViewProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  selectedStation?: number | null;
  onStationClick?: (stationId: number) => void;
  showUserLocation?: boolean; // 관리자일 때는 false
  radius?: number; // 반경 (km)
}

// 지도 중심 자동 이동 컴포넌트
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    // 지도가 완전히 초기화된 후에만 setView 호출
    if (!map) return;

    const updateCenter = () => {
      try {
        // 지도 컨테이너가 존재하고 렌더링되었는지 확인
        const container = map.getContainer();
        if (!container || !container.offsetParent) {
          // 아직 렌더링되지 않았으면 약간의 지연 후 재시도
          setTimeout(updateCenter, 100);
          return;
        }

        // 현재 줌 레벨 가져오기
        const currentZoom = map.getZoom();
        if (currentZoom && !isNaN(currentZoom) && currentZoom > 0) {
          map.setView(center, currentZoom, { animate: false });
        } else {
          map.setView(center, 13, { animate: false });
        }
      } catch (error) {
        // 오류 발생 시 무시 (지도가 아직 준비되지 않음)
        console.warn('Map center update failed:', error);
      }
    };

    // 약간의 지연을 두고 실행 (지도 초기화 완료 대기)
    const timer = setTimeout(updateCenter, 50);
    
    return () => clearTimeout(timer);
  }, [center, map]);

  return null;
}

// 커스텀 마커 아이콘 생성
function createCustomIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 25px;
      height: 25px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  });
}

const colorMap: { [key: string]: string } = {
  red: '#dc3545',
  orange: '#fd7e14',
  green: '#28a745',
  blue: '#007bff',
  // 사용자 관점: 과잉(여유)도 초록색으로 표시
};

export default function MapView({ stations, userLocation, selectedStation, onStationClick, showUserLocation = true, radius }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  // 기본 중심점 (서울)
  const defaultCenter: [number, number] = [37.5665, 126.9780];
  const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultCenter;

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && showUserLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })}
            >
              <Popup>현재 위치</Popup>
            </Marker>
            {radius && radius > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radius * 1000} // km를 미터로 변환
                pathOptions={{
                  color: '#007bff',
                  fillColor: '#007bff',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              >
                <Popup>
                  검색 반경: {radius}km
                </Popup>
              </Circle>
            )}
          </>
        )}

        {stations
          .filter(station => {
            const lat = station.latitude ? parseFloat(String(station.latitude)) : null;
            const lng = station.longitude ? parseFloat(String(station.longitude)) : null;
            return lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
          })
          .map((station) => {
            const lat = parseFloat(String(station.latitude));
            const lng = parseFloat(String(station.longitude));
            const color = colorMap[station.color || 'blue'] || colorMap.blue;
            return (
              <Marker
                key={station.station_id}
                position={[lat, lng]}
                icon={createCustomIcon(color)}
                eventHandlers={{
                  click: () => {
                    if (onStationClick) {
                      onStationClick(station.station_id);
                    }
                  },
                }}
              >
              <Popup>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    {station.station_name}
                  </h3>
                  <p style={{ margin: '5px 0' }}>대여 가능: {station.bikes_available}대</p>
                  <p style={{ margin: '5px 0' }}>반납 가능: {station.docks_available}개</p>
                  {station.distance && (
                    <p style={{ margin: '5px 0' }}>거리: {station.distance.toFixed(2)} km</p>
                  )}
                  {station.load_factor !== undefined && (
                    <p style={{ margin: '5px 0' }}>
                      부하율: {(station.load_factor * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && showUserLocation && <MapCenter center={center} />}
      </MapContainer>
    </div>
  );
}

