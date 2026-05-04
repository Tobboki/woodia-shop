import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM } from '../../types/product'
import type { ShoeRackConfigJson, DimensionOverlayData } from '../../types/product'
import {
  SHOE_COLUMN_WIDTH_MIN,
  SHOE_COLUMN_WIDTH_MAX,
  SHOE_COLUMN_HEIGHT_MIN,
  SHOE_COLUMN_HEIGHT_MAX,
  SHOE_CELL_HEIGHT_MIN,
  SHOE_CELL_HEIGHT_MAX,
  SHOE_DEPTH_MIN,
  SHOE_DEPTH_MAX,
  SMOOTHING,
  EPS,
  DOOR_OPEN_ANGLE,
  DRAWER_SLIDE,
  HOVER_ANIM_SPEED,
  DOOR_DRAWER_CLEARANCE,
  DEFAULT_SHOE_COLUMN_HEIGHT_CM,
  defaultShoeColumnConfig,
} from './shoerack.constants'
import type { ShoeColumnConfig } from './shoerack.constants'

export type { ShoeColumnConfig } from './shoerack.constants'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ShoeRack
//
// A column-primary furniture model where each vertical column has its own
// independently configurable height.  The overall group height equals the
// tallest column.  A shared base plate spans the full width at y = 0.
//
// Structure overview
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
//    col0        col1           col2
//   (short)    (tallest)      (medium)
//
//   â”Œâ”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
//   â”‚      â”‚ â”‚   shelf     â”‚ â”‚          â”‚
//   â”‚      â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚  shelf   â”‚
//   â”‚ huge â”‚ â”‚   shelf     â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
//   â”‚ cell â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚  shelf   â”‚
//   â”‚      â”‚ â”‚   shelf     â”‚ â”‚          â”‚
//   â””â”€â”€â”€â”€â”€â”€â”´â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
//   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•   â† base plate (full width)
//
// Dividers between columns extend to max(leftHeight, rightHeight).
// Pivot: width expands from centre, depth from the back (z = 0 at wall).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class ShoeRack {
  private group = new THREE.Group()
  /** One THREE.Group per column â€” used for hover highlighting. */
  private columnsGroup: THREE.Group[] = []

  // â”€â”€ dimensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private width: number
  private depth: number
  private targetWidth: number
  private targetDepth: number
  private baseWidth!: number
  private baseDepth!: number
  // height is virtual â€” it equals the tallest column, used only for scale animation
  private _totalHeight: number = 0
  private _baseTotalHeight: number = 0

  // â”€â”€ structural â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private columns: number
  private readonly thickness: number
  private readonly origin: { x: number; y: number; z: number }
  private readonly withBack: boolean
  private readonly meshIdStart: number

  // â”€â”€ appearance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private material: THREE.Material
  private backMaterial: THREE.Material
  private edgeColor: string = '#ffffff'
  private edgeMaterial: THREE.MeshStandardMaterial
  private invisibleHitboxMaterial: THREE.MeshBasicMaterial

  // â”€â”€ per-column configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private columnConfigs: ShoeColumnConfig[] = []

  // â”€â”€ hover state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private hoveredColumn: number | null = null
  private hoveredDoor: { col: number; row: number } | null = null
  private hoveredDrawer: { col: number; row: number } | null = null

  // â”€â”€ dimension overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private dimensionOverlayData: DimensionOverlayData | null = null

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Constructor
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  constructor(
    width: number = 120 * CM,
    depth: number = 30 * CM,
    thickness: number = 2 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xd4cfc9 }),
    backMaterial: THREE.Material = material,
    meshIdStart: number = 0,
    withBack: boolean = true
  ) {
    this.width = width
    this.depth = depth
    this.targetWidth = width
    this.targetDepth = depth
    this.thickness = thickness
    this.origin = origin
    this.material = material
    this.backMaterial = backMaterial
    this.edgeMaterial = new THREE.MeshStandardMaterial({ color: this.edgeColor })
    this.invisibleHitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    this.meshIdStart = meshIdStart
    this.withBack = withBack

    const desiredWidth = Math.max(width, SHOE_COLUMN_WIDTH_MIN)
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    const minW = this.columns * SHOE_COLUMN_WIDTH_MIN
    const maxW = this.columns * SHOE_COLUMN_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minW, maxW)
    this.targetDepth = this.clamp(depth, SHOE_DEPTH_MIN, SHOE_DEPTH_MAX)

    this.rebuild()
    this.captureBaseSize()
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Column count computation
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private computeColumnsFromWidth(desiredWidth: number): number {
    const avgCellWidth = (SHOE_COLUMN_WIDTH_MIN + SHOE_COLUMN_WIDTH_MAX) / 2
    let cols = Math.round((desiredWidth + this.thickness) / (avgCellWidth + this.thickness))
    cols = Math.max(1, cols)
    const minCols = Math.ceil(desiredWidth / SHOE_COLUMN_WIDTH_MAX)
    const maxCols = Math.floor(desiredWidth / SHOE_COLUMN_WIDTH_MIN)
    return this.clamp(cols, minCols, Math.max(minCols, maxCols))
  }

  /** How many internal shelf rows fit inside a column of height `colH`. */
  private computeRowsFromHeight(colH: number): number {
    let rows = 1
    while (colH / rows > SHOE_CELL_HEIGHT_MAX) rows++
    while (rows > 1 && colH / rows < SHOE_CELL_HEIGHT_MIN) rows--
    return rows
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Column config management
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private ensureColumnConfigs() {
    while (this.columnConfigs.length < this.columns) {
      this.columnConfigs.push(defaultShoeColumnConfig())
    }
    this.columnConfigs = this.columnConfigs.slice(0, this.columns)
  }

  getColumnConfig(colIndex: number): ShoeColumnConfig {
    this.ensureColumnConfigs()
    return this.columnConfigs[colIndex] ?? defaultShoeColumnConfig()
  }

  setColumnConfig(colIndex: number, config: Partial<ShoeColumnConfig>) {
    this.ensureColumnConfigs()
    if (colIndex < 0 || colIndex >= this.columns) return
    const cur = this.columnConfigs[colIndex]
    const next: ShoeColumnConfig = {
      ...cur,
      ...config,
      heightCm: this.clamp(
        config.heightCm ?? cur.heightCm,
        SHOE_COLUMN_HEIGHT_MIN / CM,
        SHOE_COLUMN_HEIGHT_MAX / CM
      ),
    }
    if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
    if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
    if (next.hugeCell) {
      next.doors = 'none'
      next.drawers = 'none'
    }
    this.columnConfigs[colIndex] = next
    this.rebuild()
    this.captureBaseSize()
  }

  getColumnConfigs(): ShoeColumnConfig[] {
    this.ensureColumnConfigs()
    return [...this.columnConfigs]
  }

  setColumnConfigs(configs: ShoeColumnConfig[]) {
    this.ensureColumnConfigs()
    for (let c = 0; c < this.columns && c < configs.length; c++) {
      const next: ShoeColumnConfig = {
        ...configs[c],
        heightCm: this.clamp(
          configs[c].heightCm,
          SHOE_COLUMN_HEIGHT_MIN / CM,
          SHOE_COLUMN_HEIGHT_MAX / CM
        ),
      }
      if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
      if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
      if (next.hugeCell) {
        next.doors = 'none'
        next.drawers = 'none'
      }
      this.columnConfigs[c] = next
    }
    this.rebuild()
    this.captureBaseSize()
  }

  /** Convenience: set all columns to the same height (global height reset). */
  setAllColumnsHeight(heightCm: number) {
    this.ensureColumnConfigs()
    const clamped = this.clamp(heightCm, SHOE_COLUMN_HEIGHT_MIN / CM, SHOE_COLUMN_HEIGHT_MAX / CM)
    for (let c = 0; c < this.columns; c++) {
      this.columnConfigs[c] = { ...this.columnConfigs[c], heightCm: clamped }
    }
    this.rebuild()
    this.captureBaseSize()
  }

  // ————————————————————————————————————————————————————————————————————————————————
  // Rebuild — the core geometry builder
  // ————————————————————————————————————————————————————————————————————————————————

  private rebuild() {
    this.width = this.targetWidth
    this.depth = this.targetDepth
    this.group.clear()
    this.columnsGroup = []
    this.ensureColumnConfigs()

    const idRef = { id: this.meshIdStart }
    const { width, depth, thickness, columns, origin, material, backMaterial, withBack } = this

    // Column widths â€” equal distribution
    // Opening area = width - 2*thickness (outer side walls) - (columns-1)*thickness (dividers)
    const openingWidth = width - thickness * 2
    const colNetWidth = (openingWidth - thickness * (columns - 1)) / columns

    // Per-column heights in world units
    const colHeights: number[] = this.columnConfigs.map(
      (cfg) => this.clamp(cfg.heightCm, SHOE_COLUMN_HEIGHT_MIN / CM, SHOE_COLUMN_HEIGHT_MAX / CM) * CM
    )
    const maxHeight = Math.max(...colHeights)
    this._totalHeight = maxHeight

    // â”€â”€ dimension overlay init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.dimensionOverlayData = {
      totalWidthCm: Math.round(width / CM),
      totalHeightCm: Math.round(maxHeight / CM),
      totalDepthCm: Math.round(depth / CM),
      totalWidthLineLocal: {
        start: { x: 0, y: maxHeight + thickness, z: depth },
        end: { x: width, y: maxHeight + thickness, z: depth },
      },
      totalHeightLineLocal: {
        start: { x: width, y: 0, z: depth },
        end: { x: width, y: maxHeight + thickness, z: depth },
      },
      totalDepthLineLocal: {
        start: { x: 0, y: 0, z: depth },
        end: { x: 0, y: 0, z: 0 },
      },
      cells: [],
    }

    // â”€â”€ Base plate (full width, sits between y=0 and y=thickness) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.group.add(
      new Blank(
        0, 0, 0,
        width, thickness, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )

    // â”€â”€ Build each column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Compute x-starts
    const colXStarts: number[] = []
    let xCursor = thickness // start after left outer panel
    for (let c = 0; c < columns; c++) {
      colXStarts.push(xCursor)
      xCursor += colNetWidth + thickness // net width + right divider/panel
    }

    // Left outer side panel (full height of tallest adjacent column)
    this.group.add(
      new Blank(
        0, 0, 0,
        thickness, colHeights[0] + thickness, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )

    // Right outer side panel
    this.group.add(
      new Blank(
        width - thickness, 0, 0,
        width, colHeights[columns - 1] + thickness, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )

    // Inter-column vertical dividers â€” height = max of adjacent column heights
    for (let c = 0; c < columns - 1; c++) {
      const divH = Math.max(colHeights[c], colHeights[c + 1]) + thickness
      const divX = colXStarts[c] + colNetWidth
      this.group.add(
        new Blank(
          divX, 0, 0,
          divX + thickness, divH, depth,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )
    }

    // â”€â”€ Per-column internals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (let c = 0; c < columns; c++) {
      const colGroup = new THREE.Group()
      colGroup.userData['colIndex'] = c

      const xLeft = colXStarts[c]
      const xRight = xLeft + colNetWidth
      const colH = colHeights[c]
      const colCfg = this.columnConfigs[c]

      // Top panel for this column
      colGroup.add(
        new Blank(
          xLeft, colH, 0,
          xRight, colH + thickness, depth,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )

      // â”€â”€ Huge Cell: one single tall opening, no internal shelves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (colCfg.hugeCell) {
        const yLow = thickness
        const yHigh = colH
        const openH = yHigh - yLow

        if (withBack) {
          colGroup.add(
            new Blank(
              xLeft, yLow, EPS,
              xRight, yHigh, thickness,
              origin, this.getMaterialArray(backMaterial), idRef.id++
            ).build()
          )
        }

        const hitbox = new Blank(
          xLeft, yLow, 0,
          xRight, yHigh, depth,
          origin, this.invisibleHitboxMaterial, idRef.id++
        ).build()
        hitbox.userData['colIndex'] = c
        hitbox.userData['rowIndex'] = 0
        hitbox.name = 'invisible-hitbox'
        colGroup.add(hitbox)

        if (this.dimensionOverlayData) {
          this.dimensionOverlayData.cells.push({
            row: c,
            col: 0,
            widthCm: Math.round(colNetWidth / CM),
            heightCm: Math.round(openH / CM),
            baseWidthCm: colNetWidth / CM,
            baseHeightCm: openH / CM,
            localX: (xLeft + xRight) / 2,
            localY: (yLow + yHigh) / 2,
            localZ: depth,
          })
        }

        colGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) obj.userData['colIndex'] = c
        })
        this.columnsGroup.push(colGroup)
        this.group.add(colGroup)
        continue
      }

      // â”€â”€ Standard column: horizontal shelves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const innerH = colH - thickness // base plate already drawn; inner starts at thickness
      const rows = this.computeRowsFromHeight(innerH)
      const cellHeight = (innerH - thickness * (rows - 1)) / rows

      // Internal horizontal shelves (between cells)
      for (let r = 0; r < rows - 1; r++) {
        const shelfY = thickness + (r + 1) * (cellHeight + thickness) - thickness
        colGroup.add(
          new Blank(
            xLeft, shelfY, EPS,
            xRight, shelfY + thickness, depth,
            origin, this.getMaterialArray(material), idRef.id++
          ).build()
        )
      }

      // Per-cell: back panel, hitbox, doors, drawers
      const clear = DOOR_DRAWER_CLEARANCE
      const doorFill = colCfg.doors
      const drawerFill = colCfg.drawers
      const bothSet = doorFill !== 'none' && drawerFill !== 'none'

      for (let r = 0; r < rows; r++) {
        const yLow = thickness + r * (cellHeight + thickness)
        const yHigh = yLow + cellHeight
        const cellW = colNetWidth
        const cellD = depth - thickness * 2

        const doorW = Math.max(0, cellW - 2 * clear)
        const doorH = Math.max(0, cellHeight - 2 * clear)
        const drawerW = Math.max(0, cellW - 2 * clear)
        const drawerH = Math.max(0, cellHeight - 2 * clear)
        const drawerD = Math.max(0, cellD - 2 * clear)

        // Back panel per cell
        if (withBack) {
          colGroup.add(
            new Blank(
              xLeft, yLow, EPS,
              xRight, yHigh, thickness,
              origin, this.getMaterialArray(backMaterial), idRef.id++
            ).build()
          )
        }

        // Invisible hitbox for raycasting
        const hitbox = new Blank(
          xLeft, yLow, 0,
          xRight, yHigh, depth,
          origin, this.invisibleHitboxMaterial, idRef.id++
        ).build()
        hitbox.userData['colIndex'] = c
        hitbox.userData['rowIndex'] = r
        hitbox.name = 'invisible-hitbox'
        colGroup.add(hitbox)

        const addDoor =
          doorFill !== 'none' &&
          (bothSet ? r % 2 === 0 : doorFill === 'all' || (doorFill === 'some' && r % 2 === 0))
        const addDrawer =
          drawerFill !== 'none' &&
          (bothSet ? r % 2 !== 0 : drawerFill === 'all' || (drawerFill === 'some' && r % 2 !== 0))

        if (addDoor && doorW > 0 && doorH > 0) {
          const doorThickness = this.thickness * 0.5
          const doorGroup = new THREE.Group()
          doorGroup.position.set(xLeft + clear, yLow + clear, depth - doorThickness)
          doorGroup.userData['door'] = true
          doorGroup.userData['colIndex'] = c
          doorGroup.userData['rowIndex'] = r
          const doorMesh = new Blank(
            0, 0, 0,
            doorW, doorH, doorThickness,
            { x: 0, y: 0, z: 0 },
            this.getMaterialArray(material), idRef.id++
          ).build()
          doorGroup.add(doorMesh)
          colGroup.add(doorGroup)
        }

        if (addDrawer && drawerW > 0 && drawerH > 0 && drawerD > 0) {
          const drawerGroup = new THREE.Group()
          drawerGroup.position.set(xLeft + clear, yLow + clear, this.thickness)
          drawerGroup.userData['drawer'] = true
          drawerGroup.userData['colIndex'] = c
          drawerGroup.userData['rowIndex'] = r
          drawerGroup.userData['baseZ'] = this.thickness
          const drawer = new Drawer(
            drawerW, drawerH, drawerD,
            this.thickness * 0.5,
            origin, material.clone(), idRef.id
          )
          idRef.id += 5
          drawerGroup.add(drawer.build())
          colGroup.add(drawerGroup)
        }

        if (this.dimensionOverlayData) {
          this.dimensionOverlayData.cells.push({
            row: c,
            col: r,
            widthCm: Math.round(cellW / CM),
            heightCm: Math.round(cellHeight / CM),
            baseWidthCm: cellW / CM,
            baseHeightCm: cellHeight / CM,
            localX: (xLeft + xRight) / 2,
            localY: (yLow + yHigh) / 2,
            localZ: depth,
          })
        }
      }

      colGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) obj.userData['colIndex'] = c
      })
      this.columnsGroup.push(colGroup)
      this.group.add(colGroup)
    }

    this.recenterPivot()
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Pivot / capture
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Width expands from centre; depth from the back (z = 0 at wall). */
  private recenterPivot() {
    this.group.position.set(-this.width / 2, 0, 0)
  }

  private captureBaseSize() {
    this.baseWidth = this.width
    this.baseDepth = this.depth
    this._baseTotalHeight = this._totalHeight
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Material helpers
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Returns [right, left, top, bottom, front, back] arrays so front/back edges use `edgeMaterial`. */
  private getMaterialArray(mainMaterial: THREE.Material): THREE.Material[] {
    return [
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      this.edgeMaterial.clone(),
      this.edgeMaterial.clone(),
    ]
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Hover / raycasting
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  handleHover(raycaster: THREE.Raycaster) {
    const hits = raycaster.intersectObject(this.group, true)
    const hit = hits[0]
    let colIndex: number | null = null
    let rowIndex: number | null = null

    if (hit?.object) {
      let obj: THREE.Object3D | null = hit.object
      while (obj && obj !== this.group) {
        if (obj.userData['colIndex'] !== undefined) colIndex = obj.userData['colIndex']
        if (obj.userData['rowIndex'] !== undefined) rowIndex = obj.userData['rowIndex']
        obj = obj.parent
      }

      // Fallback: infer column from x, then row from y in that column's layout
      if (colIndex === null && hit.point) {
        const localPoint = hit.point.clone()
        this.group.worldToLocal(localPoint)
        const openingWidth = (this.baseWidth ?? this.width) - this.thickness * 2
        const colNetWidth = (openingWidth - this.thickness * (this.columns - 1)) / this.columns
        const x = localPoint.x
        const left = this.thickness
        if (x >= left && colNetWidth > 0) {
          const idx = Math.floor((x - left) / (colNetWidth + this.thickness))
          colIndex = this.clamp(idx, 0, this.columns - 1)
        }
      }

      if (colIndex !== null && rowIndex === null && hit.point) {
        // Infer row from y within the detected column
        const localPoint = hit.point.clone()
        this.group.worldToLocal(localPoint)
        const colH =
          this.clamp(
            this.columnConfigs[colIndex]?.heightCm ?? DEFAULT_SHOE_COLUMN_HEIGHT_CM,
            SHOE_COLUMN_HEIGHT_MIN / CM,
            SHOE_COLUMN_HEIGHT_MAX / CM
          ) * CM
        const innerH = colH - this.thickness
        const rows = this.computeRowsFromHeight(innerH)
        const cellHeight = (innerH - this.thickness * (rows - 1)) / rows
        const y = localPoint.y - this.thickness
        if (y >= 0 && cellHeight > 0) {
          const r = Math.floor(y / (cellHeight + this.thickness))
          rowIndex = this.clamp(r, 0, rows - 1)
        }
      }
    }

    if (colIndex !== this.hoveredColumn) {
      this.setColumnHighlight(this.hoveredColumn, false)
      this.setColumnHighlight(colIndex !== null ? colIndex : null, true)
      this.hoveredColumn = colIndex !== null ? colIndex : null
    }

    this.hoveredDoor =
      this.cellHasDoor(colIndex, rowIndex) && colIndex !== null && rowIndex !== null
        ? { col: colIndex, row: rowIndex }
        : null
    this.hoveredDrawer =
      this.cellHasDrawer(colIndex, rowIndex) && colIndex !== null && rowIndex !== null
        ? { col: colIndex, row: rowIndex }
        : null
  }

  private cellHasDoor(colIndex: number | null, rowIndex: number | null): boolean {
    if (colIndex === null || rowIndex === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[colIndex]
    if (!cfg || cfg.doors === 'none' || cfg.hugeCell) return false
    return cfg.doors === 'all' || (cfg.doors === 'some' && rowIndex % 2 === 0)
  }

  private cellHasDrawer(colIndex: number | null, rowIndex: number | null): boolean {
    if (colIndex === null || rowIndex === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[colIndex]
    if (!cfg || cfg.drawers === 'none' || cfg.hugeCell) return false
    return cfg.drawers === 'all' || (cfg.drawers === 'some' && rowIndex % 2 !== 0)
  }

  private columnHasDoorsOrDrawers(col: number | null): boolean {
    if (col === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[col]
    if (!cfg) return false
    if (cfg.hugeCell) return cfg.hugeCellDoor === true
    return cfg.doors !== 'none' || cfg.drawers !== 'none'
  }

  private setColumnHighlight(_col: number | null, _active: boolean) {
    // Highlight intentionally disabled — doors/drawers still animate on hover
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Animation loop
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  update(dt = SMOOTHING) {
    // Width / depth scale animation (same pattern as TvStand)
    const scaleX = this.baseWidth > 0 ? this.width / this.baseWidth : 1
    const scaleZ = this.baseDepth > 0 ? this.depth / this.baseDepth : 1

    // Lerp live values toward targets
    const lerpFactor = this.clamp(dt / SMOOTHING, 0, 1)
    this.width += (this.targetWidth - this.width) * lerpFactor
    this.depth += (this.targetDepth - this.depth) * lerpFactor

    this.group.scale.set(
      this.baseWidth > 0 ? this.width / this.baseWidth : 1,
      1, // heights are per column â€” no uniform Y scale; they rebuild on change
      this.baseDepth > 0 ? this.depth / this.baseDepth : 1
    )

    this.animateDoorsAndDrawers(dt)
  }

  private animateDoorsAndDrawers(dt: number) {
    const t = 1 - Math.exp(-HOVER_ANIM_SPEED * (dt / SMOOTHING))
    this.group.traverse((obj) => {
      if (obj.userData['door']) {
        const target =
          this.hoveredDoor &&
          this.hoveredDoor.col === obj.userData['colIndex'] &&
          this.hoveredDoor.row === obj.userData['rowIndex']
            ? DOOR_OPEN_ANGLE
            : 0
        obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target, t)
      }
      if (obj.userData['drawer']) {
        const baseZ = obj.userData['baseZ'] as number
        const targetZ =
          this.hoveredDrawer &&
          this.hoveredDrawer.col === obj.userData['colIndex'] &&
          this.hoveredDrawer.row === obj.userData['rowIndex']
            ? baseZ + DRAWER_SLIDE
            : baseZ
        obj.position.z = THREE.MathUtils.lerp(obj.position.z, targetZ, t)
      }
    })
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Setters
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  setWidth(value: number) {
    const desired = Math.max(value, SHOE_COLUMN_WIDTH_MIN)
    const prevColumns = this.columns
    this.columns = this.computeColumnsFromWidth(desired)
    const minW = this.columns * SHOE_COLUMN_WIDTH_MIN
    const maxW = this.columns * SHOE_COLUMN_WIDTH_MAX
    this.targetWidth = this.clamp(desired, minW, maxW)
    if (this.columns !== prevColumns) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalWidthCm = Math.round(this.targetWidth / CM)
    }
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, SHOE_DEPTH_MIN, SHOE_DEPTH_MAX)
    if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalDepthCm = Math.round(this.targetDepth / CM)
    }
  }


  setColor(hex: string) {
    if (this.material instanceof THREE.MeshStandardMaterial) {
      this.material.color.set(hex)
    } else {
      ;(this.material as any).color = new THREE.Color(hex)
    }
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'invisible-hitbox') {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) {
          for (let i = 0; i <= 3; i++) {
            const m = mat[i] as THREE.MeshStandardMaterial
            if (m && m.color) m.color.set(hex)
          }
        } else {
          const m = mat as THREE.MeshStandardMaterial
          if (m && m.color) m.color.set(hex)
        }
      }
    })
  }

  setEdgeColor(hex: string) {
    this.edgeColor = hex
    this.edgeMaterial.color.set(hex)
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat) && mat.length >= 6) {
          const frontMat = mat[4] as THREE.MeshStandardMaterial
          const backMat = mat[5] as THREE.MeshStandardMaterial
          if (frontMat && frontMat.color) frontMat.color.set(hex)
          if (backMat && backMat.color) backMat.color.set(hex)
        }
      }
    })
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Getters
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getColumns(): number { return this.columns }
  getWidth(): number { return this.width }
  getDepth(): number { return this.depth }

  /** Overall height = tallest column + base plate thickness. */
  getTotalHeight(): number { return this._totalHeight + this.thickness }

  getDimensionData(): DimensionOverlayData | null {
    if (this.dimensionOverlayData) {
      const scaleX = this.baseWidth > 0 ? this.width / this.baseWidth : 1
      this.dimensionOverlayData.totalWidthCm = Math.round(this.width / CM)
      this.dimensionOverlayData.cells.forEach((cell) => {
        if (cell.baseWidthCm !== undefined) cell.widthCm = Math.round(cell.baseWidthCm * scaleX)
      })
    }
    return this.dimensionOverlayData
  }

  getConfigJson(): ShoeRackConfigJson {
    this.ensureColumnConfigs()
    return {
      widthCm: this.width / CM,
      depthCm: this.depth / CM,
      thicknessCm: this.thickness / CM,
      withBack: this.withBack,
      columnConfigs: this.columnConfigs.map((c) => ({ ...c })),
      columns: this.columns,
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Utilities
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  build(): THREE.Group {
    return this.group
  }
}
