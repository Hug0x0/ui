import { FileIds, IconIds } from '@/enums'
import { cn } from '@/utils'
import { ReactNode } from 'react'
import IconWrapper from '../icons/IconWrapper'
import { ImageWrapper } from './ImageWrapper'

export function FileWrapper(props: { children: ReactNode; className?: string }) {
    return <div className={cn('relative flex items-center justify-center', props.className)}>{props.children}</div>
}

export default function FileMapper({
    className = 'rounded-none',
    width = 20,
    height = 20,
    priority = false,
    scaleByHeight = false,
    ...props
}: {
    id?: FileIds | IconIds | string
    width?: number
    height?: number
    priority?: boolean
    className?: string
    scaleByHeight?: boolean
}) {
    // all files
    if (props.id && Object.values(FileIds).includes(props.id as FileIds))
        return (
            <ImageWrapper
                src={props.id as FileIds}
                alt={props.id as string}
                width={width}
                height={height}
                className={className}
                priority={priority}
                scaleByHeight={scaleByHeight}
                {...props}
            />
        )

    // all icons, just in case
    if (props.id && Object.values(IconIds).includes(props.id as IconIds)) return <IconWrapper id={props.id as IconIds} className={className} />

    // fallback
    return <div className={cn('skeleton-loading rounded', className)} style={{ width, height }} />
}
