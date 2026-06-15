'use client';

import {
    Map,
    Layers3,
    Route,
} from 'lucide-react';

export default function BottomToolbar() {
    return (
        <div
            className="
                fixed
                bottom-0
                left-1/2
                -translate-x-1/2
                z-[10]
            "
        >
            <div
                className="
                    flex
                    items-center
                    justify-center
                    gap-6
                    h-14
                    w-76
                    md:w-96
                "
                style={{
                    backgroundImage: 'url("/images/footer-back.png")',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >

                <div className="flex gap-2 items-center mt-4">
                    <img src="/images/shahrdari.png" className="w-8" alt=""/>
                    <p className="text-[10px] md:text-sm">
                      مدیریت فناوری اطلاعات شهرداری سبزوار
                    </p>
                </div>
            </div>
        </div>
    );
}