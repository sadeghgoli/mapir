'use client';

import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    X,
    Printer,
    CheckCircle,
    CreditCard,
    MapPin,
    FileText,
    Copy,
    Check,
    ChevronRight,
    Building2,
    Users,
    Ruler,
    Search
} from 'lucide-react';

interface NosaziModalProps {
    isOpen: boolean;
    onClose: () => void;
    nosaziData: {
        code: string;
        address: string;
        billId?: string;
        paymentId?: string;
        amount?: number;
        ownerName?: string;
        area?: string;
        constructionYear?: string;
    };
}

const MOCK_UNITS = [
    {id: '1', code: '۸۷۶۵۴۳۲۱۰۱۲۳', owner: 'محسن رضایی', floor: 'اول', unit: 'یک', area: '۱۲۰'},
    {id: '2', code: '۸۷۶۵۴۳۲۱۰۱۲۴', owner: 'علی احمدی', floor: 'اول', unit: 'دو', area: '۹۵'},
];

const MOCK_CHARGES = [
    {id: 'c1', title: 'عوارض نوسازی و عمران', amount: 2356000, icon: Building2},
    {id: 'c2', title: 'بهای خدمات مدیریت پسماند مسکونی', amount: 6604000, icon: Users},
];

export default function NosaziModal({isOpen, onClose, nosaziData}: NosaziModalProps) {
    // =================================================================
    // ۱. تمام هوک‌ها باید در بالاترین سطح و قبل از هر return ای باشند
    // =================================================================
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ownerName, setOwnerName] = useState(nosaziData.ownerName || '');
    const [area, setArea] = useState(nosaziData.area || '');
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [selectedCharge, setSelectedCharge] = useState<any>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // هوک‌های اثر (Effects)
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setStep(1);
            setSelectedUnit(null);
            setSelectedCharge(null);
            setOwnerName(nosaziData.ownerName || '');
            setArea(nosaziData.area || '');
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, nosaziData.ownerName, nosaziData.area]);

    // =================================================================
    // ۲. توابع معمولی
    // =================================================================
    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            // منطق پرداخت موفق اینجا قرار می‌گیرد
        }, 2000);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    // =================================================================
    // ۳. بازگشت شرطی (Early Return) باید حتماً بعد از تمام هوک‌ها باشد
    // =================================================================
    if (!isOpen || !mounted) return null;

    const stepTitles = {
        1: 'اطلاعات مالک',
        2: 'انتخاب واحد ساختمان',
        3: 'انتخاب عوارض قابل پرداخت',
        4: 'جزئیات و تایید پرداخت',
    };

    // =================================================================
    // ۴. استفاده از createPortal برای حل مشکل z-index و قرارگیری زیر لایه‌ها
    // =================================================================
    return typeof document !== 'undefined' ? (
        createPortal(
            <>
                {/* بکدراپ تیره با z-index بسیار بالا */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    style={{zIndex: 99998}}
                    onClick={onClose}
                />

                {/* مودال اصلی */}
                <div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl"
                    style={{zIndex: 99999}}
                    dir="rtl"
                >
                    {/* هدر مودال */}
                    <div
                        className="bg-gradient-to-r from-[#145d6e] to-[#1a7a8f] px-6 py-4 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <img src="/images/nosazi-modal.png" className={"w-5 h-5"} alt=""/>
                            </div>
                            <div>
                                <p className="text-sm font-bold">{stepTitles[step]}</p>
                                <p className="text-xs text-white/70">مرحله {step} از ۴</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                                className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* بدنه مودال (اسکرول‌خور) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* مرحله ۱ */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div
                                    className="text-center rounded-xl p-4 border  shadow border-1 border-[#1a7a8f] flex gap-4 items-center ">
                                    <img src="/images/apartment.png" className={'w-12 h-12'} alt=""/>
                                    <p className="text-xs text-gray-500 mb-1">کد نوسازی :</p>
                                    <p className="text-2xl font-bold text-[#145d6e] font-mono tracking-wider">{nosaziData.code}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">نام و نام
                                            خانوادگی مالک</label>
                                        <div className="relative">
                                            <Users
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                            <input type="text" value={ownerName} disabled
                                                   onChange={(e) => setOwnerName(e.target.value)}
                                                   className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145d6e]/20 focus:border-[#145d6e] outline-none transition-all"
                                                   placeholder="نام مالک را وارد کنید"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">مساحت ملک (متر
                                            مربع)</label>
                                        <div className="relative">
                                            <Ruler
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                            <input type="text" value={area} onChange={(e) => setArea(e.target.value)}
                                                   className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145d6e]/20 focus:border-[#145d6e] outline-none transition-all"
                                                   placeholder="مثال: ۱۲۰"/>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">آدرس ملک</label>
                                    <div
                                        className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5"/>
                                        <p className="text-sm text-gray-700 leading-relaxed">{nosaziData.address}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* مرحله ۲ */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div
                                    className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                                    <Building2 className="w-5 h-5 shrink-0 mt-0.5"/>
                                    <span>این ساختمان دارای واحدهای متعدد می‌باشد. لطفاً واحد مورد نظر خود را انتخاب کنید.</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                        <input type="text" placeholder="جستجو بر اساس کد نوسازی..."
                                               className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#145d6e]"/>
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {MOCK_UNITS.map((unit) => (
                                        <div key={unit.id} onClick={() => setSelectedUnit(unit.id)}
                                             className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedUnit === unit.id ? 'border-[#145d6e] bg-[#145d6e]/5 ring-1 ring-[#145d6e]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">کد نوسازی:</span>
                                                    <span
                                                        className="font-mono font-bold text-gray-800">{unit.code}</span>
                                                </div>
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUnit === unit.id ? 'border-[#145d6e] bg-[#145d6e]' : 'border-gray-300'}`}>
                                                    {selectedUnit === unit.id &&
                                                        <Check className="w-3 h-3 text-white"/>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div><span className="text-gray-500 text-xs block">مالک</span><span
                                                    className="font-medium">{unit.owner}</span></div>
                                                <div><span
                                                    className="text-gray-500 text-xs block">طبقه / واحد</span><span
                                                    className="font-medium">{unit.floor} / {unit.unit}</span></div>
                                                <div><span className="text-gray-500 text-xs block">مساحت</span><span
                                                    className="font-medium">{unit.area} متر</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* مرحله ۳ */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div
                                        className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500">کد نوسازی</span>
                                        <span className="font-mono font-bold text-[#145d6e]">{nosaziData.code}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span><span
                                            className="text-gray-500">مالک:</span> {ownerName || 'نامشخص'}</span>
                                        <span><span
                                            className="text-gray-500">مساحت:</span> {area || 'نامشخص'} متر</span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-[#145d6e]"/>
                                    لیست عوارض قابل پرداخت
                                </h3>
                                <div className="space-y-3">
                                    {MOCK_CHARGES.map((charge) => {
                                        const Icon = charge.icon;
                                        return (
                                            <div key={charge.id}
                                                 className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div
                                                        className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                                        <img src="images/sharhdari-2.png" className="w-12 h-12" alt=""/>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-sm sm:text-base">{charge.title}</h4>
                                                        <p className="text-sm text-gray-500 mt-1">مبلغ: <span
                                                            className="font-bold text-gray-800">{charge.amount.toLocaleString()} ریال</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => {
                                                    setSelectedCharge(charge);
                                                    setStep(4);
                                                }}
                                                        className="bg-[#145d6e] hover:bg-[#1a7a8f] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2">
                                                    جزئیات و پرداخت
                                                    <ChevronRight className="w-4 h-4 rotate-180"/>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* مرحله ۴ */}
                        {step === 4 && selectedCharge && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">عنوان عوارض</span>
                                        <span className="font-bold text-gray-800 text-sm">{selectedCharge.title}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                        <span className="text-base font-bold text-gray-700">مبلغ قابل پرداخت</span>
                                        <span
                                            className="text-xl font-bold text-green-600">{selectedCharge.amount.toLocaleString()} ریال</span>
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleCopy('9911002233445', 'bill')}
                                                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 hover:border-[#145d6e] transition-all group"
                                                    title="کپی شناسه قبض">
                                                {copiedField === 'bill' ? <Check className="w-5 h-5 text-green-600"/> :
                                                    <Copy
                                                        className="w-5 h-5 text-gray-600 group-hover:text-[#145d6e]"/>}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">شناسه قبض</span>
                                            <span
                                                className="text-lg font-mono font-bold text-gray-800 tracking-wider">۹۹۱۱۰۰۲۲۳۳۴۴۵</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleCopy('441122998877', 'payment')}
                                                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 hover:border-[#145d6e] transition-all group"
                                                    title="کپی شناسه پرداخت">
                                                {copiedField === 'payment' ?
                                                    <Check className="w-5 h-5 text-green-600"/> : <Copy
                                                        className="w-5 h-5 text-gray-600 group-hover:text-[#145d6e]"/>}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">شناسه پرداخت</span>
                                            <span
                                                className="text-lg font-mono font-bold text-gray-800 tracking-wider">۴۴۱۱۲۲۹۹۸۸۷۷</span>
                                        </div>
                                    </div>
                                </div>
                                {copiedField &&
                                    <p className="text-center text-sm text-green-600 font-medium animate-pulse">کد با
                                        موفقیت کپی شد!</p>}
                            </div>
                        )}
                    </div>

                    {/* فوتر مودال (دکمه‌ها) */}
                    <div
                        className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-between items-center gap-3">
                        {step > 1 && step < 4 && (
                            <button onClick={() => setStep((prev) => (prev - 1) as any)}
                                    className="px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                                بازگشت
                            </button>
                        )}

                        {step === 1 && (
                            <button onClick={() => setStep(2)}
                                    className="mr-auto px-8 py-2.5 rounded-xl font-medium bg-[#145d6e] text-white hover:bg-[#1a7a8f] transition-colors flex items-center gap-2">
                                تایید اطلاعات
                                <ChevronRight className="w-4 h-4 rotate-180"/>
                            </button>
                        )}

                        {step === 2 && (
                            <button onClick={() => selectedUnit && setStep(3)} disabled={!selectedUnit}
                                    className={`mr-auto px-8 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${selectedUnit ? 'bg-[#145d6e] text-white hover:bg-[#1a7a8f]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                ادامه و انتخاب عوارض
                                <ChevronRight className="w-4 h-4 rotate-180"/>
                            </button>
                        )}

                        {step === 3 && (
                            <button onClick={onClose}
                                    className="mr-auto px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                                انصراف
                            </button>
                        )}

                        {step === 4 && (
                            <div className="flex gap-3 w-full justify-end">
                                <button onClick={handlePrintReceipt}
                                        className="px-5 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                                    <Printer className="w-4 h-4"/>
                                    چاپ رسید
                                </button>
                                <button onClick={handlePayment} disabled={isProcessing}
                                        className={`flex-1 max-w-xs py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-white ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#145d6e] hover:bg-[#1a7a8f] hover:shadow-lg'}`}>
                                    {isProcessing ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                            در حال پردازش...</>
                                    ) : (
                                        <><CheckCircle className="w-4 h-4"/> تایید و پرداخت</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>,
            document.body
        )
    ) : null;
}