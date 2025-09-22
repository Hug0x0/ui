'use client'

import { useState } from 'react'
import { TransactionHistory } from './TransactionHistory'
import { HyperCoreTransactionHistory } from './HyperCoreTransactionHistory'
import { cn } from '@/utils'

interface CombinedActivityProps {
    account: string
    limit?: number
    className?: string
}

type ActivityTab = 'all' | 'hyperevm' | 'hypercore'

export function CombinedActivity({ account, limit = 50, className }: CombinedActivityProps) {
    const [activeTab, setActiveTab] = useState<ActivityTab>('all')

    return (
        <div className={cn('space-y-4', className)}>
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-default/10">
                <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                        'px-4 py-2 text-sm font-medium transition-colors',
                        activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-default/60 hover:text-default',
                    )}
                >
                    All Activity
                </button>
                <button
                    onClick={() => setActiveTab('hyperevm')}
                    className={cn(
                        'px-4 py-2 text-sm font-medium transition-colors',
                        activeTab === 'hyperevm' ? 'border-b-2 border-primary text-primary' : 'text-default/60 hover:text-default',
                    )}
                >
                    HyperEVM
                </button>
                <button
                    onClick={() => setActiveTab('hypercore')}
                    className={cn(
                        'px-4 py-2 text-sm font-medium transition-colors',
                        activeTab === 'hypercore' ? 'border-b-2 border-primary text-primary' : 'text-default/60 hover:text-default',
                    )}
                >
                    HyperCore
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {activeTab === 'all' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="mb-3 text-sm font-medium text-default/70">HyperEVM Transactions</h3>
                            <TransactionHistory account={account} limit={limit} />
                        </div>
                        <div>
                            <h3 className="mb-3 text-sm font-medium text-default/70">HyperCore Trades</h3>
                            <HyperCoreTransactionHistory account={account} limit={limit} />
                        </div>
                    </div>
                )}
                {activeTab === 'hyperevm' && <TransactionHistory account={account} limit={limit} />}
                {activeTab === 'hypercore' && <HyperCoreTransactionHistory account={account} limit={limit} />}
            </div>
        </div>
    )
}
