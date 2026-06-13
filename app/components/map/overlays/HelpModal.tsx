'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, MapPin, Building2, FileText, CheckSquare } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface StepItem {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const steps: StepItem[] = [
        {
            number: 'اول',
            title: 'انتخاب ملک از روی نقشه',
            description: 'قطعه زمین موردنظر را از روی نقشه انتخاب کنید تا اطلاعات اولیه ملک نمایش داده شود.',
            icon: <MapPin className="w-7 h-7" />,
        },
        {
            number: 'دوم',
            title: 'انتخاب واحد یا ساختمان',
            description: 'در صورت چندواحدی بودن ساختمان، واحد موردنظر را از لیست انتخاب کنید.',
            icon: <Building2 className="w-7 h-7" />,
        },
        {
            number: 'سوم',
            title: 'مشاهده اطلاعات قبض',
            description: 'شناسه قبض، شناسه پرداخت و اطلاعات ملک را بررسی کنید.',
            icon: <FileText className="w-7 h-7" />,
        },
        {
            number: 'چهارم',
            title: 'پرداخت و دریافت رسید',
            description: 'پس از پرداخت آنلاین، رسید و کد رهگیری تراکنش برای شما نمایش داده خواهد شد.',
            icon: <CheckSquare className="w-7 h-7" />,
        },
    ];

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                style={{ zIndex: 99998 }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl"
                style={{ zIndex: 99999 }}
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-[#1a5f7a] px-6 py-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <HelpCircle className="w-6 h-6" />
                        <span className="text-lg font-medium">راهنما</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Intro Text */}
                    <p className="text-center text-gray-700 text-base mb-10 leading-8">
                        برای استعلام و پرداخت عوارض نوسازی، کافی است مراحل زیر را دنبال کنید :
                    </p>

                    {/* Steps Timeline */}
                    <div className="relative max-w-2xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex items-start gap-6 mb-0 last:mb-0">
                                {/* Icon Column */}
                                <div className="flex flex-col items-center shrink-0">
                                    {/* Icon Circle */}
                                    <div className="w-16 h-16 rounded-full bg-[#e8f4f8] flex items-center justify-center text-[#1a5f7a] shrink-0 relative z-10">
                                        {step.icon}
                                    </div>

                                    {/* Dashed Line (except for last item) */}
                                    {index < steps.length - 1 && (
                                        <div className="w-0.5 h-16 border-r-2 border-dashed border-[#1a5f7a]/40 mt-2" />
                                    )}
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 pt-2">
                                    <h3 className="text-lg font-bold text-[#1a5f7a] mb-2">
                                        گام {step.number} : {step.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-7">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                    >
                        متوجه شدم
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}