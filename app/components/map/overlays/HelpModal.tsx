'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, HelpCircle, MapPin, CreditCard, Route, TreePine, Home,
    Heart, School, Trophy, ShoppingCart, Building, Landmark, Store, Church,
} from 'lucide-react';
import { fetchAllGuides, type GuideItem } from '@/app/services/layer.service';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
    mokeb: <MapPin className="w-7 h-7" />,
    CreditCard: <CreditCard className="w-7 h-7" />,
    MapPin: <MapPin className="w-7 h-7" />,
    'map-pin': <MapPin className="w-7 h-7" />,
    sports: <Trophy className="w-7 h-7" />,
    hospital: <Heart className="w-7 h-7" />,
    Route: <Route className="w-7 h-7" />,
    eskan: <Home className="w-7 h-7" />,
    tree: <TreePine className="w-7 h-7" />,
    mosque: <Church className="w-7 h-7" />,
    school: <School className="w-7 h-7" />,
    'shopping-cart': <ShoppingCart className="w-7 h-7" />,
    building: <Building className="w-7 h-7" />,
    landmark: <Landmark className="w-7 h-7" />,
    store: <Store className="w-7 h-7" />,
};

function getIcon(icon: string | null): React.ReactNode {
    if (icon && iconMap[icon]) return iconMap[icon];
    return <MapPin className="w-7 h-7" />;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [mounted, setMounted] = useState(false);
    const [guides, setGuides] = useState<GuideItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(false);
        fetchAllGuides()
            .then(data => {
                setGuides(data.filter(g => g.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99998 }} onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl" style={{ zIndex: 99999 }} dir="rtl">
                <div className="bg-[#1a5f7a] px-6 py-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <HelpCircle className="w-6 h-6" />
                        <span className="text-lg font-medium">راهنمای لایه‌ها</span>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors" aria-label="بستن">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-[#1a5f7a] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {error && (
                        <p className="text-center text-gray-500 py-16">خطا در دریافت اطلاعات راهنما</p>
                    )}

                    {!loading && !error && guides.length === 0 && (
                        <p className="text-center text-gray-500 py-16">راهنمایی ثبت نشده است</p>
                    )}

                    {!loading && !error && guides.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {guides.map(g => (
                                <div key={g.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 rounded-full bg-[#e8f4f8] flex items-center justify-center text-[#1a5f7a] shrink-0">
                                        {getIcon(g.icon)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-gray-800 mb-1">{g.title}</h3>
                                        {g.description && (
                                            <p className="text-xs text-gray-500 leading-6">{g.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-8 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors">
                        متوجه شدم
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}