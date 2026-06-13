'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Printer, CheckCircle, CreditCard, MapPin, Copy, Check,
    ChevronRight, Building2, Users, Ruler, Loader2, AlertCircle, Trash2
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

interface ApiBuildingUnit {
    shop: number;
    code_tree: number;
    codeN: string;
    Name_Malek: string | null;
    neshani_melk: string | null;
    Tabaghe: string | null;
    TedadeVahed: string | null;
    Zirbana: string | null;
    MasahatZamin: string | null;
    Nmoavaghe: string | null;
    Nkhoshhesabi: string | null;
    NBadHesabi: string | null;
    Nmablagh: string | number | null;
    NShenaseGhabz: string | null;
    NShenasePardakht: string | null;
    Pmoavaghe: string | null;
    Pkhoshhesabi: string | null;
    PTax: string | null;
    Pmablagh: string | number | null;
    PShenaseGhabz: string | null;
    PShenasePardakht: string | null;
}

interface BuildingUnit {
    id: number;
    codeN: string;
    shop: number;
    sakhteman: number;
    apar: number;
    area: number;
    nameMalek: string | null;
    address: string | null;
    billId: string | null;
    paymentId: string | null;
    amount: number | null;
    pasmandAmount: number | null;
    pasmandBillId: string | null;
    pasmandPaymentId: string | null;
}

interface ChargeItem {
    id: string;
    type: 'nosazi' | 'pasmand';
    title: string;
    amount: number | null;
    billId: string | null;
    paymentId: string | null;
    icon: string;
}

export default function NosaziModal({ isOpen, onClose, nosaziData }: NosaziModalProps) {
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [units, setUnits] = useState<BuildingUnit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<BuildingUnit | null>(null);
    const [selectedCharge, setSelectedCharge] = useState<ChargeItem | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const [ownerName, setOwnerName] = useState('');
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [billId, setBillId] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [chargeAmount, setChargeAmount] = useState<number | null>(null);
    const [pasmandAmount, setPasmandAmount] = useState<number | null>(null);
    const [pasmandBillId, setPasmandBillId] = useState('');
    const [pasmandPaymentId, setPasmandPaymentId] = useState('');

    // ✅ state جدید برای ذخیره کد زمین
    const [landCode, setLandCode] = useState<string>('');

    const encodeToBase64 = (code: string): string => {
        const utf8Bytes = new TextEncoder().encode(code);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
            binary += String.fromCharCode(utf8Bytes[i]);
        }
        return btoa(binary);
    };

    const decodePersianText = (text: string | null): string | null => {
        if (!text) return null;
        try {
            if (text.includes('Ù') || text.includes('Ø') || text.includes('â') || text.includes('™')) {
                const bytes = new Uint8Array(text.length);
                for (let i = 0; i < text.length; i++) {
                    bytes[i] = text.charCodeAt(i);
                }
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch (e) {
            console.error('Error decoding text:', e);
            return text;
        }
    };

    const extractFloorFromCode = (codeN: string): number => {
        if (!codeN) return 0;
        const parts = codeN.split('-');
        if (parts.length >= 5) {
            return parseInt(parts[4]) || 0;
        }
        return 0;
    };

    const extractUnitFromCode = (codeN: string): number => {
        if (!codeN) return 0;
        const parts = codeN.split('-');
        if (parts.length >= 6) {
            return parseInt(parts[5]) || 0;
        }
        return 0;
    };

    const formatCodeN = (codeN: string): string => {
        if (!codeN) return '';
        return codeN.replace(/\n/g, '').replace(/\s/g, '').replace(/^-|-$/g, '');
    };

    const fetchNosaziInfo = async (code: string) => {
        setIsLoading(true);
        setApiError(null);

        try {
            const base64Code = encodeToBase64(code);
            const encodedCode = encodeURIComponent(base64Code);
            const url = `/api/AmardDataHandler/AmardDataHandler.ashx?data=${encodedCode}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`خطا در ارتباط با سرور: ${response.status}`);
            }

            const responseText = await response.text();
            const lines = responseText.split(/\r?\n/);

            if (lines.length < 2) {
                setApiError('پاسخ نامعتبر از سرور');
                return;
            }

            const encodedText = lines[1].trim();
            let decodedData = '';

            try {
                const binaryString = atob(encodedText);
                const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                decodedData = new TextDecoder('utf-8').decode(bytes);
            } catch (decodeError) {
                console.error('Base64 decode error:', decodeError);
                setApiError('خطا در دیکد کردن پاسخ سرور');
                return;
            }

            let rawData: ApiBuildingUnit[];
            try {
                let cleanData = decodedData.trim();
                if (!cleanData.startsWith('[') && !cleanData.startsWith('{')) {
                    const jsonMatch = cleanData.match(/\[[\s\S]*\]/);
                    if (jsonMatch) cleanData = jsonMatch[0];
                    else {
                        setApiError(decodedData);
                        return;
                    }
                }
                rawData = JSON.parse(cleanData);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                setApiError(decodedData || 'فرمت پاسخ سرور معتبر نیست');
                return;
            }

            if (!Array.isArray(rawData) || rawData.length === 0) {
                setApiError('اطلاعاتی برای این کد نوسازی یافت نشد');
                return;
            }

            const isVilla = rawData.length === 2;
            let transformedUnits: BuildingUnit[] = [];

            if (isVilla) {
                transformedUnits = rawData
                    .filter(item => {
                        const parts = item.codeN?.split('-');
                        return parts && parts.length === 7 && parts[4] === '0' && parts[5] === '0';
                    })
                    .map((item, index) => ({
                        id: item.shop || index,
                        codeN: formatCodeN(item.codeN || ''),
                        shop: typeof item.shop === 'number' ? item.shop : 0,
                        sakhteman: extractFloorFromCode(item.codeN || ''),
                        apar: extractUnitFromCode(item.codeN || ''),
                        area: typeof item.MasahatZamin === 'number' ? item.MasahatZamin : 0,
                        nameMalek: decodePersianText(item.Name_Malek),
                        address: decodePersianText(item.neshani_melk),
                        billId: item.NShenaseGhabz || null,
                        paymentId: item.NShenasePardakht || null,
                        amount: item.Nmablagh ? Number(item.Nmablagh) : null,
                        pasmandAmount: item.Pmablagh ? Number(item.Pmablagh) : null,
                        pasmandBillId: item.PShenaseGhabz || null,
                        pasmandPaymentId: item.PShenasePardakht || null
                    }));
            } else {
                transformedUnits = rawData
                    .filter(item => {
                        const parts = item.codeN?.split('-');
                        return parts && parts.length === 7 && parts[5] !== '0';
                    })
                    .map((item, index) => ({
                        id: item.shop || index,
                        codeN: formatCodeN(item.codeN || ''),
                        shop: typeof item.shop === 'number' ? item.shop : 0,
                        sakhteman: extractFloorFromCode(item.codeN || ''),
                        apar: extractUnitFromCode(item.codeN || ''),
                        area: typeof item.MasahatZamin === 'number' ? item.MasahatZamin : 0,
                        nameMalek: decodePersianText(item.Name_Malek),
                        address: decodePersianText(item.neshani_melk),
                        billId: item.NShenaseGhabz || null,
                        paymentId: item.NShenasePardakht || null,
                        amount: item.Nmablagh ? Number(item.Nmablagh) : null,
                        pasmandAmount: item.Pmablagh ? Number(item.Pmablagh) : null,
                        pasmandBillId: item.PShenaseGhabz || null,
                        pasmandPaymentId: item.PShenasePardakht || null
                    }));
            }

            setUnits(transformedUnits);

            // ✅ پیدا کردن و ذخیره کد زمین
            const landItem = rawData.find(item => item.code_tree === 0 || item.codeN?.endsWith('-0-0-0'));

            if (landItem) {
                setLandCode(formatCodeN(landItem.codeN || ''));
            } else {
                setLandCode(formatCodeN(nosaziData.code));
            }

            const baseInfo = landItem || transformedUnits.find(item => item.nameMalek || item.address) || rawData[0];

            setOwnerName(decodePersianText(baseInfo.Name_Malek) || nosaziData.ownerName || 'نامشخص');
            setArea((typeof baseInfo.MasahatZamin === 'number' ? baseInfo.MasahatZamin.toString() : baseInfo.MasahatZamin) || nosaziData.area || 'نامشخص');
            setAddress(decodePersianText(baseInfo.neshani_melk) || nosaziData.address || 'آدرس ثبت نشده');

            const payableItem = transformedUnits.find(item => item.billId && item.paymentId) || transformedUnits[0];

            if (payableItem?.billId && payableItem?.paymentId) {
                setBillId(payableItem.billId);
                setPaymentId(payableItem.paymentId);
                setChargeAmount(payableItem.amount);
                setPasmandAmount(payableItem.pasmandAmount);
                setPasmandBillId(payableItem.pasmandBillId || '');
                setPasmandPaymentId(payableItem.pasmandPaymentId || '');
            } else if (nosaziData.billId && nosaziData.paymentId) {
                setBillId(nosaziData.billId);
                setPaymentId(nosaziData.paymentId);
                setChargeAmount(nosaziData.amount || null);
            }

        } catch (err) {
            console.error('Error:', err);
            setApiError('خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

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
        if (isOpen && nosaziData.code) {
            document.body.style.overflow = 'hidden';
            setStep(1);
            setSelectedUnit(null);
            setSelectedCharge(null);
            setApiError(null);
            setLandCode(''); // ✅ ریست کردن کد زمین
            fetchNosaziInfo(nosaziData.code);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, nosaziData.code]);

    const handleCopy = (text: string, field: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            alert('پرداخت با موفقیت انجام شد');
            onClose();
        }, 2000);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleSelectCharge = (type: 'nosazi' | 'pasmand') => {
        const targetUnit = selectedUnit || units[0];

        if (type === 'nosazi') {
            setSelectedCharge({
                id: 'nosazi',
                type: 'nosazi',
                title: 'عوارض نوسازی و عمران',
                amount: chargeAmount || targetUnit?.amount,
                billId: billId || targetUnit?.billId || '-',
                paymentId: paymentId || targetUnit?.paymentId || '-',
                icon: '/images/sharhdari-2.png'
            });
        } else {
            setSelectedCharge({
                id: 'pasmand',
                type: 'pasmand',
                title: 'عوارض پسماند',
                amount: pasmandAmount || targetUnit?.pasmandAmount,
                billId: pasmandBillId || targetUnit?.pasmandBillId || '-',
                paymentId: pasmandPaymentId || targetUnit?.pasmandPaymentId || '-',
                icon: '/images/sharhdari-2.png'
            });
        }
        setStep(4);
    };

    if (!isOpen || !mounted) return null;

    const stepTitles = {
        1: 'اطلاعات ملک',
        2: 'انتخاب واحد ساختمان',
        3: 'انتخاب عوارض قابل پرداخت',
        4: 'جزئیات و تایید پرداخت',
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-[#145d6e] animate-spin" />
                    <p className="mt-4 text-gray-600">در حال دریافت اطلاعات ملک...</p>
                </div>
            );
        }

        if (apiError) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-600 text-center">{apiError}</p>
                    <button
                        onClick={() => fetchNosaziInfo(nosaziData.code)}
                        className="mt-4 px-4 py-2 bg-[#145d6e] text-white rounded-lg hover:bg-[#1a7a8f] transition-colors"
                    >
                        تلاش مجدد
                    </button>
                </div>
            );
        }

        return (
            <>
                {step === 1 && (
                    <div className="space-y-5">
                        <div className="text-center rounded-xl p-4 border shadow border-1 border-[#1a7a8f] flex gap-4 items-center">
                            <img src="/images/apartment.png" className="w-12 h-12" alt="" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">کد نوسازی:</p>
                                <p className="text-2xl text-[#145d6e] font-mono tracking-wider">
                                    {/* ✅ استفاده از landCode به جای units[0]?.codeN */}
                                    {landCode || formatCodeN(nosaziData.code)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">نام و نام خانوادگی مالک</label>
                                <div className="relative">
                                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={ownerName}
                                        disabled
                                        className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-right"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">مساحت ملک (متر مربع)</label>
                                <div className="relative">
                                    <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={area}
                                        disabled
                                        className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">آدرس ملک</label>
                            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-700 leading-relaxed text-right" dir="rtl">
                                    {address || nosaziData.address}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                            <Building2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>این ساختمان دارای {units.length} واحد می‌باشد.</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {units.map((unit) => (
                                <div
                                    key={unit.id}
                                    onClick={() => setSelectedUnit(unit)}
                                    className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                        selectedUnit?.id === unit.id
                                            ? 'border-[#145d6e] bg-[#145d6e]/5 ring-1 ring-[#145d6e]'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">کد نوسازی:</span>
                                            <span className="font-mono text-gray-800">{unit.codeN}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedUnit?.id === unit.id ? 'border-[#145d6e] bg-[#145d6e]' : 'border-gray-300'
                                        }`}>
                                            {selectedUnit?.id === unit.id && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 text-xs block">طبقه</span>
                                            <span className="font-medium">{unit.sakhteman || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs block">واحد</span>
                                            <span className="font-medium">{unit.apar || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs block">مساحت (متر)</span>
                                            <span className="font-medium">{unit.area?.toLocaleString() || '-'}</span>
                                        </div>
                                    </div>
                                    {unit.nameMalek && (
                                        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 text-right" dir="rtl">
                                            مالک: {unit.nameMalek}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                <span className="text-sm text-gray-500">کد نوسازی</span>
                                <span className="font-mono text-[#145d6e]">{selectedUnit?.codeN || units[0]?.codeN}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  <span className="text-gray-500">مالک:</span>
                  <span className="text-right" dir="rtl">{selectedUnit?.nameMalek || ownerName || 'نامشخص'}</span>
                </span>
                                <span>
                  <span className="text-gray-500">مساحت:</span>
                                    {selectedUnit?.area?.toLocaleString() || area || 'نامشخص'} متر
                </span>
                            </div>
                        </div>

                        <h3 className="text-gray-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#145d6e]" />
                            لیست عوارض قابل پرداخت
                        </h3>

                        {/* کارت عوارض نوسازی */}
                        <div className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <img src="/images/sharhdari-2.png" className="w-12 h-12" alt="" />
                                </div>
                                <div>
                                    <h4 className="text-gray-800">عوارض نوسازی و عمران</h4>
                                    <p className="text-sm text-gray-500">
                                        مبلغ:
                                        <span className={`text-gray-800 ${!chargeAmount ? 'text-gray-400' : ''}`}>
                      {chargeAmount ? `${chargeAmount.toLocaleString()} ریال` : '-'}
                    </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSelectCharge('nosazi')}
                                disabled={!chargeAmount}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2 ${
                                    chargeAmount
                                        ? 'bg-[#145d6e] hover:bg-[#1a7a8f] text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                جزئیات و پرداخت
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        </div>

                        {/* کارت عوارض پسماند */}
                        <div className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <img src="/images/sharhdari-2.png" className="w-12 h-12" alt="" />
                                </div>
                                <div>
                                    <h4 className="text-gray-800">عوارض پسماند</h4>
                                    <p className="text-sm text-gray-500">
                                        مبلغ:
                                        <span className={`text-gray-800 ${!pasmandAmount ? 'text-gray-400' : ''}`}>
                      {pasmandAmount ? `${pasmandAmount.toLocaleString()} ریال` : '-'}
                    </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSelectCharge('pasmand')}
                                disabled={!pasmandAmount}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2 ${
                                    pasmandAmount
                                        ? 'bg-[#145d6e] hover:bg-[#1a7a8f] text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                جزئیات و پرداخت
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        </div>

                        {!chargeAmount && !pasmandAmount && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>مبلغ عوارض برای این ملک ثبت نشده است. لطفاً برای اطلاع از مبلغ به شهرداری مراجعه کنید.</span>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && selectedCharge && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">عنوان عوارض</span>
                                <span className="text-gray-800">{selectedCharge.title}</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                <span className="text-base text-gray-700">مبلغ قابل پرداخت</span>
                                <span className={`text-xl ${selectedCharge.amount ? 'text-green-600' : 'text-gray-400'}`}>
                  {selectedCharge.amount ? `${selectedCharge.amount.toLocaleString()} ریال` : '-'}
                </span>
                            </div>
                        </div>

                        {!selectedCharge.amount && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>مبلغ عوارض ثبت نشده است و امکان پرداخت وجود ندارد.</span>
                            </div>
                        )}

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                <button
                                    onClick={() => handleCopy(selectedCharge.billId || '', 'bill')}
                                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all group"
                                >
                                    {copiedField === 'bill' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">شناسه قبض</span>
                                    <span className="text-lg font-mono text-gray-800">{selectedCharge.billId || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <button
                                    onClick={() => handleCopy(selectedCharge.paymentId || '', 'payment')}
                                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all group"
                                >
                                    {copiedField === 'payment' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">شناسه پرداخت</span>
                                    <span className="text-lg font-mono text-gray-800">{selectedCharge.paymentId || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {copiedField && (
                            <p className="text-center text-sm text-green-600 font-medium animate-pulse">کد با موفقیت کپی شد!</p>
                        )}
                    </div>
                )}
            </>
        );
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99998 }} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl" style={{ zIndex: 99999 }} dir="rtl">
                <div className="bg-gradient-to-r from-[#145d6e] to-[#1a7a8f] px-6 py-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <img src="/images/nosazi-modal.png" className="w-5 h-5" alt="" />
                        </div>
                        <div>
                            <p className="text-sm">{stepTitles[step]}</p>
                            <p className="text-xs text-white/70">مرحله {step} از ۴</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {renderContent()}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-between items-center gap-3">
                    {step > 1 && step < 4 && (
                        <button
                            onClick={() => setStep((prev) => (prev - 1) as any)}
                            className="px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            بازگشت
                        </button>
                    )}
                    {step === 1 && !isLoading && !apiError && (
                        <button
                            onClick={() => setStep(2)}
                            className="mr-auto px-8 py-2.5 rounded-xl font-medium bg-[#145d6e] text-white hover:bg-[#1a7a8f] transition-colors flex items-center gap-2"
                        >
                            تایید اطلاعات
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                    {step === 2 && (
                        <button
                            onClick={() => selectedUnit && setStep(3)}
                            disabled={!selectedUnit}
                            className={`mr-auto px-8 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                                selectedUnit ? 'bg-[#145d6e] text-white hover:bg-[#1a7a8f]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            ادامه و انتخاب عوارض
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                    {step === 3 && (
                        <button
                            onClick={onClose}
                            className="mr-auto px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            انصراف
                        </button>
                    )}
                    {step === 4 && (
                        <div className="flex gap-3 w-full justify-end">
                            <button
                                onClick={handlePrintReceipt}
                                className="px-5 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" /> چاپ رسید
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !selectedCharge?.amount}
                                className={`flex-1 max-w-xs py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-white ${
                                    isProcessing || !selectedCharge?.amount
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-[#145d6e] hover:bg-[#1a7a8f] hover:shadow-lg'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        در حال پردازش...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" /> تایید و پرداخت
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}