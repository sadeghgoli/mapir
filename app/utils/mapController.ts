type ClickListener = (lat: number, lng: number) => void;

export const mapController = {
    flyTo: null as ((lat: number, lng: number, zoom?: number) => void) | null,
    _clickListeners: [] as ClickListener[],
    onMapClick(lat: number, lng: number) {
        this._clickListeners.forEach(fn => fn(lat, lng));
    },
    addClickListener(fn: ClickListener) {
        this._clickListeners.push(fn);
        return () => { this._clickListeners = this._clickListeners.filter(f => f !== fn); };
    },
};
