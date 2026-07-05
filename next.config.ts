import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    generateBuildId: async () => `build-${Date.now()}`,
    
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        return [
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
                source: '/api/map-point/:path*',
                destination: 'http://apiweb-locationsmap.sabzevar.ir:5020/:path*',
            },
        ];
    },
};

export default nextConfig;