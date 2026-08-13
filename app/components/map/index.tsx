'use client';

import MapView from './MapView';

import TopBar from './overlays/TopBar';
import SearchBox from './overlays/SearchBox';
import UserCard from './overlays/UserCard';
import BottomToolbar from './overlays/BottomToolbar';
import ZoomControls from './overlays/ZoomControls';
import PropertyPopup from './overlays/PropertyPopup';
import SelectedPointQr from './overlays/SelectedPointQr';

export default function MapLayout() {
    return (
        <div className="relative w-full h-screen overflow-hidden">

            <MapView />

            {/* overlays */}

            <SearchBox />

            <UserCard />

            <ZoomControls />

            <PropertyPopup />

            <SelectedPointQr />

            <BottomToolbar />
        </div>
    );
}
