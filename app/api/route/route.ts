import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SERVERS = [
    'https://router.project-osrm.org',
    'https://routing.openstreetmap.de/routed-car',
];

async function tryFetch(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timeout);
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
        return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
    }

    const [lat1, lng1] = origin.split(',').map(Number);
    const [lat2, lng2] = destination.split(',').map(Number);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const path = `/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&steps=false`;

    for (const base of SERVERS) {
        try {
            const res = await tryFetch(`${base}${path}`, 8000);
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data);
            }
        } catch {
            continue;
        }
    }

    return NextResponse.json({ error: 'All routing servers unavailable' }, { status: 503 });
}
