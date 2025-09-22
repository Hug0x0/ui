import PageWrapper from '../common/PageWrapper'
import Skeleton from '../common/Skeleton'

export function DefaultFallbackContent() {
    return (
        <>
            <Skeleton variant="text" />
        </>
    )
}

export default function DefaultFallback() {
    return (
        <PageWrapper>
            <DefaultFallbackContent />
        </PageWrapper>
    )
}
