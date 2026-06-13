'use client';

import { Tooltip } from 'react-tooltip';
import ProfileModal from './ProfileModal';
import {useState} from "react";
import Link from "next/link";

export default function UserCard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const userInfo = {
        name: 'ورود به حساب',
        phone: '-'
    };
    return (
        <div
            className="
                absolute
                top-12
                left-8
                z-[1000]
            "
        >
            <div className="flex items-center gap-3">


                <div
                    className="
                        bg-cyan-800
                        text-white
                        rounded-lg
                        px-2
                        h-12
                        shadow-xl
                        flex
                        items-center
                        gap-4
                    "
                    onClick={() => setIsModalOpen(true)}
                >
                    <div
                        className="
                            w-10
                            h-10
                            rounded-full
                            bg-white/30
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <img src="/images/solar_user-circle-bold-duotone.png" alt=""/>
                    </div>

                    <div>
                        <div className="text-sm">
                            ورود به حساب
                        </div>

                        <div className="text-sm opacity-80">
                            -
                        </div>
                    </div>


                </div>
                <Link href="https://sabzevar.ir">

                <button
                    id="my-anchor-element"
                    className="
                        w-12
                        h-12
                        rounded-lg
                        bg-white
                        shadow-lg
                        flex
                        items-center
                        justify-center
                    "
                >
                    <img src="/images/solar_round-arrow-left-bold-duotone.png" alt=""/>
                </button>
                </Link>

                <Tooltip
                    anchorSelect="#my-anchor-element"
                    content="بازگشت به سایت"
                    place="bottom"        // نمایش تولتیپ در سمت پایین
                    style={{
                        backgroundColor: "#ffffff",  // رنگ پس‌زمینه سفید
                        color: "#000000",            // رنگ متن سیاه (برای خوانایی بهتر)
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        fontSize: '10px',
                    }}
                />

                {/* مودال */}
                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userData={userInfo}
                />

            </div>
        </div>
    );
}