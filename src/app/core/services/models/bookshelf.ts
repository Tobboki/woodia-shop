import * as THREE from 'three'
import { Blank } from '../components/blank'
import { CM } from '../types'

/* ================= Constraints ================= */

const CELL_WIDTH_MIN  = 25 * CM
const CELL_WIDTH_MAX  = 60 * CM

const CELL_HEIGHT_MIN = 25 * CM
const CELL_HEIGHT_MAX = 45 * CM

const DEPTH_MIN = 20 * CM
const DEPTH_MAX = 45 * CM

const SMOOTHING = 0.08 // animation smoothness

export class BookShelf {
  /* ================= State ================= */

  private parts: Blank[] = []
  private group = new THREE.Group()

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

  /* ================= Constructor ================= */

  constructor(
    rows: number,
    columns: number,
    width: number,
    height: number,
    depth: number,
    thickness: number,
    origin: { x: number; y: number; z: number },
    material: THREE.Material,
    meshIdStart: number,
    withBack: boolean = true
  ) {
    this.rows = rows
    this.columns = columns

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
    this.withBack = withBack

    this.rebuild()
    this.captureBaseSize()
  }

  /* ================= Utilities ================= */

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  /* ================= Geometry ================= */

  private rebuild() {
    this.parts = []
    this.group.clear()

    let id = this.meshIdStart

    const {
      rows,
      columns,
      width,
      height,
      depth,
      thickness,
      origin,
      material,
      withBack,
    } = this

    /* ---------- Outer frame ---------- */

    // Left
    this.parts.push(new Blank(
      0, 0, 0,
      thickness, height, depth,
      origin, material, id++
    ))

    // Right
    this.parts.push(new Blank(
      width - thickness, 0, 0,
      width, height, depth,
      origin, material, id++
    ))

    // Bottom
    this.parts.push(new Blank(
      thickness, 0, 0,
      width - thickness, thickness, depth,
      origin, material, id++
    ))

    // Top
    this.parts.push(new Blank(
      thickness, height - thickness, 0,
      width - thickness, height, depth,
      origin, material, id++
    ))

    /* ---------- Inner grid ---------- */

    const innerWidth  = width - thickness * 2
    const innerHeight = height - thickness * 2

    const cellWidth =
      (innerWidth - thickness * (columns - 1)) / columns

    const cellHeight =
      (innerHeight - thickness * (rows - 1)) / rows

    // Vertical dividers
    for (let c = 1; c < columns; c++) {
      const x = thickness + c * (cellWidth + thickness)

      this.parts.push(new Blank(
        x - thickness, thickness, 0,
        x, height - thickness, depth,
        origin, material, id++
      ))
    }

    // Horizontal dividers
    for (let r = 1; r < rows; r++) {
      const y = thickness + r * (cellHeight + thickness)

      this.parts.push(new Blank(
        thickness, y - thickness, 0,
        width - thickness, y, depth,
        origin, material, id++
      ))
    }

    /* ---------- Back panel ---------- */

    if (withBack) {
      this.parts.push(new Blank(
        thickness, thickness, 0,
        width - thickness,
        height - thickness,
        thickness,
        origin, material, id++
      ))
    }

    /* ---------- Build group ---------- */

    this.parts.forEach(p => this.group.add(p.build()))
    this.recenterPivot()
  }

  private recenterPivot() {
    const box = new THREE.Box3().setFromObject(this.group)
    const size = new THREE.Vector3()
    box.getSize(size)

    this.group.position.set(
      -size.x / 2,
      -size.y / 2,
      0
    )
  }

  private captureBaseSize() {
    this.baseWidth = this.width
    this.baseHeight = this.height
    this.baseDepth = this.depth
  }

  /* ================= Smooth Scaling ================= */

  update(dt = SMOOTHING) {
    this.width  += (this.targetWidth  - this.width)  * dt
    this.height += (this.targetHeight - this.height) * dt
    this.depth  += (this.targetDepth  - this.depth)  * dt

    const sx = this.width  / this.baseWidth
    const sy = this.height / this.baseHeight
    const sz = this.depth  / this.baseDepth

    this.group.scale.set(sx, sy, sz)
  }

  /* ================= Dimension API ================= */

  setWidth(value: number) {
    this.targetWidth = this.clamp(
      value,
      this.columns * CELL_WIDTH_MIN,
      this.columns * CELL_WIDTH_MAX
    )
  }

  setHeight(value: number) {
    this.targetHeight = this.clamp(
      value,
      this.rows * CELL_HEIGHT_MIN,
      this.rows * CELL_HEIGHT_MAX
    )
  }

  setDepth(value: number) {
    this.targetDepth = this.clamp(value, DEPTH_MIN, DEPTH_MAX)
  }

  /* ================= Topology API ================= */

  addColumn() {
    this.columns++
    this.rebuild()
    this.captureBaseSize()
  }

  removeColumn() {
    if (this.columns <= 1) return
    this.columns--
    this.rebuild()
    this.captureBaseSize()
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

  /* ================= Build ================= */

  build(): THREE.Group {
    return this.group
  }
}
