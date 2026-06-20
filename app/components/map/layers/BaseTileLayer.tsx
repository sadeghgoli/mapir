'use client';

import dynamic from 'next/dynamic';

// Import پویای TileLayer
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

export default function BaseTileLayer() {
    return (
        <TileLayer
            url="https://osm.sabzevar.ir:4443/tile/raster/{z}/{x}/{y}.png"
            // url="https://osm.sabzevar.ir:4443/tile/raster/{z}/{x}/{y}.png"
            attribution=''
            maxZoom={19}
            minZoom={1}
        />
    );
}