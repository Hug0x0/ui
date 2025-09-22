'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utils'
import { env } from '@/env/t3-env'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import LinkWrapper from '../common/LinkWrapper'
import { AppUrls, FileIds, IconIds } from '@/enums'
import StyledTooltip from '../common/StyledTooltip'
import FileMapper from '../common/FileMapper'
import IconWrapper from '../icons/IconWrapper'
dayjs.extend(utc)
dayjs.extend(relativeTime)

export default function Footer(props: { className?: string }) {
    const [commitDate, setCommitDate] = useState<null | Date>(null)
    useEffect(() => {
        const timestamp = env.NEXT_PUBLIC_COMMIT_TIMESTAMP
        if (timestamp) {
            const date = new Date(parseInt(timestamp, 10) * 1000)
            setCommitDate(date)
        }
    }, [])
    if (!commitDate) return null
    return (
        <footer
            className={cn('flex min-h-16 w-full items-center justify-between gap-2 px-6 text-sm font-light md:gap-0 xl:text-base', props.className)}
        >
            {/* left */}
            <div className="hidden flex-row gap-8 md:flex">
                <div>
                    <StyledTooltip
                        closeDelay={500}
                        content={
                            <div className="flex flex-col gap-1">
                                <span>Last commit deployed on {dayjs.utc(commitDate).format('D MMM. YYYY HH:mm A')} UTC</span>
                                <span className="text-default/50">1st commit pushed on {dayjs.utc('2025-08-04').format('D MMM. YYYY')}</span>
                            </div>
                        }
                    >
                        <p className="truncate">August 2025</p>
                    </StyledTooltip>
                </div>

                <LinkWrapper href={AppUrls.TAIKAI} target="_blank">
                    <p className="cursor-alias truncate hover:text-primary hover:underline">Hyperliquid Community Hackathon</p>
                </LinkWrapper>
            </div>

            {/* right */}
            <div className="mx-auto my-10 flex flex-col flex-wrap items-center justify-center gap-3 sm:my-0 sm:flex-row sm:gap-8 md:mx-0 md:justify-end">
                {/* <StyledTooltip
                    closeDelay={500}
                    content={
                        <div className="space-y-1.5">
                            <div className="font-semibold">Altitude</div>
                            <div className="text-xs opacity-90">Lightning-fast RPC nodes for investors & developers</div>
                            <LinkWrapper href="https://rpc.reachaltitude.xyz/" target="_blank">
                                <span className="cursor-alias text-xs underline hover:text-primary">https://rpc.reachaltitude.xyz/</span>
                            </LinkWrapper>
                        </div>
                    }
                >
                    <p className="truncate">Sponsors</p>
                </StyledTooltip> */}
                <div className="flex items-center gap-2">
                    <p className="cursor-alias truncate">Team</p>
                    <div className="flex items-center gap-0">
                        {[
                            {
                                id: FileIds.TEAM_MERSO,
                                taikaiUrl: 'https://taikai.network/Merso',
                                xUrl: 'https://x.com/0xMerso',
                                name: 'Merso',
                                description: 'Rust / Solidity',
                                width: 24,
                                height: 24,
                                className: 'size-6 rounded-full border border-primary/50 shadow',
                            },
                            {
                                id: FileIds.TEAM_KATALYSTER,
                                taikaiUrl: 'https://taikai.network/Katalyster',
                                xUrl: 'https://x.com/Katalyster',
                                name: 'Katalyster',
                                description: 'BD / Ops',
                                width: 24,
                                height: 24,
                                className: 'size-6 rounded-full border border-primary/50 shadow',
                            },
                            {
                                id: FileIds.TEAM_ZARBOQ,
                                taikaiUrl: 'https://taikai.network/zarboq',
                                xUrl: 'https://x.com/zarboq',
                                name: 'Zarboq',
                                description: 'Rust / Solidity',
                                width: 24,
                                height: 24,
                                className: 'size-6 rounded-full border border-primary/50 shadow',
                            },
                            {
                                id: FileIds.TEAM_FBERGER,
                                taikaiUrl: 'https://taikai.network/fberger-xyz',
                                xUrl: 'https://x.com/fberger_xyz',
                                name: 'fberger',
                                description: 'Fullstack dev',
                                width: 24,
                                height: 24,
                                className: 'size-6 rounded-full border border-primary/50 shadow',
                            },
                        ].map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex items-center">
                                <StyledTooltip content={item.taikaiUrl}>
                                    <LinkWrapper
                                        href={item.taikaiUrl}
                                        target="_blank"
                                        className="flex cursor-alias items-center gap-2 transition-all duration-300 hover:scale-110"
                                    >
                                        <FileMapper {...item} priority />
                                    </LinkWrapper>
                                </StyledTooltip>
                            </div>
                        ))}
                    </div>
                </div>
                <LinkWrapper href={AppUrls.STATUS} target="_blank">
                    <p className="cursor-alias truncate hover:text-primary hover:underline">Status</p>
                </LinkWrapper>
                <LinkWrapper href={AppUrls.DOCS_NOTION} target="_blank">
                    <p className="cursor-alias truncate hover:text-primary hover:underline">Docs</p>
                </LinkWrapper>
                <LinkWrapper href={AppUrls.HYPERLP_X} target="_blank" className="cursor-alias underline-offset-2 hover:text-primary hover:underline">
                    <IconWrapper id={IconIds.X} className="rounded-none" />
                </LinkWrapper>
            </div>
            {/* <Authors className="justify-start md:justify-end" /> */}
        </footer>
    )
}
