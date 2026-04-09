import { CM } from '../../types/product'
import type { RowFill } from '../../types/product'

// ─── Column width bounds (smaller than BookCase/TvStand for high density) ─────
export const BEDSIDE_COLUMN_WIDTH_MIN = 15 * CM
export const BEDSIDE_COLUMN_WIDTH_MAX = 40 * CM

// ─── Height bounds ─────────────────────────────────────────────────────────────
export const BEDSIDE_HEIGHT_MIN = 30 * CM
export const BEDSIDE_HEIGHT_MAX = 90 * CM

// ─── Cell height bounds (small for dense shelving) ────────────────────────────
export const BEDSIDE_CELL_HEIGHT_MIN = 10 * CM
export const BEDSIDE_CELL_HEIGHT_MAX = 22 * CM

// ─── Depth bounds ──────────────────────────────────────────────────────────────
export const BEDSIDE_DEPTH_MIN = 25 * CM
export const BEDSIDE_DEPTH_MAX = 50 * CM

// ─── Table-top overhang beyond the outer side walls ──────────────────────────
export const BEDSIDE_TABLE_TOP_OVERHANG = 1.5 * CM

// ─── Animation / geometry constants ──────────────────────────────────────────
export const SMOOTHING = 0.12
/** Small epsilon to eliminate z-fighting on back panels. */
export const EPS = 0.01 * CM
/** Clearance so doors/drawers never overlap their surrounding frame. */
export const DOOR_DRAWER_CLEARANCE = 0.001
/** Door open angle in radians (~77° outward). */
export const DOOR_OPEN_ANGLE = -1.35
/** How far a drawer slides out when hovered. */
export const DRAWER_SLIDE = 12 * CM
export const HOVER_ANIM_SPEED = 0.18

/**
 * Configuration for one vertical column of the BedsideTable.
 * All columns share the same height (set on the whole model).
 */
export interface BedsideColumnConfig {
  doors: RowFill
  drawers: RowFill
  /** When true the column has no internal horizontal shelves — one tall open cubby. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

export function defaultBedsideColumnConfig(): BedsideColumnConfig {
  return { doors: 'none', drawers: 'none', hugeCell: false, hugeCellDoor: false }
}
