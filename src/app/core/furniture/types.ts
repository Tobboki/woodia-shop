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

/** JSON-serializable config for a bookshelf (e.g. for API or persistence). Lengths in cm. */
export interface BookShelfConfigJson {
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

/** API model config for Bookcase product (from /api/Product/{id}). */
export interface BookcaseModelConfig {
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
  widthCm: number
  heightCm: number
  depthCm: number
  color: string
  legroomPosition: number
  columnConfigs: DeskColumnConfig[]
}

/** Product category determines which model and configurator inputs are used. */
export type ProductCategory = 'Bookcase' | 'Desk'

/** Discriminated union of model configs by category. */
export type ProductModelConfig = 
  | { category: 'Bookcase'; modelConfig: BookcaseModelConfig }
  | { category: 'Desk'; modelConfig: DeskModelConfig }

/** Product as returned from /api/Product/{Id}. */
export interface Product {
  id: number
  category: ProductCategory
  images: string[]
  modelConfig: BookcaseModelConfig | DeskModelConfig
}
