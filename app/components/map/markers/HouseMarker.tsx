'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import پویای Marker از react-leaflet
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

export default function HouseMarker() {
    const [customIcon, setCustomIcon] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // ایجاد آیکون فقط در کلاینت
        import('leaflet').then((L) => {
            const icon = L.divIcon({
                className: '',
                html: `
                    <div class="marker-house">
                        <div class="marker-house-inner"></div>
                    </div>
                `,
                iconSize: [40, 40],
            });
            setCustomIcon(icon);
        });
    }, []);

    if (!isMounted || !customIcon) {
        return null; // یا یک placeholder
    }

    return (
        <Marker
            position={[35.6888, 51.3845]}
            icon={customIcon}
        />
    );
}