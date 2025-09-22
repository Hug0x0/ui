/* eslint-disable @typescript-eslint/no-explicit-any */
const isDev = process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

class Logger {
    private context: string
    private level: LogLevel

    constructor(context: string) {
        this.context = context
        this.level = isDev || isDebugEnabled ? LogLevel.DEBUG : LogLevel.ERROR
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.level
    }

    private formatMessage(level: string, message: string): string {
        return `[${this.context}:${level}] ${message}`
    }

    error(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('ERROR', message), ...args)
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('WARN', message), ...args)
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.INFO) && isDev) {
            console.info(this.formatMessage('INFO', message), ...args)
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.DEBUG) && isDebugEnabled) {
            console.log(this.formatMessage('DEBUG', message), ...args)
        }
    }

    log(message: string, ...args: any[]): void {
        this.info(message, ...args)
    }
}

export const createLogger = (context: string) => new Logger(context)

// Convenience logger for one-off logs
export const logger = {
    error: (message: string, ...args: any[]) => {
        if (isDev) console.error(message, ...args)
    },
    warn: (message: string, ...args: any[]) => {
        if (isDev) console.warn(message, ...args)
    },
    info: (message: string, ...args: any[]) => {
        if (isDev && isDebugEnabled) console.info(message, ...args)
    },
    debug: (message: string, ...args: any[]) => {
        if (isDebugEnabled) console.log(message, ...args)
    },
}
