import { CM } from '../../types/product'
import type { RowFill } from '../../types/product'

// ─── Column (width) bounds ────────────────────────────────────────────────────
/** Minimum width of a single TV stand column (opening). */
export const TV_COLUMN_WIDTH_MIN = 30 * CM
/** Maximum width of a single TV stand column (opening). */
export const TV_COLUMN_WIDTH_MAX = 80 * CM

// ─── Stand height bounds ──────────────────────────────────────────────────────
/** TV stands are low-profile furniture; max height 120 cm. */
export const TV_HEIGHT_MIN = 30 * CM
export const TV_HEIGHT_MAX = 120 * CM

// ─── Cell height bounds (for internal shelf rows within a column) ─────────────
export const TV_CELL_HEIGHT_MIN = 18 * CM
export const TV_CELL_HEIGHT_MAX = 50 * CM

// ─── Depth bounds ─────────────────────────────────────────────────────────────
export const TV_DEPTH_MIN = 30 * CM
export const TV_DEPTH_MAX = 60 * CM

// ─── Shared animation/geometry constants ──────────────────────────────────────
export const SMOOTHING = 0.12
/** Small epsilon to eliminate z-fighting on back panels. */
export const EPS = 0.01 * CM

// ─── Leg constants ─────────────────────────────────────────────────────────────
/** Height of each corner leg when legs are enabled. */
export const TV_LEG_HEIGHT = 8 * CM
/** Width/depth of each square leg. */
export const TV_LEG_WIDTH = 3 * CM
/** Inset from the outer corner so legs sit just inside the side panels. */
export const TV_LEG_INSET = 1 * CM
/** Clearance so doors/drawers never overlap their surrounding frame. */
export const DOOR_DRAWER_CLEARANCE = 0.001
/** Door open angle in radians (~77° outward). */
export const DOOR_OPEN_ANGLE = -1.35
/** How far a drawer slides out when hovered (meters). */
export const DRAWER_SLIDE = 26 * CM
export const HOVER_ANIM_SPEED = 0.18

// ─── Column fill type ─────────────────────────────────────────────────────────
/**
 * Configuration for one vertical column of the TV stand.
 *
 * - `doors`   – fill each internal cell with a door  (none / some / all)
 * - `drawers` – fill each internal cell with a drawer (none / some / all)
 * - `hugeCell`– treat the entire column as one single large opening
 *               (no internal horizontal shelves, no doors/drawers)
 */
export interface TvColumnConfig {
  doors: RowFill
  drawers: RowFill
  /** When true the column is rendered as one tall unpartitioned cell. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

export function defaultTvColumnConfig(): TvColumnConfig {
  return { doors: 'none', drawers: 'none', hugeCell: false, hugeCellDoor: false }
}
