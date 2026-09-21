'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { KOCHE_LAYER_ID } from '@/app/constants/layers';
import { buildPointShareUrl, clearIdParam, getIdParam } from '@/app/utils/urlManager';
import {
    fetchKoocheMapPoints,
    fetchMapPointById,
    findMapPointById,
    mapPointShareUrl,
    type MapPoint,
} from '@/app/services/mapPoint.service';

const SHORT_LINK_POLL_MS = 2000;
const SHORT_LINK_POLL_ATTEMPTS = 5;

function qrFileName(title: string) {
    const safe = title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'kooche';
    return `${safe}-qr.png`;
}

function downloadSvgPng(svg: SVGSVGElement, filename: string) {
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            URL.revokeObjectURL(url);
            return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const a = document.createElement('a');
        a.download = filename;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
}

export default function SelectedPointPanel() {
    const [pointId, setPointId] = useState<string | null>(null);
    const [point, setPoint] = useState<MapPoint | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');
    const qrRef = useRef<SVGSVGElement>(null);

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

    useEffect(() => {
        if (!pointId) {
            setPoint(null);
            setLoading(false);
            setError(false);
            return;
        }

        let cancelled = false;
        let pollTimer: ReturnType<typeof setTimeout> | undefined;

        (async () => {
            setLoading(true);
            setError(false);
            try {
                const list = await fetchKoocheMapPoints();
                if (cancelled) return;
                const found = findMapPointById(list, pointId);
                if (!found) {
                    setPoint(null);
                    setError(true);
                    setLoading(false);
                    return;
                }
                setPoint(found);
                setLoading(false);

                fetchMapPointById(pointId).catch(() => {});

                if (found.shortVisitLink) return;

                let attempts = 0;
                const poll = async () => {
                    if (cancelled || attempts >= SHORT_LINK_POLL_ATTEMPTS) return;
                    attempts += 1;
                    try {
                        const refreshed = await fetchKoocheMapPoints({ force: true });
                        const updated = findMapPointById(refreshed, pointId);
                        if (cancelled) return;
                        if (updated) {
                            setPoint(updated);
                            if (updated.shortVisitLink) return;
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    pollTimer = setTimeout(poll, SHORT_LINK_POLL_MS);
                };
                pollTimer = setTimeout(poll, SHORT_LINK_POLL_MS);
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError(true);
                    setPoint(null);
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [pointId]);

    const qrUrl = point?.shortVisitLink || point?.visitLink || null;
    const shareUrl = (point && mapPointShareUrl(point))
        || (pointId ? buildPointShareUrl(pointId, KOCHE_LAYER_ID) : '');

    const handleShare = useCallback(async () => {
        if (!shareUrl) return;

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({ url: shareUrl, title: point?.title || 'نقطه روی نقشه' });
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
    }, [shareUrl, point?.title]);

    const handleDownloadQr = useCallback(() => {
        const svg = qrRef.current;
        if (!svg || !point) return;
        downloadSvgPng(svg, qrFileName(point.title));
    }, [point]);

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
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 truncate">
                    {point?.title || (loading ? 'در حال بارگذاری...' : error ? 'خطا در دریافت اطلاعات' : 'جزئیات کوچه')}
                </h2>
                <button
                    type="button"
                    onClick={() => clearIdParam()}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                    title="بستن"
                    aria-label="بستن"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-teal-700" />
                    </div>
                )}

                {!loading && error && (
                    <p className="text-sm text-gray-500 text-center py-12">اطلاعات این کوچه در دسترس نیست.</p>
                )}

                {!loading && !error && point && (
                    <div className="flex flex-col items-stretch gap-5">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">نام کوچه</p>
                                <p className="text-base font-semibold text-gray-800">{point.title}</p>
                            </div>
                            {point.address && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">آدرس</p>
                                    <p className="text-sm text-gray-700 leading-6">{point.address}</p>
                                </div>
                            )}
                        </div>

                        {qrUrl ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                    <QRCodeSVG
                                        ref={qrRef}
                                        value={qrUrl}
                                        size={220}
                                        level="M"
                                        marginSize={1}
                                        title={point.title}
                                    />
                                </div>
                                <a
                                    href={qrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    dir="ltr"
                                    className="text-xs text-teal-700 hover:underline break-all text-center"
                                >
                                    {qrUrl}
                                </a>
                                <button
                                    type="button"
                                    onClick={handleDownloadQr}
                                    className="
                                        w-full flex items-center justify-center gap-2
                                        py-2.5 rounded-xl font-medium text-sm
                                        border border-teal-700 text-teal-800
                                        hover:bg-teal-50 transition-colors
                                    "
                                >
                                    <Download size={16} />
                                    دانلود کد QR
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-teal-700" />
                                <p className="text-sm text-gray-500">در حال آماده‌سازی لینک کوتاه...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={handleShare}
                    disabled={!shareUrl}
                    className="
                        w-full flex items-center justify-center gap-2
                        py-3 rounded-xl font-medium
                        bg-teal-700 text-white hover:bg-teal-800
                        disabled:opacity-50 disabled:cursor-not-allowed
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
