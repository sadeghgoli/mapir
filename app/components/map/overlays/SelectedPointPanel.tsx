'use client';

import { useCallback, useEffect, useState } from 'react';
import { Share2, X } from 'lucide-react';
import { KOCHE_LAYER_ID } from '@/app/constants/layers';
import { buildPointShareUrl, clearIdParam, getIdParam } from '@/app/utils/urlManager';

export default function SelectedPointPanel() {
    const [pointId, setPointId] = useState<string | null>(null);
    const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');

    const syncFromUrl = useCallback(() => {
        setPointId(getIdParam());
        setShareState('idle');
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

    useEffect(() => {
        if (!pointId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') clearIdParam();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [pointId]);

    const handleShare = useCallback(async () => {
        if (!pointId) return;
        const shareUrl = buildPointShareUrl(pointId, KOCHE_LAYER_ID);

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ url: shareUrl, title: 'نقطه روی نقشه' });
                return;
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareState('copied');
        } catch {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                setShareState('copied');
            } catch {
                setShareState('error');
            }
            document.body.removeChild(ta);
        }

        window.setTimeout(() => setShareState('idle'), 2000);
    }, [pointId]);

    if (!pointId) return null;

    const shareLabel =
        shareState === 'copied' ? 'لینک کپی شد' :
        shareState === 'error' ? 'خطا در کپی لینک' :
        'اشتراک نقطه';

    return (
        <aside
            className="
                fixed top-0 bottom-0 right-0 z-[1100]
                w-[min(100%,340px)] md:w-[360px]
                bg-white shadow-2xl border-l border-gray-100
                flex flex-col
                animate-slideInFromRight
            "
            dir="rtl"
            aria-label="جزئیات نقطه"
        >
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-gray-100">
                <button
                    type="button"
                    onClick={() => clearIdParam()}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="بستن"
                    aria-label="بستن"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1" />

            <div className="p-4 border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={handleShare}
                    className="
                        w-full flex items-center justify-center gap-2
                        py-3 rounded-xl font-medium
                        bg-teal-700 text-white hover:bg-teal-800
                        transition-colors
                    "
                >
                    <Share2 size={16} />
                    <span>{shareLabel}</span>
                </button>
            </div>
        </aside>
    );
}
