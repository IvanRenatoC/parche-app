import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  type GoogleMapInstance,
  type GoogleMarker,
  type GoogleNs,
} from '../../lib/googleMaps';
import type { JobPost } from '../../types';

interface Props {
  posts: JobPost[];
  onSelect: (post: JobPost) => void;
}

// Centro por defecto: Plaza de Armas, Santiago (ChL).
const DEFAULT_CENTER = { lat: -33.4378, lng: -70.6504 };

export function JobsMap({ posts, onSelect }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const googleRef = useRef<GoogleNs | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [userLocated, setUserLocated] = useState(false);

  // Postulaciones que tienen coordenadas válidas.
  const geoPosts = posts.filter((p) => p.lat && p.lng && p.lat !== 0 && p.lng !== 0);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setLoadError(
        'Google Maps no está configurado. Agrega VITE_GOOGLE_MAPS_API_KEY en frontend/.env.local.'
      );
      return;
    }

    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapDivRef.current) return;
        googleRef.current = google;
        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          disableDefaultUI: false,
          clickableIcons: false,
        });
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'No se pudo cargar Google Maps');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Geolocalización del usuario una sola vez por sesión.
  useEffect(() => {
    if (!ready || userLocated) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current) return;
        mapRef.current.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current.setZoom(13);
        setUserLocated(true);
      },
      () => {
        // Permiso denegado o error: dejamos el centro default.
        setUserLocated(true);
      },
      { timeout: 8000 }
    );
  }, [ready, userLocated]);

  // Render markers para cada job post con coordenadas.
  useEffect(() => {
    if (!ready || !googleRef.current || !mapRef.current) return;
    const google = googleRef.current;
    const map = mapRef.current;

    // Limpiar markers anteriores.
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    geoPosts.forEach((post) => {
      const marker = new google.maps.Marker({
        position: { lat: post.lat!, lng: post.lng! },
        map,
      });
      marker.addListener('click', () => onSelect(post));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
    // onSelect cambia cada render, pero queremos remontar markers ante posts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, geoPosts]);

  const skipped = posts.length - geoPosts.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {loadError ? (
        <div style={warnBoxStyle}>
          <AlertTriangle size={14} color="#92400E" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{loadError}</span>
        </div>
      ) : (
        <>
          <div ref={mapDivRef} style={mapContainerStyle} />
          <div style={legendStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} color="#C0395B" />
              <span>
                {geoPosts.length} {geoPosts.length === 1 ? 'turno' : 'turnos'} en el mapa
              </span>
            </div>
            {skipped > 0 && (
              <span style={{ color: '#9CA3AF' }}>
                {skipped} sin ubicación exacta (no aparecen en el mapa)
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '480px',
  borderRadius: '14px',
  overflow: 'hidden',
  border: '1px solid #E8E5E0',
};

const legendStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '12.5px',
  color: '#6B7280',
  padding: '4px 4px',
  flexWrap: 'wrap',
};

const warnBoxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '12px 14px',
  borderRadius: '10px',
  background: '#FEF7E6',
  color: '#92400E',
  fontSize: '13px',
  lineHeight: 1.45,
  border: '1px solid #FCE7B0',
};
