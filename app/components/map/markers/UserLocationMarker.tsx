'use client';

import { CircleMarker } from 'react-leaflet';

interface UserLocationMarkerProps {
    position: [number, number];
}

export default function UserLocationMarker({ position }: UserLocationMarkerProps) {
    return (
        <>
            <CircleMarker
                center={position}
                radius={12}
                pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.3,
                    weight: 2,
                }}
            />
            <CircleMarker
                center={position}
                radius={6}
                pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    weight: 2,
                }}
                className="user-location-pulse"
            />
            <style jsx global>{`
                .user-location-pulse {
                    animation: pulse-location 2s ease-in-out infinite;
                }
                @keyframes pulse-location {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </>
    );
}
