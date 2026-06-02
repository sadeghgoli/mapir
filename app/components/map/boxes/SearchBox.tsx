import { useState, useRef, useEffect } from 'react';

const SearchBox2 = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [values, setValues] = useState<string[]>(Array(14).fill(''));
    const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const groups = [
        { start: 0, end: 2 },
        { start: 2, end: 4 },
        { start: 4, end: 7 },
        { start: 7, end: 11 },
        { start: 11, end: 14 },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (overlayRef.current && !overlayRef.current.contains(target)) {
                setIsOpen(false);
                setFocusedIdx(null);
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

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        let val = convertToEnglish(e.target.value).replace(/[^0-9]/g, '');
        if (val.length > 1) val = val.slice(-1);

        const newValues = [...values];
        newValues[index] = val;
        setValues(newValues);

        if (val && index < 13) {
            setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index < 13) {
            inputRefs.current[index + 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = convertToEnglish(e.clipboardData.getData('text'))
            .replace(/[^0-9]/g, '')
            .slice(0, 14);
        const newValues = [...values];
        for (let i = 0; i < pasted.length; i++) {
            newValues[i] = pasted[i];
        }
        setValues(newValues);
        if (pasted.length > 0) {
            setTimeout(() => inputRefs.current[Math.min(pasted.length, 13)]?.focus(), 10);
        }
    };

    const fullCode = values.join('');
    const hasValue = values.some((v) => v !== '');

    return (
        <div className="relative">
            {/* کامپوننت فعلی - بسته */}
            <div
                onClick={() => setIsOpen(true)}
                className="
          bg-white/95
          backdrop-blur-md
          rounded-lg
          shadow-lg
          px-5
          h-12
          w-[360px]
          flex
          items-center
          gap-4
          text-sm
          cursor-pointer
          hover:shadow-xl
          transition-shadow
        "
            >
                <img src="/images/solar_magnifer-bold-duotone.png" alt="" />
                <input
                    placeholder="جستجو بر اساس کد نوسازی..."
                    className="flex-1 outline-none bg-transparent text-right cursor-pointer"
                    readOnly
                    value={hasValue ? fullCode : ''}
                    onClick={() => setIsOpen(true)}
                />
            </div>

            {/* Overlay باز شده */}
            {isOpen && (
                <div
                    ref={overlayRef}
                    className="absolute top-0 left-0 z-50"
                >
                    <div
                        dir="ltr"
                        className="
              bg-white
              border-2 border-[#6B9A9D]
              rounded-lg
              h-12
              w-[360px]
              flex
              items-center
              justify-between
              px-2
              shadow-2xl
            "
                    >
                        {/* دکمه بستن */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setValues(Array(14).fill(''));
                                setFocusedIdx(null);
                            }}
                            className="text-gray-300 hover:text-gray-500 text-xl transition-colors w-6 h-6 flex items-center justify-center flex-shrink-0"
                        >
                            ×
                        </button>

                        {/* نقطه‌ها */}
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
                                                {/* input نامرئی برای تایپ */}
                                                <input
                                                    ref={(el) => { inputRefs.current[idx] = el; }} // <-- این خط تغییر کرد
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={values[idx]}
                                                    onChange={(e) => handleChange(idx, e)}
                                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                                    onPaste={idx === 0 ? handlePaste : undefined}
                                                    onFocus={() => setFocusedIdx(idx)}
                                                    onBlur={() => setFocusedIdx(null)}
                                                    className={`
                            absolute
                            w-3 h-3
                            text-center text-xs font-bold
                            outline-none
                            bg-transparent
                            caret-transparent
                            transition-all
                            ${isFilled ? 'text-gray-800' : 'text-transparent'}
                            z-10
                            cursor-pointer
                            text-lg
                          `}
                                                    style={{ padding: 0 }}
                                                />

                                                {/* دایره توخالی (نمایشی) */}
                                                {!isFilled && (
                                                    <div
                                                        className={`
                              w-2 h-2 rounded-full border-2
                              transition-all
                              ${isFocused
                                                            ? 'border-[#6B9A9D] scale-125'
                                                            : 'border-gray-300'
                                                        }
                              pointer-events-none
                            `}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                    {gIdx < groups.length - 1 && (
                                        <span className="text-gray-300 mx-0.5 text-xs">|</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* دکمه جستجو */}
                        <button
                            onClick={() => {
                                console.log('Searching for:', fullCode);
                            }}
                            disabled={!hasValue}
                            className="
                rounded-full flex items-center justify-center
                transition-colors flex-shrink-0
                disabled:opacity-50 disabled:cursor-not-allowed
              "
                        >
                            <img
                                src="/images/solar_magnifer-bold-duotone.png"
                                alt="search"
                                className="w-6 h-6"
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBox2;