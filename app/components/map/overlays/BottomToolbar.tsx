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
                absolute
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
                    h-20
                    w-96
                "
                style={{
                    backgroundImage: 'url("/images/footer-back.png")',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="flex flex-col gap-1 items-center mt-4">
                    <img src="/images/fanavari.png" className="w-8" alt=""/>
                    <p className="text-xs">
                        سازمان فناوری
                    </p>
                </div>

                <div className="flex flex-col gap-1 items-center mt-4">
                    <img src="/images/etelaat.png" className="w-8" alt=""/>
                    <p className="text-xs">
                       اطلاعات
                    </p>
                </div>

                <div className="flex flex-col gap-1 items-center mt-4">
                    <img src="/images/shahrdari.png" className="w-8" alt=""/>
                    <p className="text-xs">
                        شهرداری سبزوار
                    </p>
                </div>
            </div>
        </div>
    );
}