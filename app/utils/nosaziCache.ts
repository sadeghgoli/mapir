'use client';

interface CacheEntry {
    data: any;
    timestamp: number;
    bounds: { minx: number; miny: number; maxx: number; maxy: number; zoom: number };
}

const CACHE_PREFIX = 'nosazi_cache_';
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 30;

function roundCoord(n: number): number {
    return Math.round(n * 1000) / 1000;
}

function getCacheKey(minx: number, miny: number, maxx: number, maxy: number, zoom: number): string {
    return `${CACHE_PREFIX}${zoom}_${roundCoord(minx)}_${roundCoord(miny)}_${roundCoord(maxx)}_${roundCoord(maxy)}`;
}

function getAllCacheKeys(): string[] {
    if (typeof window === 'undefined') return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    return keys;
}

function boundsContain(
    cached: CacheEntry['bounds'],
    minx: number, miny: number, maxx: number, maxy: number
): boolean {
    return cached.minx <= minx && cached.miny <= miny
        && cached.maxx >= maxx && cached.maxy >= maxy
        && Math.abs(cached.zoom - Math.round(cached.zoom)) < 0.01;
}

function evictOldest(keys: string[], count: number): void {
    if (typeof window === 'undefined') return;
    const entries: { key: string; timestamp: number }[] = [];
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const entry: CacheEntry = JSON.parse(raw);
                entries.push({ key, timestamp: entry.timestamp });
            }
        } catch {
            localStorage.removeItem(key);
        }
    }
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, count);
    toRemove.forEach(e => localStorage.removeItem(e.key));
}

export function getCachedNosaziData(
    minx: number, miny: number, maxx: number, maxy: number, zoom: number
): any | null {
    if (typeof window === 'undefined') return null;

    const directKey = getCacheKey(minx, miny, maxx, maxy, zoom);
    const directRaw = localStorage.getItem(directKey);
    if (directRaw) {
        try {
            const entry: CacheEntry = JSON.parse(directRaw);
            if (Date.now() - entry.timestamp < TTL_MS) {
                return entry.data;
            }
            localStorage.removeItem(directKey);
        } catch {
            localStorage.removeItem(directKey);
        }
    }

    const allKeys = getAllCacheKeys();
    for (const key of allKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const entry: CacheEntry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > TTL_MS) {
                localStorage.removeItem(key);
                continue;
            }
            if (boundsContain(entry.bounds, minx, miny, maxx, maxy)) {
                return entry.data;
            }
        } catch {
            localStorage.removeItem(key);
        }
    }

    return null;
}

export function setCachedNosaziData(
    minx: number, miny: number, maxx: number, maxy: number, zoom: number,
    data: any
): void {
    if (typeof window === 'undefined') return;

    const key = getCacheKey(minx, miny, maxx, maxy, zoom);
    const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        bounds: { minx, miny, maxx, maxy, zoom },
    };

    const store = () => {
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            const allKeys = getAllCacheKeys();
            if (allKeys.length > 0) {
                evictOldest(allKeys, Math.max(1, Math.ceil(allKeys.length / 3)));
                try {
                    localStorage.setItem(key, JSON.stringify(entry));
                } catch {
                    // still full, give up
                }
            }
        }
    };

    store();

    const allKeys = getAllCacheKeys();
    if (allKeys.length > MAX_ENTRIES) {
        evictOldest(allKeys, allKeys.length - MAX_ENTRIES);
    }
}

export function getAllCachedNosaziFeatures(): any[] {
    if (typeof window === 'undefined') return [];
    const allFeatures: any[] = [];
    const seenCodes = new Set<string>();
    const keys = getAllCacheKeys();

    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const entry: CacheEntry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > TTL_MS) {
                localStorage.removeItem(key);
                continue;
            }
            if (entry.data?.features) {
                for (const feature of entry.data.features) {
                    const codeKey = feature.properties?.code_nosazi
                        || feature.properties?.name
                        || feature.properties?.Code_nosaz
                        || JSON.stringify(feature.geometry);
                    if (!seenCodes.has(codeKey)) {
                        seenCodes.add(codeKey);
                        allFeatures.push(feature);
                    }
                }
            }
        } catch {
            localStorage.removeItem(key);
        }
    }

    return allFeatures;
}

export function clearNosaziCache(): void {
    if (typeof window === 'undefined') return;
    const keys = getAllCacheKeys();
    keys.forEach(k => localStorage.removeItem(k));
}
