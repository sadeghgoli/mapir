'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { mapController } from '@/app/utils/mapController';
import { mapStyleUrl, transformMapRequest } from '@/app/utils/mapGateway';

interface MapLibreMapContextType {
    map: maplibregl.Map | null;
    styleLoaded: boolean;
}

const MapLibreMapContext = createContext<MapLibreMapContextType>({ map: null, styleLoaded: false });

export function useMapLibre(): maplibregl.Map | null {
    return useContext(MapLibreMapContext).map;
}

export function useStyleLoaded(): boolean {
    return useContext(MapLibreMapContext).styleLoaded;
}

interface MapLibreProviderProps {
    children: ReactNode;
    center: [number, number];
    zoom: number;
    maxZoom?: number;
    minZoom?: number;
}

let rtlPluginLoaded = false;

export function MapLibreProvider({ children, center, zoom, maxZoom = 18, minZoom = 0 }: MapLibreProviderProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [styleLoaded, setStyleLoaded] = useState(false);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        if (!rtlPluginLoaded) {
            rtlPluginLoaded = true;
            maplibregl.setRTLTextPlugin?.(
                '/js/mapbox-gl-rtl-text.js',
                () => {},
                () => {}
            );
        }

        const instance = new maplibregl.Map({
            container: mapContainerRef.current,
            style: mapStyleUrl(),
            center: [center[1], center[0]],
            zoom,

            pitch: 60,
            bearing: 0,

            attributionControl: false,

            dragRotate: false,
            touchPitch: false,

            maxZoom,
            minZoom,

            transformRequest: (url: string, resourceType?: string) =>
                transformMapRequest(url, resourceType),
        });
        
        mapRef.current = instance;
        setMap(instance);

        instance.on('load', () => {
            if (mapRef.current === instance) {
                setStyleLoaded(true);
            }
        });

        instance.on('error', (e) => {
            console.error('Map error:', e.error ?? e);
        });

        return () => {
            instance.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!map) return;
        mapController.flyTo = (lat: number, lng: number, zoom?: number) => {
            map.flyTo({
                center: [lng, lat],
                zoom: zoom ?? map.getZoom(),
                duration: 1000,
            });
        };
        return () => {
            mapController.flyTo = null;
        };
    }, [map]);

    return (
        <MapLibreMapContext.Provider value={{ map, styleLoaded }}>
            <div
                ref={mapContainerRef}
                className="w-full h-full z-0"
                style={{ background: '#f0f0f0' }}
            />
            {children}
        </MapLibreMapContext.Provider>
    );
}
