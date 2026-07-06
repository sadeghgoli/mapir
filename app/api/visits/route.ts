import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'visits.json');

async function readVisits(): Promise<unknown[]> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const raw = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function writeVisits(visits: unknown[]) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(visits, null, 2), 'utf-8');
}

export async function GET() {
    const visits = await readVisits();
    return NextResponse.json(visits);
}

export async function POST(request: NextRequest) {
    try {
        const visit = await request.json();
        const visits = await readVisits();
        visits.unshift(visit);
        await writeVisits(visits);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: String(e) },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    await writeVisits([]);
    return NextResponse.json({ success: true });
}
