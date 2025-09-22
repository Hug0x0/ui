import { cn } from '@/utils'

interface EmptyTablePlaceholderProps {
    message: string
    className?: string
}

export function EmptyTablePlaceholder({ message, className }: EmptyTablePlaceholderProps) {
    return <div className={cn('py-2 text-center text-default/50', className)}>{message}</div>
}
