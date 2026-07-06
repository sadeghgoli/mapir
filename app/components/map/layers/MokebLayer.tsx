'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
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

const iconMap: Record<string, string> = {
    eskan: '/images/logo2.png',
    mokeb: '/images/logo1.png',
};

function makeIcon(categoryIcon: string) {
    const src = iconMap[categoryIcon] || '/images/logo2.png';
    return divIcon({
        className: '',
        html: `<div style="
            width: 50px; 
            overflow: hidden;
            display: flex; align-items: center; justify-content: center;
        ">
            <img 
                src="${src}" 
                alt="${categoryIcon}" 
                style="width: 100%; height: 100%; object-fit: cover;"
            />
        </div>
       `,
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5],
    });
}

const popupContent = (item: ApiMokeb) => `
    <div style="text-align:center;font-family:IRANSans,sans-serif;min-width:150px;direction:rtl">
        <strong style="font-size:14px;color:#333">${item.title}</strong>
        <p style="font-size:11px;margin:6px 0 0;color:#666">${item.description}</p>
    </div>`;

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
                    icon={makeIcon(item.categoryIcon)}
                    eventHandlers={{
                        mouseover: (e) => {
                            const marker = e.target;
                            if (!marker._popup) {
                                marker.bindPopup(popupContent(item), {
                                    closeButton: false,
                                    closeOnClick: false,
                                    className: 'mokeb-popup',
                                });
                            }
                            marker.openPopup();
                        },
                        mouseout: (e) => {
                            e.target.closePopup();
                        },
                        click: () => {
                            openMokeb(item);
                        },
                    }}
                />
            ))}

            <MokebModal
                isOpen={!!selected}
                onClose={handleCloseModal}
                data={selected}
            />
        </>
    );
}
