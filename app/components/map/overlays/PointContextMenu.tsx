'use client';

import { useState, useCallback, useEffect } from 'react';
import { Copy, X, MapPin } from 'lucide-react';
import { mapController } from '@/app/utils/mapController';

export default function PointContextMenu() {
    const [latlng, setLatlng] = useState<{ lat: number; lng: number } | null>(null);
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        return mapController.addClickListener((lat, lng) => {
            setLatlng({ lat, lng });
            setVisible(true);
            setCopied(false);
        });
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setVisible(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleCopy = useCallback(() => {
        if (!latlng) return;
        const text = `${latlng.lat}, ${latlng.lng}`;
        try { navigator.clipboard.writeText(text); } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [latlng]);

    if (!visible || !latlng) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                style={{ zIndex: 99998 }}
                onClick={() => setVisible(false)}
            />
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm animate-fadeIn"
                style={{ zIndex: 99999 }}
                dir="rtl"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-blue-600" />
                        <span className="font-medium text-gray-800">مختصات نقطه انتخاب شده</span>
                    </div>
                    <button
                        onClick={() => setVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center" dir="ltr">
                    <p className="text-lg font-mono text-gray-800 tracking-wide">
                        {latlng.lat.toFixed(6)}, {latlng.lng.toFixed(6)}
                    </p>
                </div>

                <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <Copy size={16} />
                    <span>{copied ? 'کپی شد ✓' : 'کپی مختصات'}</span>
                </button>
            </div>
        </>
    );
}
