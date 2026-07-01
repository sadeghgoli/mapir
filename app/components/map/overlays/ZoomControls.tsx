'use client';

import {
    Plus,
    Minus,
    LocateFixed,
    Layers3,
    CreditCard,
    Route,
    MapPin,
} from 'lucide-react';
import { useMap } from 'react-leaflet';
import { useState, useCallback, useEffect } from 'react';
import { useLayer, AVAILABLE_LAYERS } from '@/app/contexts/LayerContext';

const layerIconMap: Record<string, React.ReactNode> = {
    CreditCard: <CreditCard size={16} />,
    Route: <Route size={16} />,
    MapPin: <MapPin size={16} />,
};

export default function ZoomControls() {
    const [isLocating, setIsLocating] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const { activeLayer, setActiveLayer, isPanelOpen, togglePanel } = useLayer();

    // این خط ممکن است در ابتدا خطا بدهد، اما catch می‌کنیم
    let map;
    try {
        map = useMap();
        if (map && !mapReady) setMapReady(true);
    } catch (error) {
        console.warn('Map not ready yet:', error);
        return null; // یا نمایش placeholder
    }

    if (!map) {
        return null;
    }

    const handleZoomIn = useCallback(() => {
        map.zoomIn();
    }, [map]);

    const handleZoomOut = useCallback(() => {
        map.zoomOut();
    }, [map]);

    const handleLocate = useCallback(() => {
        setIsLocating(true);

        if (!navigator.geolocation) {
            alert('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                map.setView([position.coords.latitude, position.coords.longitude], 18, {
                    animate: true,
                });
                setIsLocating(false);
            },
            (error) => {
                let message = 'خطا در دریافت موقعیت';
                if (error.code === 1) message = 'دسترسی به موقعیت داده نشد';
                alert(message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [map]);

    return (
        <div className="absolute left-6 bottom-52 z-[10] flex flex-col gap-3" style={{zIndex: '999'}}>
            <div className="bg-white rounded-lg w-10 flex items-center justify-center flex-col shadow-lg">
                <button
                    className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-t-lg transition-colors"
                    onClick={handleZoomIn}
                    title="بزرگنمایی"
                >
                    <Plus size={20} />
                </button>

                <div className="w-full flex items-center justify-center">
                    <div className="h-[1px] w-8 bg-gray-200"></div>
                </div>

                <button
                    className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-b-lg transition-colors"
                    onClick={handleZoomOut}
                    title="کوچکنمایی"
                >
                    <Minus size={20} />
                </button>
            </div>

            <button
                className="bg-white h-10 w-10 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={handleLocate}
                disabled={isLocating}
                title="موقعیت من"
            >
                <LocateFixed size={20} className={isLocating ? 'animate-pulse' : ''} />
            </button>

            <div className="relative">
                <button
                    className={`bg-white h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-colors ${isPanelOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                    onClick={togglePanel}
                    title="انتخاب لایه"
                >
                    <Layers3 size={20} />
                </button>

                {isPanelOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => togglePanel()} />
                        <div className="absolute left-0 bottom-full mb-2 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[210px] animate-fadeIn">
                            {AVAILABLE_LAYERS.map((layer) => {
                                const isActive = activeLayer === layer.id;
                                return (
                                    <button
                                        key={layer.id}
                                        onClick={() => { setActiveLayer(layer.id); togglePanel(); }}
                                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-right transition-colors duration-150 border-r-3 ${isActive ? 'bg-blue-50 border-r-blue-600' : 'border-r-transparent hover:bg-gray-50'}`}
                                    >
                                        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                                            {layerIconMap[layer.icon]}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                                                {layer.name}
                                            </div>
                                            <div className="text-[11px] text-gray-400 truncate">
                                                {layer.description}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}