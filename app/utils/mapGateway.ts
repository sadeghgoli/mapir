const DEFAULT_STYLE_URL = '/gw/styles/style.json';
const DEFAULT_API_KEY = 'pk_nPieiislOrRRdfJUxauVU-rI3tqYBPN6';

const TILE_ORIGINS = [
  'https://map-gateway.sabzevar.ir:8004',
  'http://map-gateway.sabzevar.ir:8004',
  'https://geo.sabzevar.ir:7001',
  'http://geo.sabzevar.ir:7001',
  'https://geo.sabzevar.ir',
  'http://geo.sabzevar.ir',
];

const KEYED_RESOURCE_TYPES = new Set([
  'Style',
  'Source',
  'Tile',
  'Glyphs',
  'SpriteJSON',
  'SpriteImage',
  'Image',
]);

export function mapStyleUrl(): string {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || DEFAULT_STYLE_URL;
}

export function mapApiKey(): string {
  return process.env.NEXT_PUBLIC_MAP_API_KEY?.trim() || DEFAULT_API_KEY;
}

function gwBase(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/gw`;
  }
  return '/gw';
}

export function rewriteMapAssetUrl(url: string): string {
  for (const origin of TILE_ORIGINS) {
    if (url.startsWith(origin)) {
      return gwBase() + url.slice(origin.length);
    }
  }
  return url;
}

export function withMapApiKey(url: string, key = mapApiKey()): string {
  if (!key) return url;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    if (
      !parsed.searchParams.has('key') &&
      !parsed.searchParams.has('apikey') &&
      !parsed.searchParams.has('token')
    ) {
      parsed.searchParams.set('key', key);
    }
    return parsed.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}key=${encodeURIComponent(key)}`;
  }
}

export function transformMapRequest(
  url: string,
  resourceType?: string,
): { url: string } {
  const rewritten = rewriteMapAssetUrl(url);
  if (resourceType && !KEYED_RESOURCE_TYPES.has(resourceType)) {
    return { url: rewritten };
  }
  return { url: withMapApiKey(rewritten) };
}
