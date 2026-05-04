import type { ProductCategory } from '../../../furniture'

/** Describes a mobile control sub-tab (e.g. 'width', 'color', 'style'). */
export interface ControlTab {
  id: string
  label: string
}

/** Describes a top-level tab (e.g. 'Model', 'Rows config'). */
export interface MainTab {
  id: string
  label: string
}

/** Tab configuration per model type — drives both the top-level and mobile sub-tab UI. */
export const MODEL_TABS: Record<ProductCategory, {
  mainTabs: MainTab[]
  controlTabs: ControlTab[]
}> = {
  Bookcase: {
    mainTabs: [
      { id: 'model', label: 'model' },
      { id: 'rows', label: 'rowsConfig' },
    ],
    controlTabs: [
      { id: 'color', label: 'color' },
      { id: 'width', label: 'width' },
      { id: 'height', label: 'height' },
      { id: 'depth', label: 'depth' },
      { id: 'style', label: 'style' },
      { id: 'density', label: 'density' },
      { id: 'storage', label: 'storageOptions.label' },
    ],
  },
  Desk: {
    mainTabs: [
      { id: 'model', label: 'model' },
      { id: 'columns', label: 'colsConfig' },
    ],
    controlTabs: [
      { id: 'color', label: 'color' },
      { id: 'width', label: 'width' },
      { id: 'height', label: 'height' },
      { id: 'depth', label: 'depth' },
      { id: 'legroom', label: 'legroom' },
      { id: 'overhang', label: 'overhang' },
    ],
  },
  TvStand: {
    mainTabs: [
      { id: 'model', label: 'model' },
      { id: 'columns', label: 'colsConfig' },
    ],
    controlTabs: [
      { id: 'color', label: 'color' },
      { id: 'width', label: 'width' },
      { id: 'height', label: 'height' },
      { id: 'depth', label: 'depth' },
      { id: 'style', label: 'style' },
      { id: 'legs', label: 'legs' },
    ],
  },
  ShoeRack: {
    mainTabs: [
      { id: 'model', label: 'model' },
      { id: 'columns', label: 'colsConfig' },
    ],
    controlTabs: [
      { id: 'color', label: 'color' },
      { id: 'width', label: 'width' },
      { id: 'height', label: 'height' },
      { id: 'depth', label: 'depth' },
    ],
  },
  BedsideTable: {
    mainTabs: [
      { id: 'model', label: 'model' },
      { id: 'columns', label: 'colsConfig' },
    ],
    controlTabs: [
      { id: 'color', label: 'color' },
      { id: 'width', label: 'width' },
      { id: 'height', label: 'height' },
      { id: 'depth', label: 'depth' },
      { id: 'density', label: 'density' },
    ],
  },
}
