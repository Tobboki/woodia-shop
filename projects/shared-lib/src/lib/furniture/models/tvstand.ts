import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM } from '../../types/product'
import type {
  TvStandConfigJson,
  DimensionOverlayData,
} from '../../types/product'
import {
  TV_COLUMN_WIDTH_MIN,
  TV_COLUMN_WIDTH_MAX,
  TV_HEIGHT_MIN,
  TV_HEIGHT_MAX,
  TV_CELL_HEIGHT_MIN,
  TV_CELL_HEIGHT_MAX,
  TV_DEPTH_MIN,
  TV_DEPTH_MAX,
  TV_LEG_HEIGHT,
  TV_LEG_WIDTH,
  TV_LEG_INSET,
  SMOOTHING,
  EPS,
  DOOR_OPEN_ANGLE,
  DRAWER_SLIDE,
  HOVER_ANIM_SPEED,
  DOOR_DRAWER_CLEARANCE,
  defaultTvColumnConfig,
} from './tvstand.constants'
import type { TvColumnConfig } from './tvstand.constants'
import type { RowStyle } from './bookcase.constants'

export type { TvColumnConfig } from './tvstand.constants'
export type { RowStyle } from './bookcase.constants'

// ─────────────────────────────────────────────────────────────────────────────
// TvStand
//
// Structural overview
// ───────────────────
//
//   ┌─────────┬─────────┬─────────┐    ← top panel (full width)
//   │         │  shelf  │         │
//   │ huge    │─────────│ drawers │    ← horizontal shelves divide rows within
//   │  cell   │  shelf  │         │      each column
//   │         │─────────│         │
//   └─────────┴─────────┴─────────┘    ← bottom panel (full width)
//       col 0     col 1     col 2
//
// The outer frame (top, bottom, outer side panels) is built first.
// Then each column is processed in order:
//   • A vertical divider is inserted to the right of each non-last column.
//   • If the column is a "huge cell" no horizontal shelves are added.
//   • Otherwise the column is divided into `rows` equal-height cells.
//
// Pivot: width expands from centre, depth from the back (z = 0 at wall).
// ─────────────────────────────────────────────────────────────────────────────

export class TvStand {
  private group = new THREE.Group()
  /** One Group per structural column, used for hover highlighting. */
  private columnsGroup: THREE.Group[] = []

  // ── live (animated) dimensions ────────────────────────────────────────────
  private width: number
  private height: number
  private depth: number

  // ── targets (set by setWidth/setHeight/setDepth) ──────────────────────────
  private targetWidth: number
  private targetHeight: number
  private targetDepth: number

  // ── snapshot taken after rebuild (used for scale-based animation) ─────────
  private baseWidth!: number
  private baseHeight!: number
  private baseDepth!: number

  // ── structural parameters ─────────────────────────────────────────────────
  /** Number of vertical columns. Derived from width. */
  private columns: number
  /** Number of horizontal shelf rows inside each (non-huge) column. Derived from height. */
  private rows: number
  private readonly thickness: number
  private readonly origin: { x: number; y: number; z: number }
  private readonly withBack: boolean
  private readonly meshIdStart: number

  // ── appearance ─────────────────────────────────────────────────────────────
  private material: THREE.Material
  private backMaterial: THREE.Material
  private edgeColor: string = '#ffffff'
  private edgeMaterial: THREE.MeshStandardMaterial
  private invisibleHitboxMaterial: THREE.MeshBasicMaterial
  private rowStyle: RowStyle = 'grid'
  /** When true, render 4 corner box legs below the main body. */
  private withLegs: boolean = false

  // ── per-column configuration ──────────────────────────────────────────────
  private columnConfigs: TvColumnConfig[] = []

  // ── hover state ───────────────────────────────────────────────────────────
  /** Index of the currently hovered column (for highlight). */
  private hoveredColumn: number | null = null
  /** Door to animate open when hovered. col = column index, row = row index. */
  private hoveredDoor: { col: number; row: number } | null = null
  /** Drawer to animate open when hovered. */
  private hoveredDrawer: { col: number; row: number } | null = null

  // ── dimension overlay ────────────────────────────────────────────────────
  private dimensionOverlayData: DimensionOverlayData | null = null
  /** Per-column local x-start positions (built by rebuild, used by handleHover). */
  private colXStarts: number[] = []
  /** Per-column actual widths (built by rebuild, used by handleHover). */
  private columnWidths: number[] = []

  // ───────────────────────────────────────────────────────────────────────────
  // Construction
  // ───────────────────────────────────────────────────────────────────────────

  constructor(
    width: number = 150 * CM,
    height: number = 60 * CM,
    depth: number = 40 * CM,
    thickness: number = 2 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xd4cfc9 }),
    backMaterial: THREE.Material = material,
    meshIdStart: number = 0,
    withBack: boolean = true
  ) {
    this.width = width
    this.height = height
    this.depth = depth
    this.targetWidth = width
    this.targetHeight = height
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

    // Clamp to valid ranges
    const desiredWidth = Math.max(width, TV_COLUMN_WIDTH_MIN)
    const desiredHeight = this.clamp(height, TV_HEIGHT_MIN, TV_HEIGHT_MAX)

    this.columns = this.computeColumnsFromWidth(desiredWidth)
    this.rows = this.computeRowsFromHeight(desiredHeight)

    const minW = this.columns * TV_COLUMN_WIDTH_MIN
    const maxW = this.columns * TV_COLUMN_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minW, maxW)

    const minH = this.rows * TV_CELL_HEIGHT_MIN
    const maxH = Math.min(this.rows * TV_CELL_HEIGHT_MAX, TV_HEIGHT_MAX)
    this.targetHeight = this.clamp(desiredHeight, minH, maxH)
    this.targetDepth = this.clamp(depth, TV_DEPTH_MIN, TV_DEPTH_MAX)

    this.rebuild()
    this.captureBaseSize()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Column / row count computation
  // ───────────────────────────────────────────────────────────────────────────

  private computeColumnsFromWidth(desiredWidth: number): number {
    const avgCellWidth = (TV_COLUMN_WIDTH_MIN + TV_COLUMN_WIDTH_MAX) / 2
    let cols = Math.round((desiredWidth + this.thickness) / (avgCellWidth + this.thickness))
    cols = Math.max(1, cols)
    const minCols = Math.ceil(desiredWidth / TV_COLUMN_WIDTH_MAX)
    const maxCols = Math.floor(desiredWidth / TV_COLUMN_WIDTH_MIN)
    return this.clamp(cols, minCols, Math.max(minCols, maxCols))
  }

  /**
   * Compute how many horizontal shelf rows fit inside a column for the given
   * stand height, respecting the 120 cm height cap.
   */
  private computeRowsFromHeight(desiredHeight: number): number {
    const h = Math.min(desiredHeight, TV_HEIGHT_MAX)
    let rows = 1
    while (h / rows > TV_CELL_HEIGHT_MAX) rows++
    while (rows > 1 && h / rows < TV_CELL_HEIGHT_MIN) rows--
    return rows
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Column config management
  // ───────────────────────────────────────────────────────────────────────────

  private ensureColumnConfigs() {
    while (this.columnConfigs.length < this.columns) {
      this.columnConfigs.push(defaultTvColumnConfig())
    }
    this.columnConfigs = this.columnConfigs.slice(0, this.columns)
  }

  getColumnConfig(colIndex: number): TvColumnConfig {
    this.ensureColumnConfigs()
    return this.columnConfigs[colIndex] ?? defaultTvColumnConfig()
  }

  setColumnConfig(colIndex: number, config: Partial<TvColumnConfig>) {
    this.ensureColumnConfigs()
    if (colIndex < 0 || colIndex >= this.columns) return
    const cur = this.columnConfigs[colIndex]
    const next: TvColumnConfig = { ...cur, ...config }
    // Sanity: doors + drawers = all is contradictory — prefer doors
    if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
    if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
    // hugeCell overrides doors/drawers
    if (next.hugeCell) {
      next.doors = 'none'
      next.drawers = 'none'
    }
    this.columnConfigs[colIndex] = next
    this.rebuild()
    this.captureBaseSize()
  }

  getColumnConfigs(): TvColumnConfig[] {
    this.ensureColumnConfigs()
    return [...this.columnConfigs]
  }

  setColumnConfigs(configs: TvColumnConfig[]) {
    this.ensureColumnConfigs()
    for (let c = 0; c < this.columns && c < configs.length; c++) {
      const next: TvColumnConfig = { ...configs[c] }
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

  // ───────────────────────────────────────────────────────────────────────────
  // Row style (visual variation)
  // ───────────────────────────────────────────────────────────────────────────

  setRowStyle(style: RowStyle) {
    this.rowStyle = style
    this.rebuild()
    this.captureBaseSize()
  }

  getRowStyle(): RowStyle {
    return this.rowStyle
  }

  setWithLegs(value: boolean) {
    this.withLegs = value
    this.rebuild()
    this.captureBaseSize()
  }

  getWithLegs(): boolean {
    return this.withLegs
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Main rebuild
  // ───────────────────────────────────────────────────────────────────────────

  private rebuild() {
    this.width = this.targetWidth
    this.height = this.targetHeight
    this.depth = this.targetDepth
    this.group.clear()
    this.columnsGroup = []
    this.ensureColumnConfigs()

    const idRef = { id: this.meshIdStart }
    const { width, height, depth, thickness, columns, rows, origin, material, backMaterial, withBack } = this
    /** Y offset: when legs are enabled the whole cabinet body is lifted by leg height. */
    const legYOffset = this.withLegs ? TV_LEG_HEIGHT : 0

    // ── dimension overlay init ───────────────────────────────────────────────
    this.dimensionOverlayData = {
      totalWidthCm: Math.round(width / CM),
      totalHeightCm: Math.round((height + legYOffset) / CM),
      totalDepthCm: Math.round(depth / CM),
      totalWidthLineLocal: {
        start: { x: 0, y: height + legYOffset, z: depth },
        end: { x: width, y: height + legYOffset, z: depth },
      },
      totalHeightLineLocal: {
        start: { x: width, y: 0, z: depth },
        end: { x: width, y: height + legYOffset, z: depth },
      },
      totalDepthLineLocal: {
        start: { x: 0, y: 0, z: depth },
        end: { x: 0, y: 0, z: 0 },
      },
      cells: [],
    }

    // ── Corner legs & Intermediate legs (below cabinet body, only when withLegs) ──
    if (this.withLegs) {
      const lw = TV_LEG_WIDTH
      const li = TV_LEG_INSET
      
      const maxSpan = 80 * CM; 
      const availableSpan = width - 2 * li - lw;
      const numSegments = Math.ceil(availableSpan / maxSpan);
      const numLegsX = numSegments + 1;

      for (let i = 0; i < numLegsX; i++) {
        const fraction = numLegsX > 1 ? i / (numLegsX - 1) : 0;
        const x1 = li + fraction * availableSpan;
        const x2 = x1 + lw;

        // Front leg
        this.group.add(
          new Blank(x1, 0, li, x2, TV_LEG_HEIGHT, li + lw, origin, this.getMaterialArray(material), idRef.id++).build()
        )
        // Back leg
        this.group.add(
          new Blank(x1, 0, depth - li - lw, x2, TV_LEG_HEIGHT, depth - li, origin, this.getMaterialArray(material), idRef.id++).build()
        )
      }
    }

    // Y0: base Y of the cabinet body (0 normally, legYOffset when legs enabled)
    const Y0 = legYOffset

    // ── outer frame ──────────────────────────────────────────────────────────
    // Bottom panel (full width)
    this.group.add(
      new Blank(
        thickness, Y0, 0,
        width - thickness, Y0 + thickness, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )
    // Top panel (full width)
    this.group.add(
      new Blank(
        thickness, Y0 + height - thickness, 0,
        width - thickness, Y0 + height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )
    // Left outer side panel
    this.group.add(
      new Blank(
        thickness, Y0, 0,
        thickness * 2, Y0 + height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )
    // Right outer side panel
    this.group.add(
      new Blank(
        width - thickness * 2, Y0, 0,
        width - thickness, Y0 + height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )

    // ── column layout ────────────────────────────────────────────────────────
    // The opening width is derived the same way as Bookcase:
    //   openingWidth = width - 4 * thickness  (inner between the two side panels)
    const openingWidth = width - thickness * 4
    const baseCellWidth = (openingWidth - thickness * (columns - 1)) / columns

    // Compute per-column cell heights from a row-height sum approach
    // (uniform rows here: all rows have equal height based on stand height)
    const innerHeight = height - thickness * 2 // between top and bottom panels
    const cellHeight = (innerHeight - thickness * (rows - 1)) / rows

    // RowStyle: compute per-column divider x-positions if gradient/stagger style
    // (applied to column widths as a visual variation — mirrors Bookcase column logic)
    let columnWidths: number[] = []
    if (this.rowStyle === 'gradient') {
      const availableWidth = openingWidth - (columns - 1) * thickness
      let totalRaw = 0
      const rawWidths: number[] = []
      for (let c = 0; c < columns; c++) {
        const t = c / Math.max(1, columns - 1)
        const gradientFactor = 1 - 4 * Math.pow(t - 0.5, 2)
        const w = baseCellWidth * (0.6 + gradientFactor * 0.8)
        rawWidths.push(w)
        totalRaw += w
      }
      const scale = availableWidth / totalRaw
      // Clamp each width within valid per-column bounds, then renormalize
      const raw = rawWidths.map((w) => Math.max(TV_COLUMN_WIDTH_MIN, Math.min(TV_COLUMN_WIDTH_MAX, w * scale)))
      const rawSum = raw.reduce((a, b) => a + b, 0)
      const rescale = rawSum > 0 ? availableWidth / rawSum : 1
      columnWidths = raw.map((w) => w * rescale)
    } else if (this.rowStyle === 'stagger') {
      const availableWidth = openingWidth - (columns - 1) * thickness
      let totalRaw = 0
      const rawWidths: number[] = []
      for (let c = 0; c < columns; c++) {
        const wave = Math.sin(c * 1.7 + 1.31) + 0.5 * Math.sin(c * 0.77 + 0.9)
        const mult = 1 + 0.4 * (wave / 1.5)
        const w = Math.max(0.2, mult) * baseCellWidth
        rawWidths.push(w)
        totalRaw += w
      }
      const scale = availableWidth / totalRaw
      // Clamp each width within valid per-column bounds, then renormalize
      const raw = rawWidths.map((w) => Math.max(TV_COLUMN_WIDTH_MIN, Math.min(TV_COLUMN_WIDTH_MAX, w * scale)))
      const rawSum = raw.reduce((a, b) => a + b, 0)
      const rescale = rawSum > 0 ? availableWidth / rawSum : 1
      columnWidths = raw.map((w) => w * rescale)
    } else {
      columnWidths = Array(columns).fill(baseCellWidth)
    }

    // Build per-column x-start positions
    const colXStarts: number[] = []
    let xCursor = thickness * 2
    for (let c = 0; c < columns; c++) {
      colXStarts.push(xCursor)
      xCursor += columnWidths[c] + thickness
    }
    // Store for use in handleHover
    this.colXStarts = colXStarts
    this.columnWidths = columnWidths

    // ── columns loop ─────────────────────────────────────────────────────────
    for (let c = 0; c < columns; c++) {
      const colGroup = new THREE.Group()
      colGroup.userData['colIndex'] = c

      const xLeft = colXStarts[c]
      const xRight = xLeft + columnWidths[c]
      const colCfg = this.columnConfigs[c]

      // Apply stagger x-offset on the group itself (mirrors Bookcase row stagger)
      if (this.rowStyle === 'stagger') {
        colGroup.position.x += (c - columns / 2) * baseCellWidth * 0.05
      }

      // ── vertical divider to the right of this column (except last) ──────────
      if (c < columns - 1) {
        this.group.add(
          new Blank(
            xRight, Y0 + thickness, EPS,
            xRight + thickness, Y0 + height - thickness, depth,
            origin, this.getMaterialArray(material), idRef.id++
          ).build()
        )
      }

      // ── Huge Cell: one single tall opening, no internal shelves ─────────────
      if (colCfg.hugeCell) {
        const yLow = Y0 + thickness
        const yHigh = Y0 + height - thickness
        const opening_H = yHigh - yLow

        if (withBack) {
          colGroup.add(
            new Blank(
              xLeft, yLow, EPS,
              xRight, yHigh, thickness,
              origin, this.getMaterialArray(backMaterial), idRef.id++
            ).build()
          )
        }

        // Huge cell door spanning the full opening height
        if (colCfg.hugeCellDoor) {
          const clear = DOOR_DRAWER_CLEARANCE
          const cellW = columnWidths[c]
          const doorW = Math.max(0, cellW - 2 * clear)
          const doorH = Math.max(0, opening_H - 2 * clear)
          if (doorW > 0 && doorH > 0) {
            const doorThickness = this.thickness * 0.5
            const doorGroup = new THREE.Group()
            doorGroup.position.set(xLeft + clear, yLow + clear, depth - doorThickness)
            doorGroup.userData['door'] = true
            doorGroup.userData['colIndex'] = c
            doorGroup.userData['rowIndex'] = 0
            const doorMesh = new Blank(
              0, 0, 0,
              doorW, doorH, doorThickness,
              { x: 0, y: 0, z: 0 },
              this.getMaterialArray(material), idRef.id++
            ).build()
            doorGroup.add(doorMesh)
            colGroup.add(doorGroup)
          }
        }

        // Hitbox for raycasting
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
            widthCm: Math.round(columnWidths[c] / CM),
            heightCm: Math.round(opening_H / CM),
            baseWidthCm: columnWidths[c] / CM,
            baseHeightCm: opening_H / CM,
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

      // ── Standard column: horizontal shelves divide into `rows` cells ─────────
      for (let r = 0; r < rows - 1; r++) {
        // Shelf at top of cell r (= bottom of cell r+1)
        const shelfY = Y0 + thickness + (r + 1) * (cellHeight + thickness) - thickness
        colGroup.add(
          new Blank(
            xLeft, shelfY, EPS,
            xRight, shelfY + thickness, depth,
            origin, this.getMaterialArray(material), idRef.id++
          ).build()
        )
      }

      const clear = DOOR_DRAWER_CLEARANCE
      const doorFill = colCfg.doors
      const drawerFill = colCfg.drawers
      const bothSet = doorFill !== 'none' && drawerFill !== 'none'

      for (let r = 0; r < rows; r++) {
        const yLow = Y0 + thickness + r * (cellHeight + thickness)
        const yHigh = yLow + cellHeight
        const cellW = columnWidths[c]
        const cellD = depth - thickness * 2

        const doorW = Math.max(0, cellW - 2 * clear)
        const doorH = Math.max(0, cellHeight - 2 * clear)
        const drawerW = Math.max(0, cellW - 2 * clear)
        const drawerH = Math.max(0, cellHeight - 2 * clear)
        const drawerD = Math.max(0, cellD - 2 * clear)

        // Back panel per cell (like Bookcase)
        if (withBack) {
          colGroup.add(
            new Blank(
              xLeft, yLow, EPS,
              xRight, yHigh, thickness,
              origin, this.getMaterialArray(backMaterial), idRef.id++
            ).build()
          )
        }

        // Invisible hitbox for this cell
        const hitbox = new Blank(
          xLeft, yLow, 0,
          xRight, yHigh, depth,
          origin, this.invisibleHitboxMaterial, idRef.id++
        ).build()
        hitbox.userData['colIndex'] = c
        hitbox.userData['rowIndex'] = r
        hitbox.name = 'invisible-hitbox'
        colGroup.add(hitbox)

        // Door / drawer logic — same alternating rule as Bookcase
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

      // Tag all meshes in this column with colIndex
      colGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) obj.userData['colIndex'] = c
      })

      this.columnsGroup.push(colGroup)
      this.group.add(colGroup)
    }

    this.recenterPivot()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Pivot / base size
  // ───────────────────────────────────────────────────────────────────────────

  /** Width expands from centre; depth from the back (z = 0 at wall). */
  private recenterPivot() {
    this.group.position.set(-this.width / 2, 0, 0)
  }

  private captureBaseSize() {
    this.baseWidth = this.width
    this.baseHeight = this.height
    this.baseDepth = this.depth
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Material helpers
  // ───────────────────────────────────────────────────────────────────────────

  /** Returns [right, left, top, bottom, front, back] so front/back edges are edgeColor. */
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

  // ───────────────────────────────────────────────────────────────────────────
  // Hover / raycasting
  // ───────────────────────────────────────────────────────────────────────────

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
      // Fallback: infer column from hit point if colIndex still missing
      if (colIndex === null && hit.point) {
        const localPoint = hit.point.clone()
        this.group.worldToLocal(localPoint)
        const x = localPoint.x
        // Walk stored x-starts to find which column we're in
        let found = -1
        for (let c = 0; c < this.colXStarts.length; c++) {
          const x0 = this.colXStarts[c]
          const x1 = x0 + this.columnWidths[c]
          if (x >= x0 && x < x1) { found = c; break }
        }
        if (found >= 0) colIndex = found
        else {
          // Fallback to equal-width estimate
          const openingWidth = (this.baseWidth ?? this.width) - this.thickness * 4
          const baseCellWidth = (openingWidth - this.thickness * (this.columns - 1)) / this.columns
          const left = this.thickness * 2
          if (x >= left && baseCellWidth > 0) {
            const idx = Math.floor((x - left) / (baseCellWidth + this.thickness))
            colIndex = this.clamp(idx, 0, this.columns - 1)
          }
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

    // Huge-cell door: rowIndex is always 0; set hoveredDoor even when rowIndex was null
    if (colIndex !== null && rowIndex === null) {
      const cfg = this.columnConfigs[colIndex]
      if (cfg?.hugeCell && cfg?.hugeCellDoor) {
        this.hoveredDoor = { col: colIndex, row: 0 }
      }
    }
  }

  private cellHasDoor(colIndex: number | null, rowIndex: number | null): boolean {
    if (colIndex === null || rowIndex === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[colIndex]
    if (!cfg) return false
    // Huge-cell door is a special case: rowIndex is always 0
    if (cfg.hugeCell) return cfg.hugeCellDoor === true && rowIndex === 0
    if (cfg.doors === 'none') return false
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

  // ───────────────────────────────────────────────────────────────────────────
  // Animation
  // ───────────────────────────────────────────────────────────────────────────

  update(dt = SMOOTHING) {
    this.width += (this.targetWidth - this.width) * dt
    this.height += (this.targetHeight - this.height) * dt
    this.depth += (this.targetDepth - this.depth) * dt
    this.group.scale.set(
      this.width / this.baseWidth,
      this.height / this.baseHeight,
      this.depth / this.baseDepth
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

  // ───────────────────────────────────────────────────────────────────────────
  // Setters
  // ───────────────────────────────────────────────────────────────────────────

  setWidth(value: number) {
    const desiredWidth = Math.max(value, TV_COLUMN_WIDTH_MIN)
    const prevColumns = this.columns
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    const minWidth = this.columns * TV_COLUMN_WIDTH_MIN
    const maxWidth = this.columns * TV_COLUMN_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minWidth, maxWidth)
    if (this.columns !== prevColumns) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalWidthCm = Math.round(this.targetWidth / CM)
    }
  }

  setHeight(value: number) {
    const desiredHeight = this.clamp(value, TV_HEIGHT_MIN, TV_HEIGHT_MAX)
    const prevRows = this.rows
    this.rows = this.computeRowsFromHeight(desiredHeight)
    const minHeight = this.rows * TV_CELL_HEIGHT_MIN
    const maxHeight = Math.min(this.rows * TV_CELL_HEIGHT_MAX, TV_HEIGHT_MAX)
    this.targetHeight = this.clamp(desiredHeight, minHeight, maxHeight)
    if (this.rows !== prevRows) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalHeightCm = Math.round(this.targetHeight / CM)
    }
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, TV_DEPTH_MIN, TV_DEPTH_MAX)
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
            const bodyMat = mat[i] as THREE.MeshStandardMaterial
            if (bodyMat && bodyMat.color) bodyMat.color.set(hex)
          }
        } else {
          const standardMat = mat as THREE.MeshStandardMaterial
          if (standardMat && standardMat.color) standardMat.color.set(hex)
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

  // ───────────────────────────────────────────────────────────────────────────
  // Getters
  // ───────────────────────────────────────────────────────────────────────────

  getColumns(): number { return this.columns }
  getRows(): number { return this.rows }
  getDepth(): number { return this.depth }
  getWidth(): number { return this.width }
  getHeight(): number { return this.height }

  getDimensionData(): DimensionOverlayData | null {
    if (this.dimensionOverlayData) {
      const scaleX = this.baseWidth > 0 ? this.width / this.baseWidth : 1
      const scaleY = this.baseHeight > 0 ? this.height / this.baseHeight : 1
      this.dimensionOverlayData.totalWidthCm = Math.round(this.width / CM)
      this.dimensionOverlayData.totalHeightCm = Math.round(this.height / CM)
      this.dimensionOverlayData.cells.forEach((cell) => {
        if (cell.baseWidthCm !== undefined) cell.widthCm = Math.round(cell.baseWidthCm * scaleX)
        if (cell.baseHeightCm !== undefined) cell.heightCm = Math.round(cell.baseHeightCm * scaleY)
      })
    }
    return this.dimensionOverlayData
  }

  /** Returns current config as a JSON-serializable object (lengths in cm). */
  getConfigJson(): TvStandConfigJson {
    this.ensureColumnConfigs()
    return {
      widthCm: this.width / CM,
      heightCm: this.height / CM,
      depthCm: this.depth / CM,
      thicknessCm: this.thickness / CM,
      withBack: this.withBack,
      style: this.rowStyle,
      columnConfigs: this.columnConfigs.map((c) => ({ ...c })),
      columns: this.columns,
      rows: this.rows,
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Utilities
  // ───────────────────────────────────────────────────────────────────────────

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  build(): THREE.Group {
    return this.group
  }
}
