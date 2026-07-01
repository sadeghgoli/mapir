'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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

interface LayerContextType {
    activeLayer: string;
    setActiveLayer: (layerId: string) => void;
    isPanelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    togglePanel: () => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider({ children }: { children: ReactNode }) {
    const [activeLayer, setActiveLayer] = useState<string>('toll');
    const [isPanelOpen, setPanelOpen] = useState(false);

    const togglePanel = useCallback(() => {
        setPanelOpen(prev => !prev);
    }, []);

    return (
        <LayerContext.Provider value={{ activeLayer, setActiveLayer, isPanelOpen, setPanelOpen, togglePanel }}>
            {children}
        </LayerContext.Provider>
    );
}

export function useLayer() {
    const ctx = useContext(LayerContext);
    if (!ctx) throw new Error('useLayer must be used within LayerProvider');
    return ctx;
}
