'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLayer } from '@/app/contexts/LayerContext';
import { mapController } from '@/app/utils/mapController';
import { addPoint, removeAllPoints, setIdParam } from '@/app/utils/urlManager';
import { alleyways, getAlleywayPoint } from '@/app/constants/alleyways';

interface MokebItem {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    categoryName?: string;
}

export default function GeneralSearchBox() {
    const { activeLayers, availableLayers } = useLayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ label: string; lat: number; lng: number; id?: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [mokebData, setMokebData] = useState<MokebItem[]>([]);
    const [mokebLoaded, setMokebLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isLayerActive = (componentName: string) =>
        availableLayers.some(l => activeLayers.includes(l.id) && l.componentName === componentName);

    const isMokebActive = isLayerActive('MokebLayer');
    const isKoocheActive = isLayerActive('KoocheLayer');

    useEffect(() => {
        if (isMokebActive && !mokebLoaded) {
            fetch('/api/map-point/api/MapPoint?page=1&pageSize=50')
                .then(res => res.json())
                .then((data: { success: boolean; data: MokebItem[] }) => {
                    if (data.success) setMokebData(data.data);
                })
                .catch(console.error)
                .finally(() => setMokebLoaded(true));
        }
    }, [isMokebActive, mokebLoaded]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const doSearch = useCallback((q: string) => {
        if (!q.trim()) { setResults([]); setIsOpen(false); return; }
        const lower = q.trim().toLowerCase();

        if (isMokebActive && mokebData.length > 0) {
            const filtered = mokebData.filter(m =>
                m.title.toLowerCase().includes(lower)
            );
            setResults(filtered.map(m => ({
                label: m.title + (m.categoryName ? ` (${m.categoryName})` : ''),
                lat: m.latitude,
                lng: m.longitude,
                id: m.id,
            })));
            setIsOpen(filtered.length > 0);
        } else if (isKoocheActive) {
            const filtered = alleyways.filter(a =>
                a.name.toLowerCase().includes(lower)
            );
            setResults(filtered.map(a => {
                const [lat, lng] = getAlleywayPoint(a);
                return { label: a.name, lat, lng, id: a.id };
            }));
            setIsOpen(filtered.length > 0);
        }
    }, [isMokebActive, isKoocheActive, mokebData]);

    const handleSelect = useCallback((lat: number, lng: number, layer?: string, id?: string) => {
        mapController.flyTo?.(lat, lng, 18);
        if (layer && id) {
            if (layer === 'kooche') {
                setIdParam(id);
            } else {
                removeAllPoints(layer);
                addPoint(layer, id);
            }
        }
        setQuery('');
        setResults([]);
        setIsOpen(false);
    }, []);

    const placeholder = isMokebActive ? 'جستجوی موکب...' : 'جستجوی کوچه...';

    return (
        <div ref={containerRef} className="relative">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg px-5 h-12 md:w-[400px] flex items-center gap-4 text-sm cursor-pointer hover:shadow-xl transition-shadow">
                <img src="/images/solar_magnifer-bold-duotone.png" alt="search" className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    className="flex-1 outline-none bg-transparent text-right"
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                    {results.map((r, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(r.lat, r.lng, isMokebActive ? 'mokeb' : 'kooche', r.id)}
                            className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
