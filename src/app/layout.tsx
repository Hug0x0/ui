import type { Metadata } from 'next'
import './globals.css'
import { APP_METADATA, LATO_FONT, PVP_TRADE_FONT, TEODOR_LIGHT_FONT } from '../config'
import { cn } from '@/utils'
import { Suspense } from 'react'
import DefaultFallback from '@/components/layouts/DefaultFallback'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from '@/components/common/ErrorBoundaryFallback'
import Footer from '@/components/layouts/Footer'
import HeaderDesktop from '@/components/layouts/HeaderDesktop'
import HeaderMobile from '@/components/layouts/HeaderMobile'
import { ThemeProvider } from 'next-themes'
import { AppThemes, AppUrls } from '@/enums'
import { ReactQueryProvider } from '@/providers/react-query.providers'
import PWAProvider from '@/providers/pwa.provider'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Analytics } from '@vercel/analytics/next'
import { ChunkErrorHandler } from '@/components/common/ChunkErrorHandler'

// Note: 1500x500 dimensions work well for Twitter's 3:1 aspect ratio
// Standard OpenGraph recommends 1200x630, but Twitter handles this size well
const image = {
    url: '/1500x500.jpeg',
    width: 1500,
    height: 500,
    alt: `${APP_METADATA.SITE_NAME} - ${APP_METADATA.SITE_DESCRIPTION}`,
    type: 'image/jpeg',
}

export const metadata: Metadata = {
    // Basic metadata
    title: {
        default: APP_METADATA.SITE_NAME,
        template: `%s | ${APP_METADATA.SITE_NAME}`,
    },
    description: APP_METADATA.SITE_DESCRIPTION,
    metadataBase: new URL(APP_METADATA.SITE_URL),

    // Icons
    icons: {
        icon: [
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon.png', type: 'image/png' },
        ],
        shortcut: '/favicon.png',
        apple: '/apple-touch-icon.png',
    },

    // PWA & Mobile
    appleWebApp: {
        title: APP_METADATA.SHORT_NAME,
        capable: true,
        statusBarStyle: 'black-translucent',
        startupImage: '/apple-touch-icon.png',
    },

    // OpenGraph
    openGraph: {
        type: 'website',
        title: APP_METADATA.SITE_NAME,
        siteName: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        images: [image],
        locale: 'en_US',
    },

    // Twitter/X
    twitter: {
        card: 'summary_large_image',
        site: APP_METADATA.AUTHOR.twitter,
        creator: APP_METADATA.AUTHOR.twitter,
        title: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        images: [image],
    },

    // Additional metadata
    keywords: [
        'hyperliquid',
        'defi',
        'liquidity',
        'vault',
        'delta-neutral',
        'LP',
        'yield',
        'APR',
        'funding',
        'hyperswap',
        'hyperevm',
        'crypto',
        'web3',
    ],
    authors: [{ name: APP_METADATA.AUTHOR.name, url: APP_METADATA.AUTHOR.url }],
    category: 'finance',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

const Providers = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider attribute="class" defaultTheme={AppThemes.LIGHT} disableTransitionOnChange themes={Object.values(AppThemes)}>
        <ReactQueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
        </ReactQueryProvider>
    </ThemeProvider>
)

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: APP_METADATA.SITE_NAME,
        description: APP_METADATA.SITE_DESCRIPTION,
        url: APP_METADATA.SITE_URL,
        applicationCategory: APP_METADATA.STRUCTURED_DATA.applicationCategory,
        operatingSystem: APP_METADATA.STRUCTURED_DATA.operatingSystem,
        author: {
            '@type': 'Person',
            name: APP_METADATA.AUTHOR.name,
            url: AppUrls.TAIKAI,
        },
    }

    return (
        <html lang="en" suppressHydrationWarning className="bg-background text-default">
            <head>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            </head>
            <body className={cn(PVP_TRADE_FONT.className, LATO_FONT.className, TEODOR_LIGHT_FONT.variable, 'min-h-screen w-full text-base')}>
                <PWAProvider>
                    <Providers>
                        <main className="flex min-h-screen flex-col">
                            <Suspense fallback={null}>
                                <HeaderDesktop />
                                <HeaderMobile />
                            </Suspense>
                            <Suspense fallback={<DefaultFallback />}>
                                <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>{children}</ErrorBoundary>
                            </Suspense>
                            <Suspense fallback={null}>
                                <Footer />
                            </Suspense>
                            <Toaster position="bottom-right" reverseOrder={true} />
                        </main>
                    </Providers>
                </PWAProvider>
                <Analytics />
                <ChunkErrorHandler />
            </body>
        </html>
    )
}
