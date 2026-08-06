'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import NosaziModal from '../overlays/NosaziModal';
import { getFirstPoint, setPoints, removeAllPoints } from '@/app/utils/urlManager';
import { getCachedNosaziData, setCachedNosaziData, getAllCachedNosaziFeatures } from '@/app/utils/nosaziCache';
import 'leaflet/dist/leaflet.css';

function useTollPoint() {
    const [paramValue, setParamValue] = useState<string | null>(null);

    useEffect(() => {
        setParamValue(getFirstPoint('toll'));

        const handlePopState = () => {
            setParamValue(getFirstPoint('toll'));
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const updateParam = (value: string | null) => {
        if (value) {
            setPoints('toll', [value], 'push');
        } else {
            removeAllPoints('toll');
        }
        setParamValue(value);
    };

    return { paramValue, updateParam };
}

// تابع تبدیل کد به فرمت مورد نیاز سرور (مشابه SearchBox2)
const formatCodeForServer = (code: string): string => {
    // اگر کد خالی است
    if (!code || code === "کد نوسازی موجود نیست") {
        return '0-00-000-000-00-00-00';
    }

    // جدا کردن بخش‌های کد بر اساس خط تیره
    let parts = code.split('-');

    // اندازه گروه‌ها به ترتیب
    const groupSizes = [1, 2, 3, 3, 2, 2, 2];

    // اگر تعداد بخش‌ها کمتر از 7 است، بخش‌های缺失 را با صفر پر کن
    const fullParts = [];
    for (let i = 0; i < groupSizes.length; i++) {
        if (i < parts.length && parts[i]) {
            // بخش موجود را با صفرهای سمت چپ به اندازه گروه پر کن
            fullParts.push(parts[i].padStart(groupSizes[i], '0'));
        } else {
            // بخش缺失 را با صفر پر کن
            fullParts.push('0'.repeat(groupSizes[i]));
        }
    }

    const formattedCode = fullParts.join('-');

    return formattedCode;
};

// تابع تبدیل کد به فرمت نمایش (با خط تیره)
const formatCodeForDisplay = (code: string): string => {
    if (!code || code === "کد نوسازی موجود نیست") return code;

    // حذف صفرهای بی‌معنی از ابتدا و انتها
    let parts = code.split('-');

    // حذف بخش‌های صفر از انتها
    let lastNonZeroIndex = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i] !== '0' && parts[i] !== '00' && parts[i] !== '000' && parts[i] !== '') {
            lastNonZeroIndex = i;
            break;
        }
    }

    if (lastNonZeroIndex >= 0) {
        parts = parts.slice(0, lastNonZeroIndex + 1);
    }

    // حذف صفرهای ابتدایی هر بخش (به جز بخش اول که ممکن است صفر باشد)
    const cleanedParts = parts.map((part, index) => {
        if (index === 0) return part; // بخش اول را بدون تغییر نگه دار
        return part.replace(/^0+/, '') || '0';
    });

    return cleanedParts.join('-');
};

// کش داده‌های ویژگی‌ها و هندل های لایه
const featuresCache = new Map<string, any>();
const layerMap = new Map<string, any>();
const accumulatedFeatures = new Map<string, any>();

interface NosaziLayerProps {
    onLoadingChange?: (isLoading: boolean) => void;
}

export default function NosaziLayer({ onLoadingChange }: NosaziLayerProps) {
    const map = useMap();
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
    const { paramValue: urlPointValue, updateParam } = useTollPoint();

    // رفرنس برای دسترسی به مقدار به‌روز isModalOpen داخل Closureها
    const isModalOpenRef = useRef(isModalOpen);
    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    // اطلاع‌رسانی تغییرات loading به کامپوننت والد
    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    // پاکسازی لایه GeoJSON در زمان unmount
    useEffect(() => {
        return () => {
            onLoadingChange?.(false);
            clearAllLeafletLayers();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // بارگذاری leaflet
    useEffect(() => {
        import('leaflet').then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

    // تابع utf8ToBase64 برای ارسال داده به سرور (مشابه SearchBox2)
    const utf8ToBase64 = (str: string): string => {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    };

    // تابع اصلی استخراج اطلاعات از ویژگی‌های لایه
    const extractFeatureInfo = (feature: any) => {
        const props = feature.properties || {};

        // دریافت کد نوسازی (ممکن است با فرمت‌های مختلف بیاید)
        let rawCode = "کد نوسازی موجود نیست";
        if (props.name && props.name !== "0" && props.name !== "") {
            rawCode = props.name;
        } else if (props.Code_nosaz && props.Code_nosaz !== "0" && props.Code_nosaz !== "") {
            rawCode = props.Code_nosaz;
        } else if (props.code && props.code !== "0" && props.code !== "") {
            rawCode = props.code;
        } else if (props.codeN && props.codeN !== "0" && props.codeN !== "") {
            rawCode = props.codeN;
        } else if (props.Code && props.Code !== "0" && props.Code !== "") {
            rawCode = props.Code;
        }

        // فرمت کردن کد برای نمایش
        const formattedCode = formatCodeForDisplay(rawCode);

        // بررسی نام‌های مختلف برای فیلد آدرس
        let address = "آدرس موجود نیست";
        if (props.neshani_melk && props.neshani_melk !== "0" && props.neshani_melk !== "") {
            address = props.neshani_melk;
        } else if (props.address && props.address !== "0" && props.address !== "") {
            address = props.address;
        } else if (props.full_address && props.full_address !== "0" && props.full_address !== "") {
            address = props.full_address;
        } else if (props.Address && props.Address !== "0" && props.Address !== "") {
            address = props.Address;
        }

        // بررسی نام‌های مختلف برای فیلد مالک
        let ownerName = "نامشخص";
        if (props.Name_Malek && props.Name_Malek !== "0" && props.Name_Malek !== "" && props.Name_Malek !== "null") {
            ownerName = props.Name_Malek;
        } else if (props.owner_name && props.owner_name !== "0" && props.owner_name !== "" && props.owner_name !== "null") {
            ownerName = props.owner_name;
        } else if (props.OwnerName && props.OwnerName !== "0" && props.OwnerName !== "" && props.OwnerName !== "null") {
            ownerName = props.OwnerName;
        } else if (props.malek && props.malek !== "0" && props.malek !== "" && props.malek !== "null") {
            ownerName = props.malek;
        } else if (props.Malek && props.Malek !== "0" && props.Malek !== "" && props.Malek !== "null") {
            ownerName = props.Malek;
        } else if (props.name_malek && props.name_malek !== "0" && props.name_malek !== "" && props.name_malek !== "null") {
            ownerName = props.name_malek;
        }

        // بررسی نام‌های مختلف برای فیلد مساحت
        let area = "نامشخص";
        if (props.MasahatZamin && props.MasahatZamin !== "0" && props.MasahatZamin !== "") {
            area = props.MasahatZamin.toString();
        } else if (props.area && props.area !== "0" && props.area !== "") {
            area = props.area;
        } else if (props.Area && props.Area !== "0" && props.Area !== "") {
            area = props.Area;
        } else if (props.masahat && props.masahat !== "0" && props.masahat !== "") {
            area = props.masahat;
        }

        // بررسی نام‌های مختلف برای فیلد سال ساخت
        let constructionYear = "نامشخص";
        if (props.Tabaghe && props.Tabaghe !== "0" && props.Tabaghe !== "") {
            constructionYear = props.Tabaghe;
        } else if (props.construction_year && props.construction_year !== "0" && props.construction_year !== "") {
            constructionYear = props.construction_year;
        } else if (props.sale_sakht && props.sale_sakht !== "0" && props.sale_sakht !== "") {
            constructionYear = props.sale_sakht;
        } else if (props.Year && props.Year !== "0" && props.Year !== "") {
            constructionYear = props.Year;
        }

        // بررسی نام‌های مختلف برای فیلد مبلغ
        let amount = 0;
        if (props.Nmablagh && props.Nmablagh !== "0" && props.Nmablagh !== "") {
            amount = Number(props.Nmablagh);
        } else if (props.amount && props.amount !== "0" && props.amount !== "") {
            amount = Number(props.amount);
        } else if (props.Amount && props.Amount !== "0" && props.Amount !== "") {
            amount = Number(props.Amount);
        } else if (props.mablagh && props.mablagh !== "0" && props.mablagh !== "") {
            amount = Number(props.mablagh);
        }

        // بررسی نام‌های مختلف برای فیلد شناسه قبض
        let billId = undefined;
        if (props.NShenaseGhabz && props.NShenaseGhabz !== "0" && props.NShenaseGhabz !== "") {
            billId = props.NShenaseGhabz;
        } else if (props.billId && props.billId !== "0" && props.billId !== "") {
            billId = props.billId;
        } else if (props.BillId && props.BillId !== "0" && props.BillId !== "") {
            billId = props.BillId;
        } else if (props.shenase_ghabz && props.shenase_ghabz !== "0" && props.shenase_ghabz !== "") {
            billId = props.shenase_ghabz;
        }

        // بررسی نام‌های مختلف برای فیلد شناسه پرداخت
        let paymentId = undefined;
        if (props.NShenasePardakht && props.NShenasePardakht !== "0" && props.NShenasePardakht !== "") {
            paymentId = props.NShenasePardakht;
        } else if (props.paymentId && props.paymentId !== "0" && props.paymentId !== "") {
            paymentId = props.paymentId;
        } else if (props.PaymentId && props.PaymentId !== "0" && props.PaymentId !== "") {
            paymentId = props.PaymentId;
        } else if (props.shenase_pardakht && props.shenase_pardakht !== "0" && props.shenase_pardakht !== "") {
            paymentId = props.shenase_pardakht;
        }

        const result = {
            nosaziCode: formattedCode,
            rawCode: rawCode,
            address: address,
            billId: billId,
            paymentId: paymentId,
            amount: amount,
            ownerName: ownerName,
            area: area,
            constructionYear: constructionYear,
            geometry: feature.geometry
        };

        return result;
    };

    // تابع جستجوی اطلاعات ملک از سرور (مشابه SearchBox2)
    const fetchPropertyDetails = async (code: string) => {
        try {
            const formattedCode = formatCodeForServer(code);
            const base64Data = utf8ToBase64(formattedCode);
            const url = `/api/AmardDataHandler.ashx?data=${encodeURIComponent(base64Data)}`;

            console.log('=== Fetching property details ===');
            console.log('Raw code:', code);
            console.log('Formatted code:', formattedCode);
            console.log('URL:', url);

            const response = await fetch(url);
            const responseText = await response.text();

            const lines = responseText.split(/\r?\n/);
            if (lines.length < 2) return null;

            const encodedText = lines[1].trim();
            const binaryString = atob(encodedText);
            const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
            const decodedText = new TextDecoder('utf-8').decode(bytes);
            const apiData = JSON.parse(decodedText);

            if (!Array.isArray(apiData) || apiData.length === 0) return null;

            // پیدا کردن آیتمی که Name_Malek دارد یا code_tree !== 0
            const validItem = apiData.find(item => item.code_tree !== 0 && item.code_tree !== null && item.Name_Malek) ||
                apiData.find(item => item.code_tree !== 0 && item.code_tree !== null) ||
                apiData[0];

            if (validItem && validItem.Name_Malek) {
                return {
                    code: validItem.codeN || formattedCode,
                    address: validItem.neshani_melk || 'آدرس ثبت نشده',
                    billId: validItem.NShenaseGhabz,
                    paymentId: validItem.NShenasePardakht,
                    amount: validItem.Nmablagh ? Number(validItem.Nmablagh) : undefined,
                    ownerName: validItem.Name_Malek || "نامشخص",
                    area: validItem.MasahatZamin?.toString(),
                    constructionYear: validItem.Tabaghe,
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching property details:', error);
            return null;
        }
    };

    // تابع زوم روی یک feature خاص
    const zoomToFeature = (featureInfo: any) => {
        if (!map || !featureInfo.geometry || isZooming) return;

        setIsZooming(true);

        try {
            let coordinates = null;
            if (featureInfo.geometry.type === 'Polygon') {
                coordinates = featureInfo.geometry.coordinates[0];
            } else if (featureInfo.geometry.type === 'MultiPolygon') {
                coordinates = featureInfo.geometry.coordinates[0][0];
            }

            if (coordinates && coordinates.length > 0) {
                const latLngs = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
                const bounds = L.latLngBounds(latLngs);
                map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 20,
                    duration: 0.5
                });
            }
        } catch (error) {
            console.error('Error zooming to feature:', error);
        } finally {
            setTimeout(() => setIsZooming(false), 500);
        }
    };

    const handleFeatureClick = async (info: any, shouldZoom: boolean = true) => {
        // ابتدا سعی کن اطلاعات دقیق را از API اصلی بگیر (مشابه SearchBox2)
        let detailedData = null;
        if (info.rawCode && info.rawCode !== "کد نوسازی موجود نیست") {
            detailedData = await fetchPropertyDetails(info.rawCode);
        }

        const modalData = {
            code: detailedData?.code || info.nosaziCode,
            address: detailedData?.address || info.address,
            billId: detailedData?.billId || info.billId,
            paymentId: detailedData?.paymentId || info.paymentId,
            amount: detailedData?.amount || info.amount,
            ownerName: detailedData?.ownerName || info.ownerName,
            area: detailedData?.area || info.area,
            constructionYear: detailedData?.constructionYear || info.constructionYear
        };

        setSelectedNosazi(modalData);
        setIsModalOpen(true);
        updateParam(info.nosaziCode);

        if (shouldZoom) {
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

    const highlightFeature = (nosaziCode: string) => {
        layerMap.forEach((layer, code) => {
            if (layer && layer.setStyle) {
                layer.setStyle({ color: '#0d6efd', weight: 1 });
            }
        });

        const layer = layerMap.get(nosaziCode);
        if (layer && layer.setStyle) {
            layer.setStyle({ color: '#ff0000', weight: 3 });
            layer.bringToFront();
        }
    };

    const layerGroupsRef = useRef<any[]>([]);

    const mergeFeaturesLeaflet = useCallback((data: any) => {
        if (!L || !map || !data?.features?.length) return;

        const newFeatures = data.features.filter((feature: any) => {
            const info = extractFeatureInfo(feature);
            return !accumulatedFeatures.has(info.nosaziCode);
        });

        if (newFeatures.length === 0) return;

        const newGeoJson = { type: 'FeatureCollection', features: newFeatures };

        const layerGroup = L.geoJSON(newGeoJson, {
            style: () => ({
                color: '#0d6efd',
                weight: 1,
                opacity: 0.9
            }),
            onEachFeature: (feature: any, layer: any) => {
                const info = extractFeatureInfo(feature);
                featuresCache.set(info.nosaziCode, info);
                accumulatedFeatures.set(info.nosaziCode, feature);
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

        layerGroupsRef.current.push(layerGroup);

        if (urlPointValue && !isModalOpenRef.current && featuresCache.has(urlPointValue)) {
            setTimeout(() => {
                if (!isModalOpenRef.current && featuresCache.has(urlPointValue)) {
                    const info = featuresCache.get(urlPointValue);
                    handleFeatureClick(info, true);
                    highlightFeature(info.nosaziCode);
                }
            }, 300);
        }
    }, [L, map, urlPointValue, selectedNosazi]);

    const clearAllLeafletLayers = useCallback(() => {
        for (const group of layerGroupsRef.current) {
            if (group && group.remove) group.remove();
        }
        layerGroupsRef.current = [];
        layerMap.clear();
        accumulatedFeatures.clear();
        featuresCache.clear();
    }, []);

    const loadData = async () => {
        if (!L || !map) return;

        const currentZoom = map.getZoom();

        if (currentZoom < 16) {
            clearAllLeafletLayers();
            return;
        }

        const bounds = map.getBounds();
        const minx = bounds.getWest();
        const miny = bounds.getSouth();
        const maxx = bounds.getEast();
        const maxy = bounds.getNorth();

        const cachedData = getCachedNosaziData(minx, miny, maxx, maxy, Math.round(currentZoom));
        if (cachedData) {
            mergeFeaturesLeaflet(cachedData);
            return;
        }

        const url = `/api/sabzevar/Sabzevar/Nosazi?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&zoom=${currentZoom}&vcode=f0b4db73-94fb-42c5-adda-857485a90745`;

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
                return;
            }

            setCachedNosaziData(minx, miny, maxx, maxy, Math.round(currentZoom), data);
            mergeFeaturesLeaflet(data);
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
            const cachedFeatures = getAllCachedNosaziFeatures();
            if (cachedFeatures.length > 0) {
                mergeFeaturesLeaflet({ features: cachedFeatures });
            }
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
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>کد نوسازی</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                                {tooltipData.nosaziCode}
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