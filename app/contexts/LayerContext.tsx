'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { updateUrl, getUrlParams } from '@/app/utils/urlManager';

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
        id: 'mokeb',
        name: 'موکب‌های شهرداری',
        description: 'لیست موقعیت موکب و اسکان‌های شهر سبزوار',
        icon: 'MapPin',
    },
];

const ALL_IDS = AVAILABLE_LAYERS.map(l => l.id);

function readLayersFromUrl(): string[] {
    const p = getUrlParams();
    if (!p.layers) return [];
    return p.layers.split(',').filter(id => ALL_IDS.includes(id));
}

interface LayerContextType {
    activeLayers: string[];
    toggleLayer: (layerId: string) => void;
    isPanelOpen: boolean;
    togglePanel: () => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider({ children }: { children: ReactNode }) {
    const [activeLayers, setActiveLayers] = useState<string[]>([]);
    const [isPanelOpen, setPanelOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setActiveLayers(readLayersFromUrl());
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        updateUrl({
            layers: activeLayers.length > 0 && activeLayers.length < ALL_IDS.length
                ? activeLayers.join(',')
                : null,
        });
    }, [activeLayers, hydrated]);

    const toggleLayer = useCallback((layerId: string) => {
        setActiveLayers(prev => {
            if (prev.includes(layerId)) {
                return prev.filter(id => id !== layerId);
            }
            return [...prev, layerId];
        });
    }, []);

    const togglePanel = useCallback(() => setPanelOpen(prev => !prev), []);

    return (
        <LayerContext.Provider value={{ activeLayers, toggleLayer, isPanelOpen, togglePanel }}>
            {children}
        </LayerContext.Provider>
    );
}

export function useLayer() {
    const ctx = useContext(LayerContext);
    if (!ctx) throw new Error('useLayer must be used within LayerProvider');
    return ctx;
}
