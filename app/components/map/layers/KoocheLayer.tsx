'use client';

import { CircleMarker, Tooltip } from 'react-leaflet';
import { alleyways } from '@/app/constants/alleyways';

export default function KoocheLayer() {
    return (
        <>
            {alleyways.map((alley) => (
                <CircleMarker
                    key={alley.name}
                    center={[alley.lat, alley.lng]}
                    radius={8}
                    pathOptions={{
                        color: '#FFFFFF',
                        weight: 2.5,
                        fillColor: '#0F766E',
                        fillOpacity: 0.95,
                    }}
                >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                        <span className="text-xs font-bold whitespace-nowrap">{alley.name}</span>
                    </Tooltip>
                </CircleMarker>
            ))}
        </>
    );
}
