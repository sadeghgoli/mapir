'use client';

import { useEffect, useRef, useState } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre, useStyleLoaded } from '@/app/contexts/MapLibreMapContext';
import { getIdParam, setIdParam } from '@/app/utils/urlManager';
import { fetchKoocheMapPoints, type MapPoint } from '@/app/services/mapPoint.service';

const SOURCE_ID = 'kooche-points';
const CIRCLE_LAYER = 'kooche-circles';
const CIRCLE_HIT_LAYER = 'kooche-circles-hit';
const GLOW_LAYER = 'kooche-glow';
const LABEL_LAYER = 'kooche-labels';
const SELECTED_LAYER = 'kooche-selected';

const COLOR = '#0F766E';
const COLOR_SELECTED = '#0D9488';
const STROKE = '#FFFFFF';
const SHORT_LINK_POLL_MS = 2000;
const SHORT_LINK_POLL_ATTEMPTS = 5;

function toFeatures(points: MapPoint[]) {
    return points.map((point, i) => ({
        type: 'Feature' as const,
        properties: {
            id: point.id,
            name: point.title,
            color: point.categoryColor || COLOR,
            number: i + 1,
        },
        geometry: {
            type: 'Point' as const,
            coordinates: [point.longitude, point.latitude],
        },
    }));
}

function findPoint(points: MapPoint[], id: string | null): MapPoint | undefined {
    if (!id) return undefined;
    const lower = id.toLowerCase();
    return points.find(p => p.id.toLowerCase() === lower);
}

function setSelectedFilter(map: maplibregl.Map, selectedId: string | null) {
    if (!map.getLayer(SELECTED_LAYER)) return;
    map.setFilter(SELECTED_LAYER, selectedId
        ? ['==', ['get', 'id'], selectedId]
        : ['==', ['get', 'id'], '']
    );
}

export default function MapLibreKoocheLayer() {
    const map = useMapLibre();
    const styleLoaded = useStyleLoaded();
    const [points, setPoints] = useState<MapPoint[]>([]);
    const selectedRef = useRef<string | null>(null);
    const initDone = useRef(false);
    const pointsRef = useRef<MapPoint[]>([]);
    pointsRef.current = points;

    useEffect(() => {
        let cancelled = false;
        let pollTimer: ReturnType<typeof setTimeout> | undefined;

        async function load() {
            try {
                const data = await fetchKoocheMapPoints();
                if (cancelled) return;
                pointsRef.current = data;
                setPoints(data);

                let attempts = 0;
                const poll = async () => {
                    if (cancelled || attempts >= SHORT_LINK_POLL_ATTEMPTS) return;
                    if (!pointsRef.current.some(p => !p.shortVisitLink)) return;
                    attempts += 1;
                    try {
                        const refreshed = await fetchKoocheMapPoints();
                        if (cancelled) return;
                        pointsRef.current = refreshed;
                        setPoints(refreshed);
                    } catch (err) {
                        console.error(err);
                    }
                    pollTimer = setTimeout(poll, SHORT_LINK_POLL_MS);
                };

                if (data.some(p => !p.shortVisitLink)) {
                    pollTimer = setTimeout(poll, SHORT_LINK_POLL_MS);
                }
            } catch (err) {
                console.error(err);
            }
        }

        load();
        return () => {
            cancelled = true;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, []);

    useEffect(() => {
        if (!map || !styleLoaded) return;

        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: toFeatures(pointsRef.current),
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
            id: GLOW_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 14,
                'circle-color': ['coalesce', ['get', 'color'], COLOR],
                'circle-opacity': 0.18,
            },
        });

        map.addLayer({
            id: CIRCLE_LAYER,
            type: 'circle',
            source: SOURCE_ID,
            paint: {
                'circle-radius': 8,
                'circle-color': ['coalesce', ['get', 'color'], COLOR],
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
                'text-field': ['get', 'name'],
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
            setIdParam(id);
            setSelectedFilter(map, id);
            if (!fly) return;
            const alley = findPoint(pointsRef.current, id);
            if (!alley) return;
            map.flyTo({ center: [alley.longitude, alley.latitude], zoom: 19, duration: 900 });
        };

        const onClick = (e: LayerClickEvent) => {
            e.originalEvent.stopPropagation();
            const id = e.features?.[0]?.properties?.id as string | undefined;
            if (!id) return;
            selectAlley(id, true);
        };
        const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
        const onLeave = () => { map.getCanvas().style.cursor = ''; };
        const syncSelectedFromUrl = () => {
            const id = getIdParam();
            selectedRef.current = id;
            setSelectedFilter(map, id);
        };

        map.on('click', CIRCLE_HIT_LAYER, onClick);
        map.on('mouseenter', CIRCLE_HIT_LAYER, onEnter);
        map.on('mouseleave', CIRCLE_HIT_LAYER, onLeave);
        window.addEventListener('popstate', syncSelectedFromUrl);
        window.addEventListener('mapurlchange', syncSelectedFromUrl);

        return () => {
            map.off('click', CIRCLE_HIT_LAYER, onClick);
            map.off('mouseenter', CIRCLE_HIT_LAYER, onEnter);
            map.off('mouseleave', CIRCLE_HIT_LAYER, onLeave);
            window.removeEventListener('popstate', syncSelectedFromUrl);
            window.removeEventListener('mapurlchange', syncSelectedFromUrl);

            [
                LABEL_LAYER,
                SELECTED_LAYER,
                CIRCLE_LAYER,
                GLOW_LAYER,
                CIRCLE_HIT_LAYER,
            ].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [map, styleLoaded]);

    useEffect(() => {
        if (!map || !styleLoaded) return;
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: toFeatures(points),
        });

        if (!initDone.current) {
            const urlId = getIdParam();
            const alley = findPoint(points, urlId);
            if (alley) {
                initDone.current = true;
                selectedRef.current = alley.id;
                setSelectedFilter(map, alley.id);
                map.jumpTo({ center: [alley.longitude, alley.latitude], zoom: 19 });
            }
        } else if (selectedRef.current) {
            setSelectedFilter(map, selectedRef.current);
        }
    }, [map, styleLoaded, points]);

    return null;
}
