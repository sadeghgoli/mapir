'use client';

import { useLayer } from '@/app/contexts/LayerContext';
import { CreditCard, MapPin, Route, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    CreditCard,
    MapPin,
    Route,
};

export default function MapLegend() {
    const { activeLayers, availableLayers, getGuides } = useLayer();

    if (activeLayers.length === 0) return null;

    const activeConfigs = availableLayers.filter(l => activeLayers.includes(l.id));

    return (
        <div
            className="absolute bottom-24 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 min-w-[160px]"
            dir="rtl"
        >
            <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1.5">راهنما</p>
            <div className="space-y-2">
                {activeConfigs.map(layer => {
                    const Icon = iconMap[layer.icon as string] || MapPin;
                    const guides = getGuides(layer.id);

                    return (
                        <div key={layer.id}>
                            <div className="flex items-center gap-2">
                                <Icon size={14} style={{ color: layer.color }} />
                                <span className="text-xs text-gray-700 font-medium">{layer.name}</span>
                            </div>

                            {guides.length > 0 && (
                                <div className="mr-5 mt-1 space-y-1">
                                    {guides.map(g => (
                                        <div key={g.id} className="flex items-center gap-1.5">
                                            <img
                                                src={g.imageUrl || (g.icon === 'eskan' ? '/images/logo1.png' : '/images/logo2.png')}
                                                alt={g.title}
                                                className="w-4 h-4 rounded-full object-cover"
                                            />
                                            <span className="text-[11px] text-gray-500">{g.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
