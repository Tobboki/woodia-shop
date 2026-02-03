import * as THREE from 'three'

export class Blank {
  // Point 1
  private x1: number
  private y1: number
  private z1: number
  
  // Point 1
  private x2: number
  private y2: number
  private z2: number
  private originPoint: IOriginPoint
  material: THREE.Material
  meshId: number

  constructor(
    // Point 1
    x1: number,
    y1: number,
    z1: number,

    // Point 2
    x2: number,
    y2: number,
    z2: number,
    originPoint: IOriginPoint = {x: 0, y: 0, z: 0},
    material: THREE.Material = new THREE.MeshBasicMaterial(),
    meshId: number
  ) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.z1 = z1;
    this.z2 = z2;
    this.originPoint = originPoint;
    this.material = material;
    this.meshId = meshId;
  }

  build(): THREE.Mesh {
    const width  = Math.abs(this.x2 - this.x1)
    const height = Math.abs(this.y2 - this.y1)
    const depth  = Math.abs(this.z2 - this.z1)

    const geometry = new THREE.BoxGeometry(width, height, depth)
    const mesh = new THREE.Mesh(geometry, this.material)

    // center of the blank
    const cx = (this.x1 + this.x2) / 2
    const cy = (this.y1 + this.y2) / 2
    const cz = (this.z1 + this.z2) / 2

    mesh.position.set(
      cx + this.originPoint.x,
      cy + this.originPoint.y,
      cz + this.originPoint.z
    )

    mesh.userData['meshId'] = this.meshId
    mesh.name = `blank-${this.meshId}`

    return mesh
  }
}