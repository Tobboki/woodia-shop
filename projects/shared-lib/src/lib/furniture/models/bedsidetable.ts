import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM } from '../../types/product'
import type { BedsideTableConfigJson, DimensionOverlayData } from '../../types/product'
import {
  BEDSIDE_COLUMN_WIDTH_MIN,
  BEDSIDE_COLUMN_WIDTH_MAX,
  BEDSIDE_HEIGHT_MIN,
  BEDSIDE_HEIGHT_MAX,
  BEDSIDE_CELL_HEIGHT_MIN,
  BEDSIDE_CELL_HEIGHT_MAX,
  BEDSIDE_DEPTH_MIN,
  BEDSIDE_DEPTH_MAX,
  BEDSIDE_TABLE_TOP_OVERHANG,
  SMOOTHING,
  EPS,
  DOOR_OPEN_ANGLE,
  DRAWER_SLIDE,
  HOVER_ANIM_SPEED,
  DOOR_DRAWER_CLEARANCE,
  defaultBedsideColumnConfig,
} from './bedsidetable.constants'
import type { BedsideColumnConfig } from './bedsidetable.constants'

export type { BedsideColumnConfig } from './bedsidetable.constants'

// ─────────────────────────────────────────────────────────────────────────────
// BedsideTable
//
// A high-density, small-scale column-primary furniture model.
// All columns share the same frame height.  A table-top panel overhangs
// each side wall by BEDSIDE_TABLE_TOP_OVERHANG.
//
// Density (0-100) controls how tightly packed the internal shelves are:
//   density 0   → largest cells (fewest rows)
//   density 100 → smallest cells (most rows)
//
// Structure overview
// ──────────────────
//   ┌─────────────────────────────────┐  ← table top (with overhang)
//   │  col0   │  col1   │    col2     │
//   │─────────│─────────│─────────────│
//   │         │         │             │
//   │─────────│─────────│─────────────│
//   │         │   open  │             │
//   └─────────┴─────────┴─────────────┘
//   ══════════════════════════════════   ← base plate
//
// Pivot: width expands from centre; depth from the back (z = 0 at wall).
// ─────────────────────────────────────────────────────────────────────────────

export class BedsideTable {
  private group = new THREE.Group()
  /** One Group per column — used for hover highlighting. */
  private columnsGroup: THREE.Group[] = []

  // ── dimensions ────────────────────────────────────────────────────────────
  private width: number
  private height: number
  private depth: number
  private targetWidth: number
  private targetHeight: number
  private targetDepth: number
  private baseWidth!: number
  private baseHeight!: number
  private baseDepth!: number

  // ── structural ────────────────────────────────────────────────────────────
  private columns: number
  private readonly thickness: number
  private readonly origin: { x: number; y: number; z: number }
  private readonly withBack: boolean
  private readonly meshIdStart: number

  // ── density ───────────────────────────────────────────────────────────────
  private density: number // 0-100

  // ── appearance ─────────────────────────────────────────────────────────────
  private material: THREE.Material
  private edgeColor: string = '#ffffff'
  private edgeMaterial: THREE.MeshStandardMaterial
  private invisibleHitboxMaterial: THREE.MeshBasicMaterial

  // ── per-column configuration ──────────────────────────────────────────────
  private columnConfigs: BedsideColumnConfig[] = []

  // ── hover state ───────────────────────────────────────────────────────────
  private hoveredColumn: number | null = null
  private hoveredDoor: { col: number; row: number } | null = null
  private hoveredDrawer: { col: number; row: number } | null = null

  // ── dimension overlay ─────────────────────────────────────────────────────
  private dimensionOverlayData: DimensionOverlayData | null = null
  /** Tabletop overhang beyond each outer side wall (scene units). Configurable. */
  private topOverhang: number = BEDSIDE_TABLE_TOP_OVERHANG

  // ───────────────────────────────────────────────────────────────────────────
  // Constructor
  // ───────────────────────────────────────────────────────────────────────────

  constructor(
    width: number = 45 * CM,
    height: number = 60 * CM,
    depth: number = 40 * CM,
    thickness: number = 1 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xd2b48c }),
    meshIdStart: number = 0,
    withBack: boolean = true,
    density: number = 50
  ) {
    this.width = this.clamp(width, BEDSIDE_COLUMN_WIDTH_MIN, 200 * CM)
    this.height = this.clamp(height, BEDSIDE_HEIGHT_MIN, BEDSIDE_HEIGHT_MAX)
    this.depth = this.clamp(depth, BEDSIDE_DEPTH_MIN, BEDSIDE_DEPTH_MAX)
    this.targetWidth = this.width
    this.targetHeight = this.height
    this.targetDepth = this.depth
    this.thickness = thickness
    this.origin = origin
    this.material = material
    this.edgeMaterial = new THREE.MeshStandardMaterial({ color: this.edgeColor })
    this.invisibleHitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    this.meshIdStart = meshIdStart
    this.withBack = withBack
    this.density = this.clamp(density, 0, 100)
    this.columns = this.computeColumnsFromWidth(this.width)
    this.rebuild()
    this.captureBaseSize()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Layout helpers
  // ───────────────────────────────────────────────────────────────────────────

  private computeColumnsFromWidth(w: number): number {
    const avgCellWidth = (BEDSIDE_COLUMN_WIDTH_MIN + BEDSIDE_COLUMN_WIDTH_MAX) / 2
    let cols = Math.round((w + this.thickness) / (avgCellWidth + this.thickness))
    cols = Math.max(1, cols)
    const minCols = Math.max(1, Math.ceil(w / BEDSIDE_COLUMN_WIDTH_MAX))
    const maxCols = Math.floor(w / BEDSIDE_COLUMN_WIDTH_MIN)
    return this.clamp(cols, minCols, Math.max(minCols, maxCols))
  }

  /**
   * Number of shelf rows determined by height and density.
   *
   * density 0   → targetCellHeight = BEDSIDE_CELL_HEIGHT_MAX (fewest rows)
   * density 100 → targetCellHeight = BEDSIDE_CELL_HEIGHT_MIN (most rows)
   */
  private computeRowsFromHeight(innerH: number): number {
    const t = this.density / 100
    const targetCellH = BEDSIDE_CELL_HEIGHT_MAX - t * (BEDSIDE_CELL_HEIGHT_MAX - BEDSIDE_CELL_HEIGHT_MIN)
    let rows = Math.max(1, Math.floor(innerH / targetCellH))
    // Ensure cells aren't too small
    while (rows > 1 && innerH / rows < BEDSIDE_CELL_HEIGHT_MIN) rows--
    return rows
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Column config management
  // ───────────────────────────────────────────────────────────────────────────

  private ensureColumnConfigs() {
    while (this.columnConfigs.length < this.columns) {
      this.columnConfigs.push(defaultBedsideColumnConfig())
    }
    this.columnConfigs = this.columnConfigs.slice(0, this.columns)
  }

  getColumnConfig(colIndex: number): BedsideColumnConfig {
    this.ensureColumnConfigs()
    return this.columnConfigs[colIndex] ?? defaultBedsideColumnConfig()
  }

  setColumnConfig(colIndex: number, config: Partial<BedsideColumnConfig>) {
    this.ensureColumnConfigs()
    if (colIndex < 0 || colIndex >= this.columns) return
    const cur = this.columnConfigs[colIndex]
    const next: BedsideColumnConfig = { ...cur, ...config }
    if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
    if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
    if (next.hugeCell) { next.doors = 'none'; next.drawers = 'none' }
    this.columnConfigs[colIndex] = next
    this.rebuild()
    this.captureBaseSize()
  }

  getColumnConfigs(): BedsideColumnConfig[] {
    this.ensureColumnConfigs()
    return [...this.columnConfigs]
  }

  setColumnConfigs(configs: BedsideColumnConfig[]) {
    this.ensureColumnConfigs()
    for (let c = 0; c < this.columns && c < configs.length; c++) {
      const next: BedsideColumnConfig = { ...configs[c] }
      if (next.hugeCell) { next.doors = 'none'; next.drawers = 'none' }
      this.columnConfigs[c] = next
    }
    this.rebuild()
    this.captureBaseSize()
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Rebuild — core geometry builder
  // ───────────────────────────────────────────────────────────────────────────

  private rebuild() {
    this.width = this.targetWidth
    this.height = this.targetHeight
    this.depth = this.targetDepth
    this.group.clear()
    this.columnsGroup = []
    this.ensureColumnConfigs()

    const idRef = { id: this.meshIdStart }
    const { width, height, depth, thickness, columns, origin, withBack } = this
    const overhang = this.topOverhang
    const material = this.material

    // Effective inner height for shelf calculation
    const innerH = height - thickness // above the base plate

    // Per-column net width
    const openingWidth = width - thickness * 2
    const colNetWidth = (openingWidth - thickness * (columns - 1)) / columns

    // ── Dimension overlay init ──────────────────────────────────────────────
    this.dimensionOverlayData = {
      totalWidthCm: Math.round(width / CM),
      totalHeightCm: Math.round((height + thickness) / CM),
      totalDepthCm: Math.round(depth / CM),
      totalWidthLineLocal: {
        start: { x: -overhang, y: height + thickness, z: depth },
        end: { x: width + overhang, y: height + thickness, z: depth },
      },
      totalHeightLineLocal: {
        start: { x: width, y: 0, z: depth },
        end: { x: width, y: height + thickness, z: depth },
      },
      totalDepthLineLocal: {
        start: { x: 0, y: 0, z: depth },
        end: { x: 0, y: 0, z: 0 },
      },
      cells: [],
    }

    // ── Base plate ─────────────────────────────────────────────────────────
    this.group.add(new Blank(
      0, 0, 0,
      width, thickness, depth,
      origin, this.getMaterialArray(material), idRef.id++
    ).build())

    // ── Table top (with overhang) ──────────────────────────────────────────
    this.group.add(new Blank(
      -overhang, height, 0,
      width + overhang, height + thickness, depth,
      origin, this.getMaterialArray(material), idRef.id++
    ).build())

    // ── Left outer wall ────────────────────────────────────────────────────
    this.group.add(new Blank(
      0, thickness, 0,
      thickness, height, depth,
      origin, this.getMaterialArray(material), idRef.id++
    ).build())

    // ── Right outer wall ───────────────────────────────────────────────────
    this.group.add(new Blank(
      width - thickness, thickness, 0,
      width, height, depth,
      origin, this.getMaterialArray(material), idRef.id++
    ).build())

    // ── Column x-starts ────────────────────────────────────────────────────
    const colXStarts: number[] = []
    let xCursor = thickness
    for (let c = 0; c < columns; c++) {
      colXStarts.push(xCursor)
      xCursor += colNetWidth + thickness
    }

    // ── Inter-column vertical dividers ────────────────────────────────────
    for (let c = 0; c < columns - 1; c++) {
      const divX = colXStarts[c] + colNetWidth
      this.group.add(new Blank(
        divX, thickness, 0,
        divX + thickness, height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build())
    }

    // ── Per-column internals ────────────────────────────────────────────────
    for (let c = 0; c < columns; c++) {
      const colGroup = new THREE.Group()
      colGroup.userData['colIndex'] = c

      const xLeft = colXStarts[c]
      const xRight = xLeft + colNetWidth
      const colCfg = this.columnConfigs[c]
      const clear = DOOR_DRAWER_CLEARANCE

      // ── Huge Cell ──────────────────────────────────────────────────────
      if (colCfg.hugeCell) {
        const yLow = thickness
        const yHigh = height

        if (withBack) {
          colGroup.add(new Blank(
            xLeft, yLow, EPS,
            xRight, yHigh, thickness,
            origin, this.getMaterialArray(material), idRef.id++
          ).build())
        }

        // Huge cell door spanning the full opening height
        if (colCfg.hugeCellDoor) {
          const doorW = Math.max(0, colNetWidth - 2 * clear)
          const doorH = Math.max(0, (yHigh - yLow) - 2 * clear)
          if (doorW > 0 && doorH > 0) {
            const doorThickness = this.thickness * 0.5
            const doorGroup = new THREE.Group()
            doorGroup.position.set(xLeft + clear, yLow + clear, depth - doorThickness)
            doorGroup.userData['door'] = true
            doorGroup.userData['colIndex'] = c
            doorGroup.userData['rowIndex'] = 0
            const doorMesh = new Blank(
              0, 0, 0, doorW, doorH, doorThickness,
              { x: 0, y: 0, z: 0 }, this.getMaterialArray(material), idRef.id++
            ).build()
            doorGroup.add(doorMesh)
            colGroup.add(doorGroup)
          }
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
            row: c, col: 0,
            widthCm: Math.round(colNetWidth / CM),
            heightCm: Math.round((yHigh - yLow) / CM),
            baseWidthCm: colNetWidth / CM,
            baseHeightCm: (yHigh - yLow) / CM,
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

      // ── Standard column: rows derived from density ─────────────────────
      const rows = this.computeRowsFromHeight(innerH)
      const cellHeight = (innerH - thickness * (rows - 1)) / rows

      // Internal horizontal shelves
      for (let r = 0; r < rows - 1; r++) {
        const shelfY = thickness + (r + 1) * (cellHeight + thickness) - thickness
        colGroup.add(new Blank(
          xLeft, shelfY, EPS,
          xRight, shelfY + thickness, depth,
          origin, this.getMaterialArray(material), idRef.id++
        ).build())
      }

      // Per-cell content
      const doorFill = colCfg.doors
      const drawerFill = colCfg.drawers
      const bothSet = doorFill !== 'none' && drawerFill !== 'none'

      for (let r = 0; r < rows; r++) {
        const yLow = thickness + r * (cellHeight + thickness)
        const yHigh = yLow + cellHeight
        const cellW = colNetWidth
        const cellD = depth - thickness * 2

        if (withBack) {
          colGroup.add(new Blank(
            xLeft, yLow, EPS,
            xRight, yHigh, thickness,
            origin, this.getMaterialArray(material), idRef.id++
          ).build())
        }

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

        const doorW = Math.max(0, cellW - 2 * clear)
        const doorH = Math.max(0, cellHeight - 2 * clear)
        const drawerW = Math.max(0, cellW - 2 * clear)
        const drawerH = Math.max(0, cellHeight - 2 * clear)
        const drawerD = Math.max(0, cellD - 2 * clear)

        if (addDoor && doorW > 0 && doorH > 0) {
          const doorThickness = this.thickness * 0.5
          const doorGroup = new THREE.Group()
          doorGroup.position.set(xLeft + clear, yLow + clear, depth - doorThickness)
          doorGroup.userData['door'] = true
          doorGroup.userData['colIndex'] = c
          doorGroup.userData['rowIndex'] = r
          const doorMesh = new Blank(
            0, 0, 0, doorW, doorH, doorThickness,
            { x: 0, y: 0, z: 0 }, this.getMaterialArray(material), idRef.id++
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
            row: c, col: r,
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

  // ───────────────────────────────────────────────────────────────────────────
  // Pivot
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

  private getMaterialArray(mainMaterial: THREE.Material): THREE.Material[] {
    return [
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      this.edgeMaterial.clone(), // front
      this.edgeMaterial.clone(), // back
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
        const localPoint = hit.point.clone()
        this.group.worldToLocal(localPoint)
        const innerH = (this.baseHeight ?? this.height) - this.thickness
        const rows = this.computeRowsFromHeight(innerH)
        const cellHeight = (innerH - this.thickness * (rows - 1)) / rows
        const y = localPoint.y - this.thickness
        if (y >= 0 && cellHeight > 0) {
          rowIndex = this.clamp(Math.floor(y / (cellHeight + this.thickness)), 0, rows - 1)
        }
      }
    }

    if (colIndex !== this.hoveredColumn) {
      this.setColumnHighlight(this.hoveredColumn, false)
      this.setColumnHighlight(colIndex, true)
      this.hoveredColumn = colIndex
    }

    this.hoveredDoor = colIndex !== null && rowIndex !== null && this.cellHasDoor(colIndex, rowIndex)
      ? { col: colIndex, row: rowIndex } : null
    this.hoveredDrawer = colIndex !== null && rowIndex !== null && this.cellHasDrawer(colIndex, rowIndex)
      ? { col: colIndex, row: rowIndex } : null
  }

  private cellHasDoor(col: number, row: number): boolean {
    const cfg = this.columnConfigs[col]
    if (!cfg || cfg.doors === 'none' || cfg.hugeCell) return false
    // At this point doors is 'some' | 'all'
    const bothActive = cfg.drawers !== 'none'
    if (bothActive) return row % 2 === 0 // alternate: even rows = doors
    return cfg.doors === 'all' || (cfg.doors === 'some' && row % 2 === 0)
  }

  private cellHasDrawer(col: number, row: number): boolean {
    const cfg = this.columnConfigs[col]
    if (!cfg || cfg.drawers === 'none' || cfg.hugeCell) return false
    // At this point drawers is 'some' | 'all'
    const bothActive = cfg.doors !== 'none'
    if (bothActive) return row % 2 !== 0 // alternate: odd rows = drawers
    return cfg.drawers === 'all' || (cfg.drawers === 'some' && row % 2 !== 0)
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
  // Animation loop
  // ───────────────────────────────────────────────────────────────────────────

  update(dt = SMOOTHING) {
    const lerpFactor = this.clamp(dt / SMOOTHING, 0, 1)
    this.width += (this.targetWidth - this.width) * lerpFactor
    this.height += (this.targetHeight - this.height) * lerpFactor
    this.depth += (this.targetDepth - this.depth) * lerpFactor

    this.group.scale.set(
      this.baseWidth > 0 ? this.width / this.baseWidth : 1,
      this.baseHeight > 0 ? this.height / this.baseHeight : 1,
      this.baseDepth > 0 ? this.depth / this.baseDepth : 1
    )

    const t = 1 - Math.exp(-HOVER_ANIM_SPEED * (dt / SMOOTHING))
    this.group.traverse((obj) => {
      if (obj.userData['door']) {
        const target = this.hoveredDoor?.col === obj.userData['colIndex'] &&
          this.hoveredDoor?.row === obj.userData['rowIndex'] ? DOOR_OPEN_ANGLE : 0
        obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target, t)
      }
      if (obj.userData['drawer']) {
        const baseZ = obj.userData['baseZ'] as number
        const targetZ = this.hoveredDrawer?.col === obj.userData['colIndex'] &&
          this.hoveredDrawer?.row === obj.userData['rowIndex'] ? baseZ + DRAWER_SLIDE : baseZ
        obj.position.z = THREE.MathUtils.lerp(obj.position.z, targetZ, t)
      }
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Setters
  // ───────────────────────────────────────────────────────────────────────────

  setWidth(value: number) {
    const desiredW = this.clamp(value, BEDSIDE_COLUMN_WIDTH_MIN, 200 * CM)
    const prevColumns = this.columns
    this.columns = this.computeColumnsFromWidth(desiredW)
    this.targetWidth = desiredW
    if (this.columns !== prevColumns) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalWidthCm = Math.round(this.targetWidth / CM)
    }
  }

  setHeight(value: number) {
    const clamped = this.clamp(value, BEDSIDE_HEIGHT_MIN, BEDSIDE_HEIGHT_MAX)
    this.targetHeight = clamped
    this.rebuild()
    this.captureBaseSize()
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, BEDSIDE_DEPTH_MIN, BEDSIDE_DEPTH_MAX)
    if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalDepthCm = Math.round(this.targetDepth / CM)
    }
  }

  setTopOverhang(overhanCm: number) {
    this.topOverhang = Math.max(0, overhanCm) * CM
    this.rebuild()
    this.captureBaseSize()
  }

  getTopOverhang(): number { return this.topOverhang / CM }

  setDensity(value: number) {
    this.density = this.clamp(value, 0, 100)
    this.rebuild()
    this.captureBaseSize()
  }

  setColor(hex: string) {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'invisible-hitbox') {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) {
          for (let i = 0; i <= 3; i++) {
            const m = mat[i] as THREE.MeshStandardMaterial
            if (m?.color) m.color.set(hex)
          }
        } else {
          const m = mat as THREE.MeshStandardMaterial
          if (m?.color) m.color.set(hex)
        }
      }
    })
    if (this.material instanceof THREE.MeshStandardMaterial) this.material.color.set(hex)
  }

  setEdgeColor(hex: string) {
    this.edgeColor = hex
    this.edgeMaterial.color.set(hex)
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat) && mat.length >= 6) {
          for (const m of [mat[4], mat[5]] as THREE.MeshStandardMaterial[]) {
            if (m?.color) m.color.set(hex)
          }
        }
      }
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Getters
  // ───────────────────────────────────────────────────────────────────────────

  getColumns(): number { return this.columns }
  getWidth(): number { return this.width }
  getHeight(): number { return this.height }
  getDepth(): number { return this.depth }
  getTotalHeight(): number { return this.height + this.thickness }

  getDimensionData(): DimensionOverlayData | null {
    if (this.dimensionOverlayData) {
      const scaleX = this.baseWidth > 0 ? this.width / this.baseWidth : 1
      const scaleY = this.baseHeight > 0 ? this.height / this.baseHeight : 1
      this.dimensionOverlayData.totalWidthCm = Math.round(this.width / CM)
      this.dimensionOverlayData.totalHeightCm = Math.round((this.height + this.thickness) / CM)
      this.dimensionOverlayData.totalDepthCm = Math.round(this.depth / CM)
      this.dimensionOverlayData.cells.forEach((cell) => {
        if (cell.baseWidthCm !== undefined) cell.widthCm = Math.round(cell.baseWidthCm * scaleX)
        if (cell.baseHeightCm !== undefined) cell.heightCm = Math.round(cell.baseHeightCm * scaleY)
      })
    }
    return this.dimensionOverlayData
  }

  getConfigJson(): BedsideTableConfigJson {
    this.ensureColumnConfigs()
    return {
      widthCm: this.width / CM,
      heightCm: this.height / CM,
      depthCm: this.depth / CM,
      thicknessCm: this.thickness / CM,
      density: this.density,
      withBack: this.withBack,
      columnConfigs: this.columnConfigs.map((c) => ({ ...c })),
      columns: this.columns,
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
