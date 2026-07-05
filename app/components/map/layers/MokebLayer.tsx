'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { updateUrl, getUrlParams } from '@/app/utils/urlManager';
import MokebModal from '../overlays/MokebModal';

interface ApiMokeb {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    status: number;
    submittedByName: string;
    submittedAt: string;
    visitCount: number;
}

interface ApiResponse {
    success: boolean;
    data: ApiMokeb[];
    totalCount: number;
}

function makeIcon(color: string) {
    return divIcon({
        className: '',
        html: `<div style="
            width: 45px; height: 45px;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            overflow: hidden;
            display: flex; align-items: center; justify-content: center;
        ">
            <img 
                src="/images/logo-bar.webp" 
                alt="موکب" 
                style="width: 100%; height: 100%; object-fit: cover;"
            />
        </div>
        <div style="
            position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
            width: 10px; height: 10px; border-radius: 50%;
            background: ${color}; border: 2px solid white;
        "></div>`,
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5],
    });
}

export default function MokebLayer() {
    const map = useMap();
    const [points, setPoints] = useState<ApiMokeb[]>([]);
    const [selected, setSelected] = useState<ApiMokeb | null>(null);
    const [loading, setLoading] = useState(true);
    const initDone = useRef(false);

    const urlMokebId = typeof window !== 'undefined'
        ? getUrlParams().mokebId
        : undefined;

    const openMokeb = (item: ApiMokeb) => {
        setSelected(item);
        updateUrl({ mokebId: item.id });
        map.setView([item.latitude, item.longitude], 18, { animate: true, duration: 1 });
    };

    useEffect(() => {
        fetch('/api/map-point/api/MapPoint?page=1&pageSize=50')
            .then(res => res.json())
            .then((data: ApiResponse) => {
                if (data.success) {
                    setPoints(data.data);
                    if (urlMokebId && !initDone.current) {
                        const found = data.data.find(p => p.id === urlMokebId);
                        if (found) {
                            initDone.current = true;
                            setSelected(found);
                            map.setView([found.latitude, found.longitude], 18, { animate: false });
                        }
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCloseModal = () => {
        setSelected(null);
        updateUrl({ mokebId: null });
    };

    if (loading || points.length === 0) return null;

    return (
        <>
            {points.map((item) => (
                <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={makeIcon(item.categoryColor || '#ff6600')}
                    eventHandlers={{ click: () => openMokeb(item) }}
                >
                    <Popup>
                        <div style={{ textAlign: 'center', fontFamily: 'IRANSans, sans-serif', minWidth: 150 }}>
                            <strong style={{ fontSize: 14, color: '#333' }}>{item.title}</strong>
                            <p style={{ fontSize: 11, margin: '6px 0 0', color: '#666' }}>{item.description}</p>
                            <button
                                onClick={() => openMokeb(item)}
                                style={{
                                    marginTop: 8, padding: '4px 16px',
                                    background: '#2563eb', color: 'white',
                                    border: 'none', borderRadius: 6,
                                    fontSize: 12, cursor: 'pointer',
                                }}
                            >
                                اطلاعات بیشتر
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}

            <MokebModal
                isOpen={!!selected}
                onClose={handleCloseModal}
                data={selected}
            />
        </>
    );
}
