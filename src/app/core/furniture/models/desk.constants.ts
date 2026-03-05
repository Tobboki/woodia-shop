import { CM } from '@shared/typse/product'
import type { DeskColumnConfig } from '@shared/typse/product'

export const DESK_COLUMN_WIDTH_MIN = 40 * CM
export const DESK_COLUMN_WIDTH_MAX = 80 * CM
export const DESK_HEIGHT_MIN = 60 * CM
export const DESK_HEIGHT_MAX = 90 * CM
export const DESK_DEPTH_MIN = 50 * CM
export const DESK_DEPTH_MAX = 70 * CM
export const DESK_TABLETOP_THICKNESS = 3 * CM
export const DESK_LEGROOM_WIDTH_MIN = 60 * CM
export const DESK_LEGROOM_WIDTH_MAX = 100 * CM

export const SMOOTHING = 0.12
export const EPS = 0.01 * CM
export const DOOR_DRAWER_CLEARANCE = 0.001
export const DOOR_OPEN_ANGLE = -1.35
export const DRAWER_SLIDE = 26 * CM
export const HOVER_ANIM_SPEED = 0.18

export function defaultDeskColumnConfig(): DeskColumnConfig {
  return { doors: 'none', drawers: 'none' }
}
