/**
 * Optimized ECharts imports - only import what we use
 * This reduces bundle size by ~500KB
 */

// Core
import * as echarts from 'echarts/core'

// Charts we actually use
import { HeatmapChart } from 'echarts/charts'

// Components we need
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, VisualMapComponent, DataZoomComponent } from 'echarts/components'

// Renderer
import { CanvasRenderer } from 'echarts/renderers'

// Register only what we use
echarts.use([
    // Charts
    HeatmapChart,
    // Components
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    VisualMapComponent,
    DataZoomComponent,
    // Renderer
    CanvasRenderer,
])

export default echarts
export type { EChartsCoreOption as EChartsOption } from 'echarts/core'
