// app/components/map/overlays/SelectedLocationsModal.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { X, MapPin, Trash2, Loader2, Star, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import NosaziModal from './NosaziModal';
import { PAY_API_URL } from '@/app/utils/apiConfig';

const API_BASE_URL = PAY_API_URL;

interface Location {
    id: string;
    locationCode: string;
    address: string;
    title: string | null;
    isDefault: boolean;
    createdAt: string;
}

interface SelectedLocationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SelectedLocationsModal({ isOpen, onClose }: SelectedLocationsModalProps) {
    const { isAuthenticated } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ✅ State های جدید برای NosaziModal
    const [isNosaziModalOpen, setIsNosaziModalOpen] = useState(false);
    const [selectedNosazi, setSelectedNosazi] = useState<{
        code: string;
        address: string;
        ownerName?: string;
        area?: string;
    } | null>(null);

    const getToken = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    };

    const fetchLocations = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = getToken();
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/locations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLocations(data.data || []);
            } else {
                setError('خطا در دریافت مکان‌ها');
            }
        } catch {
            setError('خطا در ارتباط با سرور');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) fetchLocations();
    }, [isOpen, fetchLocations]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // ✅ جلوگیری از باز شدن مودال جزئیات هنگام کلیک روی دکمه حذف
        const token = getToken();
        if (!token) return;

        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLocations(prev => prev.filter(l => l.id !== id));
            } else {
                setError('خطا در حذف مکان');
            }
        } catch {
            setError('خطا در ارتباط با سرور');
        } finally {
            setDeletingId(null);
        }
    };

    // ✅ تابع جدید برای باز کردن مودال جزئیات
    const handleViewDetails = (loc: Location) => {
        setSelectedNosazi({
            code: loc.locationCode,
            address: loc.address || 'آدرس ثبت نشده',
            ownerName: loc.title || undefined,
            area: undefined
        });
        setIsNosaziModalOpen(true);
    };

    const handleCloseNosaziModal = () => {
        setIsNosaziModalOpen(false);
        setSelectedNosazi(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-lg" dir="rtl">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-[#145d6e] px-5 py-3 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 fill-white" />
                            <p className="text-sm font-medium">مکان‌های منتخب</p>
                        </div>
                        <button onClick={onClose} className="hover:opacity-80 transition-opacity">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-10 h-10 text-[#145d6e] animate-spin" />
                                <p className="mt-3 text-gray-500 text-sm">در حال بارگذاری...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                                <p className="text-red-600 text-sm">{error}</p>
                                <button onClick={fetchLocations}
                                    className="mt-3 px-4 py-2 bg-[#145d6e] text-white text-sm rounded-lg hover:bg-[#1a7a8f] transition-colors">
                                    تلاش مجدد
                                </button>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm">هیچ مکانی ذخیره نشده است</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    روی ملک موردنظر کلیک کنید و آن را به مکان‌های منتخب اضافه کنید
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {locations.map((loc) => (
                                    <div
                                        key={loc.id}
                                        onClick={() => handleViewDetails(loc)} // ✅ اضافه کردن کلیک برای باز کردن جزئیات
                                        className="border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:border-[#145d6e]/30 hover:bg-[#145d6e]/5 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-[#145d6e]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="w-5 h-5 text-[#145d6e]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-[#145d6e] text-sm font-medium">
                                                    {loc.locationCode}
                                                </span>
                                                {loc.isDefault && (
                                                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                                                        پیش‌فرض
                                                    </span>
                                                )}
                                            </div>
                                            {loc.title && (
                                                <p className="text-sm text-gray-700 mb-1">{loc.title}</p>
                                            )}
                                            {loc.address && (
                                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                    {loc.address}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(loc.createdAt).toLocaleDateString('fa-IR')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {/* ✅ دکمه مشاهده جزئیات */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetails(loc);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#145d6e] hover:bg-[#145d6e]/10 transition-colors"
                                                title="مشاهده جزئیات"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* دکمه حذف */}
                                            <button
                                                onClick={(e) => handleDelete(e, loc.id)}
                                                disabled={deletingId === loc.id}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="حذف"
                                            >
                                                {deletingId === loc.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ اضافه کردن NosaziModal */}
            <NosaziModal
                isOpen={isNosaziModalOpen}
                onClose={handleCloseNosaziModal}
                nosaziData={selectedNosazi || { code: '', address: '' }}
            />
        </>
    );
}