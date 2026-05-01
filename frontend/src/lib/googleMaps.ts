// Minimal Google Maps typings for the bits we actually use.
// We avoid @types/google.maps to keep dependencies light.
export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GooglePlaceGeometry {
  location?: { lat: () => number; lng: () => number };
}

export interface GooglePlaceResult {
  place_id?: string;
  formatted_address?: string;
  name?: string;
  geometry?: GooglePlaceGeometry;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GoogleAutocomplete {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => GooglePlaceResult;
  setFields: (fields: string[]) => void;
  setComponentRestrictions: (r: { country: string | string[] }) => void;
}

export interface GoogleMapInstance {
  setCenter: (pos: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
}

export interface GoogleMarker {
  setPosition: (pos: GoogleLatLngLiteral) => void;
  setMap: (map: GoogleMapInstance | null) => void;
}

export interface GoogleNs {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: { center: GoogleLatLngLiteral; zoom: number; disableDefaultUI?: boolean; clickableIcons?: boolean }
    ) => GoogleMapInstance;
    Marker: new (opts: { position: GoogleLatLngLiteral; map: GoogleMapInstance }) => GoogleMarker;
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: {
          fields?: string[];
          componentRestrictions?: { country: string | string[] };
          types?: string[];
        }
      ) => GoogleAutocomplete;
    };
    event: {
      clearInstanceListeners: (instance: unknown) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleNs;
  }
}

let loaderPromise: Promise<GoogleNs> | null = null;

// Acepta cualquiera de los dos nombres por compatibilidad con configs previas.
const RAW_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ??
  (import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY as string | undefined);
export const GOOGLE_MAPS_API_KEY = RAW_KEY?.trim() || undefined;

let diagnosticPrinted = false;
function printDiagnosticOnce(): void {
  if (diagnosticPrinted) return;
  diagnosticPrinted = true;
  const viteEnvKeys = Object.keys(import.meta.env)
    .filter((k) => k.startsWith('VITE_'))
    .sort();
  // eslint-disable-next-line no-console
  console.warn(
    '[Parche · Google Maps] VITE_GOOGLE_MAPS_API_KEY no está definida.\n' +
      `  → mode: ${import.meta.env.MODE}\n` +
      `  → VITE_ vars cargadas: ${viteEnvKeys.join(', ') || '(ninguna)'}\n` +
      '  → Si la agregaste recién a frontend/.env.local, reinicia el dev server (matar todos los procesos `vite` y volver a `npm run dev`).'
  );
}

export function isGoogleMapsConfigured(): boolean {
  if (!GOOGLE_MAPS_API_KEY) {
    if (typeof window !== 'undefined') printDiagnosticOnce();
    return false;
  }
  return true;
}

export function loadGoogleMaps(): Promise<GoogleNs> {
  if (loaderPromise) return loaderPromise;

  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    loaderPromise = Promise.resolve(window.google);
    return loaderPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error('Falta VITE_GOOGLE_MAPS_API_KEY en el archivo .env.local del frontend')
    );
  }

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = `__parcheGmapsCb_${Date.now()}`;
    const w = window as unknown as Record<string, unknown>;
    w[callbackName] = () => {
      delete w[callbackName];
      if (window.google?.maps?.places) {
        resolve(window.google);
      } else {
        loaderPromise = null;
        reject(new Error('Google Maps cargó pero falta la librería places'));
      }
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: 'places',
      callback: callbackName,
      loading: 'async',
      v: 'weekly',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loaderPromise = null;
      delete w[callbackName];
      reject(new Error('No se pudo cargar Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
