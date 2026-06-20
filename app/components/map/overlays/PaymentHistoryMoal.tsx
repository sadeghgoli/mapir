'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from '@/app/contexts/AuthContext';

const API_BASE_URL = 'https://apiweb-payonmap.sabzevar.ir:8446';

interface PaymentHistoryItem {
    id: number;
    trackingCode: string;
    authCode: string;
    billId: string;
    paymentId: string;
    amount: string;
    date: string;
    time: string;
    status: string;
    locationCode: string;
    title?: string;
}

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PaymentHistoryModal = ({ isOpen, onClose }: PaymentHistoryModalProps) => {
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState<PaymentHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalCount, setTotalCount] = useState(0);

    const getToken = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    };

    const fetchHistory = useCallback(async () => {
        if (!isAuthenticated) return;
        const token = getToken();
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/payment/history?page=1&pageSize=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setData(result.data || []);
                    setTotalCount(result.totalCount || 0);
                } else {
                    setError(result.message || 'خطا در دریافت اطلاعات');
                }
            } else {
                setError('خطا در دریافت اطلاعات');
            }
        } catch {
            setError('خطا در ارتباط با سرور');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            fetchHistory();
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, fetchHistory]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const getStatusStyle = (status: string): string => {
        if (status === 'موفق') return 'bg-green-100 text-green-700';
        if (status === 'ناموفق') return 'bg-red-50 text-red-600';
        if (status === 'در انتظار') return 'bg-amber-100 text-amber-700';
        if (status === 'منقضی شده') return 'bg-gray-100 text-gray-600';
        return 'bg-gray-100 text-gray-600';
    };

    const filteredData = data.filter(row =>
        row.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.billId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.locationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]" onClick={onClose} />

            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-5xl">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    <div className="bg-[#145d6e] px-5 py-3 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <img src="/images/solar_user-circle-bold-duotone2.png" alt="" className="w-5 h-5" />
                            <p className="text-sm font-medium">تاریخچه پرداخت‌ها</p>
                        </div>
                        <button onClick={onClose} className="hover:opacity-80 transition-opacity">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col p-4 bg-gray-50" dir="rtl">
                        <div className="p-2 flex flex-col md:flex-row justify-between items-center mb-3">
                            <p className="font-bold text-gray-700">
                                {totalCount > 0 ? `${totalCount} تراکنش موجود است` : 'هیچ تراکنشی موجود نیست'}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="shadow-md bg-white p-3 rounded-lg text-sm w-64 border border-gray-200 focus:border-[#145d6e] focus:outline-none"
                                    placeholder="جستجو ..."
                                />
                                <button
                                    onClick={fetchHistory}
                                    disabled={isLoading}
                                    className="p-3 bg-[#145d6e] text-white rounded-lg hover:bg-[#1a7a8f] transition-colors disabled:opacity-50"
                                    title="بروزرسانی"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                            {isLoading && data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-10 h-10 text-[#145d6e] animate-spin" />
                                    <p className="mt-3 text-gray-500 text-sm">در حال بارگذاری...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                                    <p className="text-red-600 text-sm">{error}</p>
                                    <button
                                        onClick={fetchHistory}
                                        className="mt-3 px-4 py-2 bg-[#145d6e] text-white text-sm rounded-lg hover:bg-[#1a7a8f] transition-colors"
                                    >
                                        تلاش مجدد
                                    </button>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">هیچ تراکنشی یافت نشد</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-100 px-6 py-4 flex items-center border-b border-gray-200 font-bold text-gray-500 text-sm">
                                        <div className="w-16 text-center">رد.</div>
                                        <div className="w-40 text-center">کد نوسازی</div>
                                        <div className="w-40 text-center">کد پیگیری</div>
                                        <div className="w-48 text-center">شناسه قبض</div>
                                        <div className="w-48 text-center">شناسه پرداخت</div>
                                        <div className="w-36 text-center">مبلغ</div>
                                        <div className="w-48 text-center">ساعت و تاریخ</div>
                                        <div className="w-24 text-center">وضعیت</div>
                                    </div>

                                    <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[800px] ">
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredData.map((row, index) => (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-500 text-sm w-16 text-center">
                                                                {row.id}.
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-800 text-sm w-40 text-center font-mono">
                                                                {row.locationCode}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-800 text-sm w-40 text-center font-mono">
                                                                {row.trackingCode}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-800 text-sm w-48 text-center font-mono">
                                                                {row.billId}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-800 text-sm w-48 text-center font-mono">
                                                                {row.paymentId}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-800 text-sm w-36 text-center font-medium">
                                                                {row.amount}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500 text-sm w-48 text-center">
                                                                {row.date} - {row.time}
                                                            </td>
                                                            <td className="px-6 py-4 w-24 text-center">
                                                                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusStyle(row.status)}`}>
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentHistoryModal;