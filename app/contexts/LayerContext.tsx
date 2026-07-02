'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface LayerConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export const AVAILABLE_LAYERS: LayerConfig[] = [
    {
        id: 'toll',
        name: 'پرداخت عوارض',
        description: 'مشاهده و پرداخت عوارض نوسازی و پسماند',
        icon: 'CreditCard',
    },
    {
        id: 'kooche',
        name: 'کوچه‌ها',
        description: 'نمایش کوچه‌ها و معابر (داده تستی)',
        icon: 'Route',
    },
    {
        id: 'points',
        name: 'نقاط مهم',
        description: 'نمایش نقاط مهم و اماکن دیدنی (داده تستی)',
        icon: 'MapPin',
    },
];

const ALL_IDS = AVAILABLE_LAYERS.map(l => l.id);

function readLayersFromUrl(): string[] {
    if (typeof window === 'undefined') return ['toll'];
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('layers');
    if (!raw) return ['toll'];
    return raw.split(',').filter(id => ALL_IDS.includes(id));
}

function writeLayersToUrl(ids: string[]) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (ids.length > 0 && ids.length < ALL_IDS.length) {
        url.searchParams.set('layers', ids.join(','));
    } else {
        url.searchParams.delete('layers');
    }
    window.history.replaceState({}, '', url.toString());
}

interface LayerContextType {
    activeLayers: string[];
    toggleLayer: (layerId: string) => void;
    setActiveLayers: (ids: string[]) => void;
    isPanelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    togglePanel: () => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider({ children }: { children: ReactNode }) {
    const [activeLayers, setActiveLayers] = useState<string[]>(['toll']);
    const [isPanelOpen, setPanelOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setActiveLayers(readLayersFromUrl());
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) writeLayersToUrl(activeLayers);
    }, [activeLayers, hydrated]);

    const toggleLayer = useCallback((layerId: string) => {
        setActiveLayers(prev => {
            if (prev.includes(layerId)) {
                const next = prev.filter(id => id !== layerId);
                return next.length === 0 ? [layerId] : next;
            }
            return [...prev, layerId];
        });
    }, []);

    const togglePanel = useCallback(() => {
        setPanelOpen(prev => !prev);
    }, []);

    return (
        <LayerContext.Provider value={{
            activeLayers, toggleLayer, setActiveLayers,
            isPanelOpen, setPanelOpen, togglePanel,
        }}>
            {children}
        </LayerContext.Provider>
    );
}

export function useLayer() {
    const ctx = useContext(LayerContext);
    if (!ctx) throw new Error('useLayer must be used within LayerProvider');
    return ctx;
}
