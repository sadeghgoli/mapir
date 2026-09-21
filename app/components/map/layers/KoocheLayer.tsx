'use client';

import { useEffect, useState } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { fetchKoocheMapPoints, type MapPoint } from '@/app/services/mapPoint.service';

const FALLBACK_COLOR = '#0F766E';

export default function KoocheLayer() {
    const [points, setPoints] = useState<MapPoint[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetchKoocheMapPoints()
            .then(data => {
                if (!cancelled) setPoints(data);
            })
            .catch(console.error);
        return () => { cancelled = true; };
    }, []);

    return (
        <>
            {points.map((alley) => (
                <CircleMarker
                    key={alley.id}
                    center={[alley.latitude, alley.longitude]}
                    radius={8}
                    pathOptions={{
                        color: '#FFFFFF',
                        weight: 2.5,
                        fillColor: alley.categoryColor || FALLBACK_COLOR,
                        fillOpacity: 0.95,
                    }}
                >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                        <span className="text-xs font-bold whitespace-nowrap">{alley.title}</span>
                    </Tooltip>
                </CircleMarker>
            ))}
        </>
    );
}
