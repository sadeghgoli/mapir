import { NextRequest } from 'next/server';
import http from 'node:http';
import https from 'node:https';

export const dynamic = 'force-dynamic';

const UPSTREAM = process.env.GEO_TILE_UPSTREAM?.trim() || 'https://192.168.1.19';
const UPSTREAM_HOST = process.env.GEO_TILE_HOST?.trim() || 'geo.sabzevar.ir';

function proxy(
  method: string,
  pathWithQuery: string,
): Promise<{ status: number; contentType: string | undefined; cacheControl: string | undefined; body: Buffer }> {
  const base = new URL(UPSTREAM);
  const lib = base.protocol === 'https:' ? https : http;
  const port = base.port ? Number(base.port) : base.protocol === 'https:' ? 443 : 80;
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: base.protocol,
        hostname: base.hostname,
        port,
        path,
        method,
        headers: {
          Host: UPSTREAM_HOST,
          Accept: '*/*',
        },
        servername: UPSTREAM_HOST,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 502,
            contentType: typeof res.headers['content-type'] === 'string' ? res.headers['content-type'] : undefined,
            cacheControl:
              typeof res.headers['cache-control'] === 'string' ? res.headers['cache-control'] : undefined,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetPath = `/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  try {
    const upstream = await proxy(req.method, targetPath);
    const headers = new Headers();
    if (upstream.contentType) headers.set('content-type', upstream.contentType);
    headers.set('cache-control', upstream.cacheControl || 'public, max-age=3600');
    return new Response(new Uint8Array(upstream.body), { status: upstream.status, headers });
  } catch {
    return new Response('Geo tile upstream unreachable', { status: 502 });
  }
}

export function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx);
}

export function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx);
}
