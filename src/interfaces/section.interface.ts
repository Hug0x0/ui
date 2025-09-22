export interface SectionConfig {
    displayName: string
    chartSeriesName: string
    className: string
    platform: string
    description: string
    subSections: SectionConfig[]
}
