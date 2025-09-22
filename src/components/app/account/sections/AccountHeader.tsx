'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/utils'
import { formatUSD, shortenValue } from '@/utils'
import { DAYJS_FORMATS } from '@/utils/date.util'
import { TimeAgo } from '@/components/common/DateWrapper'
import StyledTooltip from '@/components/common/StyledTooltip'
import IconWrapper from '@/components/icons/IconWrapper'
import { AppUrls, FileIds, IconIds } from '@/enums'
import LinkWrapper from '@/components/common/LinkWrapper'
import FileMapper from '@/components/common/FileMapper'
import numeral from 'numeral'
import type { AccountSnapshotMetrics, AccountSnapshot } from '@/interfaces/account.interface'
import { DEMO_ACCOUNTS } from '@/config/app.config'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'
import { SectionCard } from '../layout/Cards'
// import AllTransactionsModal from '@/components/modals/AllTransactionsModal'

interface AccountHeaderProps {
    accountFromUrl: string
    lastRefreshTime: number | null
    nextUpdateIn: string
    isFetching: boolean
    refetch: () => void
    metrics: Partial<AccountSnapshotMetrics>
    timings?: AccountSnapshot['timings']
}

export default function AccountHeader({ accountFromUrl, lastRefreshTime, nextUpdateIn, isFetching, refetch, metrics, timings }: AccountHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    // const [showTransactionsModal, setShowTransactionsModal] = useState(false)
    // const handleShowTransactions = () => setShowTransactionsModal(true)
    // const handleCloseTransactions = () => setShowTransactionsModal(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    // Get precomputed portfolio metrics
    const combinedAPRs = metrics?.portfolio?.apr
    const allocation = metrics?.portfolio?.allocation
    const aprSources = metrics?.portfolio?.aprSources

    // Get metrics for the breakdown tooltip
    const lpMetrics = metrics?.longLegs?.find((l) => l.type === 'lp')?.metrics
    const hyperDriveMetrics = metrics?.longLegs?.find((l) => l.type === 'hyperdrive')?.metrics

    // Calculate long and short values for allocation display
    const longValueUSD = (lpMetrics?.totalValueUSD || 0) + (hyperDriveMetrics?.totalValueUSD || 0)
    const shortValueUSD = metrics?.shortLegs?.values?.perpsValueUSD || 0

    // Calculate APR range with memoization to avoid expensive recalculations
    const aprRange = useMemo(() => {
        const aprs = [combinedAPRs?.combined24h, combinedAPRs?.combined7d, combinedAPRs?.combined30d].filter(
            (apr) => apr !== null && apr !== undefined,
        ) as number[]

        return aprs.length === 0 ? null : { min: Math.min(...aprs), max: Math.max(...aprs) }
    }, [combinedAPRs])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="flex flex-col gap-2 text-lg lg:text-xl">
            {/* Title */}
            {Object.values(DEMO_ACCOUNTS).find((a) => a.address.toLowerCase() === accountFromUrl.toLowerCase())?.hasLP === true ? (
                <div className="mb-2 flex w-full flex-wrap items-center gap-1">
                    <p className="text-wrap text-default">Below is an example of a delta neutral</p>
                    {/* <IconWrapper id={IconIds.ARROW_RIGHT} className="size-4 text-default" /> */}
                    <p className="text-wrap text-hyper-evm-lps">HYPE/USD₮0</p>
                    <FileMapper id={FileIds.TOKEN_HYPE} width={20} height={20} className="z-10 rounded-full" />
                    <FileMapper id={FileIds.TOKEN_USDT0} width={20} height={20} className="-ml-2 rounded-full" />
                    <p className="text-wrap text-hyper-evm-lps">LP (actively rebalanced)</p>
                    <p className="text-wrap text-default">with a</p>
                    <p className="text-wrap text-hyper-core-perps">dynamic short leg</p>
                </div>
            ) : Object.values(DEMO_ACCOUNTS).find((a) => a.address.toLowerCase() === accountFromUrl.toLowerCase())?.hasHyperDrive === true ? (
                <div className="mb-2 flex w-full flex-wrap items-center gap-1">
                    <p className="text-wrap text-default">Below is an example of a delta neutral</p>
                    <p className="text-wrap text-hyper-evm-lps">lending of HYPE</p>
                    <FileMapper id={FileIds.TOKEN_HYPE} width={20} height={20} className="z-10 rounded-full" />
                    <p className="text-wrap text-hyper-evm-lps">on Hyperdrive</p>
                    <FileMapper id={FileIds.LENDING_HYPERDRIVE} width={20} height={20} className="rounded" />
                    <p className="text-wrap text-default">with a</p>
                    <p className="text-wrap text-hyper-core-perps">dynamic short leg</p>
                </div>
            ) : null}

            {/* Summary */}
            <div className="flex flex-col gap-3 lg:w-full lg:flex-row lg:justify-between">
                {/* Address */}
                <SectionCard padding="px-4 py-2" className="flex w-fit flex-col justify-around lg:grow">
                    {/* row */}
                    <div className="flex items-center gap-2 text-sm">
                        {/* Address Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-1 text-xl font-medium transition-colors hover:bg-default/5 hover:text-primary"
                            >
                                <IconWrapper
                                    id={IconIds.CHEVRON_DOWN}
                                    className={cn('size-4 text-default/50 transition-transform', isDropdownOpen && 'rotate-180')}
                                />
                                <span className="hidden truncate xl:flex">Vault = {accountFromUrl}</span>
                                <span className="hidden truncate md:flex xl:hidden">Vault = {shortenValue(accountFromUrl, 8)}</span>
                                <span className="flex truncate md:hidden">{shortenValue(accountFromUrl, 4)}</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute left-0 top-full z-50 mt-2 min-w-[400px] rounded-lg border border-default/20 bg-background shadow-lg">
                                    {Object.values(DEMO_ACCOUNTS).map((account) => (
                                        <LinkWrapper
                                            key={account.address}
                                            href={`/account/${account.address}`}
                                            target="_blank"
                                            className="flex items-start gap-3 border-b border-default/10 p-3 transition-colors last:border-b-0 hover:bg-default/5"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn('truncate font-semibold', account.address === accountFromUrl && 'text-primary')}
                                                    >
                                                        {account.name}
                                                    </span>
                                                    <span className="text-default/50">•</span>
                                                    <span className="truncate text-default/50">{account.description}</span>
                                                </div>
                                                <p className="mt-1 font-mono text-sm text-default/70">{account.address}</p>
                                            </div>
                                            <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="mt-0.5 size-4 text-default/50" />
                                        </LinkWrapper>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* <div>
                            <StyledTooltip content={<p>View all transactions</p>}>
                                <button
                                    onClick={handleShowTransactions}
                                    className="flex cursor-pointer items-center gap-0.5 pl-2 text-default/50 hover:text-default hover:underline"
                                >
                                    <p>tx</p>
                                    <IconWrapper id={IconIds.LIST} className="size-3.5" />
                                </button>
                            </StyledTooltip>
                        </div> */}
                        {[
                            {
                                name: 'evm',
                                description: 'HyperEVM explorer',
                                url: `https://hyperevmscan.io/address/${accountFromUrl}`,
                                isExternal: true,
                            },
                            {
                                name: 'core',
                                description: 'HyperLiquid explorer',
                                url: `https://app.hyperliquid.xyz/explorer/address/${accountFromUrl}`,
                                isExternal: true,
                            },
                            {
                                name: 'debank',
                                description: 'DeBank profile',
                                url: `https://debank.com/profile/${accountFromUrl}`,
                                isExternal: true,
                            },
                        ].map((link) => (
                            <div key={link.name}>
                                <StyledTooltip key={link.name} content={<p>{link.description}</p>}>
                                    <LinkWrapper
                                        target="_blank"
                                        href={link.url}
                                        className="flex cursor-alias items-center gap-0.5 text-default/50 hover:text-default hover:underline"
                                    >
                                        <p>{link.name}</p>
                                        <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="size-3.5" />
                                    </LinkWrapper>
                                </StyledTooltip>
                            </div>
                        ))}
                    </div>

                    {/* row */}
                    <div className="flex items-center gap-1.5 text-sm text-default/50">
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="rounded hover:bg-default/10 hover:text-default disabled:opacity-50"
                            title="Refresh all page data for this address"
                        >
                            <IconWrapper id={IconIds.REFRESH} className={cn('size-3.5', isFetching && 'animate-spin')} />
                        </button>
                        {isFetching ? (
                            <p>Fetching live onchain data</p>
                        ) : (
                            <>
                                <StyledTooltip
                                    content={
                                        <div className="text-sm">
                                            <div>{DAYJS_FORMATS.dateLong(lastRefreshTime || 0)}</div>
                                            <p className="mt-2">API calls timing (we use RPCs)</p>
                                            <div className="text-default/60">
                                                {SECTION_CONFIG[SectionType.LONG_EVM].displayName}{' '}
                                                {(timings?.longLegs?.find((t) => t.type === 'lp')?.fetchTimeMs || 0) +
                                                    (timings?.longLegs?.find((t) => t.type === 'hyperdrive')?.fetchTimeMs || 0)}
                                                ms • {SECTION_CONFIG[SectionType.WALLET].displayName} {timings?.idle?.balancesMs || 0}ms •{' '}
                                                {SECTION_CONFIG[SectionType.PERPS].displayName} {timings?.shortLegs?.perpsMs || 0}ms •{' '}
                                                {SECTION_CONFIG[SectionType.SPOTS].displayName} {timings?.idle?.spotsMs || 0}ms
                                            </div>
                                        </div>
                                    }
                                    placement="bottom"
                                >
                                    <span className="flex items-center gap-1">
                                        <p>Last update</p>
                                        <TimeAgo date={lastRefreshTime} />
                                    </span>
                                </StyledTooltip>
                                {nextUpdateIn && (
                                    <>
                                        <span className="text-default/30">•</span>
                                        <p>next in {nextUpdateIn}</p>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </SectionCard>

                {/* Global KPIs */}
                {/* <div className="flex items-center gap-3 md:gap-5"> */}
                <div className="flex w-full items-center gap-3 lg:w-max">
                    {/* HyperLP balance */}
                    {/* <div className="flex flex-col items-center lg:items-end"> */}
                    <SectionCard padding="px-4 py-2" className="flex flex-col items-center lg:items-end">
                        <span className="truncate text-base tracking-wider text-default/50 md:hidden">Balance</span>
                        <span className="hidden truncate text-base tracking-wider text-default/50 md:flex">HyperLP balance</span>
                        <StyledTooltip
                            content={
                                <div className="flex flex-col">
                                    <div className="mb-2 font-semibold">Breakdown</div>
                                    <div className="flex justify-between font-medium">
                                        <span>+ Deployed AUM</span>
                                        <span>{formatUSD(metrics?.portfolio?.deployedValueUSD ?? 0)}</span>
                                    </div>
                                    <div className="space-y-0 opacity-60">
                                        <div className="ml-3">
                                            <div className="flex justify-between gap-6">
                                                <span className="">• {SECTION_CONFIG[SectionType.LONG_EVM].subSections?.lps}</span>
                                                <span>{formatUSD(lpMetrics?.totalValueUSD || 0)}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="">• {SECTION_CONFIG[SectionType.LONG_EVM].subSections?.hyperdrive}</span>
                                                <span>{formatUSD(hyperDriveMetrics?.totalValueUSD || 0)}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="">• {SECTION_CONFIG[SectionType.PERPS].displayName}</span>
                                                <span>{formatUSD(metrics?.shortLegs?.values?.perpsValueUSD || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-0">
                                        <div className="flex justify-between font-medium">
                                            <div className="">+ Idle/dust capital</div>
                                            <span>
                                                {numeral(
                                                    (metrics?.idle?.values?.balancesValueUSD || 0) +
                                                        (metrics?.idle?.values?.spotValueUSD || 0) +
                                                        (metrics?.shortLegs?.values?.withdrawableUSDC || 0),
                                                ).format('0,0a$')}
                                            </span>
                                        </div>

                                        <div className="ml-3 opacity-60">
                                            <div className="flex justify-between gap-6">
                                                <span className="">• {SECTION_CONFIG[SectionType.WALLET].displayName} balances</span>
                                                <span>{numeral(metrics?.idle?.values?.balancesValueUSD || 0).format('0,0a$')}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="">• {SECTION_CONFIG[SectionType.SPOTS].displayName} balances</span>
                                                <span>{numeral(metrics?.idle?.values?.spotValueUSD || 0).format('0,0a$')}</span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <span className="">• Withdrawable USDC</span>
                                                <span>{numeral(metrics?.shortLegs?.values?.withdrawableUSDC || 0).format('0,0a$')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-default/20 pt-4">
                                        <div className="flex justify-between font-semibold">
                                            <span>= HyperLP balance</span>
                                            <span>{formatUSD(metrics?.portfolio?.totalValueUSD ?? 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            <span className="cursor-help text-xl font-semibold">{formatUSD(metrics?.portfolio?.totalValueUSD || 0)}</span>
                        </StyledTooltip>
                    </SectionCard>

                    {/* Net P&L */}
                    {/* <div className="hidden h-10 border-l border-dashed border-default/20 md:flex" /> */}
                    <SectionCard padding="px-4 py-2" className="hidden flex-col items-center md:flex lg:items-end">
                        <span className="truncate text-base tracking-wider text-default/50">Net P&L</span>
                        <StyledTooltip
                            content={
                                <div className="flex max-w-[380px] flex-col gap-2">
                                    <div className="flex flex-col">
                                        <p className="text-lg font-semibold">Net P&L coming soon</p>
                                        <p className="text-default/60">We’re working on adding proper P&L benchmarks for LPs leg.</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-semibold underline">3 points of view to consider for the LP leg</p>
                                        <ul className="list-disc pl-2 text-default/60">
                                            <li>
                                                <span className="font-semibold">HOLD</span> Compare to just holding the tokens in your wallet
                                            </li>
                                            <li>
                                                <span className="font-semibold">HYPE</span> Compare to holding HYPE, using deposit-time prices
                                            </li>
                                            <li>
                                                <span className="font-semibold">USDT0</span> Compare to holding USDT0, using deposit-time prices
                                            </li>
                                        </ul>
                                    </div>

                                    <LinkWrapper href={AppUrls.DOCS} target="_blank" className="flex items-center gap-1 underline hover:text-primary">
                                        <p>Also we want a P&L explained display</p>
                                        <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="size-3.5" />
                                    </LinkWrapper>
                                </div>
                            }
                        >
                            <span className="cursor-help truncate text-lg font-semibold text-default/30 hover:text-primary hover:underline">
                                Coming soon
                            </span>
                        </StyledTooltip>
                    </SectionCard>

                    {aprRange !== null && (
                        <>
                            {/* <div className="h-10 border-l border-dashed border-default/20" /> */}
                            {/* <div className="flex flex-col items-center lg:items-end"> */}
                            <SectionCard padding="px-4 py-2" className="flex flex-col items-center lg:items-end">
                                <span className="text-base tracking-wider text-default/50">Estimated Gross APR</span>
                                <StyledTooltip
                                    content={
                                        <div className="space-y-3">
                                            <div className="space-y-1 pb-2">
                                                <div className="text-sm font-semibold">Gross Delta-Neutral APR on deployed AUM</div>
                                                {allocation && (
                                                    <>
                                                        <div className="text-sm opacity-70">
                                                            Allocation: {numeral(longValueUSD).format('0,0$')} Yield leg (
                                                            {allocation.longPercentage.toFixed(0)}%) + {numeral(shortValueUSD).format('0,0$')} Perps (
                                                            {allocation.shortPercentage.toFixed(0)}%)
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* 24h APR */}
                                            {combinedAPRs?.combined24h !== null && combinedAPRs?.combined24h !== undefined && (
                                                <div className="space-y-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">24h</span>
                                                        <span
                                                            className={cn('font-medium', {
                                                                'text-success':
                                                                    Math.min(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined24h ||
                                                                    Math.max(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined24h,
                                                            })}
                                                        >
                                                            {numeral(combinedAPRs.combined24h).divide(100).format('+0,0%')} *
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        {aprSources?.longAPR24h !== null && aprSources?.longAPR24h !== undefined && allocation && (
                                                            <div className="flex justify-between gap-6">
                                                                <span className="opacity-60">
                                                                    {numeral(allocation.longPercentage).divide(100).format('0,0.0%')} * Yield leg{' '}
                                                                    {aprSources.longAPR24h.toFixed(1)}%
                                                                </span>
                                                                <span className="opacity-60">
                                                                    {/* {((allocation.longPercentage / 100) * aprSources.longAPR24h).toFixed(1)}% */}
                                                                    {numeral(allocation.longPercentage)
                                                                        .divide(100)
                                                                        .multiply(aprSources.longAPR24h)
                                                                        .divide(100)
                                                                        .format('+0,0.0%')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {aprSources?.fundingAPR24h !== null &&
                                                            aprSources?.fundingAPR24h !== undefined &&
                                                            allocation && (
                                                                <div className="flex justify-between gap-6">
                                                                    <span className="opacity-60">
                                                                        {numeral(allocation.shortPercentage).divide(100).format('0,0.0%')} * Short leg{' '}
                                                                        {aprSources.fundingAPR24h.toFixed(1)}%
                                                                    </span>
                                                                    <span className="opacity-60">
                                                                        {/* {(allocation.shortPercentage / 100) * aprSources.fundingAPR24h > 0 ? '+' : ''} */}
                                                                        {/* {((allocation.shortPercentage / 100) * aprSources.fundingAPR24h).toFixed(1)}% */}
                                                                        {numeral(allocation.shortPercentage)
                                                                            .divide(100)
                                                                            .multiply(aprSources.fundingAPR24h)
                                                                            .divide(100)
                                                                            .format('+0,0.0%')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 7d APR */}
                                            {combinedAPRs?.combined7d !== null && combinedAPRs?.combined7d !== undefined && (
                                                <div className="space-y-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">7d</span>
                                                        <span
                                                            className={cn('font-medium', {
                                                                'text-success':
                                                                    Math.min(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined7d ||
                                                                    Math.max(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined7d,
                                                            })}
                                                        >
                                                            {numeral(combinedAPRs.combined7d).divide(100).format('+0,0%')} *
                                                        </span>
                                                    </div>
                                                    <div className="ml-3 space-y-0.5">
                                                        {aprSources?.longAPR7d !== null && aprSources?.longAPR7d !== undefined && allocation && (
                                                            <div className="flex justify-between gap-6">
                                                                <span className="opacity-60">
                                                                    {numeral(allocation.longPercentage).divide(100).format('0,0.0%')} * Yield leg{' '}
                                                                    {aprSources.longAPR7d.toFixed(1)}%
                                                                </span>
                                                                <span className="opacity-60">
                                                                    {/* {((allocation.longPercentage / 100) * aprSources.longAPR7d).toFixed(1)}% */}
                                                                    {numeral(allocation.longPercentage)
                                                                        .divide(100)
                                                                        .multiply(aprSources.longAPR7d)
                                                                        .divide(100)
                                                                        .format('+0,0.0%')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {aprSources?.fundingAPR7d !== null &&
                                                            aprSources?.fundingAPR7d !== undefined &&
                                                            allocation && (
                                                                <div className="flex justify-between gap-6">
                                                                    <span className="opacity-60">
                                                                        {numeral(allocation.shortPercentage).divide(100).format('0,0.0%')} * Short leg{' '}
                                                                        {aprSources.fundingAPR7d.toFixed(1)}%
                                                                    </span>
                                                                    <span className="opacity-60">
                                                                        {/* {(allocation.shortPercentage / 100) * aprSources.fundingAPR7d > 0 ? '+' : ''} */}
                                                                        {/* {((allocation.shortPercentage / 100) * aprSources.fundingAPR7d).toFixed(1)}% */}
                                                                        {numeral(allocation.shortPercentage)
                                                                            .divide(100)
                                                                            .multiply(aprSources.fundingAPR7d)
                                                                            .divide(100)
                                                                            .format('+0,0.0%')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 30d APR */}
                                            {combinedAPRs?.combined30d !== null && combinedAPRs?.combined30d !== undefined && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">30d</span>
                                                        <span
                                                            className={cn('font-medium', {
                                                                'text-success':
                                                                    Math.min(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined30d ||
                                                                    Math.max(
                                                                        ...[
                                                                            combinedAPRs.combined30d || 0,
                                                                            combinedAPRs.combined24h || 0,
                                                                            combinedAPRs.combined7d || 0,
                                                                        ],
                                                                    ) === combinedAPRs.combined30d,
                                                            })}
                                                        >
                                                            {numeral(combinedAPRs.combined30d).divide(100).format('+0,0%')} *
                                                        </span>
                                                    </div>
                                                    <div className="ml-3 space-y-0.5">
                                                        {aprSources?.longAPR30d !== null && aprSources?.longAPR30d !== undefined && allocation && (
                                                            <div className="flex justify-between gap-6">
                                                                <span className="opacity-60">
                                                                    {numeral(allocation.longPercentage).divide(100).format('0,0.0%')} * Yield leg{' '}
                                                                    {aprSources.longAPR30d.toFixed(1)}%
                                                                </span>
                                                                <span className="opacity-60">
                                                                    {/* {((allocation.longPercentage / 100) * aprSources.longAPR30d).toFixed(1)}% */}
                                                                    {numeral(allocation.longPercentage)
                                                                        .divide(100)
                                                                        .multiply(aprSources.longAPR30d)
                                                                        .divide(100)
                                                                        .format('+0,0.0%')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {aprSources?.fundingAPR30d !== null &&
                                                            aprSources?.fundingAPR30d !== undefined &&
                                                            allocation && (
                                                                <div className="flex justify-between gap-6">
                                                                    <span className="opacity-60">
                                                                        {numeral(allocation.shortPercentage).divide(100).format('0,0.0%')} * Short leg{' '}
                                                                        {aprSources.fundingAPR30d.toFixed(1)}%
                                                                    </span>
                                                                    <span className="opacity-60">
                                                                        {/* {(allocation.shortPercentage / 100) * aprSources.fundingAPR30d > 0 ? '+' : ''} */}
                                                                        {/* {((allocation.shortPercentage / 100) * aprSources.fundingAPR30d).toFixed(1)}% */}
                                                                        {numeral(allocation.shortPercentage)
                                                                            .divide(100)
                                                                            .multiply(aprSources.fundingAPR30d)
                                                                            .divide(100)
                                                                            .format('+0,0.0%')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}

                                            <p>* Before operating costs (EVM gas, Core fees, etc.)</p>
                                        </div>
                                    }
                                >
                                    <p
                                        className={cn(
                                            'cursor-help text-xl font-semibold',
                                            aprRange.min > 0 && aprRange.max > 0
                                                ? 'text-success'
                                                : aprRange.min < 0 && aprRange.max < 0
                                                  ? 'text-error'
                                                  : 'text-default',
                                        )}
                                    >
                                        {Math.abs(aprRange.max - aprRange.min) < 0.01 ? (
                                            `${aprRange.min > 0 ? '+' : ''}${aprRange.min.toFixed(2)}%`
                                        ) : (
                                            <span>
                                                <span className="pr-1 text-sm text-default/30">low</span>
                                                <span>
                                                    {aprRange.min > 0 ? '+' : ''}
                                                    {aprRange.min.toFixed(0)}%
                                                </span>

                                                <span className="pl-4 pr-1 text-sm text-default/30">high</span>
                                                <span>
                                                    {aprRange.max > 0 ? '+' : ''}
                                                    {aprRange.max.toFixed(0)}%
                                                </span>
                                            </span>
                                        )}
                                    </p>
                                </StyledTooltip>
                            </SectionCard>
                        </>
                    )}
                </div>
            </div>

            {/* All Transactions Modal */}
            {/* <AllTransactionsModal isOpen={showTransactionsModal} onClose={handleCloseTransactions} address={accountFromUrl} /> */}
        </div>
    )
}
