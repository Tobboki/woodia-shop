interface IOriginPoint {
  x: number
  y: number
  z: number
}

export const CM = 0.01
export const MM = 0.001
export const M  = 1

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
  sm: 25 * CM,
  md: 35 * CM,
  lg: 45 * CM,
}
