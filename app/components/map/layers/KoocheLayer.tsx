'use client';

import { Polyline, Tooltip } from 'react-leaflet';
import { alleyways } from '@/app/constants/alleyways';

const COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2980b9'];

export default function KoocheLayer() {
    return (
        <>
            {alleyways.map((alley, i) => (
                <Polyline
                    key={alley.name}
                    positions={alley.positions}
                    pathOptions={{
                        color: COLORS[i % COLORS.length],
                        weight: 3,
                        opacity: 0.85,
                        dashArray: '8 6',
                    }}
                >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                        <span className="text-xs font-bold whitespace-nowrap">{alley.name}</span>
                    </Tooltip>
                </Polyline>
            ))}
        </>
    );
}
