'use client';

import {
    Plus, Minus, LocateFixed, Layers3,
    CreditCard, Route, MapPin, Check,
    ChevronLeft, ChevronDown, Info, X,
} from 'lucide-react';
import { useMap } from 'react-leaflet';
import { useState, useCallback, useEffect } from 'react';
import { useLayer } from '@/app/contexts/LayerContext';
import type { CategoryTreeNode, GuideEntry } from '@/app/services/layer.service';

const layerIconMap: Record<string, React.ReactNode> = {
    CreditCard: <CreditCard size={16} />,
    Route: <Route size={16} />,
    MapPin: <MapPin size={16} />,
    tree: <MapPin size={16} />,
    'shopping-cart': <MapPin size={16} />,
    mosque: <MapPin size={16} />,
    hospital: <MapPin size={16} />,
    school: <MapPin size={16} />,
    sports: <MapPin size={16} />,
    'map-pin': <MapPin size={16} />,
    road: <Route size={16} />,
};

function TreeNodeItem({
    node, depth, activeLayers, onToggle, expanded, onToggleExpand, onShowGuide,
}: {
    node: CategoryTreeNode;
    depth: number;
    activeLayers: string[];
    onToggle: (id: string) => void;
    expanded: Record<string, boolean>;
    onToggleExpand: (id: string) => void;
    onShowGuide: (guides: GuideEntry[]) => void;
}) {
    const isActive = activeLayers.includes(node.id);
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id];
    const hasGuides = node.guides.length > 0;

    return (
        <div>
            <button
                onClick={() => hasChildren ? onToggleExpand(node.id) : onToggle(node.id)}
                className={`w-full px-4 py-2 flex items-center gap-2 text-right transition-colors duration-150 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                style={{ paddingRight: `${12 + depth * 20}px` }}
            >
                {hasChildren ? (
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronLeft size={14} className="text-gray-400" />}
                    </span>
                ) : (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {isActive && <Check size={12} className="text-white" />}
                    </div>
                )}

                <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                    {layerIconMap[node.icon ?? 'map-pin'] || <MapPin size={16} />}
                </span>

                <span className={`flex-1 text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>
                    {node.name}
                </span>

                {hasGuides && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onShowGuide(node.guides); }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        title="راهنما"
                    >
                        <Info size={14} />
                    </button>
                )}
            </button>

            {hasChildren && isExpanded && (
                <div>
                    {node.children.map(child => (
                        <TreeNodeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            activeLayers={activeLayers}
                            onToggle={onToggle}
                            expanded={expanded}
                            onToggleExpand={onToggleExpand}
                            onShowGuide={onShowGuide}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function GuidePopup({ guides, onClose }: { guides: GuideEntry[]; onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-50" onClick={onClose} />
            <div className="absolute left-0 bottom-full mb-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[260px] max-w-[320px] animate-fadeIn" dir="rtl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">راهنما</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={16} />
                    </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {guides.map(g => (
                        <div key={g.id} className="pb-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                                {g.icon && (
                                    <span className="text-gray-500">
                                        {layerIconMap[g.icon] || <Info size={14} />}
                                    </span>
                                )}
                                <span className="text-sm font-medium text-gray-700">{g.title}</span>
                            </div>
                            {g.description && (
                                <p className="text-xs text-gray-500 mt-1 pr-6">{g.description}</p>
                            )}
                        </div>
                    ))}
                    {guides.length === 0 && (
                        <p className="text-xs text-gray-400">راهنمایی ثبت نشده است</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default function ZoomControls() {
    const [isLocating, setIsLocating] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const { activeLayers, toggleLayer, isPanelOpen, togglePanel, treeNodes, expanded, toggleExpand, getGuides } = useLayer();
    const [guideGuides, setGuideGuides] = useState<GuideEntry[] | null>(null);

    let map;
    try {
        map = useMap();
        if (map && !mapReady) setMapReady(true);
    } catch {
        return null;
    }

    if (!map) return null;

    const handleZoomIn = useCallback(() => map.zoomIn(), [map]);
    const handleZoomOut = useCallback(() => map.zoomOut(), [map]);

    const handleLocate = useCallback(() => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert('مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                map.setView([position.coords.latitude, position.coords.longitude], 18, { animate: true });
                setIsLocating(false);
            },
            () => { alert('خطا در دریافت موقعیت'); setIsLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [map]);

    return (
        <div className="absolute left-6 bottom-52 z-[10] flex flex-col gap-3" style={{ zIndex: '999' }}>
            <div className="bg-white rounded-lg w-10 flex items-center justify-center flex-col shadow-lg">
                <button className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-t-lg transition-colors" onClick={handleZoomIn} title="بزرگنمایی">
                    <Plus size={20} />
                </button>
                <div className="w-full flex items-center justify-center">
                    <div className="h-[1px] w-8 bg-gray-200" />
                </div>
                <button className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-b-lg transition-colors" onClick={handleZoomOut} title="کوچکنمایی">
                    <Minus size={20} />
                </button>
            </div>

            <button className="bg-white h-10 w-10 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50" onClick={handleLocate} disabled={isLocating} title="موقعیت من">
                <LocateFixed size={20} className={isLocating ? 'animate-pulse' : ''} />
            </button>

            <div className="relative">
                <button className={`bg-white h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-colors ${isPanelOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`} onClick={togglePanel} title="انتخاب لایه">
                    <Layers3 size={20} />
                </button>

                {isPanelOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => { togglePanel(); setGuideGuides(null); }} />
                        <div className="absolute left-0 bottom-full mb-2 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[240px] max-w-[300px] animate-fadeIn">
                            {treeNodes.map(node => (
                                <TreeNodeItem
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    activeLayers={activeLayers}
                                    onToggle={toggleLayer}
                                    expanded={expanded}
                                    onToggleExpand={toggleExpand}
                                    onShowGuide={(guides) => setGuideGuides(guides)}
                                />
                            ))}
                            {treeNodes.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">لایه‌ای یافت نشد</div>
                            )}
                        </div>

                        {guideGuides && (
                            <GuidePopup guides={guideGuides} onClose={() => setGuideGuides(null)} />
                        )}
                    </>
                )}
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-in-out; }
            `}</style>
        </div>
    );
}

