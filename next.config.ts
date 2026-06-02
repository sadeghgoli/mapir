import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    async rewrites() {
        return [
            {
                source: '/api/sabzevar/:path*',
                destination: 'https://layers.sabzevar.ir/:path*',
            },
        ];
    },
};

export default nextConfig;
