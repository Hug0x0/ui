import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here.
     * This way you can ensure the app isn't built with invalid env vars.
     */

    server: {
        // Databases
        DATABASE_URL_MONITORING: z.string().url(),
        DATABASE_URL_KEEPER: z.string().url(),

        // API Security
        API_SECRET_KEY: z.string().optional(),
        INTERNAL_API_KEY: z.string().optional(),
        RATE_LIMIT_ENABLED: z.string().optional().default('true'),

        // Monitoring Configuration
        MONITORED_WALLETS: z.string().optional(), // Comma-separated list of wallet addresses

        // Inngest Configuration
        INNGEST_BRANCH: z.string().optional(),
        INNGEST_EVENT_KEY: z.string().optional(),
        INNGEST_SIGNING_KEY: z.string().optional(),
        INGEST_CLIENT_ID: z.string().optional(),
        ANALYTICS_CRON: z.string().optional(),

        // Explorer
        HYPEREVM_SCAN_API_KEY: z.string().optional(),
    },

    /**
     * Specify your client-side environment variables schema here.
     * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
     */

    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
        NEXT_PUBLIC_COMMIT_TIMESTAMP: z.string().optional(),
        NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
    },

    /**
     * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
     */

    runtimeEnv: {
        // Server
        DATABASE_URL_MONITORING: process.env.DATABASE_URL_MONITORING,
        DATABASE_URL_KEEPER: process.env.DATABASE_URL_KEEPER,
        API_SECRET_KEY: process.env.API_SECRET_KEY,
        INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
        RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
        MONITORED_WALLETS: process.env.MONITORED_WALLETS,
        INNGEST_BRANCH: process.env.INNGEST_BRANCH,
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
        INGEST_CLIENT_ID: process.env.INGEST_CLIENT_ID,
        ANALYTICS_CRON: process.env.ANALYTICS_CRON,
        HYPEREVM_SCAN_API_KEY: process.env.HYPEREVM_SCAN_API_KEY,

        // Client
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_COMMIT_TIMESTAMP: process.env.NEXT_PUBLIC_COMMIT_TIMESTAMP,
        NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    },

    emptyStringAsUndefined: true,
})
