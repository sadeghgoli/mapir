'use client';

const STORAGE_KEY = 'site_visits';

export interface VisitRecord {
    id: string;
    timestamp: string;
    date: string;
    time: string;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
    userAgent: string;
    referrer: string;
    pageUrl: string;
    browser: string;
    os: string;
    device: string;
}

function detectBrowser(ua: string) {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
    return 'Other';
}

function detectOS(ua: string) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Other';
}

function detectDevice(ua: string) {
    if (ua.includes('Mobile') || ua.includes('Android')) return 'موبایل';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'موبایل';
    if (ua.includes('Tablet')) return 'تبلت';
    return 'کامپیوتر';
}

export function trackVisit() {
    if (typeof window === 'undefined') return;

    try {
        const params = new URLSearchParams(window.location.search);
        const source = params.get('utm_source');
        const medium = params.get('utm_medium');
        const campaign = params.get('utm_campaign');
        const term = params.get('utm_term');
        const content = params.get('utm_content');

        if (!source && !medium && !campaign) return;

        const now = new Date();
        const ua = navigator.userAgent;

        const record: VisitRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: now.toISOString(),
            date: now.toLocaleDateString('fa-IR'),
            time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            source,
            medium,
            campaign,
            term,
            content,
            userAgent: ua,
            referrer: document.referrer || '(مستقیم)',
            pageUrl: window.location.href,
            browser: detectBrowser(ua),
            os: detectOS(ua),
            device: detectDevice(ua),
        };

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        stored.unshift(record);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

        fetch('/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
        }).catch(() => {});
    } catch (e) {
        console.warn('Visit tracking failed:', e);
    }
}

export function getVisits(): VisitRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function clearVisits() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
