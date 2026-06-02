'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import NosaziModal from '../overlays/NosaziModal';
import 'leaflet/dist/leaflet.css'; // ✅ این خط را به بالای فایل اضافه کنید

// هوک سفارشی برای مدیریت URL
function useUrlParam(paramName: string) {
    const [paramValue, setParamValue] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setParamValue(params.get(paramName));

        const handlePopState = () => {
            const newParams = new URLSearchParams(window.location.search);
            setParamValue(newParams.get(paramName));
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [paramName]);

    const updateParam = (value: string | null) => {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(paramName, value);
        } else {
            url.searchParams.delete(paramName);
        }
        window.history.pushState({}, '', url.toString());
        setParamValue(value);
    };

    return { paramValue, updateParam };
}

// کش داده‌های ویژگی‌ها
const featuresCache = new Map<string, any>();

export default function NosaziLayer() {
    const map = useMap();
    const geoLayerRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [L, setL] = useState<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [tooltipData, setTooltipData] = useState<{
        show: boolean;
        x: number;
        y: number;
        nosaziCode: string;
        address: string;
    }>({
        show: false,
        x: 0,
        y: 0,
        nosaziCode: '',
        address: ''
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNosazi, setSelectedNosazi] = useState<any>(null);
    const { paramValue: urlPointValue, updateParam } = useUrlParam('point');

    // رفرنس برای دسترسی به مقدار به‌روز isModalOpen داخل Closureها
    const isModalOpenRef = useRef(isModalOpen);
    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    // بارگذاری leaflet
    useEffect(() => {
        import('leaflet').then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    const extractFeatureInfo = (feature: any) => {
        const props = feature.properties || {};
        return {
            nosaziCode: props.name || props.Code_nosaz || props.code || "کد نوسازی موجود نیست",
            address: props.address || props.full_address || "آدرس موجود نیست",
            billId: props.bill_id || props.BillId || Math.floor(Math.random() * 10000000000000).toString(),
            paymentId: props.payment_id || props.PaymentId || Math.floor(Math.random() * 1000000000000).toString(),
            amount: props.amount || 3500000,
            ownerName: props.owner_name || props.OwnerName || "نامشخص",
            area: props.area || props.Area || "نامشخص",
        };
    };

    const handleFeatureClick = (info: any) => {
        // تبدیل داده‌ها به فرمتی که NosaziModal انتظار دارد
        const modalData = {
            code: info.nosaziCode,
            address: info.address,
            billId: info.billId,
            paymentId: info.paymentId,
            amount: info.amount,
            ownerName: info.ownerName,
            area: info.area
        };

        setSelectedNosazi(modalData);
        setIsModalOpen(true);
        updateParam(info.nosaziCode);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedNosazi(null);
        updateParam(null);
    };

    const loadData = async () => {
        if (!L || !map) return;

        const currentZoom = map.getZoom();

        if (currentZoom < 16) {
            if (geoLayerRef.current) {
                geoLayerRef.current.remove();
                geoLayerRef.current = null;
            }
            return;
        }

        const bounds = map.getBounds();
        const url = `/api/sabzevar/Sabzevar/Nosazi?minx=${bounds.getWest()}&miny=${bounds.getSouth()}&maxx=${bounds.getEast()}&maxy=${bounds.getNorth()}&zoom=${currentZoom}`;

        setLoading(true);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(url, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.features || data.features.length === 0) {
                if (geoLayerRef.current) {
                    geoLayerRef.current.remove();
                    geoLayerRef.current = null;
                }
                return;
            }

            if (geoLayerRef.current) {
                geoLayerRef.current.remove();
            }

            geoLayerRef.current = L.geoJSON(data, {
                style: () => ({
                    color: '#0d6efd',
                    weight: 1,
                    opacity: 0.9
                }),
                onEachFeature: (feature: any, layer: any) => {
                    const info = extractFeatureInfo(feature);
                    featuresCache.set(info.nosaziCode, info);

                    layer.on('mouseover', (e: any) => {
                        layer.setStyle({ color: 'red', weight: 2 });
                        const containerPoint = map.latLngToContainerPoint(e.latlng);
                        setTooltipData({
                            show: true,
                            x: containerPoint.x,
                            y: containerPoint.y - 60,
                            nosaziCode: info.nosaziCode,
                            address: info.address
                        });
                    });

                    layer.on('mouseout', () => {
                        layer.setStyle({ color: '#0d6efd', weight: 1 });
                        setTooltipData(prev => ({ ...prev, show: false }));
                    });

                    layer.on('click', (e: any) => {
                        L.DomEvent.stopPropagation(e);
                        handleFeatureClick(info);
                    });
                },
                pointToLayer: (feature: any, latlng: any) => {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        color: '#0d6efd',
                        weight: 1,
                        fillColor: '#0d6efd',
                        fillOpacity: 0.9
                    });
                }
            }).addTo(map);

            // ✅ مرحله ۳ از منطق هوشمند: اگر بعد از لود شدن داده‌ها، کد URL در کش پیدا شد، مودال را باز کن
            if (urlPointValue && !isModalOpenRef.current && featuresCache.has(urlPointValue)) {
                setTimeout(() => {
                    if (!isModalOpenRef.current && featuresCache.has(urlPointValue)) {
                        const info = featuresCache.get(urlPointValue);
                        handleFeatureClick(info);
                    }
                }, 300); // تاخیر کوتاه برای اطمینان از رندر شدن نقشه
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Load error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    useMapEvents({
        moveend: () => {
            loadData();
            setTooltipData(prev => ({ ...prev, show: false }));
        },
        zoomend: () => {
            loadData();
            setTooltipData(prev => ({ ...prev, show: false }));
        },
        click: () => {
            setTooltipData(prev => ({ ...prev, show: false }));
        }
    });

    useEffect(() => {
        if (map && L) {
            loadData();
        }
    }, [map, L]);

    // ✅ مرحله ۱ و ۲ از منطق هوشمند: تلاش برای باز کردن مودال به محض وجود پارامتر در URL
    useEffect(() => {
        const tryOpenFromUrl = async () => {
            if (!urlPointValue || isModalOpenRef.current) return;

            // ۱. اگر در کش موجود است، بلافاصله باز کن (سریع‌ترین حالت)
            if (featuresCache.has(urlPointValue)) {
                handleFeatureClick(featuresCache.get(urlPointValue));
                return;
            }

            // ۲. اگر در کش نیست، تلاش کن مستقیماً از API بگیر (اگر بک‌اند ساپورت می‌کند)
            try {
                const res = await fetch(`/api/sabzevar/Sabzevar/Nosazi?code=${urlPointValue}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.features?.length > 0) {
                        const info = extractFeatureInfo(data.features[0]);
                        featuresCache.set(info.nosaziCode, info);
                        handleFeatureClick(info);

                        // اختیاری: اگر بک‌اند مختصات را برمی‌گرداند، نقشه را به آنجا زوم کن
                        // const coords = data.features[0].geometry.coordinates;
                        // if (coords && map) map.flyTo([coords[1], coords[0]], 18);
                        return;
                    }
                }
            } catch (err) {
                // اگر اندپوینت تکی پشتیبانی نشود، خطا نادیده گرفته می‌شود و مرحله ۳ (داخل loadData) آن را هندل می‌کند
                console.log("Direct fetch not supported, waiting for map loadData...");
            }
        };

        tryOpenFromUrl();
    }, [urlPointValue, map]); // وابستگی به urlPointValue و map

    return (
        <>
            {tooltipData.show && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipData.x,
                        top: tooltipData.y,
                        zIndex: 2000,
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.2s ease-in-out'
                    }}
                >
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        minWidth: '260px',
                        padding: '14px',
                        direction: 'rtl'
                    }}>
                        <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>کد نوسازی</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                                {tooltipData.nosaziCode}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>آدرس :</div>
                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                                {tooltipData.address}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NosaziModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                nosaziData={selectedNosazi || { code: '', address: '' }}
            />

            {loading && (
                <div className="absolute bottom-5 right-5 bg-black/70 text-white px-3 py-2 rounded text-sm z-[1000]">
                    در حال بارگذاری داده‌های نوسازی...
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .leaflet-interactive {
                    cursor: pointer;
                }
            `}</style>
        </>
    );
}