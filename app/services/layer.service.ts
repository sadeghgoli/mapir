export interface GuideEntry {
    id: string;
    categoryId: string;
    categoryName: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    icon: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface CategoryTreeNode {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
    componentName: string | null;
    children: CategoryTreeNode[];
    guides: GuideEntry[];
}

interface TreeResponse {
    success: boolean;
    data: CategoryTreeNode[];
}

interface GuideListResponse {
    success: boolean;
    data: GuideEntry[];
}

export async function fetchCategoryTree(): Promise<CategoryTreeNode[]> {
    const res = await fetch('/api/map-layers/api/categories/tree');
    if (!res.ok) throw new Error(`Failed to fetch category tree: ${res.status}`);
    const json: TreeResponse = await res.json();
    if (!json.success) throw new Error('API returned success: false');
    return json.data;
}

export async function fetchGuidesByCategory(categoryId: string): Promise<GuideEntry[]> {
    const res = await fetch(`/api/map-layers/api/guide/by-category/${categoryId}`);
    if (!res.ok) throw new Error(`Failed to fetch guides: ${res.status}`);
    const json: GuideListResponse = await res.json();
    if (!json.success) throw new Error('API returned success: false');
    return json.data;
}

export function flattenTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
    const result: CategoryTreeNode[] = [];
    function walk(list: CategoryTreeNode[]) {
        for (const node of list) {
            result.push(node);
            if (node.children.length > 0) walk(node.children);
        }
    }
    walk(nodes);
    return result;
}
