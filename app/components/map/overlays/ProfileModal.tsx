import React, {useEffect, useState} from 'react';
import {X} from "lucide-react";
import PaymentHistoryModal from "./PaymentHistoryMoal";
import SelectedLocationsModal from "@/app/components/map/overlays/SelectedLocationsModal";
import LogoutConfirmationModal from "@/app/components/map/overlays/LogoutConfirmationModal";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData?: any; // اگر ساختار دقیق userData را می‌دانید، می‌توانید به جای any تایپ دقیق‌تری بنویسید
}

const ProfileModal = ({ isOpen, onClose, userData }: ProfileModalProps) => {
    const [isModalOpen2, setIsModalOpen2] = useState(false);
    const [isModalOpen3, setIsModalOpen3] = useState(false);
    const [isModalOpen4, setIsModalOpen4] = useState(false);

    // بستن مودال با دکمه ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { // <-- تایپ KeyboardEvent اضافه شد
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // جلوگیری از اسکرول صفحه هنگام باز بودن مودال
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
            onClick: () => {
                setIsModalOpen2(true)
            }
        },
        {
            id: 'locations',
            title: 'مکان های منتخب',
            icon: '/images/solar_star-circle-linear.png',
            onClick: () => {
                setIsModalOpen3(true)
            }
        },
        {
            id: 'logout',
            title: 'خروج از حساب کاربری',
            icon: '/images/iconamoon_exit-light.png',
            onClick: () => {
                 setIsModalOpen4(true)
            },
            isDanger: true // برای استایل قرمز
        }
    ];


    const data = [
        {
            id: '۱',
            trackingCode: '۵۰۱۲۳۵۶۷',
            authCode: 'A9C7F3K2104587',
            billId: '۱۲۳۴۶۷۸۹۰۲۳',
            paymentId: '۹۸۷۶۵۴۳۲۱۰۱۲',
            amount: '۳,۵۰,۰۰۰ ریال',
            date: '۱۴۰۳/۰۶/۱۲',
            time: '۱:۴۵',
            status: 'موفق',
        },
        {
            id: '۲',
            trackingCode: '۵۰۱۲۳۵۶۷',
            authCode: 'A9C7F3K2104587',
            billId: '۲۳۴۵۶۸۹۰۱۲',
            paymentId: '۹۸۷۶۵۴۳۲۱۰۱۲',
            amount: '۳,۵۰۰,۰۰۰ ریال',
            date: '۱۴۰۳/۰۶/۱۲',
            time: '۱۰:۴۵',
            status: 'ناموفق',
        },
        {
            id: '۳',
            trackingCode: '۵۵۰۱۲۳۴۵۶۷',
            authCode: 'A9C7F3K2104587',
            billId: '۱۲۳۴۵۶۷۸۹۰۱۲۳',
            paymentId: '۹۸۷۶۴۳۲۱۰۱۲',
            amount: '۳,۵۰۰,۰۰۰ ریال',
            date: '۱۴۰۳/۰۶/۱۲',
            time: '۱۰:۴۵',
            status: 'موفق',
        },
        {
            id: '۴',
            trackingCode: '۵۵۰۱۲۳۴۵۶۷',
            authCode: 'A9C7F3K2104587',
            billId: '۱۲۳۴۵۶۷۸۹۰۱۲۳',
            paymentId: '۸۷۶۵۴۳۲۱۰۱۲',
            amount: '۳,۵۰,۰۰۰ ریال',
            date: '۱۴۰۳/۰۶/۱',
            time: '۱۰:۴۵',
            status: 'موفق',
        },
        {
            id: '۵',
            trackingCode: '۵۰۱۲۳۴۶۷',
            authCode: 'A9C7F3K2104587',
            billId: '۱۳۴۵۶۷۹۰۱۲۳',
            paymentId: '۹۸۷۶۵۴۳۲۱۰۱۲',
            amount: '۳,۵۰۰,۰۰۰ ریال',
            date: '۱۴۰۳/۰۶/۱۲',
            time: '۱۰:۴۵',
            status: 'موفق',
        },
    ];

    const locationsData = [
        {
            code: '۸۷۶۵۴۳۲۱۰۱۲۳',
            address: 'خراسان رضوی، سبزوار، بلوار امامت، بیهقی شمالی، بیهقی شمالی ۱۲، پلاک ۱۴'
        },
        {
            code: '۸۷۶۴۳۲۱۰۱۲۳',
            address: 'خراسان رضوی، سبزوار، بلوار امامت، بیهقی شمالی، بیهقی شمالی ۱۲، پلاک ۱۴'
        }
    ];

    return (
        <>
            {/* بکدراپ تیره */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
            />

            {/* مودال اصلی */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-slideUp">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* هدر مودال با اطلاعات کاربر */}
                    <div className="bg-[#145d6e] px-5 py-2 text-white flex justify-between items-center w-full">
                       <div className="flex items-center gap-2">
                           <img src="/images/solar_user-circle-bold-duotone2.png" alt=""/>
                           <p className="text-sm">
                               پروفایل کاربری
                           </p>
                       </div>
                        <button
                            onClick={onClose}
                            className="py-2 text-white text-sm font-medium transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* منوها */}
                    <div className="py-2" style={{background: '#f9f9f9'}}>
                        <div className="p-3">
                            <div className="flex items-center gap-3 border justify-between rounded-lg border-gray-200 bg-white px-3">

                                <div className="flex justify-center items-center">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                        <img
                                            src="/images/profie-in-modal.png"
                                            alt="avatar"
                                            className="w-12 h-12"
                                        />
                                    </div>
                                    <h3 className=" text-lg">{userData?.name || 'ورود به حساب'}</h3>
                                </div>
                                <p className="text-lg opacity-90">{userData?.phone || '-'}</p>

                            </div>
                        </div>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className={`
                  w-full px-5 py-3 flex items-center gap-3 transition-all duration-200
                  hover:bg-gray-50 active:bg-gray-100
                  ${item.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                  border-b
                  border-gray-200
                  last:border-0
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
            {/* مودال */}
            <PaymentHistoryModal
                isOpen={isModalOpen2}
                onClose={() => setIsModalOpen2(false)}
                data={data}
            />

            <SelectedLocationsModal
                isOpen={isModalOpen3}
                onClose={() => setIsModalOpen3(false)}
                data={locationsData}
            />

            <LogoutConfirmationModal
                isOpen={isModalOpen4}
                onClose={() => setIsModalOpen4(false)}
            />
        </>
    );
};

export default ProfileModal;