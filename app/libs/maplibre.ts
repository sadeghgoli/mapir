type MaplibreNamespace = typeof import('maplibre-gl');

const globalAny = (typeof window !== 'undefined' ? (window as unknown as { maplibregl?: MaplibreNamespace }) : null);

export const maplibregl: MaplibreNamespace =
    (globalAny && globalAny.maplibregl) || ({} as MaplibreNamespace);
