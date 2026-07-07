import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'mokeb-edits.json');
const VALID_TOKEN = 'UUMMWX87736mmx77';

interface MokebEdit {
    id: string;
    description: string;
    editedAt: string;
}

async function readEdits(): Promise<Record<string, MokebEdit>> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const raw = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

async function writeEdits(edits: Record<string, MokebEdit>) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(edits, null, 2), 'utf-8');
}

export async function GET() {
    const edits = await readEdits();
    return NextResponse.json(edits);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, description, edit_token } = body;

        if (edit_token !== VALID_TOKEN) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 403 });
        }

        if (!id || typeof description !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        const edits = await readEdits();
        edits[id] = { id, description, editedAt: new Date().toISOString() };
        await writeEdits(edits);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
