import React, { useEffect } from 'react';
import {X} from "lucide-react";

// ۱. تعریف اینترفیس برای پراپ‌های کامپوننت
interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: any; // اگر ساختار دقیق data را می‌دانید، می‌توانید به جای any تایپ دقیق‌تری بنویسید (مثلاً Record<string, any>)
}

const PaymentHistoryModal = ({ isOpen, onClose, data }: PaymentHistoryModalProps) => {
    // بستن مودال با دکمه ESC
    useEffect(() => {
        // ۳. مشخص کردن تایپ KeyboardEvent برای پارامتر e
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // جلوگیری از اسکرول صفحه هنگام باز بودن مودال
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;


    // تابع برای تعیین رنگ وضعیت
    const getStatusStyle = (status: string): string => {
        if (status === 'موفق') {
            return 'bg-green-100 text-green-700';
        } else if (status === 'ناموفق') {
            return 'bg-red-50 text-red-600';
        }
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <>
            {/* بکدراپ تیره */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onClose}
            />

            {/* مودال اصلی */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-5xl animate-slideUp">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* هدر مودال با اطلاعات کاربر */}
                    <div className="bg-[#145d6e] px-5 py-2 text-white flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <img src="/images/solar_user-circle-bold-duotone2.png" alt=""/>
                            <p className="text-sm">
                                پروفایل کاربری
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="py-2 text-white text-sm font-medium transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col p-4 bg-gray-50 " dir="rtl">
                        <div className="p-2 flex justify-between items-center">
                            <p className="font-bold">
                                5 تراکنش موجود است
                            </p>
                            <div>
                                <input type="text" className="shadow-md bg-white p-3 rounded-lg text-sm w-sm" placeholder="تراکنش مورد نظر را جستجو کنید ..."/>
                            </div>

                        </div>

                        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* هدر جدول */}
                            <div className="bg-gray-100 px-6 py-4 flex items-center border-b border-gray-200 font-bold text-gray-500 text-sm">
                                <div className="w-16 text-center">رد.</div>
                                <div className="w-40 text-center">کد نویسازی</div>
                                <div className="w-40 text-center">کد پیگیری</div>
                                <div className="w-48 text-center">شناسه قبض</div>
                                <div className="w-48 text-center">شناسه پرداخت</div>
                                <div className="w-36 text-center">مبلغ</div>
                                <div className="w-48 text-center">ساعت و تاریخ</div>
                                <div className="w-24 text-center">وضعیت</div>
                            </div>

                            {/* بدنه جدول با اسکرول عمودی */}
                            <div className="max-h-[600px] overflow-y-auto">
                                {/* اسکرول افقی برای ریسپانسیو بودن در موبایل */}
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px]">
                                        <tbody className="divide-y divide-gray-100">
                                        {data?.map((row: Record<string, any>, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                {/* ردیف */}
                                                <td className="px-6 py-4 text-gray-500 text-sm w-16 text-center">
                                                    {row.id}.
                                                </td>

                                                {/* کد نویسازی */}
                                                <td className="px-6 py-4 text-gray-800 text-sm w-40 text-center">
                                                    {row.trackingCode}
                                                </td>

                                                {/* کد پیگیری */}
                                                <td className="px-6 py-4 text-gray-800 text-sm w-40 text-center">
                                                    {row.authCode}
                                                </td>

                                                {/* شناسه قبض */}
                                                <td className="px-6 py-4 text-gray-800 text-sm w-48 text-center">
                                                    {row.billId}
                                                </td>

                                                {/* شناسه پرداخت */}
                                                <td className="px-6 py-4 text-gray-800 text-sm w-48 text-center">
                                                    {row.paymentId}
                                                </td>

                                                {/* مبلغ */}
                                                <td className="px-6 py-4 text-gray-800 text-sm w-36 text-center">
                                                    {row.amount}
                                                </td>

                                                {/* ساعت و تاریخ */}
                                                <td className="px-6 py-4 text-gray-500 text-sm w-48 text-center">
                                                    {row.date} - {row.time}
                                                </td>

                                                {/* وضعیت */}
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentHistoryModal;