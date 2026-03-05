import * as THREE from 'three'
import { Blank } from './blank'
import type { IOriginPoint } from '@shared/typse/product'

export class Drawer {
  private parts: Blank[] = []

  constructor(
    width: number,
    height: number,
    depth: number,
    thickness: number,
    origin: IOriginPoint,
    material: THREE.Material,
    meshIdStart: number
  ) {
    let id = meshIdStart
    this.parts.push(
      new Blank(0, 0, 0, width, thickness, depth, origin, material, id++)
    )
    this.parts.push(
      new Blank(0, thickness, 0, thickness, height, depth, origin, material, id++)
    )
    this.parts.push(
      new Blank(
        width - thickness,
        thickness,
        0,
        width,
        height,
        depth,
        origin,
        material,
        id++
      )
    )
    this.parts.push(
      new Blank(
        thickness,
        thickness,
        depth - thickness,
        width - thickness,
        height,
        depth,
        origin,
        material,
        id++
      )
    )
    this.parts.push(
      new Blank(
        thickness,
        thickness,
        0,
        width - thickness,
        height,
        thickness,
        origin,
        material,
        id++
      )
    )
  }

  build(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'drawer'
    this.parts.forEach((part) => group.add(part.build()))
    return group
  }
}
