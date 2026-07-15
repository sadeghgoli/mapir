'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Copy, MapPin } from 'lucide-react';

export default function PointContextMenu() {
    const map = useMap();
    const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
    const [pixel, setPixel] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const latlngRef = useRef(latlng);
    latlngRef.current = latlng;

    const updatePixel = useCallback(() => {
        if (!latlngRef.current) return;
        const p = map.latLngToContainerPoint([latlngRef.current.lat, latlngRef.current.lng]);
        setPixel({ x: p.x, y: p.y });
    }, [map]);

    useMapEvents({
        click: (e) => {
            setLatlng({ lat: e.latlng.lat, lng: e.latlng.lng });
            const p = map.latLngToContainerPoint(e.latlng);
            setPixel({ x: p.x, y: p.y });
            setVisible(true);
            setCopied(false);
        },
        move: () => { updatePixel(); },
        zoom: () => { updatePixel(); },
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setVisible(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleCopy = useCallback(async () => {
        if (!latlng) return;
        const text = `${latlng.lat}, ${latlng.lng}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [latlng]);

    if (!visible || !latlng) return null;

    return (
        <div
            ref={menuRef}
            style={{
                position: 'absolute',
                left: pixel.x,
                top: pixel.y - 8,
                transform: 'translate(-50%, -100%)',
                zIndex: 1001,
            }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[200px] animate-fadeIn"
        >
            <div className="px-4 pb-2 mb-1 border-b border-gray-100">
                <p className="text-xs text-gray-400 font-mono" dir="ltr">
                    {latlng.lat.toFixed(6)}, {latlng.lng.toFixed(6)}
                </p>
            </div>

            <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-right"
            >
                <Copy size={16} className="shrink-0" />
                <span>{copied ? 'کپی شد ✓' : 'کپی مختصات نقطه انتخاب شده'}</span>
            </button>
        </div>
    );
}
