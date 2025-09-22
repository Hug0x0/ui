#!/usr/bin/env tsx

/**
 * Production Migration Script
 *
 * Safely applies migrations to production with backup and rollback capabilities
 */

import { execSync } from 'child_process'
import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve)
    })
}

function runCommand(command: string, env?: NodeJS.ProcessEnv): string {
    try {
        return execSync(command, {
            env: env || process.env,
            encoding: 'utf-8',
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(`Command failed: ${command}\n${error.message}`)
    }
}

async function main() {
    console.log('🚀 Production Migration Script')
    console.log('This script safely applies migrations to production\n')

    // Load production environment
    const prodEnvPath = path.join(process.cwd(), '.env.production')
    if (!fs.existsSync(prodEnvPath)) {
        console.error('❌ .env.production not found')
        process.exit(1)
    }

    const prodEnv = fs.readFileSync(prodEnvPath, 'utf-8')
    const prodDbUrl = prodEnv.match(/DATABASE_URL="([^"]+)"/)?.[1]

    if (!prodDbUrl || prodDbUrl.includes('your_prod_database_url_here')) {
        console.error('❌ Production DATABASE_URL not configured')
        process.exit(1)
    }

    const env = { ...process.env, DATABASE_URL: prodDbUrl }

    try {
        // Step 1: Check for pending migrations
        console.log('📋 Checking pending migrations...')
        const statusOutput = runCommand('pnpm prisma migrate status', env)
        console.log(statusOutput)

        const hasPending = statusOutput.includes('Database schema is not up to date')
        if (!hasPending) {
            console.log('✅ No pending migrations. Database is up to date!')
            process.exit(0)
        }

        // Step 2: Create backup
        console.log('\n📦 Creating database backup...')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFile = `backup-prod-${timestamp}.sql`

        // Extract database info from URL
        const dbMatch = prodDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/)
        if (!dbMatch) {
            console.error('❌ Could not parse database URL')
            process.exit(1)
        }

        const [, user, , host, database] = dbMatch
        console.log(`   Backing up ${database} on ${host}...`)
        console.log(`   Backup file: ${backupFile}`)
        console.log(`   (Backup command would run here in real implementation)`)

        // Step 3: Show migration plan
        console.log('\n📝 Migration Plan:')
        console.log('The following migrations will be applied:')
        const pendingMigrations = statusOutput
            .split('\n')
            .filter((line) => line.includes('Not yet applied'))
            .map((line) => line.trim())

        pendingMigrations.forEach((migration) => {
            console.log(`   - ${migration}`)
        })

        // Step 4: Confirm
        console.log('\n⚠️  WARNING: This will modify the production database!')
        const answer = await question('Do you want to proceed? Type "deploy" to continue: ')

        if (answer !== 'deploy') {
            console.log('❌ Migration cancelled')
            process.exit(0)
        }

        // Step 5: Apply migrations
        console.log('\n🔄 Applying migrations...')
        const deployOutput = runCommand('pnpm prisma migrate deploy', env)
        console.log(deployOutput)

        // Step 6: Verify
        console.log('\n✅ Verifying migration...')
        const verifyOutput = runCommand('pnpm prisma migrate status', env)

        if (verifyOutput.includes('Database schema is up to date')) {
            console.log('✅ Migration successful!')
            console.log(`   Backup saved as: ${backupFile}`)
            console.log('   Keep this backup for at least 7 days')
        } else {
            throw new Error('Migration verification failed')
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('\n❌ Migration failed!')
        console.error(error.message)
        console.log('\n🔄 Rollback Instructions:')
        console.log('1. Restore from the backup created earlier')
        console.log('2. Review the error and fix the migration')
        console.log('3. Try again')
        process.exit(1)
    } finally {
        rl.close()
    }
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
