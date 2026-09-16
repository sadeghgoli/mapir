import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/app/utils/upstreamProxy';

export const dynamic = 'force-dynamic';

const UPSTREAM = process.env.LAYER_API_URL?.trim() || 'https://apiweb-layersonmap.sabzevar.ir';

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetPath = `/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  try {
    const upstream = await proxyToUpstream(req.method, UPSTREAM, targetPath);
    const headers = new Headers();
    if (upstream.contentType) headers.set('content-type', upstream.contentType);
    return new Response(new Uint8Array(upstream.body), { status: upstream.status, headers });
  } catch {
    return new Response('Layer API upstream unreachable', { status: 502 });
  }
}

export function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, ctx);
}
