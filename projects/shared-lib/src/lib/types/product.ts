export interface IOriginPoint {
  x: number
  y: number
  z: number
}

export const CM = 0.01
export const MM = 0.001
export const M = 1

export type RowHeight = 'sm' | 'md' | 'lg'
export type RowFill = 'none' | 'some' | 'all'

export type ShelfStyle =
  | 'pixel'
  | 'grid'
  | 'mosaic'
  | 'slant'
  | 'gradient'

export interface ShelfRowConfig {
  height: RowHeight
  doors: RowFill
  drawers: RowFill
}

export const ROW_HEIGHT_MAP: Record<RowHeight, number> = {
  sm: 18 * CM,
  md: 28 * CM,
  lg: 36 * CM,
}

/** Config for optional top/bottom additional storage: 2 compartments, same column count as shelf. Doors are always on (all cells). */
export interface StorageSectionConfig {
  height: RowHeight
}

/** Per-cell dimension for overlay. Position is in shelf group local space (front face center). */
export interface CellDimensionOverlay {
  row: number
  col: number
  widthCm: number
  heightCm: number
  baseWidthCm?: number
  baseHeightCm?: number
  /** Center of cell front face in shelf group local space (for projection to screen). */
  localX: number
  localY: number
  localZ: number
}

/** Line segment in 3D (shelf group local space) for dimension overlay. */
export interface DimensionLineSegment3D {
  start: { x: number; y: number; z: number }
  end: { x: number; y: number; z: number }
}

/** Data for rendering dimension overlay (overall + per-cell). All positions in shelf group local space. */
export interface DimensionOverlayData {
  totalWidthCm: number
  totalHeightCm: number
  totalDepthCm: number
  /** Line segments for overall dimensions (start/end in group local space). */
  totalWidthLineLocal: DimensionLineSegment3D
  totalHeightLineLocal: DimensionLineSegment3D
  totalDepthLineLocal: DimensionLineSegment3D
  cells: CellDimensionOverlay[]
}

/** JSON-serializable config for a bookcase (e.g. for API or persistence). Lengths in cm. */
export interface BookcaseConfigJson {
  widthCm: number
  heightCm: number
  depthCm: number
  thicknessCm: number
  withBack: boolean
  style: string
  density: number
  topStorage: StorageSectionConfig | null
  bottomStorage: StorageSectionConfig | null
  rowConfigs: ShelfRowConfig[]
  rows: number
  columns: number
}

/** Config for a desk column (storage unit). Each column has uniform height. */
export interface DeskColumnConfig {
  doors: RowFill
  drawers: RowFill
  /** 0–100: controls how many shelf rows are in the column (0 = fewest, 100 = most). */
  density: number
  /** When true the column is rendered as a single tall unpartitioned cell. Disables shelves. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

/** JSON-serializable config for a desk (e.g. for API or persistence). Lengths in cm. */
export interface DeskConfigJson {
  widthCm: number
  heightCm: number
  depthCm: number
  thicknessCm: number
  legroomPosition: number // Index where legroom is placed (0 = leftmost, 1 = second, etc.)
  columnConfigs: DeskColumnConfig[]
  columns: number
}

/** Config for one vertical column of the TV stand. */
export interface TvColumnConfig {
  doors: RowFill
  drawers: RowFill
  /** When true the column is rendered as a single tall unpartitioned cell. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

/** JSON-serializable config for a TvStand (lengths in cm). */
export interface TvStandConfigJson {
  widthCm: number
  heightCm: number
  depthCm: number
  thicknessCm: number
  withBack: boolean
  style: string
  columnConfigs: TvColumnConfig[]
  columns: number
  rows: number
}

/** API model config for TvStand product. */
export interface TvStandModelConfig {
  modelType: 'TvStand'
  widthCm: number
  heightCm: number
  depthCm: number
  color: string
  style: string
  withBack: boolean
  columnConfigs: TvColumnConfig[]
}

/** Config for one vertical column of the ShoeRack (each column has its own height). */
export interface ShoeColumnConfig {
  /** Column height in centimetres — independent per column. */
  heightCm: number
  doors: RowFill
  drawers: RowFill
  /** When true the column has no internal horizontal shelves. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

/** JSON-serializable config for a ShoeRack (lengths in cm). */
export interface ShoeRackConfigJson {
  widthCm: number
  depthCm: number
  thicknessCm: number
  withBack: boolean
  columnConfigs: ShoeColumnConfig[]
  columns: number
}

/** API model config for ShoeRack product. */
export interface ShoeRackModelConfig {
  modelType: 'ShoeRack'
  widthCm: number
  depthCm: number
  color: string
  withBack: boolean
  columnConfigs: ShoeColumnConfig[]
}

/** Config for one vertical column of the BedsideTable. */
export interface BedsideColumnConfig {
  doors: RowFill
  drawers: RowFill
  /** When true the column has no internal shelves — one tall open cubby. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

/** JSON-serializable config for a BedsideTable (lengths in cm). */
export interface BedsideTableConfigJson {
  widthCm: number
  heightCm: number
  depthCm: number
  thicknessCm: number
  density: number
  withBack: boolean
  columnConfigs: BedsideColumnConfig[]
  columns: number
}

/** API model config for BedsideTable product. */
export interface BedsideTableModelConfig {
  modelType: 'BedsideTable'
  widthCm: number
  heightCm: number
  depthCm: number
  color: string
  density: number
  withBack: boolean
  columnConfigs: BedsideColumnConfig[]
}

/** API model config for Bookcase product (from /api/Product/{id}). */
export interface BookcaseModelConfig {
  modelType: 'Bookcase'
  widthCm: number
  heightCm: number
  depthCm: number
  color: string
  style: string
  density: number
  withBack: boolean
  topStorage: StorageSectionConfig | null
  bottomStorage: StorageSectionConfig | null
  rowConfigs: ShelfRowConfig[]
}

/** API model config for Desk product (from /api/Product/{id}). */
export interface DeskModelConfig {
  modelType: 'Desk'
  widthCm: number
  heightCm: number
  depthCm: number
  color: string
  legroomPosition: number
  columnConfigs: DeskColumnConfig[]
}

/** Product category determines which model and configurator inputs are used. */
export type ProductCategory = 'Bookcase' | 'Desk' | 'TvStand' | 'ShoeRack' | 'BedsideTable'

export const DESIGN_CATEGORIES: ProductCategory[] = ['Bookcase', 'Desk', 'TvStand', 'ShoeRack', 'BedsideTable']

export const DEFAULT_MODEL_CONFIGS: Record<ProductCategory, BookcaseModelConfig | DeskModelConfig | TvStandModelConfig | ShoeRackModelConfig | BedsideTableModelConfig> = {
  Bookcase: {
    modelType: 'Bookcase',
    widthCm: 120, heightCm: 180, depthCm: 35,
    color: '#aec6de', style: 'grid', density: 50,
    withBack: true, topStorage: null, bottomStorage: null, rowConfigs: []
  },
  Desk: {
    modelType: 'Desk',
    widthCm: 180, heightCm: 75, depthCm: 60,
    color: '#aec6de', legroomPosition: 0, columnConfigs: []
  },
  TvStand: {
    modelType: 'TvStand',
    widthCm: 150, heightCm: 60, depthCm: 40,
    color: '#aec6de', style: 'grid',
    withBack: true, columnConfigs: []
  },
  ShoeRack: {
    modelType: 'ShoeRack',
    widthCm: 120, depthCm: 30,
    color: '#aec6de',
    withBack: true, columnConfigs: []
  },
  BedsideTable: {
    modelType: 'BedsideTable',
    widthCm: 45, heightCm: 60, depthCm: 40,
    color: '#aec6de', density: 50,
    withBack: true, columnConfigs: []
  },
}

/** Discriminated union of model configs by category. */
export type ProductModelConfig = 
  | { category: 'Bookcase'; modelConfig: BookcaseModelConfig }
  | { category: 'Desk'; modelConfig: DeskModelConfig }
  | { category: 'TvStand'; modelConfig: TvStandModelConfig }
  | { category: 'ShoeRack'; modelConfig: ShoeRackModelConfig }
  | { category: 'BedsideTable'; modelConfig: BedsideTableModelConfig }

/** Product */
export interface Product {
  id: number
  category: ProductCategory
  images: string[]
  modelConfig: BookcaseModelConfig | DeskModelConfig | TvStandModelConfig | ShoeRackModelConfig | BedsideTableModelConfig
}
export interface IProductCard {
  id: number
  productLine: string
  description: string
  hoverImage: string
  thumbnailImage: string
}

export interface IProductsResponse {
  items: IProductCard[]
  pageNumber: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}