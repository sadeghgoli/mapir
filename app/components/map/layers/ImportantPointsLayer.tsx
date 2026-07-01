'use client';

import { divIcon } from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

const points = [
    {
        name: 'پارک ملت',
        desc: 'بوستان بزرگ ملت، فضای سبز و تفریحی',
        pos: [36.2130, 57.6650] as [number, number],
        color: '#2ecc71',
    },
    {
        name: 'بیمارستان مبینی',
        desc: 'بیمارستان تخصصی مبینی سبزوار',
        pos: [36.2100, 57.6690] as [number, number],
        color: '#e74c3c',
    },
    {
        name: 'دانشگاه آزاد',
        desc: 'دانشگاه آزاد اسلامی واحد سبزوار',
        pos: [36.2075, 57.6660] as [number, number],
        color: '#3498db',
    },
    {
        name: 'فرهنگسرا',
        desc: 'فرهنگسرای شهر سبزوار',
        pos: [36.2150, 57.6680] as [number, number],
        color: '#f39c12',
    },
    {
        name: 'کتابخانه مرکزی',
        desc: 'کتابخانه مرکزی سبزوار',
        pos: [36.2110, 57.6700] as [number, number],
        color: '#9b59b6',
    },
];

export default function ImportantPointsLayer() {
    return (
        <>
            {points.map((pt) => {
                const icon = divIcon({
                    className: '',
                    html: `<div style="
                        width: 20px; height: 20px;
                        background: ${pt.color};
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });
                return (
                    <Marker key={pt.name} position={pt.pos} icon={icon}>
                        <Popup>
                            <div style={{ textAlign: 'center', fontFamily: 'IRANSans, sans-serif' }}>
                                <strong style={{ fontSize: 14 }}>{pt.name}</strong>
                                <p style={{ fontSize: 12, margin: '4px 0 0', color: '#666' }}>{pt.desc}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}
