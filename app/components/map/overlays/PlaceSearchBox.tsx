'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mapController } from '@/app/utils/mapController';
import { setPoints, removeAllPoints } from '@/app/utils/urlManager';

interface PlaceResult {
    id: string;
    label: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
}

export default function PlaceSearchBox() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            abortRef.current?.abort();
        };
    }, []);

    const doSearch = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = q.trim();
        if (!trimmed || trimmed.length < 2) {
            abortRef.current?.abort();
            setResults([]);
            setIsOpen(false);
            setLoading(false);
            setSearched(false);
            return;
        }

        // دراپ‌داون باز بماند تا پایان جستجو؛ نتایج قبلی تا پاسخ جدید نگه داشته شوند
        setLoading(true);
        setIsOpen(true);
        setSearched(false);

        debounceRef.current = setTimeout(async () => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            const reqId = ++requestIdRef.current;

            try {
                const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
                    signal: ctrl.signal,
                });
                const data = await res.json() as { results: PlaceResult[] };
                if (reqId !== requestIdRef.current) return;

                setResults(data.results || []);
                setSearched(true);
                setIsOpen(true);
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                if (reqId !== requestIdRef.current) return;
                setResults([]);
                setSearched(true);
                setIsOpen(true);
            } finally {
                if (reqId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        }, 350);
    }, []);

    const handleSelect = useCallback((place: PlaceResult) => {
        mapController.flyTo?.(place.lat, place.lng, 18);
        removeAllPoints('marker');
        setPoints('marker', [`${place.lat.toFixed(6)},${place.lng.toFixed(6)}`]);
        setQuery(place.name);
        setResults([]);
        setIsOpen(false);
        setSearched(false);
    }, []);

    const showDropdown = isOpen && query.trim().length >= 2;

    return (
        <div ref={containerRef} className="relative">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg px-5 h-12 md:w-[400px] flex items-center gap-4 text-sm hover:shadow-xl transition-shadow">
                <img
                    src="/images/solar_magnifer-bold-duotone.png"
                    alt="search"
                    className="w-5 h-5"
                />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="جستجو در سبزوار و شهرک توحید..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        doSearch(e.target.value);
                    }}
                    onFocus={() => {
                        if (query.trim().length >= 2) setIsOpen(true);
                    }}
                    className="flex-1 outline-none bg-transparent text-right"
                />
                {loading && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin shrink-0" />
                )}
            </div>

            {showDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
                    {loading && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-right">
                            در حال جستجو...
                        </div>
                    )}

                    {results.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => handleSelect(r)}
                            className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded shrink-0 mt-0.5">
                                    {r.type}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm text-gray-800 font-medium truncate">{r.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-5">{r.label}</div>
                                </div>
                            </div>
                        </button>
                    ))}

                    {!loading && searched && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-right">
                            چیزی یافت نشد
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
