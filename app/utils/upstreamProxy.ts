import http from 'node:http';
import https from 'node:https';

export function proxyToUpstream(
  method: string,
  upstreamBase: string,
  pathWithQuery: string,
  hostHeader?: string,
): Promise<{ status: number; contentType: string | undefined; body: Buffer }> {
  const base = new URL(upstreamBase);
  const lib = base.protocol === 'https:' ? https : http;
  const port = base.port ? Number(base.port) : base.protocol === 'https:' ? 443 : 80;
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  const hostname = base.hostname;
  const servername = hostHeader || hostname;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: base.protocol,
        hostname,
        port,
        path,
        method,
        headers: {
          Host: servername,
          Accept: 'application/json, */*',
        },
        servername,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 502,
            contentType: typeof res.headers['content-type'] === 'string' ? res.headers['content-type'] : undefined,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}
