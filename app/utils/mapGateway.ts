const DEFAULT_STYLE_URL =
  'https://map-gateway.sabzevar.ir:8004/styles/style.json';

const DEFAULT_API_KEY = 'pk_nPieiislOrRRdfJUxauVU-rI3tqYBPN6';

const LEGACY_TILE_ORIGINS = [
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

export function mapGatewayOrigin(styleUrl = mapStyleUrl()): string {
  try {
    return new URL(styleUrl).origin;
  } catch {
    return 'https://map-gateway.sabzevar.ir:8004';
  }
}

export function rewriteMapAssetUrl(url: string, gatewayOrigin = mapGatewayOrigin()): string {
  for (const legacy of LEGACY_TILE_ORIGINS) {
    if (url.startsWith(legacy)) {
      return gatewayOrigin + url.slice(legacy.length);
    }
  }
  return url;
}

export function withMapApiKey(url: string, key = mapApiKey()): string {
  if (!key) return url;
  try {
    const parsed = new URL(url);
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
