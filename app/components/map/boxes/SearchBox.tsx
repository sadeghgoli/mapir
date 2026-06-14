import { useState, useRef, useEffect } from 'react';
import NosaziModal from '../overlays/NosaziModal';

interface NosaziData {
    code: string;
    address: string;
    billId?: string;
    paymentId?: string;
    amount?: number;
    ownerName?: string;
    area?: string;
    constructionYear?: string;
}

const SearchBox2 = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [values, setValues] = useState<string[]>(Array(15).fill(''));
    const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [modalData, setModalData] = useState<NosaziData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const groups = [
        { start: 0, end: 1 },    // گروه 1: 1 رقم (ایندکس 0)
        { start: 1, end: 3 },    // گروه 2: 2 رقم (ایندکس 1,2)
        { start: 3, end: 6 },    // گروه 3: 3 رقم (ایندکس 3,4,5)
        { start: 6, end: 9 },    // گروه 4: 3 رقم (ایندکس 6,7,8)
        { start: 9, end: 11 },   // گروه 5: 2 رقم (ایندکس 9,10)
        { start: 11, end: 13 },  // گروه 6: 2 رقم (ایندکس 11,12)
        { start: 13, end: 15 },  // گروه 7: 2 رقم (ایندکس 13,14)
    ];

    // ✅ اصلاح: تابع پیدا کردن اولین ایندکس گروه بعدی
    const getNextGroupFirstIndex = (index: number): number | null => {
        const currentGroup = groups.find(g => index >= g.start && index < g.end);
        if (!currentGroup) return null;

        // پیدا کردن گروه بعدی
        const currentGroupIndex = groups.findIndex(g => g.start === currentGroup.start);
        if (currentGroupIndex !== -1 && currentGroupIndex + 1 < groups.length) {
            return groups[currentGroupIndex + 1].start;
        }
        return null;
    };
    // ✅ اصلاح: تابع پیدا کردن ایندکس شروع گروه فعلی
    const getCurrentGroupStart = (index: number): number => {
        const group = groups.find(g => index >= g.start && index < g.end);
        return group ? group.start : index;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (overlayRef.current && !overlayRef.current.contains(target)) {
                setIsOpen(false);
                setFocusedIdx(null);
                setError(null);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const convertToEnglish = (val: string): string => {
        return val.replace(/[۰-۹]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 1728));
    };

    // ✅ اصلاح: تابع handleChange - فقط حرکت به گروه بعدی اگر رقم وارد شد
    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        let val = convertToEnglish(e.target.value).replace(/[^0-9]/g, '');
        if (val.length > 1) val = val.slice(-1);

        const newValues = [...values];
        newValues[index] = val;
        setValues(newValues);

        // اگر رقم وارد شد و در انتهای گروه بودیم، برو به گروه بعدی
        if (val) {
            const currentGroup = groups.find(g => index >= g.start && index < g.end);
            const isLastOfGroup = currentGroup ? index === currentGroup.end - 1 : false;

            if (isLastOfGroup) {
                const nextGroupStart = getNextGroupFirstIndex(index);
                if (nextGroupStart !== null) {
                    setTimeout(() => inputRefs.current[nextGroupStart]?.focus(), 10);
                }
            } else if (index < 14) {
                // اگر در انتهای گروه نبودیم، برو به خانه بعدی
                setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
            }
        }
    };

    // ✅ اصلاح تابع handleKeyDown
    // ✅ اصلاح: تابع handleKeyDown
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 14) {
            inputRefs.current[index + 1]?.focus();
        }

        // ✅ هر جا که - زده شد، برو به اولین خانه گروه بعدی
        if (e.key === '-') {
            e.preventDefault();
            const nextGroupStart = getNextGroupFirstIndex(index);
            if (nextGroupStart !== null) {
                setTimeout(() => inputRefs.current[nextGroupStart]?.focus(), 10);
            }
        }

        if (e.key === 'Enter') {
            handleSearch();
        }
    };


    // ✅ اصلاح: تابع handleBeforeInput
    const handleBeforeInput = (index: number, e: React.FormEvent<HTMLInputElement>) => {
        const nativeEvent = e.nativeEvent as InputEvent;
        if (nativeEvent.data === '-') {
            e.preventDefault();
            const nextGroupStart = getNextGroupFirstIndex(index);
            if (nextGroupStart !== null) {
                setTimeout(() => inputRefs.current[nextGroupStart]?.focus(), 10);
            }
        }
    };



    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        let pasted = convertToEnglish(e.clipboardData.getData('text'))
            .replace(/[^0-9]/g, '')
            .slice(0, 15);

        const newValues = [...values];
        for (let i = 0; i < pasted.length; i++) {
            newValues[i] = pasted[i];
        }
        setValues(newValues);
        if (pasted.length > 0) {
            setTimeout(() => inputRefs.current[Math.min(pasted.length, 14)]?.focus(), 10);
        }
    };

    // ✅ اصلاح شده: ارسال کد با خط تیره (مانند HTML ساده)
    const getFormattedCodeForServer = (): string => {
        const groupSizes = [1, 2, 3, 3, 2, 2, 2];
        const parts: string[] = [];

        let currentIndex = 0;
        for (const size of groupSizes) {
            const groupValues = values.slice(currentIndex, currentIndex + size).join('');
            // فقط گروه‌هایی که حداقل یک رقم دارند را اضافه کن
            if (groupValues.length > 0) {
                parts.push(groupValues);
            } else {
                // اگر گروه خالی بود و هنوز گروه بعدی هم خالی نیست، صفر بفرست
                // بررسی کنیم آیا گروه‌های بعدی مقدار دارند
                const remainingValues = values.slice(currentIndex + size).join('');
                if (remainingValues.length > 0) {
                    parts.push('0');
                }
            }
            currentIndex += size;
        }

        return parts.join('-');
    };
    const getFormattedCodeForDisplay = (): string => {
        const groupSizes = [1, 2, 3, 3, 2, 2, 2];
        const parts: string[] = [];

        let currentIndex = 0;
        for (let i = 0; i < groupSizes.length; i++) {
            const size = groupSizes[i];
            const groupValues = values.slice(currentIndex, currentIndex + size).join('');

            // اگر گروه خالی نبود یا گروه‌های بعدی پر بودند، اضافه کن
            const remainingValues = values.slice(currentIndex + size).join('');
            if (groupValues.length > 0 || remainingValues.length > 0) {
                parts.push(groupValues.length > 0 ? groupValues : '');
            } else {
                // اگر این گروه و همه گروه‌های بعدی خالی بودند، متوقف شو
                break;
            }

            currentIndex += size;
        }

        // حذف خط تیره‌های اضافی از انتها
        let result = parts.join('-');
        result = result.replace(/-+$/, '');

        return result;
    };
    const base64ToUtf8 = (base64: string): string => {
        try {
            const binaryString = atob(base64);
            const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
            return new TextDecoder("utf-8").decode(bytes);
        } catch (error) {
            console.error('Base64 decode error:', error);
            return base64;
        }
    };

    const utf8ToBase64 = (str: string): string => {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    };

    const hasValue = values.some((v) => v !== '');
    const formattedDisplay = getFormattedCodeForDisplay();

    const handleSearch = async () => {
        const codeToSend = getFormattedCodeForServer();

        const hasValidCode = codeToSend.split('-').some(part => parseInt(part) > 0);

        if (!hasValidCode) {
            setError('لطفاً کد معتبر وارد کنید');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const base64Data = utf8ToBase64(codeToSend);
            const url = `/api/AmardDataHandler.ashx?data=${encodeURIComponent(base64Data)}`;

            console.log('Code to send:', codeToSend);
            console.log('URL:', url);

            const response = await fetch(url);
            const responseText = await response.text();

            console.log('Raw response:', responseText);

            // پاسخ شامل دو خط است
            const lines = responseText.split(/\r?\n/);

            if (lines.length < 2) {
                setError('پاسخ نامعتبر از سرور');
                return;
            }

            const encodedText = lines[1].trim();

            // دیکد کردن Base64
            let decodedText = '';
            try {
                const binaryString = atob(encodedText);
                const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                decodedText = new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                console.error('Decode error:', e);
                setError('خطا در پردازش پاسخ سرور');
                return;
            }

            console.log('Decoded data:', decodedText);

            let apiData: any[];
            try {
                apiData = JSON.parse(decodedText);
            } catch (e) {
                console.error('JSON parse error:', e);
                setError('خطا در پردازش اطلاعات');
                return;
            }

            console.log('Parsed data:', apiData);

            if (!Array.isArray(apiData) || apiData.length === 0) {
                setError('کد نوسازی یافت نشد');
                return;
            }

            // پیدا کردن آیتم معتبر
            const validItem =
                apiData.find(item => item.code_tree !== 0 && item.code_tree !== null) ||
                apiData.find(item => item.Name_Malek !== null || item.neshani_melk !== null) ||
                apiData[0];

            if (validItem) {
                setModalData({
                    // ✅ اصلاح: استفاده از codeN از API به جای getFormattedCodeForDisplay()
                    code: validItem.codeN,
                    address: validItem.neshani_melk || 'آدرس ثبت نشده',
                    billId: validItem.NShenaseGhabz || undefined,
                    paymentId: validItem.NShenasePardakht || undefined,
                    amount: validItem.Nmablagh ? Number(validItem.Nmablagh) : undefined,
                    ownerName: validItem.Name_Malek || undefined,
                    area: validItem.MasahatZamin?.toString(),
                    constructionYear: validItem.Tabaghe,
                });
                setIsModalOpen(true);
                setIsOpen(false);
                setValues(Array(15).fill(''));
                setError(null);
            } else {
                setError('کد نوسازی یافت نشد');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('خطا در جستجو. لطفاً مجدداً تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMainSearchIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasValue) {
            handleSearch();
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            <div className="relative">
                <div
                    onClick={() => setIsOpen(true)}
                    className="
                        bg-white/95
                        backdrop-blur-md
                        rounded-lg
                        shadow-lg
                        px-5
                        h-12
                        md:w-[400px]
                        flex
                        items-center
                        gap-4
                        text-sm
                        cursor-pointer
                        hover:shadow-xl
                        transition-shadow
                    "
                >
                    <img
                        src="/images/solar_magnifer-bold-duotone.png"
                        alt="search"
                        onClick={handleMainSearchIconClick}
                        className="cursor-pointer hover:scale-110 transition-transform"
                    />
                    <input
                        placeholder="جستجو بر اساس کد نوسازی..."
                        className="flex-1 outline-none bg-transparent text-right cursor-pointer"
                        readOnly
                        value={hasValue ? formattedDisplay : ''}
                        onClick={() => setIsOpen(true)}
                    />
                </div>

                {isOpen && (
                    <div ref={overlayRef} className="absolute top-0 left-0 z-50">
                        <div
                            dir="ltr"
                            className="
                                bg-white
                                border-2 border-[#6B9A9D]
                                rounded-lg
                                h-auto
                                min-h-12
                                md:w-[400px]
                                flex
                                flex-col
                                shadow-2xl
                            "
                        >
                            <div className="flex items-center justify-between px-2 py-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setValues(Array(15).fill(''));
                                        setFocusedIdx(null);
                                        setError(null);
                                    }}
                                    className="text-gray-300 hover:text-gray-500 text-xl transition-colors w-6 h-6 flex items-center justify-center flex-shrink-0"
                                >
                                    ×
                                </button>

                                <div className="flex items-center gap-2 flex-1 justify-center">
                                    {groups.map((group, gIdx) => (
                                        <div key={gIdx} className="flex items-center gap-2">
                                            {Array.from({ length: group.end - group.start }).map((_, i) => {
                                                const idx = group.start + i;
                                                const isFilled = values[idx] !== '';
                                                const isFocused = focusedIdx === idx;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="relative flex items-center justify-center"
                                                        onClick={() => inputRefs.current[idx]?.focus()}
                                                    >
                                                        <input
                                                            ref={(el) => { inputRefs.current[idx] = el; }}
                                                            type="text"
                                                            inputMode="numeric"
                                                            maxLength={1}
                                                            value={values[idx]}
                                                            onChange={(e) => handleChange(idx, e)}
                                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                                            onBeforeInput={(e) => handleBeforeInput(idx, e)}
                                                            onPaste={idx === 0 ? handlePaste : undefined}
                                                            onFocus={() => setFocusedIdx(idx)}
                                                            onBlur={() => setFocusedIdx(null)}
                                                            className="
                                                                absolute
                                                                w-12 h-12
                                                                text-center text-md 
                                                                outline-none
                                                                bg-transparent
                                                                caret-transparent
                                                                transition-all
                                                                text-gray-600
                                                                z-10
                                                                cursor-pointer
                                                            "
                                                            style={{ padding: 0 }}
                                                        />

                                                        <div
                                                            className={`
                                                                w-2 h-2 rounded-full border-2
                                                                transition-all
                                                                ${isFilled ? 'hidden' : 'border-gray-300 bg-transparent'}
                                                                ${isFocused ? 'border-[#6B9A9D] scale-125' : ''}
                                                                pointer-events-none
                                                            `}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            {gIdx < groups.length - 1 && (
                                                <span className="text-gray-300 mx-0.5 text-xs">-</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={!hasValue || isLoading}
                                    className="
                                        w-8 h-8
                                        rounded-full flex items-center justify-center
                                        bg-[#6B9A9D]/10 hover:bg-[#6B9A9D]/20
                                        transition-all flex-shrink-0
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        hover:scale-105
                                    "
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-[#6B9A9D] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <img
                                            src="/images/solar_magnifer-bold-duotone.png"
                                            alt="search"
                                            className="w-5 h-5"
                                        />
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="px-4 pb-3 text-center">
                                    <p className="text-red-500 text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {modalData && (
                <NosaziModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setModalData(null);
                    }}
                    nosaziData={modalData}
                />
            )}
        </>
    );
};

export default SearchBox2;