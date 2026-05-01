import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { FieldError } from 'react-hook-form';
import { MapPin, AlertTriangle } from 'lucide-react';
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  type GoogleAutocomplete,
  type GoogleMapInstance,
  type GoogleMarker,
} from '../../lib/googleMaps';

export interface AddressValue {
  address: string;
  place_id: string;
  lat: number;
  lng: number;
}

export const EMPTY_ADDRESS: AddressValue = { address: '', place_id: '', lat: 0, lng: 0 };

interface Props {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  error?: FieldError | string;
  /** ISO 3166-1 alpha-2 country code (default 'cl'). */
  country?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  label = 'Dirección exacta',
  hint = 'Empieza a escribir y selecciona la sugerencia de Google.',
  placeholder = 'Ej: Av. Providencia 1234, Providencia',
  error,
  country = 'cl',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);

  const [text, setText] = useState(value.address);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const errorMsg = typeof error === 'string' ? error : error?.message;

  const updateMap = useCallback((google: NonNullable<typeof window.google>, lat: number, lng: number) => {
    if (!mapDivRef.current) return;
    const pos = { lat, lng };
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center: pos,
        zoom: 16,
        disableDefaultUI: true,
        clickableIcons: false,
      });
    } else {
      mapRef.current.setCenter(pos);
      mapRef.current.setZoom(16);
    }
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({ position: pos, map: mapRef.current });
    } else {
      markerRef.current.setPosition(pos);
    }
  }, []);

  useEffect(() => {
    setText(value.address);
  }, [value.address]);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setLoadError(
        'Google Maps no está configurado. Agrega VITE_GOOGLE_MAPS_API_KEY en frontend/.env.local para habilitar el autocompletado y el mapa.'
      );
      return;
    }

    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          componentRestrictions: { country },
          types: ['address'],
        });
        autocompleteRef.current = ac;

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const lat = place.geometry?.location?.lat?.() ?? 0;
          const lng = place.geometry?.location?.lng?.() ?? 0;
          const address = place.formatted_address ?? place.name ?? '';
          const place_id = place.place_id ?? '';
          if (!address || !place_id || !lat || !lng) {
            return;
          }
          onChange({ address, place_id, lat, lng });
          setText(address);
          updateMap(google, lat, lng);
        });

        if (value.lat && value.lng) {
          updateMap(google, value.lat, value.lng);
        }

        setIsReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'No se pudo inicializar Google Maps');
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
    // We only want to set up Google Maps once per mount; subsequent value changes
    // are reflected via the value-syncing effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // Keep the map marker in sync if the parent updates the lat/lng externally.
  useEffect(() => {
    if (!isReady || !window.google) return;
    if (value.lat && value.lng) {
      updateMap(window.google, value.lat, value.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.lat, value.lng, isReady]);

  return (
    <div style={fieldWrapStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <span style={iconStyle}>
          <MapPin size={16} color="#9CA3AF" />
        </span>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // If the user clears or edits the field manually, clear the
            // structured selection so we don't keep stale lat/lng around.
            if (value.address && e.target.value !== value.address) {
              onChange(EMPTY_ADDRESS);
            }
          }}
          style={baseInputStyle(!!errorMsg)}
          onFocus={(e) => {
            if (!errorMsg) {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#C0395B';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192, 57, 91, 0.12)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = errorMsg ? '#FEF2F2' : '#F2F1EF';
            e.currentTarget.style.borderColor = errorMsg ? '#DC2626' : 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {loadError && (
        <div style={warnBoxStyle}>
          <AlertTriangle size={14} color="#92400E" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{loadError}</span>
        </div>
      )}

      {hint && !errorMsg && !loadError && <p style={hintStyle}>{hint}</p>}
      {errorMsg && <p style={errorStyle}>{errorMsg}</p>}

      <div
        ref={mapDivRef}
        style={{
          ...mapStyle,
          display: value.lat && value.lng && !loadError ? 'block' : 'none',
        }}
      />

      {value.place_id && (
        <p style={confirmedStyle}>
          ✓ Ubicación confirmada con Google Maps
        </p>
      )}
    </div>
  );
}

const fieldWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const iconStyle: CSSProperties = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const baseInputStyle = (hasError: boolean): CSSProperties => ({
  width: '100%',
  padding: '11px 14px 11px 38px',
  borderRadius: '12px',
  border: `2px solid ${hasError ? '#DC2626' : 'transparent'}`,
  fontSize: '14px',
  background: hasError ? '#FEF2F2' : '#F2F1EF',
  color: '#111827',
  outline: 'none',
  transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
});

const mapStyle: CSSProperties = {
  marginTop: '6px',
  width: '100%',
  height: '180px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #E8E5E0',
};

const hintStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: 0,
  lineHeight: 1.4,
};

const errorStyle: CSSProperties = {
  fontSize: '12px',
  color: '#DC2626',
  margin: 0,
  fontWeight: 500,
  lineHeight: 1.4,
};

const warnBoxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: '#FEF7E6',
  color: '#92400E',
  fontSize: '12px',
  lineHeight: 1.45,
  border: '1px solid #FCE7B0',
};

const confirmedStyle: CSSProperties = {
  fontSize: '12px',
  color: '#16A34A',
  margin: 0,
  fontWeight: 500,
};
