'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, Loader2, ArrowRight, RefreshCw, HelpCircle, CreditCard } from 'lucide-react';

interface PaymentInfo {
    orderId: string;
    locationCode: string;
    amount: number;
    title: string;
    errorCode?: string;
    errorMessage?: string;
}

export default function PaymentFailurePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

    useEffect(() => {
        // Get error details from URL params
        const errorCode = searchParams.get('error_code');
        const errorMessage = searchParams.get('error_message');
        
        if (errorCode && errorMessage) {
            setErrorDetails({
                code: errorCode,
                message: decodeURIComponent(errorMessage)
            });
        }

        // Get payment info from session storage
        const stored = sessionStorage.getItem('paymentInfo');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPaymentInfo(parsed);
                // Keep the data for retry attempts
                // sessionStorage.removeItem('paymentInfo'); // Don't remove on failure so user can retry
            } catch (e) {
                console.error('Error parsing payment info:', e);
            }
        }
        setIsLoading(false);
    }, [searchParams]);

    const handleRetryPayment = () => {
        // Go back to payment page with the same data
        if (paymentInfo) {
            router.push(`/payment?location=${paymentInfo.locationCode}&amount=${paymentInfo.amount}&title=${encodeURIComponent(paymentInfo.title)}`);
        } else {
            router.push('/payment');
        }
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const handleContactSupport = () => {
        // You can implement contact support logic here
        // For example, open a contact form or show a phone number
        window.location.href = 'mailto:support@example.com';
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

    // Common error messages
    const getErrorMessage = (code?: string) => {
        const errorMap: { [key: string]: string } = {
            'INSUFFICIENT_BALANCE': 'موجودی حساب شما کافی نیست',
            'CARD_EXPIRED': 'کارت شما منقضی شده است',
            'INVALID_CARD': 'شماره کارت نامعتبر است',
            'TRANSACTION_LIMIT': 'مبلغ تراکنش بیش از حد مجاز است',
            'NETWORK_ERROR': 'خطا در ارتباط با بانک',
            'CANCELLED': 'پرداخت توسط کاربر لغو شد',
            'TIMEOUT': 'زمان تراکنش به پایان رسید',
            'DUPLICATE': 'این تراکنش قبلاً ثبت شده است',
            'BANK_ERROR': 'خطا در سیستم بانکی'
        };
        return code && errorMap[code] ? errorMap[code] : 'خطای ناشناخته در پرداخت';
    };

    const errorCode = errorDetails?.code || searchParams.get('error_code') || 'UNKNOWN_ERROR';
    const errorMsg = errorDetails?.message || getErrorMessage(errorCode);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#145d6e]/5 to-white flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">پرداخت ناموفق</h1>
                    <p className="text-gray-500 mb-1">متأسفانه تراکنش شما انجام نشد</p>
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mt-2">
                        {errorMsg}
                    </p>
                    
                    {errorCode && (
                        <div className="mt-2 text-xs text-gray-400">
                            کد خطا: {errorCode}
                        </div>
                    )}
                </div>

                {paymentInfo && (
                    <div className="bg-gray-50 rounded-xl p-4 my-6 text-right space-y-2 border border-gray-200">
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
                            <span className="text-lg font-bold text-red-600">
                                {paymentInfo.amount.toLocaleString()} ریال
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                   

                    <button
                        onClick={handleGoHome}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                        بازگشت به نقشه
                    </button>

                    <div className="flex gap-3">
                      
                    </div>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800 text-center">
                        مبلغ از حساب شما کسر نشده است. در صورت مشاهده هرگونه کسر مبلغ، لطفاً با پشتیبانی تماس بگیرید.
                    </p>
                </div>
            </div>
        </div>
    );
}