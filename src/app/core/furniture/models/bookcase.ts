import * as THREE from 'three'
import { Blank } from '../primitives/blank'
import { ShelfRow } from '../primitives/shelf-row'
import { CM, ROW_HEIGHT_MAP } from '@shared/typse/product'
import type { ShelfRowConfig, ShelfStyle } from '@shared/typse/product'

const ROW_ANIMATION_SPEED = 0.06

export class Bookcase {
  private readonly group = new THREE.Group()
  private readonly rows: ShelfRow[] = []
  private activeRowIndex = 0
  private totalHeight = 0

  constructor(
    private readonly columns: number,
    private readonly width: number,
    private readonly depth: number,
    private readonly thickness: number,
    private readonly material: THREE.Material,
    private readonly rowConfigs: ShelfRowConfig[],
    private readonly style: ShelfStyle,
    private readonly withBack = true
  ) {
    this.buildStructure()
    this.applyGlobalStyle()
  }

  private buildStructure() {
    this.buildFrame()
    this.buildShelves()
    this.buildRows()
    this.recenter()
  }

  private buildFrame() {
    this.totalHeight =
      this.rowConfigs.reduce((sum, r) => sum + ROW_HEIGHT_MAP[r.height], 0) +
      this.thickness * (this.rowConfigs.length + 1)
    this.group.add(
      new Blank(0, 0, 0, this.thickness, this.totalHeight, this.depth, { x: 0, y: 0, z: 0 }, this.material, 0).build()
    )
    this.group.add(
      new Blank(
        this.width - this.thickness,
        0,
        0,
        this.width,
        this.totalHeight,
        this.depth,
        { x: 0, y: 0, z: 0 },
        this.material,
        0
      ).build()
    )
    this.group.add(
      new Blank(
        this.thickness,
        0,
        0,
        this.width - this.thickness,
        this.thickness,
        this.depth,
        { x: 0, y: 0, z: 0 },
        this.material,
        0
      ).build()
    )
    this.group.add(
      new Blank(
        this.thickness,
        this.totalHeight - this.thickness,
        0,
        this.width - this.thickness,
        this.totalHeight,
        this.depth,
        { x: 0, y: 0, z: 0 },
        this.material,
        0
      ).build()
    )
    if (this.withBack) {
      this.group.add(
        new Blank(
          this.thickness,
          this.thickness,
          0,
          this.width - this.thickness,
          this.totalHeight - this.thickness,
          this.thickness,
          { x: 0, y: 0, z: 0 },
          this.material,
          0
        ).build()
      )
    }
  }

  private buildShelves() {
    let y = this.thickness
    this.rowConfigs.forEach((config) => {
      y += ROW_HEIGHT_MAP[config.height]
      this.group.add(
        new Blank(
          this.thickness,
          y,
          0,
          this.width - this.thickness,
          y + this.thickness,
          this.depth,
          { x: 0, y: 0, z: 0 },
          this.material,
          0
        ).build()
      )
      y += this.thickness
    })
  }

  private buildRows() {
    let y = this.thickness
    this.rowConfigs.forEach((config, index) => {
      const height = ROW_HEIGHT_MAP[config.height]
      const row = new ShelfRow(
        index,
        y,
        height,
        this.columns,
        this.width,
        this.depth,
        this.thickness,
        this.material,
        config
      )
      this.rows.push(row)
      this.group.add(row.group)
      y += height + this.thickness
    })
  }

  private applyGlobalStyle() {
    this.rows.forEach((row, rowIndex) => {
      row.meshes.forEach((mesh, cellIndex) => {
        switch (this.style) {
          case 'pixel':
            mesh.scale.y = 0
            break
          case 'grid':
            mesh.position.z += (cellIndex % 2) * CM
            break
          case 'mosaic':
            mesh.position.z += (cellIndex % 3) * 2 * CM
            break
          case 'slant':
            mesh.rotation.z = (rowIndex % 2 ? 1 : -1) * 0.04
            break
        }
      })
    })
  }

  update() {
    const row = this.rows[this.activeRowIndex]
    if (!row) return
    row.update(ROW_ANIMATION_SPEED)
    const reveal = row.getReveal()
    row.meshes.forEach((mesh) => {
      if (this.style === 'pixel') mesh.scale.y = reveal
      else mesh.scale.setScalar(reveal)
    })
    if (row.isFullyRevealed) this.activeRowIndex++
  }

  hoverRow(index: number | null) {
    this.rows.forEach((row, i) => row.setHover(index === i))
  }

  private recenter() {
    const box = new THREE.Box3().setFromObject(this.group)
    const size = new THREE.Vector3()
    box.getSize(size)
    this.group.position.set(-size.x / 2, -size.y / 2, 0)
  }

  getObject(): THREE.Group {
    return this.group
  }
}
