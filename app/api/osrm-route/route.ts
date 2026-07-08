import { NextRequest, NextResponse } from 'next/server';

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://route.runflare.run';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startLat = searchParams.get('startLat');
    const startLng = searchParams.get('startLng');
    const endLat = searchParams.get('endLat');
    const endLng = searchParams.get('endLng');

    if (!startLat || !startLng || !endLat || !endLng) {
        return NextResponse.json(
            { error: 'Missing required parameters: startLat, startLng, endLat, endLng' },
            { status: 400 }
        );
    }

    const url = `${OSRM_BASE_URL}/api/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

        if (!response.ok) {
            return NextResponse.json(
                { error: `OSRM backend error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to connect to OSRM backend' },
            { status: 502 }
        );
    }
}
