import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    generateBuildId: async () => `build-${Date.now()}`,
    
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        const ssoUpstream =
            process.env.SSO_API_UPSTREAM ||
            'https://apiweb-loginsso.sabzevar.ir';

        return [
            {
                source: '/sso-api/:path*',
                destination: `${ssoUpstream.replace(/\/$/, '')}/:path*`,
            },
            {
                source: '/api/sabzevar/:path*',
                destination: 'https://layers.sabzevar.ir/:path*',
            },
            {
                source: '/api/nosazi/:path*',
                destination: 'https://regpaidbill.sabzevar.ir/:path*',
            },
            {
                source: '/api/AmardDataHandler.ashx',
                destination: 'https://regpaidbill.sabzevar.ir/AmardDataHandler.ashx',
            },
            {
                source: '/api/AmardDataHandler/:path*',
                destination: 'https://regpaidbill.sabzevar.ir/:path*',
            },
            {
                source: '/tile/:path*',
                destination: 'https://tile.openstreetmap.org/:path*',
            },
            {
                source: '/api/osrm/:path*',
                destination: `${process.env.OSRM_BASE_URL || 'http://route.runflare.run'}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;