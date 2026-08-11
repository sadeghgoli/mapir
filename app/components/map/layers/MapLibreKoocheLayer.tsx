'use client';

import { useEffect, useRef } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre, useStyleLoaded } from '@/app/contexts/MapLibreMapContext';
import { alleyways, findAlleywayByName } from '@/app/constants/alleyways';
import { getFirstPoint, setPoints } from '@/app/utils/urlManager';

const SOURCE_ID = 'kooche-points';
const CIRCLE_LAYER = 'kooche-circles';
const CIRCLE_HIT_LAYER = 'kooche-circles-hit';
const LABEL_LAYER = 'kooche-labels';
const SELECTED_LAYER = 'kooche-selected';

const COLOR = '#0F766E';
const COLOR_SELECTED = '#0D9488';
const STROKE = '#FFFFFF';

function flyToAlley(map: maplibregl.Map, name: string) {
    const alley = findAlleywayByName(name);
    if (!alley) return;
    map.flyTo({ center: [alley.lng, alley.lat], zoom: 19, duration: 900 });
}

function setSelectedFilter(map: maplibregl.Map, selectedName: string | null) {
    if (!map.getLayer(SELECTED_LAYER)) return;
    map.setFilter(SELECTED_LAYER, selectedName
        ? ['==', ['get', 'name'], selectedName]
        : ['==', ['get', 'name'], '']
    );
}

export default function MapLibreKoocheLayer() {
    const map = useMapLibre();
    const styleLoaded = useStyleLoaded();
    const selectedRef = useRef<string | null>(null);
    const initDone = useRef(false);

    useEffect(() => {
        if (!map || !styleLoaded) return;

        const features = alleyways.map((alley, i) => ({
            type: 'Feature' as const,
            properties: {
                name: alley.name,
                number: i + 1,
                label: String(i + 1),
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [alley.lng, alley.lat],
            },
        }));

        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features,
            },
        });

        // Large invisible hit area
        map.addLayer({
            id: CIRCLE_HIT_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 18,
                'circle-opacity': 0,
            },
        });

        // Soft outer glow
        map.addLayer({
            id: 'kooche-glow',
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 14,
                'circle-color': COLOR,
                'circle-opacity': 0.18,
            },
        });

        // Main marker
        map.addLayer({
            id: CIRCLE_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 8,
                'circle-color': COLOR,
                'circle-stroke-width': 2.5,
                'circle-stroke-color': STROKE,
                'circle-opacity': 0.95,
            },
        });

        // Selected ring (hidden until filter matches)
        map.addLayer({
            id: SELECTED_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['==', ['get', 'name'], ''],
            paint: {
                'circle-radius': 13,
                'circle-color': 'transparent',
                'circle-stroke-width': 3,
                'circle-stroke-color': COLOR_SELECTED,
                'circle-opacity': 1,
            },
        });

        // Number + name labels
        map.addLayer({
            id: LABEL_LAYER,
            type: 'symbol',
            source: SOURCE_ID,
            layout: {
                'text-field': ['concat', 'جوانمرد ', ['get', 'label']],
                'text-size': 11,
                'text-offset': [0, -1.6],
                'text-anchor': 'bottom',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'symbol-sort-key': ['get', 'number'],
            },
            paint: {
                'text-color': '#134E4A',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 1.8,
            },
        });

        type LayerClickEvent = maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] };

        const selectAlley = (name: string, fly: boolean) => {
            selectedRef.current = name;
            setPoints('kooche', [name]);
            setSelectedFilter(map, name);
            if (fly) flyToAlley(map, name);
        };

        const onClick = (e: LayerClickEvent) => {
            e.originalEvent.stopPropagation();
            const name = e.features?.[0]?.properties?.name as string | undefined;
            if (!name) return;
            selectAlley(name, true);
        };
        const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
        const onLeave = () => { map.getCanvas().style.cursor = ''; };

        map.on('click', CIRCLE_HIT_LAYER, onClick);
        map.on('mouseenter', CIRCLE_HIT_LAYER, onEnter);
        map.on('mouseleave', CIRCLE_HIT_LAYER, onLeave);

        if (!initDone.current) {
            const urlKooche = getFirstPoint('kooche');
            if (urlKooche && findAlleywayByName(urlKooche)) {
                initDone.current = true;
                selectedRef.current = urlKooche;
                setSelectedFilter(map, urlKooche);
                const params = new URLSearchParams(window.location.search);
                if (!(params.has('lat') && params.has('lng'))) {
                    const alley = findAlleywayByName(urlKooche)!;
                    map.jumpTo({ center: [alley.lng, alley.lat], zoom: 19 });
                }
            }
        } else if (selectedRef.current) {
            setSelectedFilter(map, selectedRef.current);
        }

        return () => {
            map.off('click', CIRCLE_HIT_LAYER, onClick);
            map.off('mouseenter', CIRCLE_HIT_LAYER, onEnter);
            map.off('mouseleave', CIRCLE_HIT_LAYER, onLeave);

            [
                LABEL_LAYER,
                SELECTED_LAYER,
                CIRCLE_LAYER,
                'kooche-glow',
                CIRCLE_HIT_LAYER,
            ].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [map, styleLoaded]);

    return null;
}
