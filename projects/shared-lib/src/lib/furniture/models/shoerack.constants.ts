import { CM } from '../../types/product'
import type { RowFill } from '../../types/product'

// ─── Column (width) bounds ────────────────────────────────────────────────────
export const SHOE_COLUMN_WIDTH_MIN = 25 * CM
export const SHOE_COLUMN_WIDTH_MAX = 55 * CM

// ─── Per-column height bounds ─────────────────────────────────────────────────
export const SHOE_COLUMN_HEIGHT_MIN = 20 * CM
export const SHOE_COLUMN_HEIGHT_MAX = 200 * CM

// ─── Cell height bounds (internal shelves within a column) ───────────────────
export const SHOE_CELL_HEIGHT_MIN = 15 * CM
export const SHOE_CELL_HEIGHT_MAX = 40 * CM

// ─── Depth bounds ─────────────────────────────────────────────────────────────
export const SHOE_DEPTH_MIN = 20 * CM
export const SHOE_DEPTH_MAX = 40 * CM

// ─── Animation / geometry constants ──────────────────────────────────────────
export const SMOOTHING = 0.12
/** Small epsilon to eliminate z-fighting on back panels. */
export const EPS = 0.01 * CM
/** Clearance so doors/drawers never overlap their surrounding frame. */
export const DOOR_DRAWER_CLEARANCE = 0.001
/** Door open angle in radians (~77° outward). */
export const DOOR_OPEN_ANGLE = -1.35
/** How far a drawer slides out when hovered (meters). */
export const DRAWER_SLIDE = 18 * CM
export const HOVER_ANIM_SPEED = 0.18

// ─── Default values ───────────────────────────────────────────────────────────
export const DEFAULT_SHOE_COLUMN_HEIGHT_CM = 60

/**
 * Configuration for one vertical column of the ShoeRack.
 *
 * - `heightCm` — this column's individual height in centimetres
 * - `doors`    — fill each internal cell with a door (none / some / all)
 * - `drawers`  — fill each internal cell with a drawer (none / some / all)
 * - `hugeCell` — treat the entire column as one tall unpartitioned opening
 */
export interface ShoeColumnConfig {
  heightCm: number
  doors: RowFill
  drawers: RowFill
  /** When true the column has no internal horizontal shelves. */
  hugeCell: boolean
  /** When true (and hugeCell is true) a full-height door is added to the column opening. */
  hugeCellDoor: boolean
}

export function defaultShoeColumnConfig(): ShoeColumnConfig {
  return {
    heightCm: DEFAULT_SHOE_COLUMN_HEIGHT_CM,
    doors: 'none',
    drawers: 'none',
    hugeCell: false,
    hugeCellDoor: false,
  }
}
