import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { Drawer } from '../primitives/drawer'
import { CM, ROW_HEIGHT_MAP } from '../../types/product'
import type {
  BookcaseConfigJson,
  DimensionOverlayData,
  CellDimensionOverlay,
  RowHeight,
  ShelfRowConfig,
  StorageSectionConfig,
} from '../../types/product'
import {
  CELL_WIDTH_MIN,
  CELL_WIDTH_MAX,
  CELL_HEIGHT_MIN,
  CELL_HEIGHT_MAX,
  DEPTH_MIN,
  DEPTH_MAX,
  SMOOTHING,
  EPS,
  DOOR_OPEN_ANGLE,
  DRAWER_SLIDE,
  HOVER_ANIM_SPEED,
  ROW_HEIGHT_MULT,
  defaultRowConfig,
  DOOR_DRAWER_CLEARANCE,
} from './bookcase.constants'
import type { RowStyle } from './bookcase.constants'

export type { RowStyle } from './bookcase.constants'

export class Bookcase {
  private group = new THREE.Group()
  private rowsGroup: THREE.Group[] = []
  private rows: number
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
  private withBack: boolean
  private hoveredRow: number | null = null
  private hoveredDoor: { row: number; col: number } | null = null
  private hoveredDrawer: { row: number; col: number } | null = null
  private rowStyle: RowStyle = 'grid'
  private edgeColor: string = '#ffffff'
  private edgeMaterial: THREE.MeshStandardMaterial
  private invisibleHitboxMaterial: THREE.MeshBasicMaterial
  private density: number = 50
  private rowConfigs: ShelfRowConfig[] = []
  private topStorageConfig: StorageSectionConfig | null = null
  private bottomStorageConfig: StorageSectionConfig | null = null
  private dimensionOverlayData: DimensionOverlayData | null = null

  constructor(
    width: number = 120 * CM,
    height: number = 180 * CM,
    depth: number = 35 * CM,
    thickness: number = 2 * CM,
    origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    material: THREE.Material = new THREE.MeshStandardMaterial({ color: 0xd2b48c }),
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
    this.edgeMaterial = new THREE.MeshStandardMaterial({ color: this.edgeColor })
    this.invisibleHitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    this.meshIdStart = meshIdStart
    this.withBack = withBack
    const desiredWidth = Math.max(width, CELL_WIDTH_MIN)
    const desiredHeight = Math.max(height, CELL_HEIGHT_MIN)
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    this.rows = this.computeRowsFromHeight(desiredHeight)
    const minW = this.columns * CELL_WIDTH_MIN
    const maxW = this.columns * CELL_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minW, maxW)
    const minH = this.rows * CELL_HEIGHT_MIN
    const maxH = this.rows * CELL_HEIGHT_MAX
    this.targetHeight = this.clamp(desiredHeight, minH, maxH)
    this.targetDepth = this.clamp(depth, DEPTH_MIN, DEPTH_MAX)
    this.rebuild()
    this.captureBaseSize()
  }

  private computeColumnsFromWidth(desiredWidth: number): number {
    const densityFactor = this.density / 100
    const targetCellWidth =
      CELL_WIDTH_MAX - densityFactor * (CELL_WIDTH_MAX - CELL_WIDTH_MIN)
    let columns = Math.round(
      (desiredWidth + this.thickness) / (targetCellWidth + this.thickness)
    )
    columns = Math.max(1, columns)
    const minColumns = Math.ceil(desiredWidth / CELL_WIDTH_MAX)
    const maxColumns = Math.floor(desiredWidth / CELL_WIDTH_MIN)
    return this.clamp(columns, minColumns, maxColumns)
  }

  private computeRowsFromHeight(desiredHeight: number): number {
    let rows = 1
    while (desiredHeight / rows > CELL_HEIGHT_MAX) rows++
    while (rows > 1 && desiredHeight / rows < CELL_HEIGHT_MIN) rows--
    return rows
  }

  setRowStyle(style: RowStyle) {
    this.rowStyle = style
    this.rebuild()
    this.captureBaseSize()
  }

  private ensureRowConfigs() {
    while (this.rowConfigs.length < this.rows) {
      this.rowConfigs.push(defaultRowConfig())
    }
    this.rowConfigs = this.rowConfigs.slice(0, this.rows)
  }

  getRowConfig(rowIndex: number): ShelfRowConfig {
    this.ensureRowConfigs()
    return this.rowConfigs[rowIndex] ?? defaultRowConfig()
  }

  setRowConfig(rowIndex: number, config: Partial<ShelfRowConfig>) {
    this.ensureRowConfigs()
    if (rowIndex < 0 || rowIndex >= this.rows) return
    const cur = this.rowConfigs[rowIndex]
    const next = { ...cur, ...config }
    if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
    if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
    this.rowConfigs[rowIndex] = next
    this.rebuild()
    this.captureBaseSize()
  }

  getRowConfigs(): ShelfRowConfig[] {
    this.ensureRowConfigs()
    return [...this.rowConfigs]
  }

  setRowConfigs(configs: ShelfRowConfig[]) {
    this.ensureRowConfigs()
    for (let r = 0; r < this.rows && r < configs.length; r++) {
      const next = { ...configs[r] }
      if (next.doors === 'all' && next.drawers === 'all') next.drawers = 'none'
      if (next.drawers === 'all' && next.doors === 'all') next.doors = 'none'
      this.rowConfigs[r] = next
    }
    this.rebuild()
    this.captureBaseSize()
  }

  getTopStorage(): StorageSectionConfig | null {
    return this.topStorageConfig
  }

  setTopStorage(config: StorageSectionConfig | null): void {
    if (this.topStorageConfig === config) return
    this.topStorageConfig = config
    this.rebuild()
    this.captureBaseSize()
  }

  getBottomStorage(): StorageSectionConfig | null {
    return this.bottomStorageConfig
  }

  setBottomStorage(config: StorageSectionConfig | null): void {
    if (this.bottomStorageConfig === config) return
    this.bottomStorageConfig = config
    this.rebuild()
    this.captureBaseSize()
  }

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  private buildAdditionalStorageSection(
    yBase: number,
    sectionHeight: number,
    width: number,
    depth: number,
    thickness: number,
    origin: { x: number; y: number; z: number },
    material: THREE.Material,
    withBack: boolean,
    columns: number,
    sectionKind: 'top' | 'bottom',
    idRef: { id: number }
  ): THREE.Group {
    const group = new THREE.Group()
    group.userData['rowIndex'] = sectionKind === 'top' ? -2 : -1
    group.userData['storageSection'] = sectionKind
    // Match main row: opening is from thickness*2 to width-thickness*2
    const innerWidth = width - thickness * 4
    const baseCellWidth = (innerWidth - thickness * (columns - 1)) / columns
    const compHeight = (sectionHeight - 3 * thickness) / 2
    const shelfY = yBase + thickness + compHeight
    const yLow1 = yBase + thickness
    const yHigh1 = shelfY
    const yLow2 = shelfY + thickness
    const yHigh2 = yBase + sectionHeight - thickness
    group.add(
      new Blank(thickness, yBase, 0, width - thickness, yBase + thickness, depth, origin, this.getMaterialArray(material), idRef.id++).build()
    )
    group.add(
      new Blank(
        thickness,
        yBase + sectionHeight - thickness,
        0,
        width - thickness,
        yBase + sectionHeight,
        depth,
        origin,
        this.getMaterialArray(material),
        idRef.id++
      ).build()
    )
    group.add(
      new Blank(thickness, yBase, 0, thickness * 2, yBase + sectionHeight, depth, origin, this.getMaterialArray(material), idRef.id++).build()
    )
    group.add(
      new Blank(
        width - thickness * 2,
        yBase,
        0,
        width - thickness,
        yBase + sectionHeight,
        depth,
        origin,
        this.getMaterialArray(material),
        idRef.id++
      ).build()
    )
    group.add(
      new Blank(
        thickness,
        shelfY,
        0,
        width - thickness,
        shelfY + thickness,
        depth,
        origin,
        this.getMaterialArray(material),
        idRef.id++
      ).build()
    )
    for (let c = 1; c < columns; c++) {
      const x = thickness * 2 + c * (baseCellWidth + thickness)
      group.add(
        new Blank(x - thickness, yLow1, EPS, x, yHigh1, depth, origin, this.getMaterialArray(material), idRef.id++).build()
      )
    }
    for (let c = 1; c < columns; c++) {
      const x = thickness * 2 + c * (baseCellWidth + thickness)
      group.add(
        new Blank(x - thickness, yLow2, EPS, x, yHigh2, depth, origin, this.getMaterialArray(material), idRef.id++).build()
      )
    }
    if (withBack) {
      for (let c = 0; c < columns; c++) {
        const cellXLeft = thickness * 2 + c * (baseCellWidth + thickness)
        const cellXRight = cellXLeft + baseCellWidth
        group.add(
          new Blank(
            cellXLeft,
            yBase + thickness,
            EPS,
            cellXRight,
            yBase + sectionHeight - thickness,
            thickness,
            origin,
            this.getMaterialArray(material),
            idRef.id++
          ).build()
        )
      }
    }
    // One door per column spanning full section height (covers both compartments)
    const doorThickness = thickness * 0.5
    const sectionOpeningHeight = sectionHeight - thickness * 2
    const clear = DOOR_DRAWER_CLEARANCE
    const doorW = Math.max(0, baseCellWidth - 2 * clear)
    const doorH = Math.max(0, sectionOpeningHeight - 2 * clear)
    const doorY = yBase + thickness
    for (let c = 0; c < columns; c++) {
      const xLeft = thickness * 2 + c * (baseCellWidth + thickness)

      // Hitbox for additional storage doors
      const hitbox = new Blank(
        xLeft,
        doorY,
        0,
        xLeft + baseCellWidth,
        doorY + sectionOpeningHeight,
        depth,
        origin,
        this.invisibleHitboxMaterial,
        idRef.id++
      ).build()
      hitbox.userData['rowIndex'] = sectionKind === 'top' ? -2 : -1
      hitbox.userData['cellIndex'] = c
      hitbox.name = 'invisible-hitbox'
      group.add(hitbox)

      if (doorW <= 0 || doorH <= 0) continue
      const doorGroup = new THREE.Group()
      doorGroup.position.set(xLeft + clear, doorY + clear, depth - doorThickness)
      doorGroup.userData['door'] = true
      doorGroup.userData['storageDoor'] = true
      doorGroup.userData['rowIndex'] = sectionKind === 'top' ? -2 : -1
      doorGroup.userData['cellIndex'] = c
      const doorMesh = new Blank(
        0,
        0,
        0,
        doorW,
        doorH,
        doorThickness,
        { x: 0, y: 0, z: 0 },
        this.getMaterialArray(material),
        idRef.id++
      ).build()
      doorGroup.add(doorMesh)
      group.add(doorGroup)
      
      if (this.dimensionOverlayData) {
        const cellXCenter = xLeft + baseCellWidth / 2
        const cellYCenter = yBase + sectionHeight / 2
        this.dimensionOverlayData.cells.push({
          row: sectionKind === 'top' ? -2 : -1,
          col: c,
          widthCm: Math.round(baseCellWidth / CM),
          heightCm: Math.round(sectionOpeningHeight / CM),
          baseWidthCm: baseCellWidth / CM,
          baseHeightCm: sectionOpeningHeight / CM,
          localX: cellXCenter,
          localY: cellYCenter,
          localZ: depth,
        })
      }
    }
    return group
  }

  private static readonly ADDITIONAL_STORAGE_PARTS = 2

  private rebuild() {
    this.width = this.targetWidth
    this.height = this.targetHeight
    this.depth = this.targetDepth
    this.group.clear()
    this.rowsGroup = []
    this.ensureRowConfigs()
    const idRef = { id: this.meshIdStart }
    const { width, height, depth, thickness, rows, columns, origin, material, withBack } = this
    const innerHeight = height - thickness * 2
    // Horizontal opening between inner edges of side walls (left wall ends at 2*thickness, right starts at width-2*thickness)
    const openingWidth = width - thickness * 4
    const bottomSectionHeight =
      this.bottomStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.bottomStorageConfig.height] + 3 * thickness
        : 0
    const topSectionHeight =
      this.topStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.topStorageConfig.height] + 3 * thickness
        : 0
    const yOffset = bottomSectionHeight
    const totalHeight = this.getTotalHeight()
    this.dimensionOverlayData = {
      totalWidthCm: Math.round(width / CM),
      totalHeightCm: Math.round(totalHeight / CM),
      totalDepthCm: Math.round(depth / CM),
      totalWidthLineLocal: {
        start: { x: 0, y: totalHeight, z: depth },
        end: { x: width, y: totalHeight, z: depth },
      },
      totalHeightLineLocal: {
        start: { x: width, y: 0, z: depth },
        end: { x: width, y: totalHeight, z: depth },
      },
      totalDepthLineLocal: {
        start: { x: 0, y: 0, z: depth },
        end: { x: 0, y: 0, z: 0 },
      },
      cells: [],
    }
    if (this.bottomStorageConfig !== null) {
      this.group.add(
        this.buildAdditionalStorageSection(
          0,
          bottomSectionHeight,
          width,
          depth,
          thickness,
          origin,
          material,
          withBack,
          columns,
          'bottom',
          idRef
        )
      )
    }
    const baseCellWidth = (openingWidth - thickness * (columns - 1)) / columns
    const multSum = this.rowConfigs.reduce((s, cfg) => s + ROW_HEIGHT_MULT[cfg.height], 0)
    const rowHeights: number[] = []
    for (let r = 0; r < rows; r++) {
      const mult = ROW_HEIGHT_MULT[this.rowConfigs[r].height]
      rowHeights.push(((innerHeight - thickness * (rows - 1)) * mult) / multSum)
    }

    // Material setup:
    // BoxGeometry faces: right, left, top, bottom, front, back
    // By default all faces use the main material. If edge color is used, front face is edgeMaterial.

    for (let r = 0; r < rows; r++) {
      const rowGroup = new THREE.Group()
      rowGroup.userData['rowIndex'] = r
      const baseCellHeight = rowHeights[r]
      let cellWidth = baseCellWidth
      let openingWidth_scaled = openingWidth
      let dividerPositions: number[] = []
      // Slant: remove leftmost or rightmost side blank per row for a stepped silhouette.
      let slantNoLeftBlank = false
      let slantNoRightBlank = false
      if (this.rowStyle === 'slant') {
        slantNoRightBlank = r % 2 === 0 // even rows: no right panel
        slantNoLeftBlank = r % 2 === 1  // odd rows: no left panel
      }

      if (this.rowStyle === 'stagger') {
        rowGroup.position.x += (r - rows / 2) * baseCellWidth * 0.15
      }

      if (this.rowStyle === 'gradient') {
        const availableWidth = openingWidth - (columns - 1) * thickness
        dividerPositions = []
        let x = thickness * 2
        const cellWidths: number[] = []
        let totalWidth = 0
        for (let c = 0; c < columns; c++) {
          const t = c / Math.max(1, columns - 1)
          const gradientFactor = 1 - 4 * Math.pow(t - 0.5, 2)
          const cellWidthMultiplier = 0.6 + gradientFactor * 0.8
          cellWidths.push(baseCellWidth * cellWidthMultiplier)
          totalWidth += cellWidths[c]
        }
        const scaleFactor = availableWidth / totalWidth
        for (let c = 0; c < columns; c++) cellWidths[c] *= scaleFactor
        for (let c = 0; c < columns - 1; c++) {
          x += cellWidths[c] + thickness
          dividerPositions.push(x)
        }
      }

      if (this.rowStyle === 'stagger') {
        const availableWidth = openingWidth - (columns - 1) * thickness
        dividerPositions = []
        let x = thickness * 2
        const cellWidths: number[] = []
        let totalWidth = 0
        for (let c = 0; c < columns; c++) {
          const wave =
            Math.sin((r + 1) * 1.7 + c * 1.31) + 0.5 * Math.sin((r + 2) * 0.9 + c * 0.77)
          const mult = 1 + 0.4 * (wave / 1.5)
          const w = Math.max(0.2, mult) * baseCellWidth
          cellWidths.push(w)
          totalWidth += w
        }
        const scaleFactor = availableWidth / totalWidth
        for (let c = 0; c < columns; c++) cellWidths[c] *= scaleFactor
        for (let c = 0; c < columns - 1; c++) {
          x += cellWidths[c] + thickness
          dividerPositions.push(x)
        }
      }

      if (dividerPositions.length > 0) {
        const minX = thickness * 3
        const maxX = width - thickness * 2 - baseCellWidth
        dividerPositions = dividerPositions
          .map((x) => this.clamp(x, minX, maxX))
          .sort((a, b) => a - b)
          .filter((x, idx, arr) => idx === 0 || Math.abs(x - arr[idx - 1]) > thickness * 0.5)
      }

      let yBottom = yOffset
      for (let i = 0; i < r; i++) yBottom += rowHeights[i] + thickness
      const yTop = yBottom + baseCellHeight + thickness

      rowGroup.add(
        new Blank(
          thickness,
          yBottom,
          0,
          width - thickness,
          yBottom + thickness,
          depth,
          origin,
          this.getMaterialArray(material),
          idRef.id++
        ).build()
      )
      rowGroup.add(
        new Blank(
          thickness,
          yTop - thickness,
          0,
          width - thickness,
          yTop,
          depth,
          origin,
          this.getMaterialArray(material),
          idRef.id++
        ).build()
      )
      if (!slantNoLeftBlank) {
        rowGroup.add(
          new Blank(thickness, yBottom, 0, thickness * 2, yTop, depth, origin, this.getMaterialArray(material), idRef.id++).build()
        )
      }
      if (!slantNoRightBlank) {
        rowGroup.add(
          new Blank(
            width - thickness * 2,
            yBottom,
            0,
            width - thickness,
            yTop,
            depth,
            origin,
            this.getMaterialArray(material),
            idRef.id++
          ).build()
        )
      }

      if (dividerPositions.length > 0) {
        for (const x of dividerPositions) {
          rowGroup.add(
            new Blank(
              x - thickness,
              yBottom + thickness,
              EPS,
              x,
              yTop - thickness,
              depth,
              origin,
              this.getMaterialArray(material),
              idRef.id++
            ).build()
          )
        }
      } else {
        for (let c = 1; c < columns; c++) {
          const x = thickness * 2 + c * (cellWidth + thickness)
          rowGroup.add(
            new Blank(
              x - thickness,
              yBottom + thickness,
              EPS,
              x,
              yTop - thickness,
              depth,
              origin,
              this.getMaterialArray(material),
              idRef.id++
            ).build()
          )
        }
      }

      const yLow = yBottom + thickness
      const yHigh = yTop - thickness
      const cellHeight = yHigh - yLow
      // Cell X bounds: openings must not overlap dividers (each divider is [x-thickness, x])
      const getCellX = (c: number): [number, number] => {
        if (dividerPositions.length > 0) {
          const left = c === 0 ? thickness * 2 : dividerPositions[c - 1]
          const right = c === columns - 1 ? width - thickness * 2 : dividerPositions[c] - thickness
          return [left, right]
        }
        const left = thickness * 2 + c * (cellWidth + thickness)
        return [left, left + cellWidth]
      }
      const rowCfg = this.rowConfigs[r]
      const doorFill = rowCfg.doors
      const drawerFill = rowCfg.drawers
      const clear = DOOR_DRAWER_CLEARANCE

      for (let c = 0; c < columns; c++) {
        const [xLeft, xRight] = getCellX(c)
        const cellW = Math.max(0, xRight - xLeft)
        const cellD = depth - thickness * 2
        const doorW = Math.max(0, cellW - 2 * clear)
        const doorH = Math.max(0, cellHeight - 2 * clear)
        const drawerW = Math.max(0, cellW - 2 * clear)
        const drawerH = Math.max(0, cellHeight - 2 * clear)
        const drawerD = Math.max(0, cellD - 2 * clear)
        
        // Slant: cells with no side panel (open edge) never get doors or drawers.
        const slantCellOpenEdge =
          this.rowStyle === 'slant' &&
          ((slantNoRightBlank && c === columns - 1) || (slantNoLeftBlank && c === 0))

        if (withBack && !slantCellOpenEdge) {
          rowGroup.add(
            new Blank(
              xLeft,
              yLow,
              EPS,
              xRight,
              yHigh,
              thickness,
              origin,
              this.getMaterialArray(material),
              idRef.id++
            ).build()
          )
        }

        // Invisible hit-box covering the entire cell volume for raycasting
        const hitbox = new Blank(
          xLeft,
          yLow,
          0,
          xRight,
          yHigh,
          depth,
          origin,
          this.invisibleHitboxMaterial,
          idRef.id++
        ).build()
        hitbox.userData['rowIndex'] = r
        hitbox.userData['cellIndex'] = c
        // Name it to avoid any general material overrides later if needed
        hitbox.name = 'invisible-hitbox'
        rowGroup.add(hitbox)
        
        // Each cell gets at most one: door or drawer. When both are set, partition by column (even = doors, odd = drawers).
        const bothSet = doorFill !== 'none' && drawerFill !== 'none'
        const addDoor =
          !slantCellOpenEdge &&
          doorFill !== 'none' &&
          (bothSet ? c % 2 === 0 : doorFill === 'all' || (doorFill === 'some' && c % 2 === 0))
        const addDrawer =
          !slantCellOpenEdge &&
          drawerFill !== 'none' &&
          (bothSet ? c % 2 !== 0 : drawerFill === 'all' || (drawerFill === 'some' && c % 2 !== 0))
        if (addDoor && doorW > 0 && doorH > 0) {
            const doorThickness = thickness * 0.5
            const doorGroup = new THREE.Group()
            doorGroup.position.set(xLeft + clear, yLow + clear, depth - doorThickness)
            doorGroup.userData['door'] = true
            doorGroup.userData['rowIndex'] = r
            doorGroup.userData['cellIndex'] = c
            const doorMesh = new Blank(
              0,
              0,
              0,
              doorW,
              doorH,
              doorThickness,
              { x: 0, y: 0, z: 0 },
              this.getMaterialArray(material),
              idRef.id++
            ).build()
            doorGroup.add(doorMesh)
            rowGroup.add(doorGroup)
          }
        if (addDrawer && drawerW > 0 && drawerH > 0 && drawerD > 0) {
            const drawerGroup = new THREE.Group()
            drawerGroup.position.set(xLeft + clear, yLow + clear, thickness)
            drawerGroup.userData['drawer'] = true
            drawerGroup.userData['rowIndex'] = r
            drawerGroup.userData['cellIndex'] = c
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
            drawerGroup.add(drawer.build())
            rowGroup.add(drawerGroup)
          }
        if (this.dimensionOverlayData) {
          const cellCenterX = (xLeft + xRight) / 2 + rowGroup.position.x
          const cellCenterY = (yLow + yHigh) / 2
          this.dimensionOverlayData.cells.push({
            row: r,
            col: c,
            widthCm: Math.round(cellW / CM),
            heightCm: Math.round(cellHeight / CM),
            baseWidthCm: cellW / CM,
            baseHeightCm: cellHeight / CM,
            localX: cellCenterX,
            localY: cellCenterY,
            localZ: depth,
          })
        }
      }

      rowGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) obj.userData['rowIndex'] = r
      })
      this.rowsGroup.push(rowGroup)
      this.group.add(rowGroup)
    }

    if (this.topStorageConfig !== null) {
      const topYBase = yOffset + height - thickness
      this.group.add(
        this.buildAdditionalStorageSection(
          topYBase,
          topSectionHeight,
          width,
          depth,
          thickness,
          origin,
          material,
          withBack,
          columns,
          'top',
          idRef
        )
      )
    }

    this.recenterPivot()
  }

  /** Position the group so width expands from center and depth expands from the back (z=0 at wall). Height stays bottom-anchored. Uses this.width so pivot does not jump when column count changes. */
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
    let rowIndex: number | null = null
    let cellIndex: number | null = null
    if (hit?.object) {
      let obj: THREE.Object3D | null = hit.object
      while (obj && obj !== this.group) {
        if (obj.userData['rowIndex'] !== undefined) rowIndex = obj.userData['rowIndex']
        if (obj.userData['cellIndex'] !== undefined) cellIndex = obj.userData['cellIndex']
        obj = obj.parent
      }
      if (rowIndex !== null && cellIndex === null && hit.point) {
        const localPoint = hit.point.clone()
        this.group.worldToLocal(localPoint)
        const w = this.baseWidth ?? this.width
        const innerWidth = w - this.thickness * 4
        const baseCellWidth = (innerWidth - this.thickness * (this.columns - 1)) / this.columns
        const x = localPoint.x
        const left = this.thickness * 2
        if (x >= left && baseCellWidth > 0) {
          const idx = Math.floor((x - left) / (baseCellWidth + this.thickness))
          cellIndex = this.clamp(idx, 0, this.columns - 1)
        }
      }
    }
    if (rowIndex !== this.hoveredRow) {
      this.setRowHighlight(this.hoveredRow, false)
      this.setRowHighlight(rowIndex !== null && rowIndex >= 0 ? rowIndex : null, true)
      this.hoveredRow = rowIndex !== null && rowIndex >= 0 ? rowIndex : null
    }
    this.hoveredDoor = this.cellHasDoor(rowIndex, cellIndex) ? { row: rowIndex!, col: cellIndex! } : null
    this.hoveredDrawer = this.cellHasDrawer(rowIndex, cellIndex) ? { row: rowIndex!, col: cellIndex! } : null
  }

  private cellHasDoor(rowIndex: number | null, cellIndex: number | null): boolean {
    if (rowIndex === null || cellIndex === null) return false
    if (rowIndex === -1 || rowIndex === -2) return true
    this.ensureRowConfigs()
    const cfg = this.rowConfigs[rowIndex]
    if (!cfg || cfg.doors === 'none') return false
    return cfg.doors === 'all' || (cfg.doors === 'some' && cellIndex % 2 === 0)
  }

  private cellHasDrawer(rowIndex: number | null, cellIndex: number | null): boolean {
    if (rowIndex === null || cellIndex === null || rowIndex < 0) return false
    this.ensureRowConfigs()
    const cfg = this.rowConfigs[rowIndex]
    if (!cfg || cfg.drawers === 'none') return false
    return cfg.drawers === 'all' || (cfg.drawers === 'some' && cellIndex % 2 !== 0)
  }

  private setRowHighlight(row: number | null, active: boolean) {
    if (row === null) return
    this.rowsGroup[row]?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'invisible-hitbox') {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) {
          for (let i = 0; i <= 3; i++) {
            const m = mat[i] as THREE.MeshStandardMaterial
            if (m && m.emissive) {
              m.emissive.set(active ? 0xaa0000 : 0x000000)
              m.emissiveIntensity = active ? 0.6 : 0
              m.polygonOffset = active
              m.polygonOffsetFactor = active ? -1 : 0
              m.polygonOffsetUnits = active ? -4 : 0
            }
          }
        } else {
          const m = mat as THREE.MeshStandardMaterial
          if (m && m.emissive) {
            m.emissive.set(active ? 0xaa0000 : 0x000000)
            m.emissiveIntensity = active ? 0.6 : 0
            m.polygonOffset = active
            m.polygonOffsetFactor = active ? -1 : 0
            m.polygonOffsetUnits = active ? -4 : 0
          }
        }
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
      if (obj.userData['door']) {
        const target =
          this.hoveredDoor &&
          this.hoveredDoor.row === obj.userData['rowIndex'] &&
          this.hoveredDoor.col === obj.userData['cellIndex']
            ? DOOR_OPEN_ANGLE
            : 0
        obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target, t)
      }
      if (obj.userData['drawer']) {
        const baseZ = obj.userData['baseZ'] as number
        const targetZ =
          this.hoveredDrawer &&
          this.hoveredDrawer.row === obj.userData['rowIndex'] &&
          this.hoveredDrawer.col === obj.userData['cellIndex']
            ? baseZ + DRAWER_SLIDE
            : baseZ
        obj.position.z = THREE.MathUtils.lerp(obj.position.z, targetZ, t)
      }
    })
  }

  setWidth(value: number) {
    const desiredWidth = Math.max(value, CELL_WIDTH_MIN)
    const prevColumns = this.columns
    this.columns = this.computeColumnsFromWidth(desiredWidth)
    const minWidth = this.columns * CELL_WIDTH_MIN
    const maxWidth = this.columns * CELL_WIDTH_MAX
    this.targetWidth = this.clamp(desiredWidth, minWidth, maxWidth)
    if (this.columns !== prevColumns) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalWidthCm = Math.round(this.targetWidth / CM)
    }
  }

  setDensity(value: number) {
    this.density = this.clamp(value, 0, 100)
    this.setWidth(this.targetWidth)
  }

  setHeight(value: number) {
    const desiredHeight = Math.max(value, CELL_HEIGHT_MIN)
    const prevRows = this.rows
    this.rows = this.computeRowsFromHeight(desiredHeight)
    const minHeight = this.rows * CELL_HEIGHT_MIN
    const maxHeight = this.rows * CELL_HEIGHT_MAX
    this.targetHeight = this.clamp(desiredHeight, minHeight, maxHeight)
    if (this.rows !== prevRows) {
      this.rebuild()
      this.captureBaseSize()
    } else if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalHeightCm = Math.round(this.getTotalHeight() / CM)
    }
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, DEPTH_MIN, DEPTH_MAX)
    if (this.dimensionOverlayData) {
      this.dimensionOverlayData.totalDepthCm = Math.round(this.targetDepth / CM)
    }
  }

  setColor(hex: string) {
    if (this.material instanceof THREE.MeshStandardMaterial) {
      this.material.color.set(hex)
    } else {
      (this.material as any).color = new THREE.Color(hex)
    }
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.name !== 'invisible-hitbox') {
        // If an object has a multi-material array, index 0 is body, index 4 is edge
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

  private getMaterialArray(mainMaterial: THREE.Material): THREE.Material[] {
    // Array: [right, left, top, bottom, front, back]
    // We want the front and back 'edges' to be edgeColor, rest body color
    return [
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      mainMaterial.clone(),
      this.edgeMaterial.clone(),
      this.edgeMaterial.clone(),
    ]
  }

  addRow() {
    this.rows++
    this.rebuild()
    this.captureBaseSize()
  }

  removeRow() {
    if (this.rows <= 1) return
    this.rows--
    this.rebuild()
    this.captureBaseSize()
  }

  getRows(): number {
    return this.rows
  }

  getColumns(): number {
    return this.columns
  }

  getDepth(): number {
    return this.depth
  }

  /** Height of the main cell section only (no top/bottom additional storage). */
  getCellsHeight(): number {
    return this.targetHeight
  }

  /** Dimension overlay data (overall + per-cell) in shelf group local space. Updated on rebuild. */
  getDimensionData(): DimensionOverlayData | null {
    if (this.dimensionOverlayData) {
      const scaleX = this.baseWidth > 0 ? this.width / this.baseWidth : 1;
      const scaleY = this.baseHeight > 0 ? this.height / this.baseHeight : 1;
      
      this.dimensionOverlayData.totalWidthCm = Math.round(this.width / CM);
      
      const bottom = this.bottomStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.bottomStorageConfig.height] + 3 * this.thickness
        : 0;
      const top = this.topStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.topStorageConfig.height] + 3 * this.thickness
        : 0;
      const animatedTotalHeight = this.height + bottom + top - this.thickness;
      this.dimensionOverlayData.totalHeightCm = Math.round(animatedTotalHeight / CM);
      
      this.dimensionOverlayData.cells.forEach(cell => {
         if (cell.baseWidthCm !== undefined) cell.widthCm = Math.round(cell.baseWidthCm * scaleX);
         if (cell.baseHeightCm !== undefined) cell.heightCm = Math.round(cell.baseHeightCm * scaleY);
      });
    }
    return this.dimensionOverlayData
  }

  /** Total visual height including top and bottom additional storage sections. */
  getTotalHeight(): number {
    const bottom =
      this.bottomStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.bottomStorageConfig.height] +
          3 * this.thickness
        : 0
    const top =
      this.topStorageConfig !== null
        ? Bookcase.ADDITIONAL_STORAGE_PARTS * ROW_HEIGHT_MAP[this.topStorageConfig.height] +
          3 * this.thickness
        : 0
    return this.targetHeight + bottom + top - this.thickness
  }

  /** Returns current config as a JSON-serializable object (lengths in cm). */
  getConfigJson(): BookcaseConfigJson {
    this.ensureRowConfigs()
    return {
      widthCm: this.width / CM,
      heightCm: this.height / CM,
      depthCm: this.depth / CM,
      thicknessCm: this.thickness / CM,
      withBack: this.withBack,
      style: this.rowStyle,
      density: this.density,
      topStorage: this.topStorageConfig,
      bottomStorage: this.bottomStorageConfig,
      rowConfigs: this.rowConfigs.map((c) => ({ ...c })),
      rows: this.rows,
      columns: this.columns,
    }
  }

  build(): THREE.Group {
    return this.group
  }
}
