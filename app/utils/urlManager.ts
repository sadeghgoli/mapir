export function getUrlParams(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
}

/** Keep : , ; readable in query values (used by p=marker:...;kooche:...) */
function encodeQueryValue(value: string): string {
    return encodeURIComponent(value)
        .replace(/%3A/gi, ':')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';');
}

function buildSearch(params: URLSearchParams): string {
    const parts: string[] = [];
    params.forEach((value, key) => {
        parts.push(`${encodeURIComponent(key)}=${encodeQueryValue(value)}`);
    });
    return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export function updateUrl(
    changes: Record<string, string | null>,
    method: 'replace' | 'push' = 'replace'
) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(changes)) {
        if (value === null) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    }
    const next = `${url.pathname}${buildSearch(url.searchParams)}${url.hash}`;
    window.history[method === 'push' ? 'pushState' : 'replaceState']({}, '', next);
}

export function readCoord(param: string, fallback: number): number {
    const v = parseFloat(getUrlParams()[param] || '');
    return !isNaN(v) ? v : fallback;
}

// --- Point standard ---
// Format: p=layerType:value;layerType:value;...
// Examples:
//   p=marker:36.21,57.667
//   p=mokeb:id123
//   p=toll:1-23-456-789-01-23-45
//   p=kooche:56BDA997-0722-4722-883D-B3C9A94AD772
//   p=marker:36.21,57.667;mokeb:id123

function parsePoints(raw: string): { layer: string; value: string }[] {
    if (!raw) return [];
    const segments = raw.split(';').filter(Boolean);
    return segments.map(seg => {
        const colonIdx = seg.indexOf(':');
        if (colonIdx === -1) return { layer: '', value: seg };
        return { layer: seg.slice(0, colonIdx), value: seg.slice(colonIdx + 1) };
    }).filter(p => p.layer);
}

function serializePoints(points: { layer: string; value: string }[]): string {
    return points.map(p => `${p.layer}:${p.value}`).join(';');
}

export function getAllPoints(): { layer: string; value: string }[] {
    const raw = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('p') || ''
        : '';
    return parsePoints(raw);
}

export function getPointsByLayer(layer: string): string[] {
    return getAllPoints().filter(p => p.layer === layer).map(p => p.value);
}

export function getFirstPoint(layer: string): string | null {
    const vals = getPointsByLayer(layer);
    return vals.length > 0 ? vals[0] : null;
}

export function setPoints(layer: string, values: string[], method: 'replace' | 'push' = 'replace') {
    const all = getAllPoints();
    const filtered = all.filter(p => p.layer !== layer);
    const newPoints = [...filtered, ...values.map(v => ({ layer, value: v }))];
    const raw = serializePoints(newPoints);
    updateUrl({ p: raw || null }, method);
}

/** Short shareable URL: only p=kooche:id (clears marker + camera params) */
export function setKoocheShareUrl(id: string, method: 'replace' | 'push' = 'replace') {
    updateUrl({
        p: `kooche:${id}`,
        lat: null,
        lng: null,
        zoom: null,
    }, method);
}

export function addPoint(layer: string, value: string, method: 'replace' | 'push' = 'replace') {
    const all = getAllPoints();
    all.push({ layer, value });
    updateUrl({ p: serializePoints(all) || null }, method);
}

export function removePoint(layer: string, value: string) {
    const all = getAllPoints();
    const filtered = all.filter(p => !(p.layer === layer && p.value === value));
    updateUrl({ p: serializePoints(filtered) || null });
}

export function removeAllPoints(layer?: string) {
    if (layer) {
        const all = getAllPoints();
        const filtered = all.filter(p => p.layer !== layer);
        updateUrl({ p: serializePoints(filtered) || null });
    } else {
        updateUrl({ p: null });
    }
}

// Migrate legacy params to new standard
export function migrateLegacyParams() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const updates: Record<string, string | null> = {};
    let needsMigrate = false;

    const oldMokebId = params.get('mokebId');
    if (oldMokebId) {
        addPoint('mokeb', oldMokebId);
        updates.mokebId = null;
        needsMigrate = true;
    }

    const oldPoint = params.get('point');
    if (oldPoint) {
        addPoint('toll', oldPoint);
        updates.point = null;
        needsMigrate = true;
    }

    const oldMlat = params.get('mlat');
    const oldMlng = params.get('mlng');
    if (oldMlat && oldMlng) {
        addPoint('marker', `${oldMlat},${oldMlng}`);
        updates.mlat = null;
        updates.mlng = null;
        needsMigrate = true;
    }

    if (needsMigrate) {
        updateUrl(updates);
    }
}
