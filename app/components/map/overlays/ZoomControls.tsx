'use client';

import {
    Plus,
    Minus,
    LocateFixed,
} from 'lucide-react';
import { useMap } from 'react-leaflet';
import { useState, useCallback, useEffect } from 'react';

export default function ZoomControls() {
    const [isLocating, setIsLocating] = useState(false);
    const [mapReady, setMapReady] = useState(false);

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
        </div>
    );
}