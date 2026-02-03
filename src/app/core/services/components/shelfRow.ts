import * as THREE from 'three'
import { Blank } from '../components/blank'
import { ShelfRowConfig } from '../types'

export class ShelfRow {
  readonly group = new THREE.Group()
  readonly meshes: THREE.Mesh[] = []

  private reveal = 0

  constructor(
    public readonly index: number,
    private readonly y: number,
    private readonly height: number,
    private readonly columns: number,
    private readonly width: number,
    private readonly depth: number,
    private readonly thickness: number,
    private readonly material: THREE.Material,
    private readonly config: ShelfRowConfig,
  ) {
    this.build()
  }

  /* ================= Build ================= */

  private build() {
    const cellWidth =
      (this.width - this.thickness * (this.columns + 1)) / this.columns

    for (let c = 0; c < this.columns; c++) {
      const x =
        this.thickness + c * (cellWidth + this.thickness)

      const mesh = new Blank(
        x,
        this.y,
        0,
        x + cellWidth,
        this.y + this.height,
        this.depth,
        { x: 0, y: 0, z: 0 },
        this.material.clone(),
        0
      ).build()

      this.meshes.push(mesh)
      this.group.add(mesh)

      this.applyDoors(mesh, c)
      this.applyDrawers(mesh, c)
    }
  }

  /* ================= Doors / Drawers ================= */

  private applyDoors(mesh: THREE.Mesh, col: number) {
    if (this.config.doors === 'none') return
    if (this.config.doors === 'some' && col % 2 === 0) return

    mesh.scale.z *= 0.92
  }

  private applyDrawers(mesh: THREE.Mesh, col: number) {
    if (this.config.drawers === 'none') return
    if (this.config.drawers === 'some' && col % 2 !== 0) return

    mesh.scale.y *= 0.85
  }

  /* ================= Animation ================= */

  update(dt: number) {
    this.reveal = Math.min(1, this.reveal + dt)
  }

  getReveal() {
    return this.reveal
  }

  get isFullyRevealed() {
    return this.reveal >= 1
  }

  /* ================= Hover ================= */

  setHover(active: boolean) {
    this.meshes.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.color.set(active ? 0xaa0000 : 0xffffff)
    })
  }
}
