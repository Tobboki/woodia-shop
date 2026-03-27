/**
 * Reusable dimension overlay types for 3D configurators.
 * Use after projecting 3D points to 2D screen coordinates.
 */

/** A dimension line in 2D (e.g. width/height/depth line with optional end arrows). */
export interface DimensionLine2D {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  /** Label text shown at the line (e.g. "185") */
  label?: string
}

/** A dimension label in 2D (e.g. value in an ellipse/pill). */
export interface DimensionLabel2D {
  id: string
  x: number
  y: number
  text: string
  /** 'total' for overall dimensions, 'cell' for per-cell. Affects styling. */
  variant?: 'total' | 'cell'
}
