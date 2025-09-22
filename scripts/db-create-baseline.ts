#!/usr/bin/env tsx

/**
 * Create Migration Baseline Script
 * 
 * This script creates a baseline migration from the current schema
 * Use this when you want to start fresh with migrations
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
    console.log('📐 Creating Migration Baseline')
    console.log('This will create a single migration that represents your entire current schema')
    console.log('')

    try {
        const migrationsDir = path.join(process.cwd(), 'prisma/migrations')
        
        // Backup existing migrations
        if (fs.existsSync(migrationsDir)) {
            const backupDir = path.join(process.cwd(), 'prisma/migrations_backup_' + Date.now())
            console.log(`📦 Backing up existing migrations to ${backupDir}`)
            fs.renameSync(migrationsDir, backupDir)
        }

        // Create fresh migrations directory
        fs.mkdirSync(migrationsDir, { recursive: true })

        // Create a baseline migration
        console.log('🔄 Creating baseline migration...')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('T')[0]
        const migrationName = `${timestamp}_baseline`
        
        execSync(`pnpm prisma migrate dev --name baseline --create-only`, {
            stdio: 'inherit',
        })

        console.log('✅ Baseline migration created!')
        console.log('')
        console.log('Next steps:')
        console.log('1. Review the migration in prisma/migrations/')
        console.log('2. Apply it to your dev database: pnpm prisma migrate deploy')
        console.log('3. Apply it to your prod database with the same command')
        
    } catch (error) {
        console.error('❌ Error creating baseline:', error)
        process.exit(1)
    }
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})