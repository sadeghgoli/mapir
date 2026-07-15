'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { updateUrl, getUrlParams, getFirstPoint } from '@/app/utils/urlManager';
import { fetchCategoryTree, flattenTree, type CategoryTreeNode, type GuideEntry } from '@/app/services/layer.service';

export interface LayerConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    componentName: string | null;
}

const DEFAULT_CATEGORIES: CategoryTreeNode[] = [
    {
        id: 'toll', name: 'پرداخت عوارض', icon: 'CreditCard', color: '#3B82F6',
        sortOrder: 1, isActive: true, componentName: 'NosaziLayer', children: [], guides: [],
    },
    {
        id: 'mokeb', name: 'موکب‌ها', icon: 'MapPin', color: '#8B5CF6',
        sortOrder: 2, isActive: true, componentName: 'MokebLayer', children: [], guides: [],
    },
    {
        id: 'kooche', name: 'کوچه‌ها', icon: 'Route', color: '#10B981',
        sortOrder: 3, isActive: true, componentName: 'KoocheLayer', children: [], guides: [],
    },
];

function nodeToConfig(node: CategoryTreeNode): LayerConfig {
    return {
        id: node.id,
        name: node.name,
        description: node.guides?.map(g => g.title).join(' · ') || node.name,
        icon: node.icon ?? 'MapPin',
        color: node.color ?? '#6B7280',
        componentName: node.componentName ?? null,
    };
}

function collectLeafIds(nodes: CategoryTreeNode[]): string[] {
    const ids: string[] = [];
    function walk(list: CategoryTreeNode[]) {
        for (const n of list) {
            if (n.children.length === 0) ids.push(n.id);
            else walk(n.children);
        }
    }
    walk(nodes);
    return ids;
}

function findNodeByComponent(nodes: CategoryTreeNode[], componentName: string): CategoryTreeNode | null {
    for (const n of nodes) {
        if (n.componentName === componentName) return n;
        if (n.children.length > 0) {
            const found = findNodeByComponent(n.children, componentName);
            if (found) return found;
        }
    }
    return null;
}

type ExpandedState = Record<string, boolean>;

interface LayerContextType {
    activeLayers: string[];
    availableLayers: LayerConfig[];
    treeNodes: CategoryTreeNode[];
    toggleLayer: (layerId: string) => void;
    isPanelOpen: boolean;
    togglePanel: () => void;
    loading: boolean;
    expanded: ExpandedState;
    toggleExpand: (nodeId: string) => void;
    getGuides: (nodeId: string) => GuideEntry[];
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export function LayerProvider({ children }: { children: ReactNode }) {
    const [activeLayers, setActiveLayers] = useState<string[]>([]);
    const [availableLayers, setAvailableLayers] = useState<LayerConfig[]>(
        DEFAULT_CATEGORIES.map(nodeToConfig)
    );
    const [treeNodes, setTreeNodes] = useState<CategoryTreeNode[]>(DEFAULT_CATEGORIES);
    const [isPanelOpen, setPanelOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);
    const [expanded, setExpanded] = useState<ExpandedState>({});

    useEffect(() => {
        let cancelled = false;

        fetchCategoryTree()
            .then(nodes => {
                if (cancelled) return;
                setTreeNodes(nodes);
                const configs = flattenTree(nodes).map(nodeToConfig);
                setAvailableLayers(configs);
                return nodes;
            })
            .catch(() => {
                if (cancelled) return;
                return DEFAULT_CATEGORIES;
            })
            .then(nodes => {
                if (cancelled || !nodes) return;
                const ids = collectLeafIds(nodes);
                const p = getUrlParams();
                let fromUrl: string[] = [];
                if (p.layers) {
                    fromUrl = p.layers.split(',').filter(id => ids.includes(id));
                }
                if (getFirstPoint('mokeb')) {
                    const mokebNode = findNodeByComponent(nodes, 'MokebLayer');
                    if (mokebNode && !fromUrl.includes(mokebNode.id)) {
                        fromUrl.push(mokebNode.id);
                    }
                }
                setActiveLayers(fromUrl);
                setHydrated(true);
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const allIds = collectLeafIds(treeNodes);
        updateUrl({
            layers: activeLayers.length > 0 && activeLayers.length < allIds.length
                ? activeLayers.join(',')
                : null,
        });
    }, [activeLayers, hydrated, treeNodes]);

    const toggleLayer = useCallback((layerId: string) => {
        setActiveLayers(prev => {
            if (prev.includes(layerId)) return prev.filter(id => id !== layerId);
            return [...prev, layerId];
        });
    }, []);

    const togglePanel = useCallback(() => setPanelOpen(prev => !prev), []);

    const toggleExpand = useCallback((nodeId: string) => {
        setExpanded(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    }, []);

    const getGuides = useCallback((nodeId: string): GuideEntry[] => {
        function search(list: CategoryTreeNode[]): GuideEntry[] {
            for (const n of list) {
                if (n.id === nodeId) return n.guides;
                if (n.children.length > 0) {
                    const found = search(n.children);
                    if (found.length > 0) return found;
                }
            }
            return [];
        }
        return search(treeNodes);
    }, [treeNodes]);

    return (
        <LayerContext.Provider value={{
            activeLayers, availableLayers, treeNodes,
            toggleLayer, isPanelOpen, togglePanel, loading,
            expanded, toggleExpand, getGuides,
        }}>
            {children}
        </LayerContext.Provider>
    );
}

export function useLayer() {
    const ctx = useContext(LayerContext);
    if (!ctx) throw new Error('useLayer must be used within LayerProvider');
    return ctx;
}
