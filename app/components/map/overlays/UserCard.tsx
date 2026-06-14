'use client';

import { Tooltip } from 'react-tooltip';
import ProfileModal from './ProfileModal';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

export default function UserCard() {
    const { user, login, isLoading } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // اطلاعات پیش‌فرض برای حالت لاگین نشده
    const userInfo = {
        name: user?.name || 'ورود به حساب',
        phone: user?.phone || '-'
    };

    const handleClick = () => {
        if (!user) {
            login();
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <div className="absolute top-24 md:top-8 left-8 z-[1000]">
            <div className="flex items-center gap-3">
                <div
                    className="bg-cyan-800 text-white rounded-lg px-2 h-12 shadow-xl flex items-center gap-4 cursor-pointer"
                    onClick={handleClick}
                >
                    <div className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                        <img src="/images/solar_user-circle-bold-duotone.png" alt=""/>
                    </div>

                    <div className="hidden md:block">
                        <div className="text-sm">
                            {isLoading ? 'در حال بارگذاری...' : userInfo.name}
                        </div>
                        <div className="text-sm opacity-80">
                            {userInfo.phone}
                        </div>
                    </div>
                </div>

                <Link href="https://sabzevar.ir">
                    <button
                        id="my-anchor-element"
                        className="md:w-12 md:h-12 w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center"
                    >
                        <img src="/images/solar_round-arrow-left-bold-duotone.png" alt=""/>
                    </button>
                </Link>

                <Tooltip
                    anchorSelect="#my-anchor-element"
                    content="بازگشت به سایت"
                    place="bottom"
                    style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        fontSize: '10px',
                    }}
                />

                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userData={user || userInfo}
                />
            </div>
        </div>
    );
}