import React, { useEffect } from 'react';
import { X } from "lucide-react";

interface SelectedLocationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: any[]; // اگر ساختار دقیق آیتم‌های آرایه data را می‌دانید، می‌توانید به جای any تایپ دقیق‌تری بنویسید
}

const SelectedLocationsModal = ({ isOpen, onClose, data }: SelectedLocationsModalProps) => {

    // بستن مودال با دکمه ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { // <-- اینجا تغییر کرد
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

    return (
        <>
            {/* بکدراپ تیره */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
            />

            {/* مودال اصلی */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl animate-slideUp">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* هدر مودال */}
                    <div className="bg-[#145d6e] px-5 py-3 text-white flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <img src="/images/solar_star-circle-bold-duotone22.png" alt="star" className="w-6 h-6" />
                            <p className="text-sm font-medium">
                                مکان های منتخب
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="py-2 text-white text-sm font-medium transition-colors hover:bg-white/10 rounded-lg p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col p-6 bg-gray-50" dir="rtl">
                        {/* تعداد مکان‌ها */}
                        <div className="mb-4 ">
                            <p className="text-gray-700 font-bold text-base">
                                {data?.length || 0} مکان موجود است .
                            </p>
                        </div>

                        {/* لیست مکان‌ها */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {data?.map((location, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">


                                        {/* محتوای اصلی */}
                                        <div className="flex-1 mx-4">
                                            {/* کد نوسازی */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <img
                                                    src="/images/apartment.png"
                                                    alt="building"
                                                    className="w-12 h-12 mt-0.5 flex-shrink-0"
                                                />
                                                <span className="text-gray-600 text-sm font-medium">
                                                    کد نوسازی:
                                                </span>
                                                <span className="text-gray-800 text-base font-bold font-mono dir-ltr">
                                                    {location.code}
                                                </span>
                                            </div>

                                            {/* خط جداکننده */}
                                            <div className="border-t border-gray-100 my-3" />

                                            {/* آدرس ملک */}
                                            <div className="flex items-start gap-2">
                                                <img
                                                    src="/images/solar_map-point-rotate-outline.png"
                                                    alt="building"
                                                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                                                />
                                                <div>
                                                    <span className="text-gray-600 text-sm block mb-1">
                                                        آدرس ملک
                                                    </span>
                                                    <p className="text-gray-800 text-sm leading-relaxed">
                                                        {location.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* آیکون ساختمان */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src="/images/solar_star-circle-bold-duotone.png"
                                                alt="building"
                                                className="w-10 h-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SelectedLocationsModal;