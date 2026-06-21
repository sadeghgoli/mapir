'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Printer, CheckCircle, CreditCard, MapPin, Copy, Check,
    ChevronRight, Building2, Users, Ruler, Loader2, AlertCircle,
    Star, StarOff, LogIn
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const API_BASE_URL = 'https://apiweb-payonmap.sabzevar.ir:8446';

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
    Tabaghe: string | null;  // این فیلد برای عنوان طبقه است
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
    tabaghe: string | null;  // اضافه کردن فیلد tabaghe
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
    const { isAuthenticated, login, user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [units, setUnits] = useState<BuildingUnit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<BuildingUnit | null>(null);
    const [selectedCharge, setSelectedCharge] = useState<ChargeItem | null>(null);

    const [ownerName, setOwnerName] = useState('');
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [billId, setBillId] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [chargeAmount, setChargeAmount] = useState<number | null>(null);
    const [pasmandAmount, setPasmandAmount] = useState<number | null>(null);
    const [pasmandBillId, setPasmandBillId] = useState('');
    const [pasmandPaymentId, setPasmandPaymentId] = useState('');
    const [landCode, setLandCode] = useState<string>('');

    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const checkIfSaved = useCallback(async (code: string) => {
        // if (!isAuthenticated) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/locations/check/${encodeURIComponent(code)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsSaved(data.isSaved);
            }
        } catch (err) {
            console.error('Error checking location:', err);
        }
    }, [isAuthenticated, getToken]);

    const handleToggleSave = async () => {
        if (!isAuthenticated) {
            setSaveMessage({ text: 'برای ذخیره مکان ابتدا وارد شوید', type: 'error' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        const token = getToken();
        if (!token) return;

        const codeToSave = landCode || nosaziData.code;
        setIsSaving(true);
        setSaveMessage(null);

        try {
            if (isSaved) {
                const listRes = await fetch(`${API_BASE_URL}/api/locations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (listRes.ok) {
                    const listData = await listRes.json();
                    const found = listData.data?.find((l: any) => l.locationCode === codeToSave);
                    if (found) {
                        const delRes = await fetch(`${API_BASE_URL}/api/locations/${found.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (delRes.ok) {
                            setIsSaved(false);
                            setSaveMessage({ text: 'مکان از لیست منتخب حذف شد', type: 'success' });
                        }
                    }
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/api/locations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        locationCode: codeToSave,
                        address: address || nosaziData.address,
                        title: ownerName ? `ملک ${ownerName}` : codeToSave,
                        latitude: null,
                        longitude: null
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setIsSaved(true);
                    setSaveMessage({ text: 'مکان به لیست منتخب اضافه شد', type: 'success' });
                } else {
                    setSaveMessage({ text: data.message || 'خطا در ذخیره', type: 'error' });
                }
            }
        } catch (err) {
            setSaveMessage({ text: 'خطا در ارتباط با سرور', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    const encodeToBase64 = (code: string): string => {
        const utf8Bytes = new TextEncoder().encode(code);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) binary += String.fromCharCode(utf8Bytes[i]);
        return btoa(binary);
    };


    // اضافه کردن این تابع در داخل کامپوننت NosaziModal
    const registerView = useCallback(async (code: string) => {
        const token = getToken();
        if (!token || !isAuthenticated) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    locationCode: code
                })
            });

            if (!response.ok) {
                console.error('Failed to register view:', response.status);
            }
        } catch (err) {
            console.error('Error registering view:', err);
        }
    }, [isAuthenticated, getToken]);

    // در useEffect مربوط به fetchNosaziInfo، بعد از تنظیم اطلاعات
    useEffect(() => {
        if (isOpen && nosaziData.code) {
            document.body.style.overflow = 'hidden';
            setStep(1);
            setSelectedUnit(null);
            setSelectedCharge(null);
            setApiError(null);
            setLandCode('');
            setIsSaved(false);
            setSaveMessage(null);

            if (isAuthenticated) {
                // ✅ دریافت اطلاعات و سپس ثبت بازدید
                const loadData = async () => {
                    await fetchNosaziInfo(nosaziData.code);
                    // بعد از بارگذاری اطلاعات، بازدید را ثبت کن
                    const codeToView = landCode || formatCodeN(nosaziData.code);
                    if (codeToView) {
                        registerView(codeToView);
                    }
                };
                loadData();
            } else {
                setIsLoading(false);
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, nosaziData.code, isAuthenticated]);

    const decodePersianText = (text: string | null): string | null => {
        if (!text) return null;
        try {
            if (text.includes('Ù') || text.includes('Ø') || text.includes('â') || text.includes('TM')) {
                const bytes = new Uint8Array(text.length);
                for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
                return new TextDecoder('utf-8').decode(bytes);
            }
            return text;
        } catch { return text; }
    };

    const extractFloorFromCode = (codeN: string): number => {
        if (!codeN) return 0;
        const parts = codeN.split('-');
        return parts.length >= 5 ? parseInt(parts[4]) || 0 : 0;
    };

    const extractUnitFromCode = (codeN: string): number => {
        if (!codeN) return 0;
        const parts = codeN.split('-');
        return parts.length >= 6 ? parseInt(parts[5]) || 0 : 0;
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
            if (!response.ok) throw new Error(`خطا در ارتباط با سرور: ${response.status}`);

            const responseText = await response.text();
            const lines = responseText.split(/\r?\n/);
            if (lines.length < 2) { setApiError('پاسخ نامعتبر از سرور'); return; }

            const encodedText = lines[1].trim();
            let decodedData = '';
            try {
                const binaryString = atob(encodedText);
                const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                decodedData = new TextDecoder('utf-8').decode(bytes);
            } catch {
                setApiError('خطا در دیکد کردن پاسخ سرور');
                return;
            }

            let rawData: ApiBuildingUnit[];
            try {
                let cleanData = decodedData.trim();
                if (!cleanData.startsWith('[') && !cleanData.startsWith('{')) {
                    const jsonMatch = cleanData.match(/\[[\s\S]*\]/);
                    if (jsonMatch) cleanData = jsonMatch[0];
                    else { setApiError(decodedData); return; }
                }
                rawData = JSON.parse(cleanData);
            } catch {
                setApiError(decodedData || 'فرمت پاسخ سرور معتبر نیست');
                return;
            }

            if (!Array.isArray(rawData) || rawData.length === 0) {
                setApiError('اطلاعاتی برای این کد نوسازی یافت نشد');
                return;
            }

            // 1. پیدا کردن آیتم اصلی (code_tree === 0) برای اطلاعات پایه
            const landItem = rawData.find(item => item.code_tree === 0 || item.codeN?.endsWith('-0-0-0'));

            // 2. پیدا کردن آیتم‌های واحدها (code_tree !== 0)
            const unitItems = rawData.filter(item =>
                item.code_tree !== 0 &&
                item.codeN?.includes('-') &&
                // فیلتر کردن آیتم‌های null که فقط shop دارند
                (item.Name_Malek !== null ||
                    item.Tabaghe !== null ||
                    item.MasahatZamin !== null ||
                    item.Nmablagh !== null ||
                    item.Pmablagh !== null)
            );

            // ساخت لیست واحدها - فقط واحدهایی که اطلاعات دارند
            let transformedUnits: BuildingUnit[] = [];

            if (unitItems.length === 0) {
                // اگر هیچ واحد معتبری نبود، از داده اصلی استفاده کن
                if (landItem) {
                    transformedUnits = [{
                        id: landItem.shop || 1,
                        codeN: formatCodeN(landItem.codeN || ''),
                        shop: typeof landItem.shop === 'number' ? landItem.shop : 0,
                        sakhteman: 0,
                        tabaghe: null,
                        apar: 0,
                        area: typeof landItem.MasahatZamin === 'number' ? landItem.MasahatZamin : 0,
                        nameMalek: decodePersianText(landItem.Name_Malek),
                        address: decodePersianText(landItem.neshani_melk),
                        billId: null,
                        paymentId: null,
                        amount: null,
                        pasmandAmount: null,
                        pasmandBillId: null,
                        pasmandPaymentId: null
                    }];
                }
            } else {
                // تبدیل واحدهای معتبر
                transformedUnits = unitItems.map((item, index) => {
                    // بررسی دقیق وجود مقادیر
                    const hasNosazi = item.Nmablagh !== null &&
                        item.Nmablagh !== undefined &&
                        Number(item.Nmablagh) > 0 &&
                        item.NShenaseGhabz !== null &&
                        item.NShenaseGhabz !== '0' &&
                        item.NShenaseGhabz !== '' &&
                        item.NShenasePardakht !== null &&
                        item.NShenasePardakht !== '0' &&
                        item.NShenasePardakht !== '';

                    const hasPasmand = item.Pmablagh !== null &&
                        item.Pmablagh !== undefined &&
                        Number(item.Pmablagh) > 0 &&
                        item.PShenaseGhabz !== null &&
                        item.PShenaseGhabz !== '0' &&
                        item.PShenaseGhabz !== '' &&
                        item.PShenasePardakht !== null &&
                        item.PShenasePardakht !== '0' &&
                        item.PShenasePardakht !== '';

                    return {
                        id: item.shop || index + 1,
                        codeN: formatCodeN(item.codeN || ''),
                        shop: typeof item.shop === 'number' ? item.shop : 0,
                        sakhteman: extractFloorFromCode(item.codeN || ''),
                        tabaghe: decodePersianText(item.Tabaghe),
                        apar: extractUnitFromCode(item.codeN || ''),
                        area: typeof item.MasahatZamin === 'number' ? item.MasahatZamin : 0,
                        nameMalek: decodePersianText(item.Name_Malek),
                        address: decodePersianText(item.neshani_melk),
                        // نوسازی - فقط در صورت وجود اطلاعات معتبر
                        billId: hasNosazi ? (item.NShenaseGhabz || null) : null,
                        paymentId: hasNosazi ? (item.NShenasePardakht || null) : null,
                        amount: hasNosazi ? Number(item.Nmablagh) : null,
                        // پسماند - فقط در صورت وجود اطلاعات معتبر
                        pasmandAmount: hasPasmand ? Number(item.Pmablagh) : null,
                        pasmandBillId: hasPasmand ? (item.PShenaseGhabz || null) : null,
                        pasmandPaymentId: hasPasmand ? (item.PShenasePardakht || null) : null
                    };
                });
            }

            // فیلتر کردن واحدهایی که حداقل یک اطلاعات معتبر دارند
            transformedUnits = transformedUnits.filter(unit =>
                unit.nameMalek !== null ||
                unit.amount !== null ||
                unit.pasmandAmount !== null ||
                unit.area > 0
            );

            setUnits(transformedUnits);

            // انتخاب اولین واحد به عنوان پیش‌فرض
            if (transformedUnits.length > 0) {
                setSelectedUnit(transformedUnits[0]);
            }

            // تنظیم اطلاعات پایه از آیتم اصلی
            const baseInfo = landItem || rawData[0];
            const resolvedLandCode = landItem ? formatCodeN(landItem.codeN || '') : formatCodeN(nosaziData.code);
            setLandCode(resolvedLandCode);

            // تنظیم اطلاعات مالک و آدرس
            setOwnerName(decodePersianText(baseInfo?.Name_Malek) || nosaziData.ownerName || 'نامشخص');
            setArea((typeof baseInfo?.MasahatZamin === 'number' ? baseInfo.MasahatZamin.toString() : baseInfo?.MasahatZamin) || nosaziData.area || 'نامشخص');
            setAddress(decodePersianText(baseInfo?.neshani_melk) || nosaziData.address || 'آدرس ثبت نشده');

            await checkIfSaved(resolvedLandCode);

        } catch (err) {
            console.error('Error:', err);
            setApiError('خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
            setLandCode('');
            setIsSaved(false);
            setSaveMessage(null);

            if (isAuthenticated) {
                fetchNosaziInfo(nosaziData.code);
            } else {
                setIsLoading(false);
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, nosaziData.code, isAuthenticated]);

    const handlePayment = async () => {
        if (!selectedCharge?.amount || !selectedCharge?.billId || !selectedCharge?.paymentId) {
            setSaveMessage({
                text: 'اطلاعات پرداخت ناقص است یا عوارض تسویه شده است',
                type: 'error'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        // بررسی مجدد وجود شناسه قبض و پرداخت
        if (selectedCharge.billId === '0' || selectedCharge.billId === 'null' || selectedCharge.billId === '-' ||
            selectedCharge.paymentId === '0' || selectedCharge.paymentId === 'null' || selectedCharge.paymentId === '-') {
            setSaveMessage({
                text: 'اطلاعات پرداخت نامعتبر است',
                type: 'error'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        if (!isAuthenticated) {
            setSaveMessage({ text: 'برای پرداخت ابتدا وارد شوید', type: 'error' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        const token = getToken();
        if (!token) {
            setSaveMessage({ text: 'توکن احراز هویت یافت نشد', type: 'error' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsProcessing(true);
        setSaveMessage(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/payment/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    locationCode: landCode || nosaziData.code,
                    title: selectedCharge.title,
                    billId: selectedCharge.billId,
                    paymentId: selectedCharge.paymentId,
                    amount: selectedCharge.amount,
                    description: `پرداخت ${selectedCharge.title} - ملک ${landCode || nosaziData.code}`
                })
            });

            const data = await res.json();

            if (data.success && data.paymentUrl) {
                sessionStorage.setItem('paymentInfo', JSON.stringify({
                    orderId: data.orderId,
                    locationCode: landCode || nosaziData.code,
                    amount: selectedCharge.amount,
                    title: selectedCharge.title
                }));

                window.location.href = data.paymentUrl;
            } else {
                setSaveMessage({ text: data.message || 'خطا در ایجاد سفارش پرداخت', type: 'error' });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setSaveMessage({ text: 'خطا در ارتباط با سرور', type: 'error' });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectCharge = (type: 'nosazi' | 'pasmand') => {
        const targetUnit = selectedUnit || units[0];
        if (!targetUnit) {
            setSaveMessage({ text: 'واحد ساختمانی انتخاب نشده است', type: 'error' });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        if (type === 'nosazi') {
            const amount = targetUnit.amount;
            const billId = targetUnit.billId;
            const paymentId = targetUnit.paymentId;

            // بررسی وجود اطلاعات معتبر
            if (!amount || amount <= 0 || !billId || !paymentId) {
                setSaveMessage({ text: 'این عوارض تسویه شده است یا اطلاعات پرداخت وجود ندارد', type: 'error' });
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

            setSelectedCharge({
                id: 'nosazi',
                type: 'nosazi',
                title: 'عوارض نوسازی و عمران',
                amount: amount,
                billId: billId,
                paymentId: paymentId,
                icon: '/images/sharhdari-2.png'
            });
        } else {
            const amount = targetUnit.pasmandAmount;
            const billId = targetUnit.pasmandBillId;
            const paymentId = targetUnit.pasmandPaymentId;

            if (!amount || amount <= 0 || !billId || !paymentId) {
                setSaveMessage({ text: 'عوارض پسماند تسویه شده است یا اطلاعات پرداخت وجود ندارد', type: 'error' });
                setTimeout(() => setSaveMessage(null), 3000);
                return;
            }

            setSelectedCharge({
                id: 'pasmand',
                type: 'pasmand',
                title: 'عوارض پسماند',
                amount: amount,
                billId: billId,
                paymentId: paymentId,
                icon: '/images/sharhdari-2.png'
            });
        }
        setStep(4);
    };

    const handleLogin = () => {
        login();
    };

    if (!isOpen || !mounted) return null;

    const stepTitles = {
        1: 'اطلاعات ملک', 2: 'انتخاب واحد ساختمان',
        3: 'انتخاب عوارض قابل پرداخت', 4: 'تایید پرداخت',
    };

    const renderLoginMessage = () => {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">برای مشاهده اطلاعات ملک وارد شوید</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                    برای مشاهده جزئیات کامل ملک، اطلاعات مالک، عوارض و امکانات پرداخت، لطفاً وارد حساب کاربری خود شوید.
                </p>

                {user && (
                    <p className="mt-4 text-sm text-gray-400">
                        در حال حاضر وارد نشده‌اید. {user?.phone && `(${user.phone})`}
                    </p>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (!isAuthenticated) {
            return renderLoginMessage();
        }

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
                                    {landCode || formatCodeN(nosaziData.code)}
                                </p>
                            </div>

                            <button
                                onClick={handleToggleSave}
                                disabled={isSaving}
                                title={
                                    !isAuthenticated
                                        ? 'برای ذخیره مکان ابتدا وارد شوید'
                                        : isSaved ? 'حذف از مکان‌های منتخب' : 'افزودن به مکان‌های منتخب'
                                }
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all duration-200 shrink-0 ${
                                    isSaved
                                        ? 'border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                        : isAuthenticated
                                            ? 'border-gray-200 bg-gray-50 text-gray-500 hover:border-[#145d6e] hover:bg-[#145d6e]/5 hover:text-[#145d6e]'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isSaved ? (
                                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                ) : (
                                    <StarOff className="w-5 h-5" />
                                )}
                                <span className="text-xs whitespace-nowrap">
                                    {isSaved ? 'منتخب' : 'افزودن'}
                                </span>
                            </button>
                        </div>

                        {saveMessage && (
                            <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                                saveMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                                {saveMessage.type === 'success'
                                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                                    : <AlertCircle className="w-4 h-4 shrink-0" />
                                }
                                {saveMessage.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">نام و نام خانوادگی مالک</label>
                                <div className="relative">
                                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={ownerName} disabled
                                           className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-right" dir="rtl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">مساحت زمین</label>
                                <div className="relative">
                                    <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={area} disabled
                                           className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-right" />
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
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {units.map((unit) => (
                                <div key={unit.id} onClick={() => setSelectedUnit(unit)}
                                     className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                         selectedUnit?.id === unit.id
                                             ? 'border-[#145d6e] bg-[#145d6e]/5 ring-1 ring-[#145d6e]'
                                             : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                                     }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">کد نوسازی:</span>
                                            <span className="font-mono text-gray-800 text-sm">{unit.codeN}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedUnit?.id === unit.id ? 'border-[#145d6e] bg-[#145d6e]' : 'border-gray-300'
                                        }`}>
                                            {selectedUnit?.id === unit.id && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>

                                    {/* نمایش نام مالک به صورت درشت */}
                                    <div className="mb-3 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-[#145d6e]" />
                                            <span className="text-sm text-gray-500">مالک:</span>
                                            <span className="text-base font-bold text-gray-800">
                                {unit.nameMalek || 'نامشخص'}
                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 text-xs block">طبقه</span>
                                            <span className="font-medium text-gray-700">
                                {unit.tabaghe || '-'}
                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs block">زیربنا (متر)</span>
                                            <span className="font-medium text-gray-700">
                                {unit.area?.toLocaleString() || '-'}
                            </span>
                                        </div>
                                    </div>

                                    {/* نمایش آدرس هر واحد */}
                                    {unit.address && unit.address !== 'آدرس ثبت نشده' && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-xs text-gray-500 block mb-0.5">آدرس واحد:</span>
                                                    <span className="text-sm text-gray-700 leading-relaxed" dir="rtl">
                                        {unit.address}
                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* در صورت عدم وجود آدرس، پیام نمایش داده شود */}
                                    {(!unit.address || unit.address === 'آدرس ثبت نشده') && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-400">آدرس برای این واحد ثبت نشده است</span>
                                            </div>
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
                                <span className="text-lg text-gray-500">کد نوسازی</span>
                                <span className="font-mono text-[#145d6e] text-lg">{selectedUnit?.codeN || units[0]?.codeN}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                <span>
                    <span className="text-gray-500 text-lg">مالک:</span>{' '}
                    <span className="text-right text-lg" dir="rtl">{selectedUnit?.nameMalek || ownerName || 'نامشخص'}</span>
                </span>
                                <span className="text-lg">
                    <span className="text-gray-500 text-lg">مساحت:</span>{' '}
                                    {selectedUnit?.area?.toLocaleString() || area || 'نامشخص'} متر
                </span>
                            </div>
                        </div>

                        <h3 className="text-gray-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#145d6e]" />
                            لیست عوارض قابل پرداخت
                        </h3>

                        {[
                            {
                                type: 'nosazi' as const,
                                title: 'عوارض نوسازی و عمران شهری',
                                amount: selectedUnit?.amount,
                                billId: selectedUnit?.billId,
                                paymentId: selectedUnit?.paymentId
                            },
                            {
                                type: 'pasmand' as const,
                                title: 'بهای خدمات مدیریت پسماند',
                                amount: selectedUnit?.pasmandAmount,
                                billId: selectedUnit?.pasmandBillId,
                                paymentId: selectedUnit?.pasmandPaymentId
                            }
                        ].map(({ type, title, amount, billId, paymentId }) => {
                            // بررسی دقیق وجود اطلاعات معتبر
                            const hasValidNosazi = amount !== null &&
                                amount !== undefined &&
                                amount > 0 &&
                                billId !== null &&
                                billId !== undefined &&
                                billId !== '0' &&
                                billId !== '' &&
                                paymentId !== null &&
                                paymentId !== undefined &&
                                paymentId !== '0' &&
                                paymentId !== '';

                            // عدم بدهی: وقتی مبلغ null است یا 0 است یا شناسه‌ها وجود ندارند
                            const isNoDebt = !hasValidNosazi;

                            return (
                                <div key={type} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                            <img src="/images/sharhdari-2.png" className="w-12 h-12" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-gray-800">{title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {isNoDebt ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        عدم بدهی
                                    </span>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-gray-500">
                                                            مبلغ: <span className="text-gray-800 font-medium">
                                                {amount ? `${amount.toLocaleString()} ریال` : '-'}
                                            </span>
                                                        </p>
                                                        {billId && (
                                                            <span className="text-xs text-gray-400">شناسه قبض: {billId}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectCharge(type)}
                                        disabled={isNoDebt}
                                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2 ${
                                            !isNoDebt
                                                ? 'bg-[#145d6e] hover:bg-[#1a7a8f] text-white'
                                                : 'bg-green-100 text-green-700 cursor-default'
                                        }`}
                                    >
                                        {isNoDebt ? (
                                            'تسویه شده'
                                        ) : (
                                            <>
                                                پرداخت
                                                <ChevronRight className="w-4 h-4 rotate-180" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}

                        {/* پیام زمانی که همه واحدها تسویه شده باشند */}
                        {units.length > 0 && units.every(unit =>
                            (!unit.amount || unit.amount === 0 || !unit.billId) &&
                            (!unit.pasmandAmount || unit.pasmandAmount === 0 || !unit.pasmandBillId)
                        ) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                                    <div>
                                        <p className="font-medium">وضعیت عوارض</p>
                                        <p className="mt-1">تمامی عوارض این ملک تسویه شده است. هیچ بدهی قابل پرداختی وجود ندارد.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && selectedCharge && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] rounded-xl p-6 border border-[#e2e8f0]">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e2e8f0]">
                                <div className="w-12 h-12 rounded-full bg-[#145d6e]/10 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-[#145d6e]" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">انتخاب شده</p>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCharge.title}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">مبلغ قابل پرداخت</p>
                                    <p className={`text-2xl font-bold ${selectedCharge.amount ? 'text-green-600' : 'text-gray-400'}`}>
                                        {selectedCharge.amount ? `${selectedCharge.amount.toLocaleString()} ریال` : '-'}
                                    </p>
                                </div>
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>

                            {/* نمایش شناسه قبض و شناسه پرداخت */}
                            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">شناسه قبض</p>
                                    <p className="text-sm font-mono text-gray-700">{selectedCharge.billId || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">شناسه پرداخت</p>
                                    <p className="text-sm font-mono text-gray-700">{selectedCharge.paymentId || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">توجه:</p>
                                <p>پس از کلیک روی دکمه پرداخت، به درگاه بانکی هدایت خواهید شد.</p>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99998 }} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl"
                 style={{ zIndex: 99999 }} dir="rtl">

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

                <div className="flex-1 overflow-y-auto p-6 space-y-6">{renderContent()}</div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 flex justify-between items-center gap-3">
                    {isAuthenticated && step > 1 && step < 4 && (
                        <button onClick={() => setStep((prev) => (prev - 1) as any)}
                                className="px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                            بازگشت
                        </button>
                    )}
                    {isAuthenticated && step === 1 && !isLoading && !apiError && (
                        <button onClick={() => setStep(2)}
                                className="mr-auto px-8 py-2.5 rounded-xl font-medium bg-[#145d6e] text-white hover:bg-[#1a7a8f] transition-colors flex items-center gap-2">
                            تایید اطلاعات
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                    {isAuthenticated && step === 2 && (
                        <button onClick={() => selectedUnit && setStep(3)} disabled={!selectedUnit}
                                className={`mr-auto px-8 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                                    selectedUnit ? 'bg-[#145d6e] text-white hover:bg-[#1a7a8f]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}>
                            ادامه و انتخاب عوارض
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                    )}
                    {isAuthenticated && step === 3 && (
                        <button onClick={onClose}
                                className="mr-auto px-6 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                            انصراف
                        </button>
                    )}
                    {isAuthenticated && step === 4 && (
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setStep(3)}
                                    className="px-5 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                                بازگشت
                            </button>
                            <button onClick={handlePayment} disabled={isProcessing || !selectedCharge?.amount}
                                    className={`flex-1 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-white ${
                                        isProcessing || !selectedCharge?.amount
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-[#145d6e] hover:bg-[#1a7a8f] hover:shadow-lg'
                                    }`}>
                                {isProcessing ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> در حال اتصال به درگاه...</>
                                ) : (
                                    <><CreditCard className="w-4 h-4" /> پرداخت و رفتن به درگاه بانکی</>
                                )}
                            </button>
                        </div>
                    )}

                    {!isAuthenticated && (
                        <div className="w-full flex justify-center">
                            <button
                                onClick={handleLogin}
                                className="px-8 py-2.5 rounded-xl font-medium bg-[#145d6e] text-white hover:bg-[#1a7a8f] transition-colors flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                ورود به حساب کاربری
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}