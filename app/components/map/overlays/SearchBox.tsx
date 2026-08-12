'use client';

import {Tooltip} from "react-tooltip";
import SearchBox2 from "@/app/components/map/boxes/SearchBox";
import GeneralSearchBox from './GeneralSearchBox';
import PlaceSearchBox from './PlaceSearchBox';
import HelpModal from '../overlays/HelpModal';
import {useState} from "react";
import { useLayer } from '@/app/contexts/LayerContext';

export default function SearchBox() {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { activeLayers, availableLayers } = useLayer();

    const isLayerActive = (componentName: string) =>
        availableLayers.some(l => activeLayers.includes(l.id) && l.componentName === componentName);

    const hasToll = isLayerActive('NosaziLayer');
    const hasKooche = isLayerActive('KoocheLayer');
    const hasMokeb = isLayerActive('MokebLayer');

    const showGeneralSearch = (hasKooche || hasMokeb) && !hasToll;
    const showParcelSearch = hasToll;
    const showPlaceSearch = !showParcelSearch && !showGeneralSearch;

    return (
        <div
            className="
                absolute
                top-8
                left-6
                md:right-8
                z-[1000]
                flex
                gap-2
                items-center
            "
        >
        {showParcelSearch && <SearchBox2/>}
        {showGeneralSearch && <GeneralSearchBox />}
        {showPlaceSearch && <PlaceSearchBox />}

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
                    onClick={() => setIsHelpOpen(true)}
                >
                    <img src="/images/solar_question-circle-bold-duotone.png" alt=""/>
                </button>
            </div>
            <Tooltip
                anchorSelect="#info"
                content="راهنما"
                place="bottom"
                style={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    fontSize: '10px',
                }}
            />

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
}
