import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM } from '../../types/product'
import type {
  DeskConfigJson,
  DimensionOverlayData,
  CellDimensionOverlay,
  RowFill,
  DeskColumnConfig,
} from '../../types/product'
import {
  DESK_COLUMN_WIDTH_MIN,
  DESK_COLUMN_WIDTH_MAX,
  DESK_HEIGHT_MIN,
  DESK_HEIGHT_MAX,
  DESK_DEPTH_MIN,
  DESK_DEPTH_MAX,
  DESK_TABLETOP_THICKNESS,
  DESK_LEGROOM_WIDTH_MIN,
  DESK_LEGROOM_WIDTH_MAX,
  DESK_ROWS_MIN,
  DESK_ROWS_MAX,
  SMOOTHING,
  EPS,
  DOOR_OPEN_ANGLE,
  DRAWER_SLIDE,
  HOVER_ANIM_SPEED,
  DOOR_DRAWER_CLEARANCE,
  defaultDeskColumnConfig,
} from './desk.constants'

export class Desk {
  private group = new THREE.Group()
  private columnsGroup: THREE.Group[] = []
  private columns: number
  private width: number
  private height: number
  private depth: number
  private targetWidth: number
  private targetHeight: number
  private targetDepth: number
  private baseWidth!: number
  private baseHeight!: number
  private baseDepth!: number
  private thickness: number
  private origin: { x: number; y: number; z: number }
  private material: THREE.Material
  private backMaterial: THREE.Material
  private meshIdStart: number
  private hoveredColumn: number | null = null
  private hoveredDoor: { col: number; cell: number } | null = null
  private hoveredDrawer: { col: number; cell: number } | null = null
  private columnConfigs: DeskColumnConfig[] = []
  private invisibleHitboxMaterial: THREE.MeshBasicMaterial
  private legroomPosition: number = 0
  private dimensionOverlayData: DimensionOverlayData | null = null
  /** How much the tabletop extends beyond the left/right outer walls (in scene units). */
  private topOverhang: number = 0

  constructor(
    width: number = 180 * CM,
    height: number = 75 * CM,
    depth: number = 60 * CM,
    thickness: number = 2 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xaec6de }),
    backMaterial: THREE.Material = material,
    meshIdStart: number = 0,
    legroomPosition: number = 0
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
    this.meshIdStart = meshIdStart
    this.invisibleHitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    this.legroomPosition = legroomPosition
    const desiredWidth = Math.max(width, DESK_COLUMN_WIDTH_MIN + DESK_LEGROOM_WIDTH_MIN)
    const desiredHeight = Math.max(height, DESK_HEIGHT_MIN)
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    const minW = this.columns * DESK_COLUMN_WIDTH_MIN + DESK_LEGROOM_WIDTH_MIN
    const maxW = this.columns * DESK_COLUMN_WIDTH_MAX + DESK_LEGROOM_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minW, maxW)
    this.targetHeight = this.clamp(desiredHeight, DESK_HEIGHT_MIN, DESK_HEIGHT_MAX)
    this.targetDepth = this.clamp(depth, DESK_DEPTH_MIN, DESK_DEPTH_MAX)
    this.rebuild()
    this.captureBaseSize()
  }

  private computeColumnsFromWidth(desiredWidth: number): number {
    const legroomWidth = DESK_LEGROOM_WIDTH_MIN
    const availableWidth = desiredWidth - legroomWidth
    const avgColumnWidth = (DESK_COLUMN_WIDTH_MIN + DESK_COLUMN_WIDTH_MAX) / 2
    let columns = Math.round(availableWidth / avgColumnWidth)
    columns = Math.max(1, columns)
    const minColumns = Math.ceil((availableWidth - DESK_COLUMN_WIDTH_MAX) / DESK_COLUMN_WIDTH_MAX) + 1
    const maxColumns = Math.floor(availableWidth / DESK_COLUMN_WIDTH_MIN)
    return this.clamp(columns, minColumns, maxColumns)
  }

  private ensureColumnConfigs() {
    while (this.columnConfigs.length < this.columns) {
      this.columnConfigs.push(defaultDeskColumnConfig())
    }
    this.columnConfigs = this.columnConfigs.slice(0, this.columns)
  }

  getColumnConfig(colIndex: number): DeskColumnConfig {
    this.ensureColumnConfigs()
    return this.columnConfigs[colIndex] ?? defaultDeskColumnConfig()
  }

  setColumnConfig(colIndex: number, config: Partial<DeskColumnConfig>) {
    this.ensureColumnConfigs()
    if (colIndex < 0 || colIndex >= this.columns) return
    const cur = this.columnConfigs[colIndex]
    const next = { ...cur, ...config }
    if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
    if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
    // When hugeCell is on, doors/drawers are disabled (hugeCellDoor takes over)
    if (next.hugeCell) {
      next.doors = 'none'
      next.drawers = 'none'
    }
    this.columnConfigs[colIndex] = next
    this.rebuild()
    this.captureBaseSize()
  }

  getColumnConfigs(): DeskColumnConfig[] {
    this.ensureColumnConfigs()
    return [...this.columnConfigs]
  }

  setLegroomPosition(position: number) {
    this.legroomPosition = this.clamp(position, 0, this.columns)
    this.rebuild()
    this.captureBaseSize()
  }

  getLegroomPosition(): number {
    return this.legroomPosition
  }

  setWidth(value: number) {
    const desiredWidth = Math.max(value, DESK_COLUMN_WIDTH_MIN + DESK_LEGROOM_WIDTH_MIN)
    const prevColumns = this.columns
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    const minWidth = this.columns * DESK_COLUMN_WIDTH_MIN + DESK_LEGROOM_WIDTH_MIN
    const maxWidth = this.columns * DESK_COLUMN_WIDTH_MAX + DESK_LEGROOM_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minWidth, maxWidth)
    if (this.columns !== prevColumns) {
      this.legroomPosition = this.clamp(this.legroomPosition, 0, this.columns)
      this.rebuild()
      this.captureBaseSize()
    }
  }

  setHeight(value: number) {
    this.targetHeight = this.clamp(value, DESK_HEIGHT_MIN, DESK_HEIGHT_MAX)
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, DESK_DEPTH_MIN, DESK_DEPTH_MAX)
  }

  setColor(hex: string) {
    const mainColor = new THREE.Color(hex)
    if (this.material instanceof THREE.MeshStandardMaterial) {
      this.material.color.copy(mainColor)
    } else {
      ;(this.material as any).color = mainColor.clone()
    }

    if (this.backMaterial !== this.material) {
      if (this.backMaterial instanceof THREE.MeshStandardMaterial) {
        this.backMaterial.color.copy(mainColor).multiplyScalar(0.82)
      } else {
        ;(this.backMaterial as any).color = mainColor.clone().multiplyScalar(0.82)
      }
    }

    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'invisible-hitbox') {
        const isBack = obj.name === 'back-panel'
        const color = isBack ? mainColor.clone().multiplyScalar(0.82) : mainColor

        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) {
          for (let i = 0; i < mat.length; i++) {
            const m = mat[i] as THREE.MeshStandardMaterial
            if (m?.color) m.color.copy(color)
          }
        } else {
          const m = mat as THREE.MeshStandardMaterial
          if (m?.color) m.color.copy(color)
        }
      }
    })
  }

  setTopOverhang(overhanCm: number) {
    this.topOverhang = Math.max(0, overhanCm) * CM
    this.rebuild()
    this.captureBaseSize()
  }

  getTopOverhang(): number { return this.topOverhang / CM }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }

  getDepth(): number {
    return this.depth
  }

  getColumns(): number {
    return this.columns
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  private getMaterialArray(mainMaterial: THREE.Material): THREE.Material[] {
    return [
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
    ]
  }

  private rebuild() {
    this.width = this.targetWidth
    this.height = this.targetHeight
    this.depth = this.targetDepth
    this.group.clear()
    this.columnsGroup = []
    this.ensureColumnConfigs()
    const idRef = { id: this.meshIdStart }
    const { width, height, depth, thickness, columns, origin, material } = this

    const legroomWidth = DESK_LEGROOM_WIDTH_MIN
    const availableWidth = width - legroomWidth
    // Columns share walls (no gaps between them)
    // Total: leftmost wall (thickness) + columns * columnWidth + rightmost wall (thickness)
    // So: columnWidth = (availableWidth - 2 * thickness) / columns
    const columnWidth = (availableWidth - 2 * thickness) / columns
    const tabletopY = height - DESK_TABLETOP_THICKNESS
    // Columns extend to full height (tabletop sits on top)
    const columnHeight = height

    this.dimensionOverlayData = {
      totalWidthCm: Math.round(width / CM),
      totalHeightCm: Math.round(height / CM),
      totalDepthCm: Math.round(depth / CM),
      totalWidthLineLocal: {
        start: { x: 0, y: height, z: depth },
        end: { x: width, y: height, z: depth },
      },
      totalHeightLineLocal: {
        start: { x: width, y: 0, z: depth },
        end: { x: width, y: height, z: depth },
      },
      totalDepthLineLocal: {
        start: { x: 0, y: 0, z: depth },
        end: { x: 0, y: 0, z: 0 },
      },
      cells: [],
    }

    // Tabletop (with optional overhang)
    // Geometry columns + legroom span from 0 to (width - 2*thickness), so tabletop matches that
    const overhang = this.topOverhang
    const tabletopRight = width - 2 * thickness
    this.group.add(
      new Blank(
        -overhang,
        tabletopY,
        0,
        tabletopRight + overhang,
        height,
        depth,
        origin,
        this.getMaterialArray(material),
        idRef.id++
      ).build()
    )

    // Columns are connected (share walls), so they're positioned directly adjacent
    // Columns and legroom
    // We have `columns` storage columns + 1 legroom = columns + 1 total positions
    let xPos = 0
    let storageColIndex = 0
    let prevWasLegroom = false
    for (let pos = 0; pos <= columns; pos++) {
      if (pos === this.legroomPosition) {
        // Legroom (empty space)
        // Add vertical blank on left edge if legroom is at leftmost position (pos === 0)
        // Extend to full height (tabletop sits on top)
        if (pos === 0) {
          this.group.add(
            new Blank(
              xPos,
              0,
              0,
              xPos + thickness,
              height,
              depth,
              origin,
              this.getMaterialArray(material),
              idRef.id++
            ).build()
          )
        }
        if (pos === columns) {
          this.group.add(
            new Blank(
              xPos + legroomWidth - thickness,
              0,
              0,
              xPos + legroomWidth,
              height,
              depth,
              origin,
              this.getMaterialArray(material),
              idRef.id++
            ).build()
          )
        }
        xPos += legroomWidth
        prevWasLegroom = true
      } else {
        // Storage column
        const needsLeftWall = storageColIndex === 0 || prevWasLegroom
        const columnGroup = this.buildColumn(
        // Move to next column position - each column has its own walls, so add columnWidth + thickness spacing
        // Move to next column position - each column has its own walls, so add columnWidth + thickness spacing
          xPos,
          columnWidth,
          columnHeight,
          depth,
          thickness,
          origin,
          material,
          this.backMaterial,
          idRef,
          storageColIndex,
          columns,
          needsLeftWall
        )
        this.columnsGroup.push(columnGroup)
        this.group.add(columnGroup)
        xPos += columnWidth // Columns share walls, so no extra spacing
        storageColIndex++
        prevWasLegroom = false
      }
    }

    this.recenterPivot()
  }

  private buildColumn(
    x: number,
    width: number,
    height: number,
    depth: number,
    thickness: number,
    origin: { x: number; y: number; z: number },
    material: THREE.Material,
    backMaterial: THREE.Material,
    idRef: { id: number },
    colIndex: number,
    totalColumns: number,
    needsLeftWall: boolean
  ): THREE.Group {
    const columnGroup = new THREE.Group()
    columnGroup.userData['columnIndex'] = colIndex

    const colCfg = this.columnConfigs[colIndex] ?? defaultDeskColumnConfig()

    // ── Huge Cell: skip all internal shelves ──────────────────────────────────
    if (colCfg.hugeCell) {
      const yLow = 0               // bottom of column (sits on floor via wrapper)
      const yHigh = height - DESK_TABLETOP_THICKNESS  // internal height below tabletop

      // Left wall
      columnGroup.add(
        new Blank(
          x, 0, 0,
          x + thickness, height, depth,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )
      // Right wall
      columnGroup.add(
        new Blank(
          x + width - thickness, 0, 0,
          x + width, height, depth,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )
      // Back
      const bp = new Blank(
        x + thickness, 0, 0,
        x + width - thickness, yHigh, thickness,
        origin, this.getMaterialArray(backMaterial), idRef.id++
      ).build()
      bp.name = 'back-panel'
      columnGroup.add(bp)
      // Bottom shelf
      columnGroup.add(
        new Blank(
          x + thickness, 0, thickness,
          x + width - thickness, thickness, depth - thickness,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )

      // Huge cell door (spans the full internal height)
      if (colCfg.hugeCellDoor) {
        const clear = DOOR_DRAWER_CLEARANCE
        const cellW = width - thickness * 2
        const cellH = yHigh - thickness
        const doorW = Math.max(0, cellW - 2 * clear)
        const doorH = Math.max(0, cellH - 2 * clear)
        if (doorW > 0 && doorH > 0) {
          const doorThickness = thickness * 0.5
          const doorGroup = new THREE.Group()
          doorGroup.position.set(x + thickness + clear, thickness + clear, depth - doorThickness)
          doorGroup.userData['door'] = true
          doorGroup.userData['columnIndex'] = colIndex
          doorGroup.userData['cellIndex'] = 0
          const doorMesh = new Blank(
            0, 0, 0,
            doorW, doorH, doorThickness,
            { x: 0, y: 0, z: 0 },
            material.clone(),
            idRef.id++
          ).build()
          doorMesh.userData['door'] = true
          doorMesh.userData['columnIndex'] = colIndex
          doorMesh.userData['cellIndex'] = 0
          doorGroup.add(doorMesh)
          columnGroup.add(doorGroup)
        }
      }

      // Hitbox for the whole opening
      const hitbox = new Blank(
        x + thickness, 0, 0,
        x + width - thickness, yHigh, depth,
        origin, this.invisibleHitboxMaterial, idRef.id++
      ).build()
      hitbox.userData['columnIndex'] = colIndex
      hitbox.userData['cellIndex'] = 0
      hitbox.name = 'invisible-hitbox'
      columnGroup.add(hitbox)

      if (this.dimensionOverlayData) {
        const cellW = width - thickness * 2
        this.dimensionOverlayData.cells.push({
          row: colIndex,
          col: 0,
          widthCm: Math.round(cellW / CM),
          heightCm: Math.round(yHigh / CM),
          localX: x + width / 2,
          localY: yHigh / 2,
          localZ: depth,
        })
      }

      columnGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) obj.userData['columnIndex'] = colIndex
      })

      return columnGroup
    }

    // ── Standard column: horizontal shelves ───────────────────────────────────
    // Derive cell count from density (0–100 → DESK_ROWS_MIN–DESK_ROWS_MAX)
    const density = colCfg.density ?? 50
    const cells = Math.round(DESK_ROWS_MIN + (density / 100) * (DESK_ROWS_MAX - DESK_ROWS_MIN))
    // Internal structure (shelves, back) stops before tabletop
    const internalHeight = height - DESK_TABLETOP_THICKNESS
    const cellHeight = (internalHeight - thickness * (cells + 1)) / cells

    // Left side
    columnGroup.add(
      new Blank(
        x, 0, 0,
        x + thickness, height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )
    // Right side
    columnGroup.add(
      new Blank(
        x + width - thickness, 0, 0,
        x + width, height, depth,
        origin, this.getMaterialArray(material), idRef.id++
      ).build()
    )
    // Back
    const bp = new Blank(
      x + thickness, 0, 0,
      x + width - thickness, internalHeight, thickness,
      origin, this.getMaterialArray(backMaterial), idRef.id++
    ).build()
    bp.name = 'back-panel'
    columnGroup.add(bp)
    // Horizontal shelves
    for (let i = 0; i <= cells; i++) {
      const y = i * (cellHeight + thickness)
      columnGroup.add(
        new Blank(
          x + thickness, y, thickness,
          x + width - thickness, y + thickness, depth - thickness,
          origin, this.getMaterialArray(material), idRef.id++
        ).build()
      )
    }

    // Doors and drawers for each cell
    const clear = DOOR_DRAWER_CLEARANCE
    const doorFill = colCfg.doors
    const drawerFill = colCfg.drawers
    const bothSet = doorFill !== 'none' && drawerFill !== 'none'

    for (let cell = 0; cell < cells; cell++) {
      const yBottom = (cell + 1) * thickness + cell * cellHeight
      const yTop = yBottom + cellHeight
      const cellW = width - thickness * 2
      const cellD = depth - thickness * 2
      const doorW = Math.max(0, cellW - 2 * clear)
      const doorH = Math.max(0, cellHeight - 2 * clear)
      const drawerW = Math.max(0, cellW - 2 * clear)
      const drawerH = Math.max(0, cellHeight - 2 * clear)
      const drawerD = Math.max(0, cellD - 2 * clear)

      const addDoor =
        doorFill !== 'none' &&
        (bothSet ? cell % 2 === 0 : doorFill === 'all' || (doorFill === 'some' && cell % 2 === 0))
      const addDrawer =
        drawerFill !== 'none' &&
        (bothSet ? cell % 2 !== 0 : drawerFill === 'all' || (drawerFill === 'some' && cell % 2 !== 0))

      const hitbox = new Blank(
        x + thickness,
        yBottom,
        0,
        x + width - thickness,
        yTop,
        depth,
        origin,
        this.invisibleHitboxMaterial,
        idRef.id++
      ).build()
      hitbox.userData['columnIndex'] = colIndex
      hitbox.userData['cellIndex'] = cell
      hitbox.name = 'invisible-hitbox'
      columnGroup.add(hitbox)

      if (addDoor && doorW > 0 && doorH > 0) {
        const doorThickness = thickness * 0.5
        const doorGroup = new THREE.Group()
        doorGroup.position.set(x + thickness + clear, yBottom + clear, depth - doorThickness)
        doorGroup.userData['door'] = true
        doorGroup.userData['columnIndex'] = colIndex
        doorGroup.userData['cellIndex'] = cell
        const doorMesh = new Blank(
          0,
          0,
          0,
          doorW,
          doorH,
          doorThickness,
          { x: 0, y: 0, z: 0 },
          material.clone(),
          idRef.id++
        ).build()
        doorMesh.userData['door'] = true
        doorMesh.userData['columnIndex'] = colIndex
        doorMesh.userData['cellIndex'] = cell
        doorGroup.add(doorMesh)
        columnGroup.add(doorGroup)
      }

      if (addDrawer && drawerW > 0 && drawerH > 0 && drawerD > 0) {
        const drawerGroup = new THREE.Group()
        drawerGroup.position.set(x + thickness + clear, yBottom + clear, thickness)
        drawerGroup.userData['drawer'] = true
        drawerGroup.userData['columnIndex'] = colIndex
        drawerGroup.userData['cellIndex'] = cell
        drawerGroup.userData['baseZ'] = thickness
        const drawer = new Drawer(
          drawerW,
          drawerH,
          drawerD,
          thickness * 0.5,
          origin,
          material.clone(),
          idRef.id
        )
        idRef.id += 5
        const drawerBuilt = drawer.build()
        drawerBuilt.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.userData['drawer'] = true
            obj.userData['columnIndex'] = colIndex
            obj.userData['cellIndex'] = cell
            obj.userData['baseZ'] = thickness
          }
        })
        drawerGroup.add(drawerBuilt)
        columnGroup.add(drawerGroup)
      }

      if (this.dimensionOverlayData) {
        const cellCenterX = x + width / 2
        const cellCenterY = (yBottom + yTop) / 2
        this.dimensionOverlayData.cells.push({
          row: colIndex,
          col: cell,
          widthCm: Math.round(cellW / CM),
          heightCm: Math.round(cellHeight / CM),
          localX: cellCenterX,
          localY: cellCenterY,
          localZ: depth,
        })
      }
    }

    columnGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) obj.userData['columnIndex'] = colIndex
    })

    return columnGroup
  }

  private recenterPivot() {
    this.group.position.set(-this.width / 2, 0, 0)
  }

  private captureBaseSize() {
    this.baseWidth = this.width
    this.baseHeight = this.height
    this.baseDepth = this.depth
  }

  handleHover(raycaster: THREE.Raycaster) {
    const hits = raycaster.intersectObject(this.group, true)
    const hit = hits[0]
    let columnIndex: number | null = null
    let cellIndex: number | null = null
    if (hit?.object) {
      let obj: THREE.Object3D | null = hit.object
      while (obj && obj !== this.group) {
        if (obj.userData['columnIndex'] !== undefined) columnIndex = obj.userData['columnIndex']
        if (obj.userData['cellIndex'] !== undefined) cellIndex = obj.userData['cellIndex']
        obj = obj.parent
      }
    }
    if (columnIndex !== this.hoveredColumn) {
      this.setColumnHighlight(this.hoveredColumn, false)
      this.setColumnHighlight(columnIndex !== null ? columnIndex : null, true)
      this.hoveredColumn = columnIndex !== null ? columnIndex : null
    }
    this.hoveredDoor =
      this.cellHasDoor(columnIndex, cellIndex) && columnIndex !== null && cellIndex !== null
        ? { col: columnIndex, cell: cellIndex }
        : null
    this.hoveredDrawer =
      this.cellHasDrawer(columnIndex, cellIndex) && columnIndex !== null && cellIndex !== null
        ? { col: columnIndex, cell: cellIndex }
        : null
  }

  private cellHasDoor(columnIndex: number | null, cellIndex: number | null): boolean {
    if (columnIndex === null || cellIndex === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[columnIndex]
    if (!cfg || cfg.doors === 'none') return false
    return cfg.doors === 'all' || (cfg.doors === 'some' && cellIndex % 2 === 0)
  }

  private cellHasDrawer(columnIndex: number | null, cellIndex: number | null): boolean {
    if (columnIndex === null || cellIndex === null) return false
    this.ensureColumnConfigs()
    const cfg = this.columnConfigs[columnIndex]
    if (!cfg || cfg.drawers === 'none') return false
    return cfg.drawers === 'all' || (cfg.drawers === 'some' && cellIndex % 2 !== 0)
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
      if (obj.userData['door'] && !(obj as THREE.Mesh).isMesh) {
        const target =
          this.hoveredDoor &&
          this.hoveredDoor.col === obj.userData['columnIndex'] &&
          this.hoveredDoor.cell === obj.userData['cellIndex']
            ? DOOR_OPEN_ANGLE
            : 0
        obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target, t)
      }
      if (obj.userData['drawer'] && !(obj as THREE.Mesh).isMesh) {
        const baseZ = obj.userData['baseZ'] as number
        const targetZ =
          this.hoveredDrawer &&
          this.hoveredDrawer.col === obj.userData['columnIndex'] &&
          this.hoveredDrawer.cell === obj.userData['cellIndex']
            ? baseZ + DRAWER_SLIDE
            : baseZ
        obj.position.z = THREE.MathUtils.lerp(obj.position.z, targetZ, t)
      }
    })
  }

  getDimensionData(): DimensionOverlayData | null {
    return this.dimensionOverlayData
  }

  getConfigJson(): DeskConfigJson {
    this.ensureColumnConfigs()
    return {
      widthCm: this.width / CM,
      heightCm: this.height / CM,
      depthCm: this.depth / CM,
      thicknessCm: this.thickness / CM,
      legroomPosition: this.legroomPosition,
      columnConfigs: this.columnConfigs.map((c) => ({ ...c })),
      columns: this.columns,
    }
  }

  build(): THREE.Group {
    return this.group
  }
}
