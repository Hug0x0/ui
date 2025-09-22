#!/usr/bin/env tsx

/**
 * Database Sync Check Script
 * 
 * Compares dev and production database schemas to ensure they're in sync
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface MigrationStatus {
    name: string
    appliedInDev: boolean
    appliedInProd: boolean
    checksum: string
}

function getMigrationChecksum(migrationPath: string): string {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    return crypto.createHash('md5').update(content).digest('hex')
}

async function checkMigrations(dbUrl: string): Promise<Set<string>> {
    // This would normally query the _prisma_migrations table
    // For now, we'll use prisma migrate status
    try {
        const output = execSync('pnpm prisma migrate status', {
            env: { ...process.env, DATABASE_URL: dbUrl },
            encoding: 'utf-8',
        })
        
        const appliedMigrations = new Set<string>()
        const lines = output.split('\n')
        
        lines.forEach(line => {
            if (line.includes('✔') || line.includes('applied')) {
                const match = line.match(/(\d{14}_\w+)/)
                if (match) {
                    appliedMigrations.add(match[1])
                }
            }
        })
        
        return appliedMigrations
    } catch (error) {
        console.error('Error checking migrations:', error)
        return new Set()
    }
}

async function main() {
    console.log('🔍 Database Sync Check')
    console.log('Comparing development and production database schemas...\n')

    // Check for environment files
    const devEnvPath = path.join(process.cwd(), '.env.development')
    const prodEnvPath = path.join(process.cwd(), '.env.production')
    
    if (!fs.existsSync(devEnvPath)) {
        console.error('❌ .env.development not found')
        console.log('Create it from .env.development template')
        process.exit(1)
    }
    
    if (!fs.existsSync(prodEnvPath)) {
        console.error('❌ .env.production not found')
        console.log('Create it from .env.production template')
        process.exit(1)
    }

    // Load environment URLs
    const devEnv = fs.readFileSync(devEnvPath, 'utf-8')
    const prodEnv = fs.readFileSync(prodEnvPath, 'utf-8')
    
    const devDbUrl = devEnv.match(/DATABASE_URL="([^"]+)"/)?.[1]
    const prodDbUrl = prodEnv.match(/DATABASE_URL="([^"]+)"/)?.[1]
    
    if (!devDbUrl || devDbUrl.includes('your_dev_database_url_here')) {
        console.error('❌ Development DATABASE_URL not configured in .env.development')
        process.exit(1)
    }
    
    if (!prodDbUrl || prodDbUrl.includes('your_prod_database_url_here')) {
        console.error('❌ Production DATABASE_URL not configured in .env.production')
        process.exit(1)
    }

    console.log('📊 Checking migrations...\n')

    // Get list of all migrations
    const migrationsDir = path.join(process.cwd(), 'prisma/migrations')
    if (!fs.existsSync(migrationsDir)) {
        console.log('⚠️  No migrations found')
        return
    }

    const migrations = fs.readdirSync(migrationsDir)
        .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
        .filter(f => !f.startsWith('.'))
        .sort()

    // Check which migrations are applied in each environment
    console.log('Checking development database...')
    const devMigrations = await checkMigrations(devDbUrl)
    
    console.log('Checking production database...')
    const prodMigrations = await checkMigrations(prodDbUrl)

    // Compare migrations
    console.log('\n📋 Migration Status:\n')
    console.log('Migration Name                          | Dev | Prod | Status')
    console.log('---------------------------------------|-----|------|--------')
    
    let hasIssues = false
    
    migrations.forEach(migration => {
        const inDev = devMigrations.has(migration)
        const inProd = prodMigrations.has(migration)
        const devStatus = inDev ? '✅' : '❌'
        const prodStatus = inProd ? '✅' : '❌'
        
        let status = '✅ Synced'
        if (inDev && !inProd) {
            status = '⚠️  Not in Prod'
            hasIssues = true
        } else if (!inDev && inProd) {
            status = '⚠️  Not in Dev'
            hasIssues = true
        } else if (!inDev && !inProd) {
            status = '❓ Not Applied'
        }
        
        const name = migration.padEnd(38)
        console.log(`${name} | ${devStatus}  | ${prodStatus}   | ${status}`)
    })
    
    console.log('\n' + '='.repeat(60))
    
    if (hasIssues) {
        console.log('\n⚠️  Databases are OUT OF SYNC!')
        console.log('\nTo fix:')
        console.log('1. Review pending migrations')
        console.log('2. Apply missing migrations to the appropriate environment')
        console.log('3. Use: pnpm prisma migrate deploy')
        process.exit(1)
    } else {
        console.log('\n✅ Databases are in sync!')
    }
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})