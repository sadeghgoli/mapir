'use client';

import { useEffect, useRef } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre, useStyleLoaded } from '@/app/contexts/MapLibreMapContext';
import { alleyways, findAlleywayById } from '@/app/constants/alleyways';
import { getFirstPoint, setKoocheShareUrl } from '@/app/utils/urlManager';

const SOURCE_ID = 'kooche-points';
const CIRCLE_LAYER = 'kooche-circles';
const CIRCLE_HIT_LAYER = 'kooche-circles-hit';
const LABEL_LAYER = 'kooche-labels';
const SELECTED_LAYER = 'kooche-selected';

const COLOR = '#0F766E';
const COLOR_SELECTED = '#0D9488';
const STROKE = '#FFFFFF';

function flyToAlley(map: maplibregl.Map, id: string) {
    const alley = findAlleywayById(id);
    if (!alley) return;
    map.flyTo({ center: [alley.lng, alley.lat], zoom: 19, duration: 900 });
}

function setSelectedFilter(map: maplibregl.Map, selectedId: string | null) {
    if (!map.getLayer(SELECTED_LAYER)) return;
    const alley = selectedId ? findAlleywayById(selectedId) : undefined;
    map.setFilter(SELECTED_LAYER, alley
        ? ['==', ['get', 'id'], alley.id]
        : ['==', ['get', 'id'], '']
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
                id: alley.id,
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

        map.addLayer({
            id: CIRCLE_HIT_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 18,
                'circle-opacity': 0,
            },
        });

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

        map.addLayer({
            id: SELECTED_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            filter: ['==', ['get', 'id'], ''],
            paint: {
                'circle-radius': 13,
                'circle-color': 'transparent',
                'circle-stroke-width': 3,
                'circle-stroke-color': COLOR_SELECTED,
                'circle-opacity': 1,
            },
        });

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

        const selectAlley = (id: string, fly: boolean) => {
            selectedRef.current = id;
            setKoocheShareUrl(id);
            setSelectedFilter(map, id);
            if (fly) flyToAlley(map, id);
        };

        const onClick = (e: LayerClickEvent) => {
            e.originalEvent.stopPropagation();
            const id = e.features?.[0]?.properties?.id as string | undefined;
            if (!id) return;
            selectAlley(id, true);
        };
        const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
        const onLeave = () => { map.getCanvas().style.cursor = ''; };

        map.on('click', CIRCLE_HIT_LAYER, onClick);
        map.on('mouseenter', CIRCLE_HIT_LAYER, onEnter);
        map.on('mouseleave', CIRCLE_HIT_LAYER, onLeave);

        if (!initDone.current) {
            const urlKooche = getFirstPoint('kooche');
            const alley = urlKooche ? findAlleywayById(urlKooche) : undefined;
            if (alley) {
                initDone.current = true;
                selectedRef.current = alley.id;
                setSelectedFilter(map, alley.id);
                // Always center from id — camera params are not kept in share URLs
                map.jumpTo({ center: [alley.lng, alley.lat], zoom: 19 });
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
