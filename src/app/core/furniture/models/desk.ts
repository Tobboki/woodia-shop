import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM } from '@shared/typse/product'
import type {
  DeskConfigJson,
  DimensionOverlayData,
  CellDimensionOverlay,
  RowFill,
  DeskColumnConfig,
} from '@shared/typse/product'
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
  private meshIdStart: number
  private hoveredColumn: number | null = null
  private hoveredDoor: { col: number; cell: number } | null = null
  private hoveredDrawer: { col: number; cell: number } | null = null
  private columnConfigs: DeskColumnConfig[] = []
  private legroomPosition: number = 0 // Index where legroom is placed (0 = leftmost)
  private dimensionOverlayData: DimensionOverlayData | null = null

  constructor(
    width: number = 180 * CM,
    height: number = 75 * CM,
    depth: number = 60 * CM,
    thickness: number = 2 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xd2b48c }),
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
    this.meshIdStart = meshIdStart
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

    // Tabletop
    this.group.add(
      new Blank(
        0,
        tabletopY,
        0,
        width,
        height,
        depth,
        origin,
        material.clone(),
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
              material.clone(),
              idRef.id++
            ).build()
          )
        }
        // Add vertical blank on right edge if legroom is at rightmost position (pos === columns)
        // Extend to full height (tabletop sits on top)
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
              material.clone(),
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
    idRef: { id: number },
    colIndex: number,
    totalColumns: number,
    needsLeftWall: boolean
  ): THREE.Group {
    const columnGroup = new THREE.Group()
    columnGroup.userData['columnIndex'] = colIndex

    const colCfg = this.columnConfigs[colIndex] ?? defaultDeskColumnConfig()
    const cells = 3 // Each column has 3 cells (shelves)
    // Internal structure (shelves, back) stops before tabletop
    const internalHeight = height - DESK_TABLETOP_THICKNESS
    const cellHeight = (internalHeight - thickness * (cells + 1)) / cells

    // Left side - every column has its own left side blank
    columnGroup.add(
      new Blank(
        x,
        0,
        0,
        x + thickness,
        height,
        depth,
        origin,
        material.clone(),
        idRef.id++
      ).build()
    )

    // Right side - every column has its own right side blank
    // This serves as the divider/wall between columns (or between column and legroom)
    columnGroup.add(
      new Blank(
        x + width - thickness,
        0,
        0,
        x + width,
        height,
        depth,
        origin,
        material.clone(),
        idRef.id++
      ).build()
    )

    // Back - stops before tabletop
    columnGroup.add(
      new Blank(
        x + thickness,
        0,
        0,
        x + width - thickness,
        internalHeight,
        thickness,
        origin,
        material.clone(),
        idRef.id++
      ).build()
    )

    // Horizontal shelves (dividers between cells) - stop before tabletop
    for (let i = 0; i <= cells; i++) {
      const y = i * (cellHeight + thickness)
      columnGroup.add(
        new Blank(
          x + thickness,
          y,
          thickness,
          x + width - thickness,
          y + thickness,
          depth - thickness,
          origin,
          material.clone(),
          idRef.id++
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

  private setColumnHighlight(col: number | null, active: boolean) {
    if (col === null) return
    this.columnsGroup[col]?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.emissive.set(active ? 0xaa0000 : 0x000000)
        mat.emissiveIntensity = active ? 0.6 : 0
        mat.polygonOffset = active
        mat.polygonOffsetFactor = active ? -1 : 0
        mat.polygonOffsetUnits = active ? -4 : 0
      }
    })
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
