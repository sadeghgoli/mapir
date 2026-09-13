const DEFAULT_STYLE_URL = '/style.json';
const DEFAULT_API_KEY = 'pk_nPieiislOrRRdfJUxauVU-rI3tqYBPN6';

const TILE_ORIGINS = [
  'https://map-gateway.sabzevar.ir',
  'http://map-gateway.sabzevar.ir',
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

function pageBase(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return 'http://localhost';
}

function gwBase(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/gw`;
  }
  return '/gw';
}

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, pageBase()).toString();
  } catch {
    return url;
  }
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
    const parsed = new URL(url, pageBase());
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
  const rewritten = toAbsoluteUrl(rewriteMapAssetUrl(url));
  if (rewritten.includes('geo.sabzevar.ir') || rewritten.includes('/gw/')) {
    return { url: rewritten };
  }
  if (resourceType && !KEYED_RESOURCE_TYPES.has(resourceType)) {
    return { url: rewritten };
  }
  return { url: withMapApiKey(rewritten) };
}
