import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  inject,
  effect,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ZardLoaderComponent } from '../../loader/loader.component'
import { DimensionOverlayComponent } from '../../dimension-overlay'
import type { DimensionLabel2D, DimensionLine2D } from '../../dimension-overlay'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ConfiguratorStore } from './configurator.store'
import {
  Product,
  ProductModelConfig,
  CM,
  M,
  CellDimensionOverlay,
} from '../../../furniture'
import { NgIcon } from '@ng-icons/core'
import { ZardButtonComponent } from '../../button'

import { BookcaseControls } from './controls/bookcase-controls'
import { DeskControls } from './controls/desk-controls'
import { TvstandControls } from './controls/tvstand-controls'
import { ShoerackControls } from './controls/shoerack-controls'
import { BedsideControls } from './controls/bedside-controls'
import { ZardSkeletonComponent } from '@shared-components/skeleton';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'woodia-design-configurator',
  templateUrl: './design-configurator.html',
  styleUrl: './design-configurator.scss',
  standalone: true,
  providers: [ConfiguratorStore],
  imports: [
    CommonModule,
    FormsModule,
    ZardLoaderComponent,
    DimensionOverlayComponent,
    NgIcon,
    ZardButtonComponent,
    ZardSkeletonComponent,
    BookcaseControls,
    DeskControls,
    TvstandControls,
    ShoerackControls,
    BedsideControls,
    TranslocoDirective,
  ],
})
export class DesignConfigurator implements AfterViewInit, OnDestroy {
  @ViewChild('designConfiguratorCanvas', { static: false })
  designConfiguratorCanvas!: ElementRef<HTMLCanvasElement>

  store = inject(ConfiguratorStore)
  @Output() configChange = new EventEmitter<ProductModelConfig | null>()

  constructor(private cdr: ChangeDetectorRef) {
    // Watch for model changes and emit
    effect(() => {
      // Trigger effect on any major config signal change
      this.store.bookcaseWidthCm();
      this.store.bookcaseHeightCm();
      this.store.bookcaseDepthCm();
      this.store.bookcaseColor();
      this.store.bookcaseStyle();
      this.store.bookcaseDensity();
      this.store.withBack();
      this.store.topStorageConfig();
      this.store.bottomStorageConfig();

      this.store.deskWidthCm();
      this.store.deskHeightCm();
      this.store.deskDepthCm();
      this.store.deskColor();
      this.store.legroomPosition();

      this.store.tvStandWidthCm();
      this.store.tvStandHeightCm();
      this.store.tvStandDepthCm();
      this.store.tvStandColor();
      this.store.tvStandStyle();
      this.store.tvStandWithBack();

      this.store.shoeRackWidthCm();
      this.store.shoeRackDepthCm();
      this.store.shoeRackColor();
      this.store.shoeRackWithBack();

      this.store.bedsideWidthCm();
      this.store.bedsideHeightCm();
      this.store.bedsideDepthCm();
      this.store.bedsideColor();
      this.store.bedsideWithBack();
      this.store.bedsideDensity();

      // Emit the full config
      this.configChange.emit(this.getModelConfig());
    });
  }

  @Input('showControls') set _showControls(val: boolean) {
    this.store.showControls.set(val)
  }

  @Input('product') set _product(val: Product | null) {
    this.store.applyProductConfig(val)
  }


  private resizeObserver!: ResizeObserver
  private renderer!: THREE.WebGLRenderer
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private animationId!: number
  private controls!: OrbitControls

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private readonly dimensionProjectionVec = new THREE.Vector3()

  // 2D dimension lines and labels for the shared overlay
  dimensionLines = signal<DimensionLine2D[]>([])
  dimensionLabels = signal<DimensionLabel2D[]>([])
  dimensionOverlayWidth = signal(1)
  dimensionOverlayHeight = signal(1)

  private isResizing = false
  private resizeTimeout: number | null = null

  private desiredCameraPosition = new THREE.Vector3()
  private desiredTarget = new THREE.Vector3()

  private readonly baseDeskWidthCm = 180
  private readonly baseDeskHeightCm = 75
  private readonly baseShelfWidthCm = 120
  private readonly baseShelfHeightCm = 180
  private readonly baseCameraDistance = 4 * M

  /**
   * Horizontal gradient for alphaMap: opaque in center, transparent at left/right to blend wall/floor edges.
   */
  private createEdgeFadeAlphaTexture(): THREE.Texture {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = 1
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, size, 0)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(0.1, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(0.2, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.8, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.9, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    return texture
  }

  private updateCameraForModel() {
    const activeWrapper =
      this.store.modelType() === 'Bookcase' ? this.store.bookcaseWrapper
        : this.store.modelType() === 'TvStand' ? this.store.tvStandWrapper
          : this.store.modelType() === 'ShoeRack' ? this.store.shoeRackWrapper
            : this.store.modelType() === 'BedsideTable' ? this.store.bedsideTableWrapper
              : this.store.deskWrapper;

    if (!activeWrapper || !this.camera || !this.renderer) return;

    const box = new THREE.Box3().setFromObject(activeWrapper)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Keep camera view from dropping below the default model height
    const baseH = this.store.modelType() === 'Bookcase'
      ? this.baseShelfHeightCm
      : this.store.modelType() === 'TvStand'
        ? this.store.tvStandHeightCm()
        : this.store.modelType() === 'ShoeRack'
          ? this.store.shoeRackDefaultHeightCm()
          : this.store.modelType() === 'BedsideTable'
            ? this.store.bedsideHeightCm()
            : this.baseDeskHeightCm;

    const defaultHeightCenterY = ConfiguratorStore.FLOOR_Y + (baseH * CM) / 2
    if (size.y < baseH * CM) {
      center.y = Math.max(center.y, defaultHeightCenterY)
    }

    const targetFill = 0.88
    const safety = 1.02
    // BedsideTable is small so pull camera further back to avoid it feeling too close
    const furtherBack = this.store.modelType() === 'BedsideTable' ? 1.8 : 1.18

    const vFov = THREE.MathUtils.degToRad(this.camera.fov)
    const canvasW = this.renderer.domElement.clientWidth
    const canvasH = this.renderer.domElement.clientHeight
    const aspect = canvasW > 0 && canvasH > 0
      ? canvasW / canvasH
      : this.camera.aspect || 1

    const distForHeight = size.y / (2 * targetFill * Math.tan(vFov / 2))
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const distForWidth = size.x / (2 * targetFill * Math.tan(hFov / 2))

    const idealDistance = Math.max(distForHeight, distForWidth) * safety * furtherBack

    // Minimum distance so smaller models don't get zoomed in excessively
    const refW = this.store.modelType() === 'Bookcase' ? this.baseShelfWidthCm * CM
      : this.store.modelType() === 'TvStand' ? this.store.tvStandWidthCm() * CM
        : this.store.modelType() === 'ShoeRack' ? this.store.shoeRackWidthCm() * CM
          : this.store.modelType() === 'BedsideTable' ? this.store.bedsideWidthCm() * CM
            : this.baseDeskWidthCm * CM
    const refH = baseH * CM

    const minDistForHeight = refH / (2 * targetFill * Math.tan(vFov / 2))
    const minDistForWidth = refW / (2 * targetFill * Math.tan(hFov / 2))
    const minCameraDistance = Math.max(minDistForHeight, minDistForWidth) * safety * furtherBack

    const distance = Math.max(idealDistance, minCameraDistance)

    if (this.controls) {
      const currentTarget = this.controls.target.clone()
      const direction = this.camera.position.clone().sub(currentTarget)
      if (direction.length() > 0.001) {
        direction.normalize()
        this.camera.position.copy(center).add(direction.multiplyScalar(distance))
      } else {
        this.camera.position.set(center.x, center.y, center.z + distance)
      }
      this.controls.target.copy(center)
      this.controls.minDistance = distance
      this.controls.maxDistance = distance
      this.controls.update()
    } else {
      this.camera.position.set(center.x, center.y, center.z + distance)
    }

    this.desiredCameraPosition.copy(this.camera.position)
    this.desiredTarget.copy(center)
  }

  public getModelConfig(): ProductModelConfig | null {
    return this.store.getModelConfig()
  }

  ngAfterViewInit(): void {
    const loadingManager = new THREE.LoadingManager()

    loadingManager.onLoad = () => {
      this.store.designLoading.set(false)
    }

    const canvas = this.designConfiguratorCanvas.nativeElement
    const parent = canvas.parentElement!

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      if (this.store.modelType() === 'Bookcase' && this.store.bookcase) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.store.bookcase.handleHover(this.raycaster)
      } else if (this.store.modelType() === 'Desk' && this.store.desk) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.store.desk.handleHover(this.raycaster)
      } else if (this.store.modelType() === 'TvStand' && this.store.tvStand) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.store.tvStand.handleHover(this.raycaster)
      } else if (this.store.modelType() === 'ShoeRack' && this.store.shoeRack) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.store.shoeRack.handleHover(this.raycaster)
      } else if (this.store.modelType() === 'BedsideTable' && this.store.bedsideTable) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.store.bedsideTable.handleHover(this.raycaster)
      }
    })

    this.scene = new THREE.Scene()
    this.store.scene.set(this.scene)

    // Wire camera updates
    let cameraUpdateTimeout: number | null = null
    const cameraDebounceMs = 350
    this.store.onCameraUpdateNeeded = () => {
      if (cameraUpdateTimeout !== null) clearTimeout(cameraUpdateTimeout)
      cameraUpdateTimeout = window.setTimeout(() => {
        cameraUpdateTimeout = null
        this.updateCameraForModel()
      }, cameraDebounceMs)
    }

    /* Gradient texture: opaque in center, fade to transparent at left/right (blends wall/floor edges). */
    const edgeFadeTexture = this.createEdgeFadeAlphaTexture()

    /* Room: wall — FrontSide so it's not visible when camera is behind it */
    const wallGeometry = new THREE.PlaneGeometry(20 * M, 1000 * M)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f4f0,    // warm off-white, not pure white
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      alphaMap: edgeFadeTexture,
      side: THREE.FrontSide,
    })
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    wall.position.set(0, 0, -0.5 * CM)
    wall.receiveShadow = true
    this.scene.add(wall)
    this.store.wallZ = wall.position.z
    const returnMargin = 0.5 * M
    const isCameraBehindWall = () => this.camera.position.z < this.store.wallZ + returnMargin

    /* Room: floor */
    const floorGeometry = new THREE.PlaneGeometry(20 * M, 20 * M)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e6e0,    // slightly darker/warmer than wall — creates wall/floor distinction
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      alphaMap: edgeFadeTexture,
      side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.position.set(0, ConfiguratorStore.FLOOR_Y, 0)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 200)
    this.camera.position.set(0, 0.3 * M, this.baseCameraDistance)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    /* Lighting */
    // 1. Base fill — reduced so directional lights create actual contrast
    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambient)

    // 2. Sky/ground bounce — airy feel, kept subtle
    const hemi = new THREE.HemisphereLight(
      0xffffff,  // sky: pure white
      0xe8edf2,  // ground: cool off-white
      0.4
    )
    this.scene.add(hemi)

    // 3. Top-down key — makes shelf tops brighter than fronts, creates 3D depth
    const top = new THREE.DirectionalLight(0xffffff, 0.5)
    top.position.set(-2, 5, 9)
    top.castShadow = true
    top.shadow.mapSize.width = 2048
    top.shadow.mapSize.height = 2048
    top.shadow.camera.near = 0.5
    top.shadow.camera.far = 50
    top.shadow.camera.left = -4    // was -3, wider coverage
    top.shadow.camera.right = 4
    top.shadow.camera.top = 5      // was 3, taller coverage
    top.shadow.camera.bottom = -2
    top.shadow.bias = -0.0005      // less aggressive, reduces acne without over-darkening
    top.shadow.radius = 8          // was 3 — this is the key, much softer penumbra
    top.shadow.mapSize.width = 4096
    top.shadow.mapSize.height = 4096
    this.scene.add(top)

    // 4. Front fill — softer than before, just enough to see inner cell walls
    const front = new THREE.DirectionalLight(0xffffff, 0.35)
    front.position.set(0, 2, 10) // lower angle, more direct into cells
    this.scene.add(front)

    // 5. Side fills — very subtle, just kill pure black edges
    const fillL = new THREE.DirectionalLight(0xffffff, 0.15)
    fillL.position.set(-6, 3, 4)
    this.scene.add(fillL)

    const fillR = new THREE.DirectionalLight(0xffffff, 0.15)
    fillR.position.set(6, 3, 4)
    this.scene.add(fillR)

    // 6. Rim — lifts furniture off background
    const rim = new THREE.DirectionalLight(0xf0f4ff, 0.12)
    rim.position.set(0, 5, -6)
    this.scene.add(rim)

    // 7. Scene background
    this.scene.background = new THREE.Color(0xf8f8f6)

    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls = controls
    controls.enableZoom = false
    controls.enablePan = false
    controls.rotateSpeed = 0.6
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minPolarAngle = Math.PI / 4
    controls.maxPolarAngle = Math.PI / 2.1
    controls.target.set(0, 0, 0)
    controls.update()

    let isUserInteracting = false
    const returnStrength = 0.05
    let idleTimeout: number | null = null

    controls.addEventListener('end', () => {
      idleTimeout = window.setTimeout(() => {
        isUserInteracting = false
      }, 800) // wait 0.8s before returning
    })

    controls.addEventListener('start', () => {
      if (idleTimeout) clearTimeout(idleTimeout)
      isUserInteracting = true
    })

    this.store.createModel()

    /* Resize */
    this.resizeObserver = new ResizeObserver(entries => {
      this.isResizing = true

      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }

      this.resizeTimeout = window.setTimeout(() => {
        const { width, height } = entries[0].contentRect

        this.renderer.setSize(width, height, false)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.store.onCameraUpdateNeeded()

        this.isResizing = false
      }, 5)
    })

    this.resizeObserver.observe(parent)

    /* ================= Animation Loop ================= */
    const animate = () => {
      if (!this.isResizing) {

        if (!isUserInteracting && isCameraBehindWall()) {
          this.camera.position.lerp(this.desiredCameraPosition, returnStrength)
          controls.target.lerp(this.desiredTarget, returnStrength)
        }

        if (this.store.modelType() === 'Bookcase' && this.store.bookcase) this.store.bookcase.update()
        else if (this.store.modelType() === 'Desk' && this.store.desk) this.store.desk.update()
        else if (this.store.modelType() === 'TvStand' && this.store.tvStand) this.store.tvStand.update()
        else if (this.store.modelType() === 'ShoeRack' && this.store.shoeRack) this.store.shoeRack.update()
        else if (this.store.modelType() === 'BedsideTable' && this.store.bedsideTable) this.store.bedsideTable.update()

        controls.update()
        this.renderer.render(this.scene, this.camera)
        if (this.store.showDimensions()) this.updateDimensionOverlay()
      }

      this.animationId = requestAnimationFrame(animate)
    }

    animate()
  }

  /** Project model group local position to overlay pixel coordinates; returns null if behind camera. */
  private projectDimensionPoint(localPoint: { x: number; y: number; z: number }): { left: number; top: number } | null {
    const group = this.store.modelType() === 'Bookcase'
      ? this.store.bookcase?.build()
      : this.store.modelType() === 'TvStand'
        ? this.store.tvStand?.build()
        : this.store.modelType() === 'ShoeRack'
          ? this.store.shoeRack?.build()
          : this.store.modelType() === 'BedsideTable'
            ? this.store.bedsideTable?.build()
            : this.store.desk?.build()
    if (!group || !this.camera || !this.renderer) return null
    this.scene.updateMatrixWorld(true)
    this.dimensionProjectionVec.set(localPoint.x, localPoint.y, localPoint.z)
    this.dimensionProjectionVec.applyMatrix4(group.matrixWorld)
    this.dimensionProjectionVec.project(this.camera)
    if (this.dimensionProjectionVec.z > 1) return null
    const rect = this.renderer.domElement.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    const left = (this.dimensionProjectionVec.x * 0.5 + 0.5) * rect.width
    const top = (1 - (this.dimensionProjectionVec.y * 0.5 + 0.5)) * rect.height
    return { left, top }
  }

  private updateDimensionOverlay(): void {
    const data =
      this.store.modelType() === 'Bookcase'
        ? this.store.bookcase?.getDimensionData() ?? null
        : this.store.modelType() === 'TvStand'
          ? this.store.tvStand?.getDimensionData() ?? null
          : this.store.modelType() === 'ShoeRack'
            ? this.store.shoeRack?.getDimensionData() ?? null
            : this.store.modelType() === 'BedsideTable'
              ? this.store.bedsideTable?.getDimensionData() ?? null
              : this.store.desk?.getDimensionData() ?? null
    if (!data || !this.renderer) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    this.dimensionOverlayWidth.set(rect.width)
    this.dimensionOverlayHeight.set(rect.height)
    const margin = 80
    const inBounds = (pos: { left: number; top: number }) =>
      pos.left >= -margin &&
      pos.left <= rect.width + margin &&
      pos.top >= -margin &&
      pos.top <= rect.height + margin
    const lines: DimensionLine2D[] = []
    const labels: DimensionLabel2D[] = []
    const project = (p: { x: number; y: number; z: number }) => this.projectDimensionPoint(p)
    const wStart = project(data.totalWidthLineLocal.start)
    const wEnd = project(data.totalWidthLineLocal.end)
    if (wStart && wEnd && inBounds(wStart) && inBounds(wEnd)) {
      lines.push({ id: 'total-w', x1: wStart.left, y1: wStart.top, x2: wEnd.left, y2: wEnd.top })
      labels.push({
        id: 'total-w-lbl',
        x: (wStart.left + wEnd.left) / 2,
        y: (wStart.top + wEnd.top) / 2,
        text: `${Math.round(data.totalWidthCm)}`,
        variant: 'total',
      })
    }
    const hStart = project(data.totalHeightLineLocal.start)
    const hEnd = project(data.totalHeightLineLocal.end)
    if (hStart && hEnd && inBounds(hStart) && inBounds(hEnd)) {
      lines.push({ id: 'total-h', x1: hStart.left, y1: hStart.top, x2: hEnd.left, y2: hEnd.top })
      labels.push({
        id: 'total-h-lbl',
        x: (hStart.left + hEnd.left) / 2,
        y: (hStart.top + hEnd.top) / 2,
        text: `${Math.round(data.totalHeightCm)}`,
        variant: 'total',
      })
    }
    const dStart = project(data.totalDepthLineLocal.start)
    const dEnd = project(data.totalDepthLineLocal.end)
    if (dStart && dEnd && inBounds(dStart) && inBounds(dEnd)) {
      lines.push({ id: 'total-d', x1: dStart.left, y1: dStart.top, x2: dEnd.left, y2: dEnd.top })
      labels.push({
        id: 'total-d-lbl',
        x: (dStart.left + dEnd.left) / 2,
        y: (dStart.top + dEnd.top) / 2,
        text: `${Math.round(data.totalDepthCm)}`,
        variant: 'total',
      })
    }
    data.cells.forEach((cell: CellDimensionOverlay) => {
      const pos = project({ x: cell.localX, y: cell.localY, z: cell.localZ })
      if (pos && inBounds(pos)) {
        labels.push({
          id: `cell-${cell.row}-${cell.col}`,
          x: pos.left,
          y: pos.top,
          text: `${Math.round(cell.widthCm)} × ${Math.round(cell.heightCm)}`,
          variant: 'cell',
        })
      }
    })
    this.dimensionLines.set(lines)
    this.dimensionLabels.set(labels)
    this.cdr.detectChanges()
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId)
    this.resizeObserver?.disconnect()
    this.renderer?.dispose()
  }
}
