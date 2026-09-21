import { KOCHE_LAYER_ID } from '@/app/constants/layers';

const MAP_POINT_BASE = '/api/map-point/api';
const KOOCHE_CATEGORY_NAME = 'کوچه‌ها';
const PAGE_SIZE = 50;

export interface MapPoint {
    id: string;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    categoryId: string;
    categoryName: string;
    categoryColor: string | null;
    status: number;
    visitLink: string | null;
    shortVisitLink: string | null;
    visitCount: number;
    mainImageUrl: string | null;
}

interface CategoryItem {
    id: string;
    name: string;
    color: string;
    sortOrder: number;
    pointCount: number;
}

interface ApiListResponse<T> {
    success: boolean;
    data: T[];
    totalCount?: number;
    page?: number;
    pageSize?: number;
}

interface ApiItemResponse<T> {
    success: boolean;
    data: T;
}

let koocheCategoryIdPromise: Promise<string> | null = null;
let koochePointsCache: MapPoint[] | null = null;
let koochePointsInflight: Promise<MapPoint[]> | null = null;

export function findMapPointById(points: MapPoint[], id: string): MapPoint | undefined {
    const lower = id.toLowerCase();
    return points.find(p => p.id.toLowerCase() === lower);
}

export function fetchKoocheCategoryId(): Promise<string> {
    if (!koocheCategoryIdPromise) {
        koocheCategoryIdPromise = (async () => {
            const res = await fetch(`${MAP_POINT_BASE}/Category`);
            if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
            const json: ApiListResponse<CategoryItem> = await res.json();
            if (!json.success) throw new Error('API returned success: false');
            const found = json.data.find(c => c.name === KOOCHE_CATEGORY_NAME);
            return found?.id || KOCHE_LAYER_ID;
        })().catch(() => {
            koocheCategoryIdPromise = Promise.resolve(KOCHE_LAYER_ID);
            return KOCHE_LAYER_ID;
        });
    }
    return koocheCategoryIdPromise;
}

export async function fetchApprovedMapPoints(categoryId?: string): Promise<MapPoint[]> {
    const all: MapPoint[] = [];
    let page = 1;

    while (true) {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: String(PAGE_SIZE),
        });
        if (categoryId) params.set('categoryId', categoryId);
        const res = await fetch(`${MAP_POINT_BASE}/MapPoint?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch map points: ${res.status}`);
        const json: ApiListResponse<MapPoint> = await res.json();
        if (!json.success) throw new Error('API returned success: false');

        const batch = json.data ?? [];
        all.push(...batch);

        const total = json.totalCount ?? all.length;
        if (all.length >= total || batch.length < PAGE_SIZE) break;
        page += 1;
    }

    return all;
}

export async function fetchKoocheMapPoints(options?: { force?: boolean }): Promise<MapPoint[]> {
    const force = options?.force ?? false;
    if (!force && koochePointsCache) return koochePointsCache;
    if (!force && koochePointsInflight) return koochePointsInflight;

    koochePointsInflight = (async () => {
        const categoryId = await fetchKoocheCategoryId();
        let data = await fetchApprovedMapPoints(categoryId);
        if (data.length === 0) {
            const all = await fetchApprovedMapPoints();
            const catLower = categoryId.toLowerCase();
            data = all.filter(p =>
                p.categoryName === KOOCHE_CATEGORY_NAME ||
                p.categoryId?.toLowerCase() === catLower
            );
        }
        koochePointsCache = data;
        return data;
    })().finally(() => {
        koochePointsInflight = null;
    });

    return koochePointsInflight;
}

export async function fetchMapPointById(id: string): Promise<MapPoint> {
    const res = await fetch(`${MAP_POINT_BASE}/MapPoint/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to fetch map point: ${res.status}`);
    const json: ApiItemResponse<MapPoint> = await res.json();
    if (!json.success || !json.data) throw new Error('API returned success: false');
    return json.data;
}

export function mapPointShareUrl(point: Pick<MapPoint, 'shortVisitLink' | 'visitLink'>): string | null {
    return point.shortVisitLink || point.visitLink || null;
}
