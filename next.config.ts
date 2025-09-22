import type { NextConfig } from 'next'
import { execSync } from 'child_process'

const nextConfig: NextConfig = {
    reactStrictMode: true, // Helps catch bugs in development
    productionBrowserSourceMaps: false, // Save ~30% bundle size
    images: {
        remotePatterns: [{ hostname: '*' }],
    },
    output: 'standalone',
    // Optimize bundle
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    experimental: {
        webpackBuildWorker: true,
        turbo: {
            resolveAlias: {
                '@/*': ['./src/*'],
            },
        },
    },
    // Better HMR settings for development
    onDemandEntries: {
        maxInactiveAge: 25 * 1000, // 25 seconds
        pagesBufferLength: 5,
    },
    async headers() {
        const isDev = process.env.NODE_ENV === 'development'
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    // Disable caching in development
                    ...(isDev ? [{
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    }] : []),
                ],
            },
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/javascript; charset=utf-8',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
    generateBuildId: async () => {
        // Use git commit hash as build ID for consistent chunk naming
        return execSync('git rev-parse HEAD').toString().trim().substring(0, 8)
    },
    // Simplified webpack config to avoid module loading issues
    webpack: (config) => {
        return config
    },
}

export default nextConfig
