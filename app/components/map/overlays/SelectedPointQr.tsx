'use client';

import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { findAlleywayById } from '@/app/constants/alleyways';
import { KOCHE_LAYER_ID } from '@/app/constants/layers';
import { buildPointShareUrl, clearIdParam, getIdParam } from '@/app/utils/urlManager';

export default function SelectedPointQr() {
    const [pointId, setPointId] = useState<string | null>(null);

    const syncFromUrl = useCallback(() => {
        setPointId(getIdParam());
    }, []);

    useEffect(() => {
        syncFromUrl();
        window.addEventListener('popstate', syncFromUrl);
        window.addEventListener('mapurlchange', syncFromUrl);
        return () => {
            window.removeEventListener('popstate', syncFromUrl);
            window.removeEventListener('mapurlchange', syncFromUrl);
        };
    }, [syncFromUrl]);

    const alley = pointId ? findAlleywayById(pointId) : undefined;
    if (!alley) return null;

    const shareUrl = buildPointShareUrl(alley.id, KOCHE_LAYER_ID);

    return (
        <div
            className="
                absolute bottom-24 right-6 z-[1000]
                bg-white/95 backdrop-blur-md rounded-2xl shadow-xl
                border border-gray-100 p-3
                flex flex-col items-center gap-2
                animate-fadeIn
            "
        >
            <div className="w-full flex items-center justify-between gap-2 px-1">
                <button
                    type="button"
                    onClick={() => clearIdParam()}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="بستن"
                    aria-label="بستن"
                >
                    <X size={14} />
                </button>
                <div className="text-right min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate max-w-[140px]">
                        {alley.name}
                    </div>
                    <div className="text-[10px] text-gray-500">لینک نقطه</div>
                </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-gray-100">
                <QRCodeSVG
                    value={shareUrl}
                    size={132}
                    level="M"
                    marginSize={1}
                    bgColor="#ffffff"
                    fgColor="#0f766e"
                />
            </div>

            <p className="text-[10px] text-gray-500 text-center leading-4 max-w-[150px]">
                برای مشاهده جزئیات نقطه، QR را اسکن کنید
            </p>
        </div>
    );
}
