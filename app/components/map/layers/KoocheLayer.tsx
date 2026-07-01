'use client';

import { Polyline, Tooltip } from 'react-leaflet';

const alleyways = [
    {
        name: 'کوچه گلستان',
        positions: [
            [36.2120, 57.6650],
            [36.2115, 57.6660],
            [36.2110, 57.6670],
            [36.2105, 57.6680],
        ] as [number, number][],
    },
    {
        name: 'کوچه بهار',
        positions: [
            [36.2110, 57.6660],
            [36.2115, 57.6650],
            [36.2125, 57.6640],
            [36.2130, 57.6635],
        ] as [number, number][],
    },
    {
        name: 'کوچه سعدی',
        positions: [
            [36.2090, 57.6670],
            [36.2095, 57.6675],
            [36.2100, 57.6680],
            [36.2105, 57.6685],
        ] as [number, number][],
    },
    {
        name: 'کوچه فردوسی',
        positions: [
            [36.2105, 57.6660],
            [36.2110, 57.6655],
            [36.2115, 57.6650],
        ] as [number, number][],
    },
    {
        name: 'کوچه مولوی',
        positions: [
            [36.2118, 57.6670],
            [36.2123, 57.6678],
            [36.2128, 57.6685],
        ] as [number, number][],
    },
    {
        name: 'کوچه حافظ',
        positions: [
            [36.2095, 57.6655],
            [36.2100, 57.6660],
            [36.2105, 57.6665],
        ] as [number, number][],
    },
];

const COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

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
