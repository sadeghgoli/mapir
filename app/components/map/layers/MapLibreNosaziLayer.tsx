'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';
import NosaziModal from '../overlays/NosaziModal';
import { getFirstPoint, setPoints, removeAllPoints } from '@/app/utils/urlManager';

const SOURCE_ID = 'nosazi-data';
const FILL_LAYER_ID = 'nosazi-fill';
const OUTLINE_LAYER_ID = 'nosazi-outline';
const HIGHLIGHT_LAYER_ID = 'nosazi-highlight';

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

const formatCodeForServer = (code: string): string => {
    if (!code || code === "کد نوسازی موجود نیست") {
        return '0-00-000-000-00-00-00';
    }
    let parts = code.split('-');
    const groupSizes = [1, 2, 3, 3, 2, 2, 2];
    const fullParts = [];
    for (let i = 0; i < groupSizes.length; i++) {
        if (i < parts.length && parts[i]) {
            fullParts.push(parts[i].padStart(groupSizes[i], '0'));
        } else {
            fullParts.push('0'.repeat(groupSizes[i]));
        }
    }
    return fullParts.join('-');
};

const formatCodeForDisplay = (code: string): string => {
    if (!code || code === "کد نوسازی موجود نیست") return code;
    let parts = code.split('-');
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
    const cleanedParts = parts.map((part, index) => {
        if (index === 0) return part;
        return part.replace(/^0+/, '') || '0';
    });
    return cleanedParts.join('-');
};

const featuresCache = new Map<string, any>();

interface MapLibreNosaziLayerProps {
    onLoadingChange?: (isLoading: boolean) => void;
}

export default function MapLibreNosaziLayer({ onLoadingChange }: MapLibreNosaziLayerProps) {
    const map = useMapLibre();
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const initRef = useRef(false);
    const [tooltipData, setTooltipData] = useState<{
        show: boolean;
        x: number;
        y: number;
        nosaziCode: string;
        address: string;
    }>({ show: false, x: 0, y: 0, nosaziCode: '', address: '' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNosazi, setSelectedNosazi] = useState<any>(null);
    const [isZooming, setIsZooming] = useState(false);
    const { paramValue: urlPointValue, updateParam } = useTollPoint();
    const isModalOpenRef = useRef(isModalOpen);
    const highlightedCodeRef = useRef<string | null>(null);
    const loadingRef = useRef(loading);

    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    useEffect(() => {
        return () => {
            onLoadingChange?.(false);
            featuresCache.clear();
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, []);

    const utf8ToBase64 = (str: string): string => {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    };

    const extractFeatureInfo = (feature: any) => {
        const props = feature.properties || {};

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

        const formattedCode = formatCodeForDisplay(rawCode);

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

        return {
            nosaziCode: formattedCode,
            rawCode: rawCode,
            address: address,
            billId: billId,
            paymentId: paymentId,
            amount: amount,
            ownerName: ownerName,
            area: area,
            constructionYear: constructionYear,
            geometry: feature.geometry,
        };
    };

    const fetchPropertyDetails = async (code: string) => {
        try {
            const formattedCode = formatCodeForServer(code);
            const base64Data = utf8ToBase64(formattedCode);
            const url = `/api/AmardDataHandler.ashx?data=${encodeURIComponent(base64Data)}`;

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

            const validItem = apiData.find((item: any) => item.code_tree !== 0 && item.code_tree !== null && item.Name_Malek) ||
                apiData.find((item: any) => item.code_tree !== 0 && item.code_tree !== null) ||
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
                const bounds = coordinates.reduce(
                    (b: maplibregl.LngLatBounds, coord: number[]) => b.extend(coord as [number, number]),
                    new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
                );
                map.fitBounds(bounds, { padding: 50, maxZoom: 20 });
            }
        } catch (error) {
            console.error('Error zooming to feature:', error);
        } finally {
            setTimeout(() => setIsZooming(false), 500);
        }
    };

    const handleFeatureClick = async (info: any, shouldZoom: boolean = true) => {
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
            constructionYear: detailedData?.constructionYear || info.constructionYear,
        };

        setSelectedNosazi(modalData);
        setIsModalOpen(true);
        updateParam(info.nosaziCode);

        if (shouldZoom) {
            setTimeout(() => { zoomToFeature(info); }, 100);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedNosazi(null);
        updateParam(null);
    };

    const highlightFeature = (nosaziCode: string) => {
        if (!map) return;
        if (highlightedCodeRef.current === nosaziCode) return;
        highlightedCodeRef.current = nosaziCode;
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) {
            map.setFilter(HIGHLIGHT_LAYER_ID, ['==', ['get', 'code_nosazi'], nosaziCode]);
        }
    };

    const loadData = async () => {
        if (!map) return;

        const currentZoom = map.getZoom();

        if (currentZoom < 16) {
            const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
            if (src) {
                src.setData({ type: 'FeatureCollection', features: [] });
            }
            featuresCache.clear();
            highlightedCodeRef.current = null;
            return;
        }

        const bounds = map.getBounds();
        const url = `/api/sabzevar/Sabzevar/Nosazi?minx=${bounds.getWest()}&miny=${bounds.getSouth()}&maxx=${bounds.getEast()}&maxy=${bounds.getNorth()}&zoom=${currentZoom}&vcode=f0b4db73-94fb-42c5-adda-857485a90745`;

        setLoading(true);

        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        try {
            const response = await fetch(url, {
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.features || data.features.length === 0) {
                const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
                if (src) {
                    src.setData({ type: 'FeatureCollection', features: [] });
                }
                featuresCache.clear();
                return;
            }

            const codeNosaziProp = (feature: any) => {
                const props = feature.properties || {};
                if (props.name && props.name !== "0" && props.name !== "") return 'name';
                if (props.Code_nosaz && props.Code_nosaz !== "0" && props.Code_nosaz !== "") return 'Code_nosaz';
                if (props.code && props.code !== "0" && props.code !== "") return 'code';
                if (props.codeN && props.codeN !== "0" && props.codeN !== "") return 'codeN';
                if (props.Code && props.Code !== "0" && props.Code !== "") return 'Code';
                return null;
            };

            const enrichedFeatures = data.features.map((feature: any) => {
                const info = extractFeatureInfo(feature);
                featuresCache.set(info.nosaziCode, info);
                const propKey = codeNosaziProp(feature) || 'code_nosazi';
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        code_nosazi: info.nosaziCode,
                    },
                };
            });

            const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
            if (src) {
                src.setData({
                    type: 'FeatureCollection',
                    features: enrichedFeatures,
                });
            }

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

    useEffect(() => {
        if (!map || initRef.current) return;
        initRef.current = true;

        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
            id: FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            paint: {
                'fill-color': '#0d6efd',
                'fill-opacity': 0.3,
            },
        });

        map.addLayer({
            id: OUTLINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: {
                'line-color': '#0d6efd',
                'line-width': 1,
                'line-opacity': 0.9,
            },
        });

        map.addLayer({
            id: HIGHLIGHT_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'code_nosazi'], ''],
            paint: {
                'line-color': '#ff0000',
                'line-width': 3,
            },
        });

        const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const code = feature.properties?.code_nosazi;
            if (!code || !featuresCache.has(code)) return;
            const info = featuresCache.get(code);
            const point = map.project(e.lngLat);
            setTooltipData({
                show: true,
                x: point.x,
                y: point.y - 20,
                nosaziCode: info.nosaziCode,
                address: info.address,
            });
        };

        const handleMouseLeave = () => {
            setTooltipData(prev => ({ ...prev, show: false }));
        };

        const handleLayerClick = async (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const code = feature.properties?.code_nosazi;
            if (!code || !featuresCache.has(code)) return;
            const info = featuresCache.get(code);
            await handleFeatureClick(info, true);
            highlightFeature(info.nosaziCode);
        };

        const handleMouseEnter = () => {
            map.getCanvas().style.cursor = 'pointer';
        };

        const handleCanvasMouseLeave = () => {
            map.getCanvas().style.cursor = '';
        };

        map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter);
        map.on('mousemove', FILL_LAYER_ID, handleMouseMove);
        map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave);
        map.on('click', FILL_LAYER_ID, handleLayerClick);

        const handleMoveEnd = () => {
            loadData();
            setTooltipData(prev => ({ ...prev, show: false }));
        };

        map.on('moveend', handleMoveEnd);

        return () => {
            map.off('mouseenter', FILL_LAYER_ID, handleMouseEnter);
            map.off('mousemove', FILL_LAYER_ID, handleMouseMove);
            map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave);
            map.off('click', FILL_LAYER_ID, handleLayerClick);
            map.off('moveend', handleMoveEnd);
            map.getCanvas().style.cursor = '';

            if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
            if (map.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID);
            if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
            initRef.current = false;
        };
    }, [map]);

    useEffect(() => {
        if (map && initRef.current) {
            loadData();
        }
    }, [map]);

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
                        animation: 'fadeIn 0.2s ease-in-out',
                    }}
                >
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        minWidth: '260px',
                        padding: '14px',
                        direction: 'rtl',
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
        </>
    );
}
