'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as maplibregl from 'maplibre-gl';
import { mapController } from '@/app/utils/mapController';

interface MapLibreMapContextType {
    map: maplibregl.Map | null;
}

const MapLibreMapContext = createContext<MapLibreMapContextType>({ map: null });

export function useMapLibre(): maplibregl.Map | null {
    return useContext(MapLibreMapContext).map;
}

interface MapLibreProviderProps {
    children: ReactNode;
    center: [number, number];
    zoom: number;
    maxZoom?: number;
    minZoom?: number;
}

let rtlPluginLoaded = false;

export function MapLibreProvider({ children, center, zoom, maxZoom = 19, minZoom = 1 }: MapLibreProviderProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        if (!rtlPluginLoaded) {
            rtlPluginLoaded = true;
            maplibregl.setRTLTextPlugin?.(
                'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js',
                () => {},
                () => {}
            );
        }

        const style: maplibregl.Style = {
            version: 8,
            sources: {
                'osm-tiles': {
                    type: 'raster',
                    tiles: ['https://osm.sabzevar.ir:4443/tile/raster/{z}/{x}/{y}.png'],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'osm-tiles',
                    type: 'raster',
                    source: 'osm-tiles',
                    minzoom: 1,
                    maxzoom: 19,
                },
            ],
        };

        const instance = new maplibregl.Map({
            container: mapContainerRef.current,
            style,
            center: [center[1], center[0]],
            zoom,
            attributionControl: false,
            dragRotate: false,
            touchPitch: false,
            maxZoom,
            minZoom,
        });

        instance.addControl(new maplibregl.NavigationControl({ showZoomButtons: false }), 'top-left');

        mapRef.current = instance;
        setMap(instance);

        instance.on('load', () => {
            setMap(instance);
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
        <MapLibreMapContext.Provider value={{ map }}>
            <div
                ref={mapContainerRef}
                className="w-full h-full z-0"
                style={{ background: '#f0f0f0' }}
            />
            {children}
        </MapLibreMapContext.Provider>
    );
}
