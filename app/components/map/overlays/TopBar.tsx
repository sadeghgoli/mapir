'use client';

import {
    HelpCircle,
    Star,
} from 'lucide-react';

export default function TopBar() {
    return (
        <div
            className="
                absolute
                top-12
                left-1/2
                -translate-x-1/2
                z-[1000]
                flex
                items-center
                gap-3
            "
        >
            <button
                className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-white/90
                    backdrop-blur-md
                    shadow-lg
                    flex
                    items-center
                    justify-center
                "
            >
                <HelpCircle size={20} />
            </button>

            <button
                className="
                    w-12
                    h-12
                    rounded-lg
                    bg-white/90
                    backdrop-blur-md
                    shadow-lg
                    flex
                    items-center
                    justify-center
                "
            >
                <Star size={20} />
            </button>
        </div>
    );
}