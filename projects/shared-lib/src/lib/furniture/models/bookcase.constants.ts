import { CM } from '../../types/product'
import type { RowHeight, ShelfRowConfig } from '../../types/product'

export const CELL_WIDTH_MIN = 30 * CM
export const CELL_WIDTH_MAX = 60 * CM
export const CELL_HEIGHT_MIN = 18 * CM
export const CELL_HEIGHT_MAX = 38 * CM
export const DEPTH_MIN = 24 * CM
export const DEPTH_MAX = 40 * CM
export const SMOOTHING = 0.12
export const EPS = 0.01 * CM
/** Clearance so doors and drawers always fit inside their openings (no overlap with dividers/shelves). */
export const DOOR_DRAWER_CLEARANCE = 0.001

/** Door open angle in radians (negative = open outward). ~-1.35 ≈ 77°. */
export const DOOR_OPEN_ANGLE = -1.35
/** How far the drawer slides out when open (meters). */
export const DRAWER_SLIDE = 26 * CM
export const HOVER_ANIM_SPEED = 0.18

export type RowStyle =
  | 'grid'
  | 'slant'
  | 'stagger'
  | 'gradient'
  | 'mosaic'

export const ROW_HEIGHT_MULT: Record<RowHeight, number> = {
  sm: 0.85,
  md: 1,
  lg: 1.15,
}

export function defaultRowConfig(): ShelfRowConfig {
  return { height: 'md', doors: 'none', drawers: 'none' }
}
