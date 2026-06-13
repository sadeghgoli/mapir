'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import NosaziModal from '../overlays/NosaziModal';
import 'leaflet/dist/leaflet.css';

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

// کش داده‌های ویژگی‌ها و هندل های لایه
const featuresCache = new Map<string, any>();
const layerMap = new Map<string, any>(); // برای ذخیره لایه هر feature

interface NosaziLayerProps {
    onLoadingChange?: (isLoading: boolean) => void;
}

export default function NosaziLayer({ onLoadingChange }: NosaziLayerProps) {
    const map = useMap();
    const geoLayerRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [L, setL] = useState<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [isZooming, setIsZooming] = useState(false);

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

    // اطلاع‌رسانی تغییرات loading به کامپوننت والد
    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

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
            amount: props.amount || 0,
            ownerName: props.owner_name || props.OwnerName || "نامشخص",
            area: props.area || props.Area || "نامشخص",
            geometry: feature.geometry // ذخیره geometry برای زوم
        };
    };

    // تابع زوم روی یک feature خاص
    const zoomToFeature = (featureInfo: any) => {
        if (!map || !featureInfo.geometry || isZooming) return;

        setIsZooming(true);

        try {
            // استخراج مختصات از geometry
            let coordinates = null;
            if (featureInfo.geometry.type === 'Polygon') {
                coordinates = featureInfo.geometry.coordinates[0];
            } else if (featureInfo.geometry.type === 'MultiPolygon') {
                coordinates = featureInfo.geometry.coordinates[0][0];
            }

            if (coordinates && coordinates.length > 0) {
                // تبدیل به فرمت Leaflet
                const latLngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
                const bounds = L.latLngBounds(latLngs);

                // زوم روی bounds با padding
                map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 20,
                    duration: 0.5 // انیمیشن زوم
                });
            }
        } catch (error) {
            console.error('Error zooming to feature:', error);
        } finally {
            setTimeout(() => setIsZooming(false), 500);
        }
    };

    const handleFeatureClick = (info: any, shouldZoom: boolean = true) => {
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

        // زوم روی ملک فقط زمانی که مودال باز می‌شه
        if (shouldZoom) {
            // کمی تاخیر برای اطمینان از باز شدن مودال
            setTimeout(() => {
                zoomToFeature(info);
            }, 100);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedNosazi(null);
        updateParam(null);
    };

    // تابع هایلایت کردن feature
    const highlightFeature = (nosaziCode: string) => {
        // ریست کردن هایلایت قبلی
        layerMap.forEach((layer, code) => {
            if (layer && layer.setStyle) {
                layer.setStyle({ color: '#0d6efd', weight: 1 });
            }
        });

        // هایلایت feature جدید
        const layer = layerMap.get(nosaziCode);
        if (layer && layer.setStyle) {
            layer.setStyle({ color: '#ff0000', weight: 3 });
            layer.bringToFront();
        }
    };

    const loadData = async () => {
        if (!L || !map) return;

        const currentZoom = map.getZoom();

        if (currentZoom < 16) {
            if (geoLayerRef.current) {
                geoLayerRef.current.remove();
                geoLayerRef.current = null;
                layerMap.clear();
            }
            return;
        }

        const bounds = map.getBounds();
        const url = `/api/sabzevar/Sabzevar/Nosazi?minx=${bounds.getWest()}&miny=${bounds.getSouth()}&maxx=${bounds.getEast()}&maxy=${bounds.getNorth()}&zoom=${currentZoom}&vcode=f0b4db73-94fb-42c5-adda-857485a90745`;

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
                    layerMap.clear();
                }
                return;
            }

            if (geoLayerRef.current) {
                geoLayerRef.current.remove();
                layerMap.clear();
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
                    layerMap.set(info.nosaziCode, layer);

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
                        // فقط اگر هایلایت نشده باشه رنگ رو برگردون
                        if (selectedNosazi?.code !== info.nosaziCode) {
                            layer.setStyle({ color: '#0d6efd', weight: 1 });
                        }
                        setTooltipData(prev => ({ ...prev, show: false }));
                    });

                    layer.on('click', (e: any) => {
                        L.DomEvent.stopPropagation(e);
                        handleFeatureClick(info, true);
                        highlightFeature(info.nosaziCode);
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

            // اگر از URL کد نوسازی داریم و مودال باز نیست
            if (urlPointValue && !isModalOpenRef.current && featuresCache.has(urlPointValue)) {
                setTimeout(() => {
                    if (!isModalOpenRef.current && featuresCache.has(urlPointValue)) {
                        const info = featuresCache.get(urlPointValue);
                        handleFeatureClick(info, true);
                        highlightFeature(info.nosaziCode);
                    }
                }, 300);
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

    useEffect(() => {
        const tryOpenFromUrl = async () => {
            if (!urlPointValue || isModalOpenRef.current) return;

            if (featuresCache.has(urlPointValue)) {
                const info = featuresCache.get(urlPointValue);
                handleFeatureClick(info, true);
                highlightFeature(info.nosaziCode);
                return;
            }

            try {
                const res = await fetch(`/api/sabzevar/Sabzevar/Nosazi?code=${urlPointValue}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.features?.length > 0) {
                        const info = extractFeatureInfo(data.features[0]);
                        featuresCache.set(info.nosaziCode, info);
                        handleFeatureClick(info, true);
                        highlightFeature(info.nosaziCode);
                        return;
                    }
                }
            } catch (err) {
                console.log("Direct fetch not supported, waiting for map loadData...");
            }
        };

        tryOpenFromUrl();
    }, [urlPointValue, map]);

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