'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { mapController } from '@/app/utils/mapController';

function parseCoords(input: string): { lat: number; lng: number } | null {
    const cleaned = input.trim().replace(/[،;]/g, ',');
    const parts = cleaned.split(',').map(s => s.trim());
    if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
    }
    const spaceSplit = cleaned.split(/\s+/);
    if (spaceSplit.length === 2) {
        const lat = parseFloat(spaceSplit[0]);
        const lng = parseFloat(spaceSplit[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
    }
    return null;
}

export default function CoordSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
    }, [isOpen]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setError(null);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleSubmit = useCallback(() => {
        const coords = parseCoords(input);
        if (coords && mapController.flyTo) {
            mapController.flyTo(coords.lat, coords.lng, 18);
            setError(null);
            setIsOpen(false);
            setInput('');
        } else if (!coords) {
            setError('فرمت نامعتبر. مثال: 36.21, 57.667');
        }
    }, [input]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    }, [handleSubmit]);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    w-12 h-12 rounded-lg
                    bg-white/90 backdrop-blur-md shadow-lg
                    flex items-center justify-center
                    hover:bg-white transition-all
                "
                title="جستجو با مختصات جغرافیایی"
            >
                <Search size={20} className="text-gray-600" />
            </button>

            {isOpen && (
                <div
                    className="
                        absolute top-0 right-14 z-50
                        bg-white rounded-2xl shadow-xl border border-gray-100
                        p-3 min-w-[260px] animate-fadeIn
                    "
                    dir="ltr"
                >
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setError(null); }}
                            onKeyDown={handleKeyDown}
                            placeholder="مثال: 36.21, 57.667"
                            className="
                                flex-1 px-3 py-2 text-sm
                                border border-gray-200 rounded-lg
                                outline-none focus:border-blue-400
                                transition-colors text-gray-700
                                placeholder:text-gray-400
                            "
                        />
                        <button
                            onClick={handleSubmit}
                            className="
                                px-4 py-2 text-sm font-medium
                                bg-blue-600 text-white rounded-lg
                                hover:bg-blue-700 transition-colors
                                whitespace-nowrap
                            "
                        >
                            برو
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs mt-2 pr-1">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
