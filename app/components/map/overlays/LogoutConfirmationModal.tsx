import React, { useEffect } from 'react';
import { X } from "lucide-react";

// ۱. تعریف اینترفیس برای پراپ‌های کامپوننت
interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ۲. اعمال اینترفیس به پراپ‌های کامپوننت
const LogoutConfirmationModal = ({ isOpen, onClose }: LogoutConfirmationModalProps) => {
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

    const handleConfirm = () => {
        onClose();
    };

    return (
        <>
            {/* بکدراپ تیره */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
            />

            {/* مودال اصلی */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-slideUp">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* هدر مودال */}
                    <div className="bg-[#145d6e] px-5 py-3 text-white flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <p className="text-sm font-medium">
                                خروج از حساب کاربری
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="py-2 text-white text-sm font-medium transition-colors hover:bg-white/10 rounded-lg p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* محتوای مودال */}
                    <div className="flex flex-col p-8 bg-gray-50" dir="rtl">
                        {/* آیکون logout */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                        </div>

                        {/* متن سوال */}
                        <div className="text-center mb-8">
                            <p className="text-gray-800 text-lg font-medium leading-relaxed">
                                آیا مایل به خروج از حساب کاربری خود هستید؟
                            </p>
                        </div>

                        {/* دکمه‌ها */}
                        <div className="flex gap-3">

                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium text-base hover:bg-red-700 transition-all duration-200"
                            >
                                خروج از حساب
                            </button>

                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-base hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                            >
                                خیر
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogoutConfirmationModal;