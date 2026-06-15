// app/components/map/overlays/ProfileModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import PaymentHistoryModal from './PaymentHistoryMoal';
import SelectedLocationsModal from './SelectedLocationsModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
    const { user, logout } = useAuth();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // بستن با دکمه ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // جلوگیری از اسکرول پشت مودال
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const menuItems = [
        {
            id: 'payments',
            title: 'سوابق پرداخت',
            icon: '/images/solar_banknote-2-linear.png',
            onClick: () => setIsPaymentModalOpen(true),
        },
        {
            id: 'locations',
            title: 'مکان‌های منتخب',
            icon: '/images/solar_star-circle-linear.png',
            onClick: () => setIsLocationsModalOpen(true),
        },
        {
            id: 'logout',
            title: 'خروج از حساب کاربری',
            icon: '/images/iconamoon_exit-light.png',
            onClick: () => setIsLogoutModalOpen(true),
            isDanger: true,
        },
    ];

    return (
        <>
            {/* بکدراپ تیره */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={onClose} />

            {/* مودال اصلی */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-slideUp">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* هدر مودال */}
                    <div className="bg-[#145d6e] px-5 py-3 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <img src="/images/solar_user-circle-bold-duotone2.png" alt="profile" className="w-6 h-6" />
                            <p className="text-sm font-medium">پروفایل کاربری</p>
                        </div>
                        <button onClick={onClose} className="hover:opacity-80 transition-opacity">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* محتوای مودال */}
                    <div className="py-2 bg-gray-50">
                        <div className="p-4">
                            <div className="flex items-center justify-between border rounded-lg border-gray-200 bg-white px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <img src={user?.avatar || "/images/profie-in-modal.png"} alt="avatar" className="w-10 h-10 rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-semibold">{user?.name || 'کاربر مهمان'}</h3>
                                        <p className="text-gray-500 text-sm">{user?.phone || 'شماره ثبت نشده'}</p>
                                    </div>
                                </div>
                                {user?.email && <p className="text-gray-500 text-sm hidden sm:block">{user.email}</p>}
                            </div>
                        </div>

                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={`
                                    w-full px-5 py-3 flex items-center gap-3 transition-all duration-200
                                    hover:bg-gray-100 active:bg-gray-200
                                    ${item.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                                    border-b border-gray-100 last:border-0
                                `}
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <img src={item.icon} alt="" className="w-5 h-5" />
                                </div>
                                <span className="flex-1 text-right font-medium">{item.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* مودال‌های ثانویه */}
            <PaymentHistoryModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
            <SelectedLocationsModal isOpen={isLocationsModalOpen} onClose={() => setIsLocationsModalOpen(false)} />
            <LogoutConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
            />
        </>
    );
};

export default ProfileModal;