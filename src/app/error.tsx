'use client'

import PageWrapper from '@/components/common/PageWrapper'
import { useEffect } from 'react'
import { extractErrorMessage } from '@/utils'
import IconWrapper from '@/components/icons/IconWrapper'
import { AppUrls, IconIds } from '@/enums'
import LinkWrapper from '@/components/common/LinkWrapper'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error)

        // Auto-reload for chunk loading errors
        if (error.message?.includes('Loading chunk') || error.message?.includes('Failed to fetch dynamically imported module')) {
            const lastReload = sessionStorage.getItem('lastChunkErrorReload')
            const now = Date.now()

            // Only reload if we haven't tried recently
            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem('lastChunkErrorReload', now.toString())
                setTimeout(() => window.location.reload(), 1500)
            }
        }
    }, [error])
    return (
        <PageWrapper>
            <div className="mx-auto mt-10 flex w-full max-w-lg flex-col items-center gap-4">
                <p className="text-lg font-semibold">
                    Sorry, something went <span className="text-primary">wrong</span>
                </p>
                <div className="flex w-full flex-col items-center gap-2 rounded-xl">
                    <pre className="max-h-96 w-full overflow-y-auto text-wrap rounded-xl border border-dashed border-primary/20 px-8 py-10 text-center text-xs text-primary">
                        {extractErrorMessage(error)}
                    </pre>
                </div>
                <div className="flex w-full flex-col items-center gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-default/20 px-4 py-4 font-semibold hover:bg-background/10 sm:py-2"
                    >
                        <p className="font-semibold">Reload page</p>
                        <IconWrapper id={IconIds.UPDATE_NOW} className="size-5" />
                    </button>

                    <p className="text-sm text-default">
                        Reload the page or
                        <LinkWrapper href={AppUrls.CONTACT_US} target="_blank" className="px-1 underline hover:text-primary">
                            contact us
                        </LinkWrapper>
                        if the problem persists
                    </p>
                </div>
            </div>
        </PageWrapper>
    )
}
