export function getUrlParams(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
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
    window.history[method === 'push' ? 'pushState' : 'replaceState']({}, '', url.toString());
}

export function readCoord(param: string, fallback: number): number {
    const v = parseFloat(getUrlParams()[param] || '');
    return !isNaN(v) ? v : fallback;
}
