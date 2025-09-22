import { inngest } from '@/lib/inngest'
import { pullAndStoreAnalyticsCron } from '@/crons/cron-pull-and-store'
import { serve } from 'inngest/next'

// Define IS_DEV locally to avoid importing app.config which loads fonts
// const IS_DEV = process.env.NODE_ENV === 'development'

export const { GET, POST, PUT } = serve({
    client: inngest,
    // functions: IS_DEV ? [pullAndStoreAnalyticsCron] : [],
    functions: [pullAndStoreAnalyticsCron],
    streaming: 'allow',
})
