import { Inngest } from 'inngest'
import { env } from '@/env/t3-env'

// Make Inngest optional - use default value if not configured
export const inngest = new Inngest({
    id: env.INGEST_CLIENT_ID || 'hyperlp',
    env: env.INNGEST_BRANCH || 'main',
})
