'use client'

import { SpotBalancesTable } from '@/components/app/account/tables'
import { CollapsibleCard } from '@/components/app/account/CollapsibleCard'
import numeral from 'numeral'
import { useAppStore } from '@/stores/app.store'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'

export default function AccountSpots() {
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const metrics = snapshot?.metrics

    return (
        <CollapsibleCard
            title={
                <h3 className={`text-lg font-semibold ${SECTION_CONFIG[SectionType.SPOTS].className}`}>
                    {SECTION_CONFIG[SectionType.SPOTS].displayName}
                </h3>
            }
            defaultExpanded={false}
            headerRight={
                <div className="flex items-center gap-6">
                    <p>{numeral(metrics?.idle?.values?.spotValueUSD || 0).format('0,0$')}</p>
                </div>
            }
        >
            <SpotBalancesTable />
        </CollapsibleCard>
    )
}
