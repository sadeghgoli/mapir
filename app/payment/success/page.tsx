'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight, Receipt } from 'lucide-react';

interface PaymentInfo {
    orderId: string;
    locationCode: string;
    amount: number;
    title: string;
}

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = sessionStorage.getItem('paymentInfo');
        if (stored) {
            try {
                setPaymentInfo(JSON.parse(stored));
                sessionStorage.removeItem('paymentInfo');
            } catch (e) {
                console.error('Error parsing payment info:', e);
            }
        }
        setIsLoading(false);
    }, []);

    const handleGoHome = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#145d6e]/5 to-white flex items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-[#145d6e] animate-spin" />
                    <p className="mt-4 text-gray-600">در حال بررسی...</p>
                </div>
            </div>
        );
    }

    const isSuccess = searchParams.get('status') !== 'failed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#145d6e]/5 to-white flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                {isSuccess ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">پرداخت با موفقیت انجام شد</h1>
                        <p className="text-gray-500 mb-6">تراکنش شما با موفقیت ثبت گردید</p>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">پرداخت ناموفق</h1>
                        <p className="text-gray-500 mb-6">متأسفانه تراکنش شما انجام نشد</p>
                    </>
                )}

                {paymentInfo && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right space-y-2 border border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">عنوان:</span>
                            <span className="text-sm font-medium text-gray-800">{paymentInfo.title}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">کد نوسازی:</span>
                            <span className="text-sm font-mono text-[#145d6e]">{paymentInfo.locationCode}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-500">مبلغ:</span>
                            <span className="text-lg font-bold text-green-600">
                                {paymentInfo.amount.toLocaleString()} ریال
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleGoHome}
                        className="w-full py-3 bg-[#145d6e] text-white rounded-xl font-medium hover:bg-[#1a7a8f] transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                        بازگشت به نقشه
                    </button>
                    <button
                        onClick={() => router.push('/payment/history')}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Receipt className="w-5 h-5" />
                        مشاهده تاریخچه پرداخت‌ها
                    </button>
                </div>
            </div>
        </div>
    );
}