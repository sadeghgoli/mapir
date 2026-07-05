// app/components/map/UserCard.tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import ProfileModal from './ProfileModal';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';

export default function UserCard() {
    const { user, login, isLoading, isAuthenticated } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log('UserCard - user:', user, 'isAuthenticated:', isAuthenticated);
    }, [user, isAuthenticated]);

    const handleClick = () => {
        if (!user && !isAuthenticated) {
            login();
        } else {
            setIsModalOpen(true);
        }
    };

    if (!mounted) {
        return (
            <div className="absolute top-12 left-8 z-[1000]">
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-800 text-white rounded-lg px-2 h-12 shadow-xl flex items-center gap-4">
                        <div className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                            <img src="/images/solar_user-circle-bold-duotone.png" alt="user-icon" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = () => {
        if (isLoading) return 'در حال بارگذاری...';
        if (user?.name) return user.name;
        return 'ورود به حساب';
    };

    const displayPhone = () => {
        if (isLoading) return '';
        if (user?.phone) return user.phone;
        return '-';
    };

    return (
        <div className="fixed top-22 md:top-8 left-6 z-[1000]">
            <div className="flex items-center gap-2">
                <div
                    onClick={handleClick}
                    className="bg-cyan-800 text-white rounded-lg px-2 h-12 shadow-xl flex items-center gap-4 cursor-pointer hover:bg-cyan-900 transition-colors"
                >
                    <div className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                        <img src="/images/solar_user-circle-bold-duotone.png" alt="user-icon" />
                    </div>
                    <div className="hidden md:block">
                        <div className="text-sm font-medium">{displayName()}</div>
                        <div className="text-xs opacity-80">{displayPhone()}</div>
                    </div>
                </div>

                <Link href="https://sabzevar.ir" target="_blank" className=''>
                    <button
                        id="back-to-site"
                        className="md:w-12 md:h-12 w-12 h-12 rounded-lg bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <img src="/images/solar_round-arrow-left-bold-duotone.png" alt="بازگشت به سایت" />
                    </button>
                </Link>

                <Tooltip
                    anchorSelect="#back-to-site"
                    content="بازگشت به سایت"
                    place="bottom"
                    style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        fontSize: "10px",
                    }}
                />
            </div>

            <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}