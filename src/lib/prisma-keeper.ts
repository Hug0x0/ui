import { PrismaClient } from '@/lib/prisma-keeper-client'

const globalForPrisma = globalThis as unknown as {
    prismaKeeper: PrismaClient | undefined
}

export const prismaKeeper = globalForPrisma.prismaKeeper ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaKeeper = prismaKeeper
}
