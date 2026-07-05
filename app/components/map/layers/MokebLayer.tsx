'use client';

import { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import MokebModal from '../overlays/MokebModal';

interface MokebItem {
    id: string;
    name: string;
    description: string;
    address: string;
    pos: [number, number];
    capacity?: string;
    services?: string;
}

const mokebData: MokebItem[] = [
    {
        id: 'm1',
        name: 'موکب امام رضا (ع)',
        description: 'موکب پذیرایی و اسکان زائرین امام رضا علیه السلام با امکانات کامل رفاهی',
        address: 'بلوار امام رضا، نبش خیابان طبرسی',
        pos: [36.2135, 57.6665],
        capacity: '۳۰۰ نفر',
        services: 'پذیرایی، اسکان، اینترنت رایگان',
    },
    {
        id: 'm2',
        name: 'موکب حضرت ابوالفضل (ع)',
        description: 'موکب خدمت‌رسانی به زائرین با ارائه خدمات فرهنگی و پذیرایی',
        address: 'میدان ابوالفضل، خیابان شهید بهشتی',
        pos: [36.2105, 57.6685],
        capacity: '۲۰۰ نفر',
        services: 'پذیرایی، کتابخانه، نمازخانه',
    },
    {
        id: 'm3',
        name: 'موکب امام حسین (ع)',
        description: 'موکب اسکان موقت زائرین با امکانات خوابگاهی و سرویس بهداشتی',
        address: 'بلوار امام حسین، خیابان ۱۵ خرداد',
        pos: [36.2150, 57.6645],
        capacity: '۴۵۰ نفر',
        services: 'اسکان، پذیرایی، بهداشت',
    },
    {
        id: 'm4',
        name: 'موکب حضرت فاطمه (س)',
        description: 'موکب خواهران با امکانات ویژه بانوان',
        address: 'خیابان دانشگاه، روبروی پارک شهر',
        pos: [36.2080, 57.6670],
        capacity: '۲۵۰ نفر',
        services: 'اسکان خواهران، مهدکودک، مشاوره',
    },
    {
        id: 'm5',
        name: 'موکب امام زمان (عج)',
        description: 'موکب فرهنگی و پذیرایی با برنامه‌های مذهبی و آموزشی',
        address: 'میدان امام خمینی، جنب مسجد جامع',
        pos: [36.2118, 57.6702],
        capacity: '۳۵۰ نفر',
        services: 'پذیرایی، سخنرانی، نمایشگاه',
    },
    {
        id: 'm6',
        name: 'موکب شهدای گمنام',
        description: 'موکب اسکان و پذیرایی ویژه ایام محرم و صفر',
        address: 'بلوار شهدا، نبش کوچه ۱۲',
        pos: [36.2140, 57.6688],
        capacity: '۱۸۰ نفر',
        services: 'اسکان، پذیرایی، ایستگاه صلواتی',
    },
];

function makeIcon() {
    return divIcon({
        className: '',
        html: `<div style="
            width: 45px; 
            height: 45px;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            overflow: hidden;
            display: flex; 
            align-items: center; 
            justify-content: center;
            background: white;
        ">
            <img 
                src="/images/logo-bar.webp" 
                alt="موکب" 
                style="
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover;
                "
            />
        </div>`,
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5],
    });
}

export default function MokebLayer() {
    const [selected, setSelected] = useState<MokebItem | null>(null);

    const handleClick = (item: MokebItem) => {
        setSelected(item);
    };

    return (
        <>
            {mokebData.map((item) => (
                <Marker
                    key={item.id}
                    position={item.pos}
                    icon={makeIcon()}
                    eventHandlers={{
                        click: () => handleClick(item),
                    }}
                >
                    <Popup>
                        <div style={{ textAlign: 'center', fontFamily: 'IRANSans, sans-serif', minWidth: 150 }}>
                            <strong style={{ fontSize: 14, color: '#333' }}>{item.name}</strong>
                            <p style={{ fontSize: 11, margin: '6px 0 0', color: '#666' }}>{item.description}</p>
                            <button
                                onClick={() => handleClick(item)}
                                style={{
                                    marginTop: 8,
                                    padding: '4px 16px',
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    cursor: 'pointer',
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
                onClose={() => setSelected(null)}
                data={selected}
            />
        </>
    );
}