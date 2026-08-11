'use client';

import { useEffect, useRef } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre, useStyleLoaded } from '@/app/contexts/MapLibreMapContext';
import { alleyways, findAlleywayByName, getAlleywayMidpoint } from '@/app/constants/alleyways';
import { getFirstPoint, setPoints } from '@/app/utils/urlManager';

const COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2980b9'];

const SOURCE_PREFIX = 'kooche-source-';
const LAYER_PREFIX = 'kooche-layer-';
const HIT_PREFIX = 'kooche-hit-';
const LABEL_SOURCE = 'kooche-label-source';
const LABEL_LAYER = 'kooche-labels';

function fitAlley(map: maplibregl.Map, name: string) {
    const alley = findAlleywayByName(name);
    if (!alley) return;

    const bounds = new maplibregl.LngLatBounds();
    alley.positions.forEach(([lat, lng]) => bounds.extend([lng, lat]));
    map.fitBounds(bounds, { padding: 80, maxZoom: 19, duration: 1000 });
}

function setAlleyHighlight(map: maplibregl.Map, selectedName: string | null) {
    alleyways.forEach((_, i) => {
        const layerId = `${LAYER_PREFIX}${i}`;
        if (!map.getLayer(layerId)) return;
        const isSelected = selectedName !== null && alleyways[i].name === selectedName;
        map.setPaintProperty(layerId, 'line-width', isSelected ? 6 : 3);
        map.setPaintProperty(layerId, 'line-opacity', isSelected ? 1 : 0.85);
    });
}

export default function MapLibreKoocheLayer() {
    const map = useMapLibre();
    const styleLoaded = useStyleLoaded();
    const selectedRef = useRef<string | null>(null);
    const initDone = useRef(false);

    useEffect(() => {
        if (!map || !styleLoaded) return;

        const lineFeatures = alleyways.map((alley, i) => ({
            type: 'Feature' as const,
            properties: { name: alley.name, index: i },
            geometry: {
                type: 'LineString' as const,
                coordinates: alley.positions.map(p => [p[1], p[0]]),
            },
        }));

        const labelFeatures = alleyways.map((alley) => {
            const [lat, lng] = getAlleywayMidpoint(alley);
            return {
                type: 'Feature' as const,
                properties: { name: alley.name },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [lng, lat],
                },
            };
        });

        type LayerClickEvent = maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] };
        const clickHandlers: Array<{ layerId: string; handler: (e: LayerClickEvent) => void }> = [];
        const enterHandlers: Array<{ layerId: string; handler: () => void }> = [];
        const leaveHandlers: Array<{ layerId: string; handler: () => void }> = [];

        const selectAlley = (name: string, fly: boolean) => {
            selectedRef.current = name;
            setPoints('kooche', [name]);
            setAlleyHighlight(map, name);
            if (fly) fitAlley(map, name);
        };

        lineFeatures.forEach((feature, i) => {
            const sourceId = `${SOURCE_PREFIX}${i}`;
            const layerId = `${LAYER_PREFIX}${i}`;
            const hitId = `${HIT_PREFIX}${i}`;
            const color = COLORS[i % COLORS.length];

            map.addSource(sourceId, {
                type: 'geojson',
                data: feature,
            });

            // Wider invisible line for easier clicking
            map.addLayer({
                id: hitId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 16,
                    'line-opacity': 0,
                },
            });

            map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 3,
                    'line-opacity': 0.85,
                    'line-dasharray': [8, 6],
                },
            });

            const onClick = (e: LayerClickEvent) => {
                e.originalEvent.stopPropagation();
                const name = e.features?.[0]?.properties?.name as string | undefined;
                if (!name) return;
                selectAlley(name, true);
            };
            const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
            const onLeave = () => { map.getCanvas().style.cursor = ''; };

            map.on('click', hitId, onClick);
            map.on('mouseenter', hitId, onEnter);
            map.on('mouseleave', hitId, onLeave);

            clickHandlers.push({ layerId: hitId, handler: onClick });
            enterHandlers.push({ layerId: hitId, handler: onEnter });
            leaveHandlers.push({ layerId: hitId, handler: onLeave });
        });

        if (!map.getSource(LABEL_SOURCE)) {
            map.addSource(LABEL_SOURCE, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: labelFeatures,
                },
            });

            map.addLayer({
                id: LABEL_LAYER,
                type: 'symbol',
                source: LABEL_SOURCE,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-offset': [0, -1.5],
                    'text-anchor': 'bottom',
                },
                paint: {
                    'text-color': '#333',
                    'text-halo-color': '#fff',
                    'text-halo-width': 2,
                },
            });
        }

        // Restore selection from URL on first mount
        if (!initDone.current) {
            const urlKooche = getFirstPoint('kooche');
            if (urlKooche && findAlleywayByName(urlKooche)) {
                initDone.current = true;
                selectedRef.current = urlKooche;
                setAlleyHighlight(map, urlKooche);
                // Jump immediately if camera not already set by lat/lng; otherwise still highlight
                const params = new URLSearchParams(window.location.search);
                const hasCamera = params.has('lat') && params.has('lng');
                if (!hasCamera) {
                    const alley = findAlleywayByName(urlKooche)!;
                    const bounds = new maplibregl.LngLatBounds();
                    alley.positions.forEach(([lat, lng]) => bounds.extend([lng, lat]));
                    map.fitBounds(bounds, { padding: 80, maxZoom: 19, duration: 0 });
                }
            }
        } else if (selectedRef.current) {
            setAlleyHighlight(map, selectedRef.current);
        }

        return () => {
            clickHandlers.forEach(({ layerId, handler }) => map.off('click', layerId, handler));
            enterHandlers.forEach(({ layerId, handler }) => map.off('mouseenter', layerId, handler));
            leaveHandlers.forEach(({ layerId, handler }) => map.off('mouseleave', layerId, handler));

            alleyways.forEach((_, i) => {
                const sourceId = `${SOURCE_PREFIX}${i}`;
                const layerId = `${LAYER_PREFIX}${i}`;
                const hitId = `${HIT_PREFIX}${i}`;
                if (map.getLayer(hitId)) map.removeLayer(hitId);
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            });
            if (map.getLayer(LABEL_LAYER)) map.removeLayer(LABEL_LAYER);
            if (map.getSource(LABEL_SOURCE)) map.removeSource(LABEL_SOURCE);
        };
    }, [map, styleLoaded]);

    return null;
}
