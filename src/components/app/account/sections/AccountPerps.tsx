'use client'

import { useState } from 'react'
import { PerpPositionsTable } from '@/components/app/account/tables'
import { CollapsibleCard } from '@/components/app/account/CollapsibleCard'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import StyledTooltip from '@/components/common/StyledTooltip'
import { cn } from '@/utils'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'
import HyperCoreTradesModal from '@/components/modals/HyperCoreTradesModal'
import IconWrapper from '@/components/icons/IconWrapper'
import { IconIds } from '@/enums'

export default function AccountPerps() {
    const [showTradesModal, setShowTradesModal] = useState(false)
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const metrics = snapshot?.metrics
    const fundingAPRs = snapshot?.metrics?.shortLegs?.apr
    // Use 24h funding APR for display (most recent historical average)
    const perpFundingAPR = fundingAPRs?.avgFundingAPR24h

    const handleShowTrades = () => {
        setShowTradesModal(true)
    }

    const handleCloseTradesModal = () => {
        setShowTradesModal(false)
    }

    return (
        <CollapsibleCard
            title={
                <h3 className={`text-lg font-semibold ${SECTION_CONFIG[SectionType.PERPS].className}`}>
                    {SECTION_CONFIG[SectionType.PERPS].displayName}
                </h3>
            }
            defaultExpanded={false}
            headerRight={
                <div className="flex items-center gap-6">
                    {perpFundingAPR != null && (
                        <StyledTooltip
                            content={
                                <div className="space-y-3">
                                    <div className="font-semibold">Funding APR (Annualized)</div>

                                    <div className="space-y-2">
                                        {fundingAPRs?.avgFundingAPR24h !== null && fundingAPRs?.avgFundingAPR24h !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">24h avg</span>
                                                <span
                                                    className={cn(
                                                        'text-sm font-medium',
                                                        fundingAPRs.avgFundingAPR24h > 0
                                                            ? 'text-success'
                                                            : fundingAPRs.avgFundingAPR24h < 0
                                                              ? 'text-error'
                                                              : '',
                                                    )}
                                                >
                                                    {fundingAPRs.avgFundingAPR24h > 0 ? '+' : ''}
                                                    {fundingAPRs.avgFundingAPR24h.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        {fundingAPRs?.avgFundingAPR7d !== null && fundingAPRs?.avgFundingAPR7d !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">7d avg</span>
                                                <span
                                                    className={cn(
                                                        'text-sm font-medium',
                                                        fundingAPRs.avgFundingAPR7d > 0
                                                            ? 'text-success'
                                                            : fundingAPRs.avgFundingAPR7d < 0
                                                              ? 'text-error'
                                                              : '',
                                                    )}
                                                >
                                                    {fundingAPRs.avgFundingAPR7d > 0 ? '+' : ''}
                                                    {fundingAPRs.avgFundingAPR7d.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        {fundingAPRs?.avgFundingAPR30d !== null && fundingAPRs?.avgFundingAPR30d !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">30d avg</span>
                                                <span
                                                    className={cn(
                                                        'text-sm font-medium',
                                                        fundingAPRs.avgFundingAPR30d > 0
                                                            ? 'text-success'
                                                            : fundingAPRs.avgFundingAPR30d < 0
                                                              ? 'text-error'
                                                              : '',
                                                    )}
                                                >
                                                    {fundingAPRs.avgFundingAPR30d > 0 ? '+' : ''}
                                                    {fundingAPRs.avgFundingAPR30d.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-default/10 pt-2">
                                        <div className="text-xs opacity-60">Positive = shorts earn from longs</div>
                                    </div>
                                </div>
                            }
                        >
                            <div className="flex items-center gap-1 rounded bg-default/5 px-2 py-1">
                                <p className="text-sm text-default/50">Funding</p>
                                <p
                                    className={cn(
                                        'text-sm font-medium',
                                        perpFundingAPR > 0 ? 'text-success' : perpFundingAPR < 0 ? 'text-error' : 'text-default',
                                    )}
                                >
                                    {perpFundingAPR > 0 ? '+' : ''}
                                    {perpFundingAPR.toFixed(0)}%
                                </p>
                            </div>
                        </StyledTooltip>
                    )}
                    <p>
                        {numeral((metrics?.shortLegs?.values?.perpsValueUSD || 0) + (metrics?.shortLegs?.values?.withdrawableUSDC || 0)).format(
                            '0,0$',
                        )}
                    </p>
                </div>
            }
        >
            <PerpPositionsTable />

            {/* Footer with action button */}
            <div className="mt-3 flex justify-end px-3 pb-2">
                <button onClick={handleShowTrades} className="flex items-center gap-1 text-xs text-default/40 transition-colors hover:text-primary">
                    <p>Click to see trades</p>
                    <IconWrapper id={IconIds.LIST} className="size-3" />
                </button>
            </div>

            {/* HyperCore Trades Modal */}
            <HyperCoreTradesModal isOpen={showTradesModal} onClose={handleCloseTradesModal} address={snapshot?.address} />
        </CollapsibleCard>
    )
}
