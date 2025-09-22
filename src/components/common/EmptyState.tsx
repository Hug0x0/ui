interface EmptyStateProps {
    title: string
    description?: string
    className?: string
}

/**
 * Reusable empty state component
 * Following DRY principle - extracted from repeated pattern in modals and tables
 */
export default function EmptyState({ title, description, className = '' }: EmptyStateProps) {
    return (
        <div className={`flex flex-1 items-center justify-center p-8 ${className}`}>
            <div className="text-center">
                <p className="text-lg text-default/50">{title}</p>
                {description && <p className="mt-2 text-sm text-default/30">{description}</p>}
            </div>
        </div>
    )
}
