'use client';

import {
    HelpCircle,
    Search, Star,
} from 'lucide-react';
import {Tooltip} from "react-tooltip";
import SearchBox2 from "@/app/components/map/boxes/SearchBox";

export default function SearchBox() {
    return (
        <div
            className="
                absolute
                top-12
                right-8
                z-[1000]
                flex
                gap-2
                items-center
            "
        >
        <SearchBox2/>

            <div  id="star">
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
                    <img src="/images/solar_star-circle-bold-duotone.png" alt=""/>
                </button>

            </div>
            <div id="info">

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
                    <img src="/images/solar_question-circle-bold-duotone.png" alt=""/>
                </button>
            </div>
            <Tooltip
                anchorSelect="#info"
                content="راهنما"
                place="bottom"        // نمایش تولتیپ در سمت پایین
                style={{
                    backgroundColor: "#ffffff",  // رنگ پس‌زمینه سفید
                    color: "#000000",            // رنگ متن سیاه (برای خوانایی بهتر)
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    fontSize: '10px',
                }}
            />

            <Tooltip
                anchorSelect="#star"
                content="مکان های منتخب"
                place="bottom"        // نمایش تولتیپ در سمت پایین
                style={{
                    backgroundColor: "#ffffff",  // رنگ پس‌زمینه سفید
                    color: "#000000",            // رنگ متن سیاه (برای خوانایی بهتر)
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    fontSize: '10px',
                }}
            />
        </div>
    );
}