import { cn } from '@/utils'
import { Suspense } from 'react'
import { DefaultFallbackContent } from '../layouts/DefaultFallback'

export default function PageWrapper({
    children,
    className,
    paddingX = 'px-4 md:px-6 lg:px-8',
    ...props
}: {
    children: React.ReactNode
    className?: string
    paddingX?: string
}) {
    return (
        <Suspense fallback={DefaultFallbackContent()}>
            <div
                {...props}
                className={cn(
                    'mx-auto mt-4 flex min-h-[calc(100vh-260px)] w-full flex-col overflow-hidden sm:min-h-[calc(100vh-184px)]',
                    paddingX,
                    className,
                )}
            >
                {children}
            </div>
        </Suspense>
    )
}
