import { NextRequest, NextResponse } from 'next/server';

/** محدوده مجاز: سبزوار + شهرک توحید */
const BOUNDS = {
    // west, north, east, south — Nominatim viewbox
    viewbox: '57.55,36.31,57.82,36.14',
    minLat: 36.14,
    maxLat: 36.31,
    minLng: 57.55,
    maxLng: 57.82,
};

const ALLOWED_AREA_KEYWORDS = ['سبزوار', 'توحید', 'sabzevar', 'towhid', 'tohid'];

export interface GeocodeResult {
    id: string;
    label: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
}

function typeLabel(cls: string, type: string, addresstype?: string): string {
    const key = addresstype || type || cls;
    const map: Record<string, string> = {
        road: 'خیابان',
        highway: 'خیابان',
        residential: 'خیابان',
        tertiary: 'خیابان',
        secondary: 'خیابان',
        primary: 'خیابان',
        pedestrian: 'پیاده‌راه',
        street: 'خیابان',
        city: 'شهر',
        town: 'شهر',
        village: 'روستا',
        suburb: 'محله',
        neighbourhood: 'محله',
        quarter: 'محله',
        amenity: 'مکان',
        shop: 'فروشگاه',
        building: 'ساختمان',
        place: 'مکان',
        house: 'پلاک',
        hamlet: 'آبادی',
    };
    return map[key] || map[cls] || 'مکان';
}

function inAllowedBounds(lat: number, lng: number): boolean {
    return (
        lat >= BOUNDS.minLat &&
        lat <= BOUNDS.maxLat &&
        lng >= BOUNDS.minLng &&
        lng <= BOUNDS.maxLng
    );
}

function inAllowedArea(displayName: string): boolean {
    const lower = displayName.toLowerCase();
    return ALLOWED_AREA_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    if (q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    // جستجو را به محدوده سبزوار/توحید بایاس می‌کنیم؛ فیلتر نهایی روی مختصات و نام
    const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '20',
        'accept-language': 'fa',
        viewbox: BOUNDS.viewbox,
        bounded: '1',
        countrycodes: 'ir',
    });

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: {
                    'User-Agent': 'SabzevarMap/1.0 (https://map.sabzevar.ir)',
                    Accept: 'application/json',
                },
                next: { revalidate: 0 },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ results: [], error: 'geocode_failed' }, { status: 502 });
        }

        const data = await res.json() as Array<{
            place_id: number;
            lat: string;
            lon: string;
            display_name: string;
            name?: string;
            class: string;
            type: string;
            addresstype?: string;
        }>;

        const results: GeocodeResult[] = data
            .map(item => ({
                id: String(item.place_id),
                name: item.name || item.display_name.split(',')[0],
                label: item.display_name,
                type: typeLabel(item.class, item.type, item.addresstype),
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            }))
            .filter(item =>
                inAllowedBounds(item.lat, item.lng) &&
                inAllowedArea(item.label)
            )
            .slice(0, 8);

        return NextResponse.json({ results });
    } catch {
        return NextResponse.json({ results: [], error: 'geocode_error' }, { status: 500 });
    }
}
