import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
  Input,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ZardLoaderComponent } from '../../loader/loader.component'
import { ZardFormModule } from '../../form/form.module'
import { ZardInputDirective } from '../../input/input.directive'
import { ZardCheckboxComponent } from '../../checkbox/checkbox.component'
import { ZardSelectComponent } from '../../select/select.component'
import { ZardSelectItemComponent } from '../../select/select-item.component'
import { ZardSliderComponent } from '@shared-components/slider/slider.component'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DimensionOverlayComponent } from '../../dimension-overlay'
import type { DimensionLabel2D, DimensionLine2D } from '../../dimension-overlay'
import {
  Bookcase,
  Desk,
  TvStand,
  ShoeRack,
  BedsideTable,
  CM,
  M,
  type BookcaseModelConfig,
  type CellDimensionOverlay,
  type DeskColumnConfig,
  type DeskModelConfig,
  type TvStandModelConfig,
  type TvColumnConfig,
  type ShoeRackModelConfig,
  type ShoeColumnConfig,
  type BedsideTableModelConfig,
  type BedsideColumnConfig,
  type Product,
  type ProductCategory,
  type RowFill,
  type RowHeight,
  type RowStyle,
  type ShelfRowConfig,
  type StorageSectionConfig,
  type ProductModelConfig,
  DEFAULT_MODEL_CONFIGS,
} from '../../../furniture'
import { ZardCarouselImports } from '../../carousel'
import { ZardCarouselComponent } from '@shared-components/carousel/carousel.component'
import {ZardButtonComponent} from '../../button';
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'woodia-design-configurator',
  templateUrl: './design-configurator.html',
  imports: [
    FormsModule,
    ZardLoaderComponent,
    ZardFormModule,
    ZardCheckboxComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardSliderComponent,
    DimensionOverlayComponent,
    ZardCarouselImports,
    NgIcon,
    ZardButtonComponent,
  ],
  styleUrl: './design-configurator.scss',
})
export class DesignConfigurator implements AfterViewInit, OnDestroy {
  @ViewChild('designConfiguratorCanvas', { static: false })
  designConfiguratorCanvas!: ElementRef<HTMLCanvasElement>

  @ViewChild('styleCarousel') styleCarouselRef?: ZardCarouselComponent

  readonly styleCarouselIndex = computed(() => {
    const idx = this.styleOptions.indexOf(this.bookcaseStyle())
    return idx >= 0 ? idx : 0
  })

  constructor(
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      const idx = this.styleCarouselIndex()
      this.styleCarouselRef?.scrollToIndex(idx)
    })
  }

  private resizeObserver!: ResizeObserver
  private renderer!: THREE.WebGLRenderer
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private animationId!: number

  private controls!: OrbitControls

  @Input() compactLayout = false

  readonly FURNITURE_COLORS = [
    { name: 'Pine', value: '#d2b48c' },
    { name: 'Oak', value: '#b58e65' },
    { name: 'Walnut', value: '#5c4033' },
    { name: 'Mahogany', value: '#4b2e2b' },
    { name: 'Black', value: '#1a1a1a' },
    { name: 'White', value: '#f5f5f5' },
    { name: 'Ash Grey', value: '#8a9a99' },
    { name: 'Navy Blue', value: '#243b55' },
    { name: 'Sage Green', value: '#8f9779' },
    { name: 'Cream', value: '#fffdd0' },
    { name: 'Terracotta', value: '#e2725b' },
    { name: 'Espresso', value: '#362a26' },
    { name: 'Cherry', value: '#5c221e' },
    { name: 'Maple', value: '#e0c9a3' },
    { name: 'Forest', value: '#1b3b27' }
  ]

  /** TV Stand specific style options (column-width effects only). */
  readonly TV_STAND_STYLES: RowStyle[] = ['grid', 'gradient', 'stagger']

  /** Controls whether to show the configurator side panel inputs. */
  showControls = signal(true)
  @Input('showControls') set _showControls(val: boolean) { this.showControls.set(val) }

  /** Tab selection for mobile viewing */
  activeControlTab = signal<string>('width')
  setControlTab(tab: string) {
    this.activeControlTab.set(tab)
  }

  /** Top-level tab: 'model' | 'rows' | 'columns' */
  activeMainTab = signal<string>('model')
  setMainTab(tab: string) {
    this.activeMainTab.set(tab)
  }

  /** Product loaded from API or passed as input */
  product = signal<Product | null>(null)
  @Input('product') set _product(val: Product | null) {
    this.product.set(val)
    if (val) this.applyProductConfig(val)
  }

  /** Which model to show */
  modelType = signal<ProductCategory>('Desk')
  @Input('modelType') set _modelType(val: ProductCategory) {
    this.modelType.set(val)
    
    // If we're not loading a specific product, apply the defaults for this model type
    if (!this.product()) {
      this.applyConfig(val, DEFAULT_MODEL_CONFIGS[val])
    }
    
    if (this.scene) {
      this.createModel()
    }
  }

  private bookcase!: Bookcase
  private bookcaseWrapper!: THREE.Group
  private desk!: Desk
  private deskWrapper!: THREE.Group
  private tvStand!: TvStand
  private tvStandWrapper!: THREE.Group
  private shoeRack!: ShoeRack
  private shoeRackWrapper!: THREE.Group
  private bedsideTable!: BedsideTable
  private bedsideTableWrapper!: THREE.Group

  /** Remove every model wrapper from the scene — called at the start of every createX method. */
  private removeAllModelWrappers() {
    if (this.bookcaseWrapper) this.scene.remove(this.bookcaseWrapper)
    if (this.deskWrapper) this.scene.remove(this.deskWrapper)
    if (this.tvStandWrapper) this.scene.remove(this.tvStandWrapper)
    if (this.shoeRackWrapper) this.scene.remove(this.shoeRackWrapper)
    if (this.bedsideTableWrapper) this.scene.remove(this.bedsideTableWrapper)
  }

  /** Floor plane Y so the model bottom sits on it. Must match floor mesh position. */
  private static readonly FLOOR_Y = -90 * CM
  /** Wall and margin: model back sits at wallZ + wallMargin so it stays in front of the wall. */
  private wallZ = 0
  private wallMargin = 1 * CM
  /** When returning from behind wall, we lerp toward this position. */
  private desiredCameraPosition = new THREE.Vector3()
  private desiredTarget = new THREE.Vector3()

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private readonly dimensionProjectionVec = new THREE.Vector3()
  /** 2D dimension lines and labels for the shared overlay (updated each frame when showDimensions). */
  dimensionLines = signal<DimensionLine2D[]>([])
  dimensionLabels = signal<DimensionLabel2D[]>([])
  dimensionOverlayWidth = signal(1)
  dimensionOverlayHeight = signal(1)

  private isResizing = false
  private resizeTimeout: number | null = null
  private cameraUpdateTimeout: number | null = null
  private readonly cameraDebounceMs = 350
  designLoading = signal(false)
  /** True when the 3D model has been created and is ready to display (skeleton hides). */
  modelLoaded = signal(false)

  private readonly baseDeskWidthCm = 180
  private readonly baseDeskHeightCm = 75
  private readonly baseShelfWidthCm = 120
  private readonly baseShelfHeightCm = 180
  private readonly baseCameraDistance = 4 * M

  // ——— Bookcase state ———
  bookcaseWidthCm = signal(120)
  bookcaseHeightCm = signal(180)
  bookcaseDepthCm = signal(35)
  bookcaseColor = signal('#d2b48c')
  bookcaseStyle = signal<RowStyle>('grid')
  bookcaseDensity = signal(50)
  withBack = signal(true)
  topStorageConfig = signal<StorageSectionConfig | null>(null)
  bottomStorageConfig = signal<StorageSectionConfig | null>(null)
  selectedRowIndex = signal(0)
  rowCount = signal(0)
  readonly styleOptions: RowStyle[] = ['grid', 'slant', 'stagger', 'gradient', 'mosaic']

  // ——— Desk state ———
  deskWidthCm = signal(180)
  deskHeightCm = signal(75)
  deskDepthCm = signal(60)
  deskColor = signal('#d2b48c')
  deskTopOverhangCm = signal(0)
  legroomPosition = signal(0)
  selectedColumnIndex = signal(0)
  columnCount = signal(0)

  // ——— TvStand state ———
  tvStandWidthCm = signal(150)
  tvStandHeightCm = signal(60)
  tvStandDepthCm = signal(40)
  tvStandColor = signal('#d2b48c')
  tvStandWithBack = signal(true)
  tvStandWithLegs = signal(false)
  tvStandStyle = signal<RowStyle>('grid')
  selectedTvColumnIndex = signal(0)
  tvColumnCount = signal(0)

  // ——— ShoeRack state ———
  shoeRackWidthCm = signal(120)
  shoeRackDepthCm = signal(30)
  shoeRackDefaultHeightCm = signal(60)
  shoeRackColor = signal('#d2b48c')
  shoeRackWithBack = signal(true)
  selectedShoeColumnIndex = signal(0)
  shoeColumnCount = signal(0)

  // ——— BedsideTable state ———
  bedsideWidthCm = signal(45)
  bedsideHeightCm = signal(60)
  bedsideDepthCm = signal(40)
  bedsideDensity = signal(50)
  bedsideTopOverhangCm = signal(Math.round(1.5))
  bedsideColor = signal('#d2b48c')
  bedsideWithBack = signal(true)
  selectedBedsideColumnIndex = signal(0)
  bedsideColumnCount = signal(0)

  /** When true, overlay dimension labels (overall + per-cell) on the 3D view. */
  showDimensions = signal(false)

  /** Horizontal gradient for alphaMap: opaque in center, transparent at left/right to blend wall/floor edges. */
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
      this.modelType() === 'Bookcase' ? this.bookcaseWrapper
      : this.modelType() === 'TvStand' ? this.tvStandWrapper
      : this.modelType() === 'ShoeRack' ? this.shoeRackWrapper
      : this.modelType() === 'BedsideTable' ? this.bedsideTableWrapper
      : this.deskWrapper;
    if (!activeWrapper || !this.camera || !this.renderer) return;

    const box = new THREE.Box3().setFromObject(activeWrapper)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Keep camera view from dropping below the default model height
    const baseH = this.modelType() === 'Bookcase'
      ? this.baseShelfHeightCm
      : this.modelType() === 'TvStand'
      ? this.tvStandHeightCm()
      : this.modelType() === 'ShoeRack'
      ? this.shoeRackDefaultHeightCm()
      : this.modelType() === 'BedsideTable'
      ? this.bedsideHeightCm()
      : this.baseDeskHeightCm;
    const defaultHeightCenterY = DesignConfigurator.FLOOR_Y + (baseH * CM) / 2
    if (size.y < baseH * CM) {
      center.y = Math.max(center.y, defaultHeightCenterY)
    }

    const targetFill = 0.88
    const safety = 1.02
    // BedsideTable is small so pull camera further back to avoid it feeling too close
    const furtherBack = this.modelType() === 'BedsideTable' ? 1.8 : 1.18

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
    const refW = this.modelType() === 'Bookcase' ? this.baseShelfWidthCm * CM
      : this.modelType() === 'TvStand' ? this.tvStandWidthCm() * CM
      : this.modelType() === 'ShoeRack' ? this.shoeRackWidthCm() * CM
      : this.modelType() === 'BedsideTable' ? this.bedsideWidthCm() * CM
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

  /** Schedule a camera update after the user stops changing input (debounced). */
  private scheduleCameraUpdate() {
    if (this.cameraUpdateTimeout !== null) clearTimeout(this.cameraUpdateTimeout)
    this.cameraUpdateTimeout = window.setTimeout(() => {
      this.cameraUpdateTimeout = null
      this.updateCameraForModel()
    }, this.cameraDebounceMs)
  }

  private createDesk(options?: { color?: string }) {
    if (!this.scene) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.deskColor()
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
    const desk = new Desk(
      this.deskWidthCm() * CM,
      this.deskHeightCm() * CM,
      this.deskDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      300,
      this.legroomPosition()
    )
    this.desk = desk
    const productVal = this.product()
    if (this.modelType() === 'Desk' && productVal?.category === 'Desk' && productVal.modelConfig) {
      const c = productVal.modelConfig as DeskModelConfig
      c.columnConfigs.forEach((cc, i) => this.desk.setColumnConfig(i, cc))
    }
    this.deskWrapper = new THREE.Group()
    this.updateDeskWrapperPosition()
    this.deskWrapper.add(this.desk.build())
    this.scene.add(this.deskWrapper)
    this.columnCount.set(this.desk.getColumns())
  }

  /** Place wrapper so desk sits on floor with its back flush to wall (back at wallZ + margin); depth changes only extend forward. */
  private updateDeskWrapperPosition() {
    if (!this.deskWrapper || !this.desk) return
    this.deskWrapper.position.set(
      0,
      DesignConfigurator.FLOOR_Y,
      this.wallZ + this.wallMargin
    )
  }

  /** Apply product from API to component state; then call createModel(). */
  private applyProductConfig(product: Product): void {
    this.modelType.set(product.category)
    this.applyConfig(product.category, product.modelConfig)
  }

  /**
   * Applies a model configuration to the component's internal state (signals).
   * Note: complex nested configs like rowConfigs/columnConfigs are handled 
   * during model building (createBookcase/createDesk).
   */
  private applyConfig(category: ProductCategory, config: BookcaseModelConfig | DeskModelConfig | TvStandModelConfig | ShoeRackModelConfig | BedsideTableModelConfig): void {
    if (category === 'Bookcase') {
      const c = config as BookcaseModelConfig
      this.bookcaseWidthCm.set(c.widthCm)
      this.bookcaseHeightCm.set(c.heightCm)
      this.bookcaseDepthCm.set(c.depthCm)
      this.bookcaseColor.set(c.color)
      this.bookcaseStyle.set(c.style as RowStyle)
      this.bookcaseDensity.set(c.density)
      this.withBack.set(c.withBack)
      this.topStorageConfig.set(c.topStorage)
      this.bottomStorageConfig.set(c.bottomStorage)
    } else if (category === 'TvStand') {
      const c = config as TvStandModelConfig
      this.tvStandWidthCm.set(c.widthCm)
      this.tvStandHeightCm.set(c.heightCm)
      this.tvStandDepthCm.set(c.depthCm)
      this.tvStandColor.set(c.color)
      this.tvStandWithBack.set(c.withBack)
      this.tvStandStyle.set(c.style as RowStyle)
    } else if (category === 'ShoeRack') {
      const c = config as ShoeRackModelConfig
      this.shoeRackWidthCm.set(c.widthCm)
      this.shoeRackDepthCm.set(c.depthCm)
      this.shoeRackColor.set(c.color)
      this.shoeRackWithBack.set(c.withBack)
    } else if (category === 'BedsideTable') {
      const c = config as BedsideTableModelConfig
      this.bedsideWidthCm.set(c.widthCm)
      this.bedsideHeightCm.set(c.heightCm)
      this.bedsideDepthCm.set(c.depthCm)
      this.bedsideColor.set(c.color)
      this.bedsideWithBack.set(c.withBack)
      this.bedsideDensity.set(c.density)
    } else {
      const c = config as DeskModelConfig
      this.deskWidthCm.set(c.widthCm)
      this.deskHeightCm.set(c.heightCm)
      this.deskDepthCm.set(c.depthCm)
      this.deskColor.set(c.color)
      this.legroomPosition.set(c.legroomPosition)
    }
  }

  /** Create the 3D model based on current modelType. */
  private createModel(): void {
    this.modelLoaded.set(false)
    if (this.modelType() === 'Bookcase') {
      this.createBookcase()
    } else if (this.modelType() === 'TvStand') {
      this.createTvStand()
    } else if (this.modelType() === 'ShoeRack') {
      this.createShoeRack()
    } else if (this.modelType() === 'BedsideTable') {
      this.createBedsideTable()
    } else {
      this.createDesk()
    }
    this.updateCameraForModel()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.modelLoaded.set(true))
    })
  }

  private createBookcase(options?: { withBack?: boolean; color?: string }) {
    if (!this.scene) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.bookcaseColor()
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
    const bookcase = new Bookcase(
      this.bookcaseWidthCm() * CM,
      this.bookcaseHeightCm() * CM,
      this.bookcaseDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      300,
      options?.withBack ?? this.withBack()
    )
    this.bookcase = bookcase
    this.bookcase.setRowStyle(this.bookcaseStyle())
    this.bookcase.setDensity(this.bookcaseDensity())
    this.bookcase.setTopStorage(this.topStorageConfig())
    this.bookcase.setBottomStorage(this.bottomStorageConfig())
    const productVal = this.product()
    if (this.modelType() === 'Bookcase' && productVal?.category === 'Bookcase' && productVal.modelConfig) {
      const c = productVal.modelConfig as BookcaseModelConfig
      c.rowConfigs.forEach((rc, i) => this.bookcase.setRowConfig(i, rc))
    }
    this.bookcaseWrapper = new THREE.Group()
    this.bookcaseWrapper.position.set(0, DesignConfigurator.FLOOR_Y, this.wallZ + this.wallMargin)
    this.bookcaseWrapper.add(this.bookcase.build())
    this.scene.add(this.bookcaseWrapper)
    this.rowCount.set(this.bookcase.getRows())
  }



  private createTvStand(options?: { withBack?: boolean; color?: string }) {
    if (!this.scene) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.tvStandColor()
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
    const tvStand = new TvStand(
      this.tvStandWidthCm() * CM,
      this.tvStandHeightCm() * CM,
      this.tvStandDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      600,
      options?.withBack ?? this.tvStandWithBack()
    )
    this.tvStand = tvStand
    this.tvStand.setRowStyle(this.tvStandStyle())
    this.tvStand.setWithLegs(this.tvStandWithLegs())
    const productVal = this.product()
    if (this.modelType() === 'TvStand' && productVal?.category === 'TvStand' && productVal.modelConfig) {
      const c = productVal.modelConfig as TvStandModelConfig
      c.columnConfigs.forEach((cc, i) => this.tvStand.setColumnConfig(i, cc))
    }
    this.tvStandWrapper = new THREE.Group()
    this.tvStandWrapper.position.set(0, DesignConfigurator.FLOOR_Y, this.wallZ + this.wallMargin)
    this.tvStandWrapper.add(this.tvStand.build())
    this.scene.add(this.tvStandWrapper)
    this.tvColumnCount.set(this.tvStand.getColumns())
  }

  private createShoeRack(options?: { withBack?: boolean; color?: string }) {
    if (!this.scene) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.shoeRackColor()
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
    const shoeRack = new ShoeRack(
      this.shoeRackWidthCm() * CM,
      this.shoeRackDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      900,
      options?.withBack ?? this.shoeRackWithBack()
    )
    this.shoeRack = shoeRack
    const productVal = this.product()
    if (this.modelType() === 'ShoeRack' && productVal?.category === 'ShoeRack' && productVal.modelConfig) {
      const c = productVal.modelConfig as ShoeRackModelConfig
      c.columnConfigs.forEach((cc, i) => this.shoeRack.setColumnConfig(i, cc))
    } else {
      // Apply current default height to all columns
      this.shoeRack.setAllColumnsHeight(this.shoeRackDefaultHeightCm())
    }
    this.shoeRackWrapper = new THREE.Group()
    this.shoeRackWrapper.position.set(0, DesignConfigurator.FLOOR_Y, this.wallZ + this.wallMargin)
    this.shoeRackWrapper.add(this.shoeRack.build())
    this.scene.add(this.shoeRackWrapper)
    this.shoeColumnCount.set(this.shoeRack.getColumns())
  }

  private createBedsideTable(options?: { withBack?: boolean; color?: string }) {
    if (!this.scene) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.bedsideColor()
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
    const bedsideTable = new BedsideTable(
      this.bedsideWidthCm() * CM,
      this.bedsideHeightCm() * CM,
      this.bedsideDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      1200,
      options?.withBack ?? this.bedsideWithBack(),
      this.bedsideDensity()
    )
    this.bedsideTable = bedsideTable
    const productVal = this.product()
    if (this.modelType() === 'BedsideTable' && productVal?.category === 'BedsideTable' && productVal.modelConfig) {
      const c = productVal.modelConfig as BedsideTableModelConfig
      c.columnConfigs.forEach((cc, i) => this.bedsideTable.setColumnConfig(i, cc))
    }
    this.bedsideTableWrapper = new THREE.Group()
    this.bedsideTableWrapper.position.set(0, DesignConfigurator.FLOOR_Y, this.wallZ + this.wallMargin)
    this.bedsideTableWrapper.add(this.bedsideTable.build())
    this.scene.add(this.bedsideTableWrapper)
    this.bedsideColumnCount.set(this.bedsideTable.getColumns())
  }

  // ——— Desk handlers ———
  onWidthChange(value: number) {
    this.deskWidthCm.set(value)
    if (this.desk) {
      this.desk.setWidth(value * CM)
      const newCount = this.desk.getColumns()
      this.columnCount.set(newCount)
      if (this.selectedColumnIndex() >= newCount) this.selectedColumnIndex.set(Math.max(0, newCount - 1))
      if (this.legroomPosition() > newCount) {
        this.legroomPosition.set(newCount)
        this.desk.setLegroomPosition(newCount)
      }
    }
    this.scheduleCameraUpdate()
  }

  onHeightChange(value: number) {
    this.deskHeightCm.set(value)
    if (this.desk) this.desk.setHeight(value * CM)
    this.scheduleCameraUpdate()
  }

  onDepthChange(value: number) {
    this.deskDepthCm.set(value)
    if (this.desk) this.desk.setDepth(value * CM)
    this.scheduleCameraUpdate()
  }

  onColorInputChange(value: string) {
    this.deskColor.set(value)
    if (!this.desk) return
    this.desk.setColor(value)
  }

  onDeskTopOverhangChange(value: number) {
    this.deskTopOverhangCm.set(value)
    if (this.desk) this.desk.setTopOverhang(value)
    this.scheduleCameraUpdate()
  }

  onLegroomPositionChange(value: number) {
    this.legroomPosition.set(value)
    if (this.desk) {
      this.desk.setLegroomPosition(value)
    }
  }


  /** Indices 0..columnCount-1 for the column selector. */
  columnIndices(): number[] {
    const n = this.columnCount()
    return Array.from({ length: n }, (_, i) => i)
  }

  /** Current column config for the selected column (for template binding). */
  selectedColumnConfig(): DeskColumnConfig | null {
    if (!this.desk) return null
    const c = this.selectedColumnIndex()
    if (c < 0 || c >= this.desk.getColumns()) return null
    return this.desk.getColumnConfig(c)
  }

  onColumnSelect(value: string | string[]) {
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedColumnIndex.set(idx)
  }

  onColumnDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.desk || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    const next: Partial<DeskColumnConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.desk.setColumnConfig(c, { ...cur, ...next })
  }

  onColumnDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.desk || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    const next: Partial<DeskColumnConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.desk.setColumnConfig(c, { ...cur, ...next })
  }

  onColumnDensityChange(value: number) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, density: value })
  }

  onColumnHugeCellChange(value: boolean) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, hugeCell: value, hugeCellDoor: value ? cur.hugeCellDoor : false })
  }

  onColumnHugeCellDoorChange(value: boolean) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, hugeCellDoor: value })
  }

  // ——— Bookcase handlers ———
  onBookcaseWidthChange(value: number) {
    this.bookcaseWidthCm.set(value)
    if (this.bookcase) this.bookcase.setWidth(value * CM)
    this.scheduleCameraUpdate()
  }

  onBookcaseHeightChange(value: number) {
    this.bookcaseHeightCm.set(value)
    if (this.bookcase) {
      this.bookcase.setHeight(value * CM)
      const n = this.bookcase.getRows()
      this.rowCount.set(n)
      if (this.selectedRowIndex() >= n) this.selectedRowIndex.set(Math.max(0, n - 1))
    }
    this.scheduleCameraUpdate()
  }

  onBookcaseDepthChange(value: number) {
    this.bookcaseDepthCm.set(value)
    if (this.bookcase) this.bookcase.setDepth(value * CM)
    this.scheduleCameraUpdate()
  }

  onBookcaseColorInputChange(value: string) {
    this.bookcaseColor.set(value)
    if (!this.bookcase) return
    this.bookcase.setColor(value)
  }

  onStyleChange(value: string | string[] | RowStyle) {
    const style = (Array.isArray(value) ? value[0] : value) as RowStyle
    if (!this.styleOptions.includes(style)) return
    this.bookcaseStyle.set(style)
    if (this.bookcase) this.bookcase.setRowStyle(style)
  }

  onDensityChange(value: number) {
    this.bookcaseDensity.set(value)
    if (this.bookcase) this.bookcase.setDensity(value)
  }

  onBackPanelToggle(enabled: boolean) {
    this.withBack.set(enabled)
    this.createBookcase({ withBack: enabled })
  }

  topStorageValue(): string {
    const c = this.topStorageConfig()
    return c == null ? 'none' : c.height
  }

  bottomStorageValue(): string {
    const c = this.bottomStorageConfig()
    return c == null ? 'none' : c.height
  }

  onTopStorageChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as string
    const next: StorageSectionConfig | null = v === 'none' ? null : { height: v as RowHeight }
    if (next && next.height !== 'sm' && next.height !== 'md' && next.height !== 'lg') return
    this.topStorageConfig.set(next)
    if (this.bookcase) {
      this.bookcase.setTopStorage(next)
      this.scheduleCameraUpdate()
    }
  }

  onBottomStorageChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as string
    const next: StorageSectionConfig | null = v === 'none' ? null : { height: v as RowHeight }
    if (next && next.height !== 'sm' && next.height !== 'md' && next.height !== 'lg') return
    this.bottomStorageConfig.set(next)
    if (this.bookcase) {
      this.bookcase.setBottomStorage(next)
      this.scheduleCameraUpdate()
    }
  }

  totalHeightCm(): number {
    if (!this.bookcase) return this.bookcaseHeightCm()
    return Math.round(this.bookcase.getTotalHeight() / CM)
  }

  rowIndices(): number[] {
    return Array.from({ length: this.rowCount() }, (_, i) => i)
  }

  selectedRowConfig(): ShelfRowConfig | null {
    if (!this.bookcase) return null
    const r = this.selectedRowIndex()
    if (r < 0 || r >= this.bookcase.getRows()) return null
    return this.bookcase.getRowConfig(r)
  }

  onRowSelect(value: string | string[]) {
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedRowIndex.set(idx)
  }

  onRowHeightChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowHeight
    if (!this.bookcase || (v !== 'sm' && v !== 'md' && v !== 'lg')) return
    this.bookcase.setRowConfig(this.selectedRowIndex(), { height: v })
  }

  onRowDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bookcase || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const r = this.selectedRowIndex()
    const cur = this.bookcase.getRowConfig(r)
    const next: Partial<ShelfRowConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.bookcase.setRowConfig(r, { ...cur, ...next })
  }

  onRowDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bookcase || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const r = this.selectedRowIndex()
    const cur = this.bookcase.getRowConfig(r)
    const next: Partial<ShelfRowConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.bookcase.setRowConfig(r, { ...cur, ...next })
  }

  // ——— TvStand handlers ———
  onTvStandWidthChange(value: number) {
    this.tvStandWidthCm.set(value)
    if (this.tvStand) {
      this.tvStand.setWidth(value * CM)
      const newCount = this.tvStand.getColumns()
      this.tvColumnCount.set(newCount)
      if (this.selectedTvColumnIndex() >= newCount) this.selectedTvColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.scheduleCameraUpdate()
  }

  onTvStandHeightChange(value: number) {
    this.tvStandHeightCm.set(value)
    if (this.tvStand) this.tvStand.setHeight(value * CM)
    this.scheduleCameraUpdate()
  }

  onTvStandDepthChange(value: number) {
    this.tvStandDepthCm.set(value)
    if (this.tvStand) this.tvStand.setDepth(value * CM)
    this.scheduleCameraUpdate()
  }

  onTvStandColorChange(value: string) {
    this.tvStandColor.set(value)
    if (this.tvStand) this.tvStand.setColor(value)
  }

  onTvStandBackPanelToggle(enabled: boolean) {
    this.tvStandWithBack.set(enabled)
    this.createTvStand({ withBack: enabled })
  }

  onTvStandStyleChange(value: string | string[] | RowStyle) {
    const style = (Array.isArray(value) ? value[0] : value) as RowStyle
    if (!this.TV_STAND_STYLES.includes(style)) return
    this.tvStandStyle.set(style)
    if (this.tvStand) this.tvStand.setRowStyle(style)
  }

  onTvStandWithLegsChange(enabled: boolean) {
    this.tvStandWithLegs.set(enabled)
    if (this.tvStand) this.tvStand.setWithLegs(enabled)
    this.scheduleCameraUpdate()
  }

  tvColumnIndices(): number[] {
    const n = this.tvColumnCount()
    return Array.from({ length: n }, (_, i) => i)
  }

  selectedTvColumnConfig(): TvColumnConfig | null {
    if (!this.tvStand) return null
    const c = this.selectedTvColumnIndex()
    if (c < 0 || c >= this.tvStand.getColumns()) return null
    return this.tvStand.getColumnConfig(c)
  }

  onTvColumnSelect(value: string | string[]) {
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedTvColumnIndex.set(idx)
  }

  onTvColumnHugeCellChange(enabled: boolean) {
    if (!this.tvStand) return
    const c = this.selectedTvColumnIndex()
    const cur = this.tvStand.getColumnConfig(c)
    this.tvStand.setColumnConfig(c, { ...cur, hugeCell: enabled, hugeCellDoor: enabled ? cur.hugeCellDoor : false })
  }

  onTvColumnHugeCellDoorChange(enabled: boolean) {
    if (!this.tvStand) return
    const c = this.selectedTvColumnIndex()
    const cur = this.tvStand.getColumnConfig(c)
    this.tvStand.setColumnConfig(c, { ...cur, hugeCellDoor: enabled })
  }

  onTvColumnDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.tvStand || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedTvColumnIndex()
    const cur = this.tvStand.getColumnConfig(c)
    const next: Partial<TvColumnConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.tvStand.setColumnConfig(c, { ...cur, ...next })
  }

  onTvColumnDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.tvStand || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedTvColumnIndex()
    const cur = this.tvStand.getColumnConfig(c)
    const next: Partial<TvColumnConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.tvStand.setColumnConfig(c, { ...cur, ...next })
  }

  // ——— ShoeRack handlers ———
  onShoeRackWidthChange(value: number) {
    this.shoeRackWidthCm.set(value)
    if (this.shoeRack) {
      this.shoeRack.setWidth(value * CM)
      const newCount = this.shoeRack.getColumns()
      this.shoeColumnCount.set(newCount)
      if (this.selectedShoeColumnIndex() >= newCount)
        this.selectedShoeColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.scheduleCameraUpdate()
  }

  onShoeRackDepthChange(value: number) {
    this.shoeRackDepthCm.set(value)
    if (this.shoeRack) this.shoeRack.setDepth(value * CM)
    this.scheduleCameraUpdate()
  }

  onShoeRackColorChange(value: string) {
    this.shoeRackColor.set(value)
    if (this.shoeRack) this.shoeRack.setColor(value)
  }

  onShoeRackBackPanelToggle(enabled: boolean) {
    this.shoeRackWithBack.set(enabled)
    this.createShoeRack({ withBack: enabled })
  }

  shoeColumnIndices(): number[] {
    const n = this.shoeColumnCount()
    return Array.from({ length: n }, (_, i) => i)
  }

  selectedShoeColumnConfig(): ShoeColumnConfig | null {
    if (!this.shoeRack) return null
    const c = this.selectedShoeColumnIndex()
    if (c < 0 || c >= this.shoeRack.getColumns()) return null
    return this.shoeRack.getColumnConfig(c)
  }

  onShoeColumnSelect(value: string | string[]) {
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedShoeColumnIndex.set(idx)
  }

  onShoeColumnHeightChange(value: number) {
    if (!this.shoeRack) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    this.shoeRack.setColumnConfig(c, { ...cur, heightCm: value })
    this.scheduleCameraUpdate()
  }

  onShoeColumnHugeCellChange(enabled: boolean) {
    if (!this.shoeRack) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    this.shoeRack.setColumnConfig(c, { ...cur, hugeCell: enabled, hugeCellDoor: enabled ? cur.hugeCellDoor : false })
  }

  onShoeColumnHugeCellDoorChange(enabled: boolean) {
    if (!this.shoeRack) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    this.shoeRack.setColumnConfig(c, { ...cur, hugeCellDoor: enabled })
  }

  onShoeColumnDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.shoeRack || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    const next: Partial<ShoeColumnConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.shoeRack.setColumnConfig(c, { ...cur, ...next })
  }

  onShoeColumnDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.shoeRack || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    const next: Partial<ShoeColumnConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.shoeRack.setColumnConfig(c, { ...cur, ...next })
  }

  onShoeRackDefaultHeightChange(value: number) {
    this.shoeRackDefaultHeightCm.set(value)
    if (this.shoeRack) this.shoeRack.setAllColumnsHeight(value)
    this.scheduleCameraUpdate()
  }


  // ——— BedsideTable handlers ———
  onBedsideWidthChange(value: number) {
    this.bedsideWidthCm.set(value)
    if (this.bedsideTable) {
      this.bedsideTable.setWidth(value * CM)
      const newCount = this.bedsideTable.getColumns()
      this.bedsideColumnCount.set(newCount)
      if (this.selectedBedsideColumnIndex() >= newCount)
        this.selectedBedsideColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.scheduleCameraUpdate()
  }

  onBedsideHeightChange(value: number) {
    this.bedsideHeightCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setHeight(value * CM)
    this.scheduleCameraUpdate()
  }

  onBedsideDepthChange(value: number) {
    this.bedsideDepthCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setDepth(value * CM)
    this.scheduleCameraUpdate()
  }

  onBedsideDensityChange(value: number) {
    this.bedsideDensity.set(value)
    if (this.bedsideTable) this.bedsideTable.setDensity(value)
  }

  onBedsideTopOverhangChange(value: number) {
    this.bedsideTopOverhangCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setTopOverhang(value)
    this.scheduleCameraUpdate()
  }

  onBedsideColorChange(value: string) {
    this.bedsideColor.set(value)
    if (this.bedsideTable) this.bedsideTable.setColor(value)
  }

  onBedsideBackPanelToggle(enabled: boolean) {
    this.bedsideWithBack.set(enabled)
    this.createBedsideTable({ withBack: enabled })
  }

  bedsideColumnIndices(): number[] {
    const n = this.bedsideColumnCount()
    return Array.from({ length: n }, (_, i) => i)
  }

  selectedBedsideColumnConfig(): BedsideColumnConfig | null {
    if (!this.bedsideTable) return null
    const c = this.selectedBedsideColumnIndex()
    if (c < 0 || c >= this.bedsideTable.getColumns()) return null
    return this.bedsideTable.getColumnConfig(c)
  }

  onBedsideColumnSelect(value: string | string[]) {
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedBedsideColumnIndex.set(idx)
  }

  onBedsideColumnHugeCellChange(enabled: boolean) {
    if (!this.bedsideTable) return
    const c = this.selectedBedsideColumnIndex()
    const cur = this.bedsideTable.getColumnConfig(c)
    this.bedsideTable.setColumnConfig(c, { ...cur, hugeCell: enabled, hugeCellDoor: enabled ? cur.hugeCellDoor : false })
  }

  onBedsideColumnHugeCellDoorChange(enabled: boolean) {
    if (!this.bedsideTable) return
    const c = this.selectedBedsideColumnIndex()
    const cur = this.bedsideTable.getColumnConfig(c)
    this.bedsideTable.setColumnConfig(c, { ...cur, hugeCellDoor: enabled })
  }

  onBedsideColumnDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bedsideTable || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedBedsideColumnIndex()
    const cur = this.bedsideTable.getColumnConfig(c)
    const next: Partial<BedsideColumnConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.bedsideTable.setColumnConfig(c, { ...cur, ...next })
  }

  onBedsideColumnDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bedsideTable || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedBedsideColumnIndex()
    const cur = this.bedsideTable.getColumnConfig(c)
    const next: Partial<BedsideColumnConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.bedsideTable.setColumnConfig(c, { ...cur, ...next })
  }

  /**
   * Returns the current configuration describing the model and its options,
   * which can be saved to the backend or loaded later.
   */
  public getModelConfig(): ProductModelConfig | null {
    if (this.modelType() === 'Bookcase' && this.bookcase) {
      return {
        category: 'Bookcase',
        modelConfig: {
          widthCm: this.bookcaseWidthCm(),
          heightCm: this.bookcaseHeightCm(),
          depthCm: this.bookcaseDepthCm(),
          color: this.bookcaseColor(),
          style: this.bookcaseStyle(),
          density: this.bookcaseDensity(),
          withBack: this.withBack(),
          topStorage: this.topStorageConfig(),
          bottomStorage: this.bottomStorageConfig(),
          rowConfigs: this.bookcase.getRowConfigs(),
        }
      }
    } else if (this.modelType() === 'Desk' && this.desk) {
      return {
        category: 'Desk',
        modelConfig: {
          widthCm: this.deskWidthCm(),
          heightCm: this.deskHeightCm(),
          depthCm: this.deskDepthCm(),
          color: this.deskColor(),
          legroomPosition: this.legroomPosition(),
          columnConfigs: this.desk.getColumnConfigs(),
        }
      }
    } else if (this.modelType() === 'TvStand' && this.tvStand) {
      return {
        category: 'TvStand',
        modelConfig: {
          widthCm: this.tvStandWidthCm(),
          heightCm: this.tvStandHeightCm(),
          depthCm: this.tvStandDepthCm(),
          color: this.tvStandColor(),
          edgeColor: '#ffffff',
          style: this.tvStandStyle(),
          withBack: this.tvStandWithBack(),
          columnConfigs: this.tvStand.getColumnConfigs(),
        }
      }
    } else if (this.modelType() === 'ShoeRack' && this.shoeRack) {
      return {
        category: 'ShoeRack',
        modelConfig: {
          widthCm: this.shoeRackWidthCm(),
          depthCm: this.shoeRackDepthCm(),
          color: this.shoeRackColor(),
          edgeColor: '#ffffff',
          withBack: this.shoeRackWithBack(),
          columnConfigs: this.shoeRack.getColumnConfigs(),
        }
      }
    } else if (this.modelType() === 'BedsideTable' && this.bedsideTable) {
      return {
        category: 'BedsideTable',
        modelConfig: {
          widthCm: this.bedsideWidthCm(),
          heightCm: this.bedsideHeightCm(),
          depthCm: this.bedsideDepthCm(),
          color: this.bedsideColor(),
          edgeColor: '#ffffff',
          density: this.bedsideDensity(),
          withBack: this.bedsideWithBack(),
          columnConfigs: this.bedsideTable.getColumnConfigs(),
        }
      }
    }
    return null
  }

  ngAfterViewInit(): void {
    const loadingManager = new THREE.LoadingManager()

    loadingManager.onLoad = () => {
      this.designLoading.set(false)
    }

    const canvas = this.designConfiguratorCanvas.nativeElement
    const parent = canvas.parentElement!

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      if (this.modelType() === 'Bookcase' && this.bookcase) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.bookcase.handleHover(this.raycaster)
      } else if (this.modelType() === 'Desk' && this.desk) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.desk.handleHover(this.raycaster)
      } else if (this.modelType() === 'TvStand' && this.tvStand) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.tvStand.handleHover(this.raycaster)
      } else if (this.modelType() === 'ShoeRack' && this.shoeRack) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.shoeRack.handleHover(this.raycaster)
      } else if (this.modelType() === 'BedsideTable' && this.bedsideTable) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.bedsideTable.handleHover(this.raycaster)
      }
    })

    this.scene = new THREE.Scene()

    /* Gradient texture: opaque in center, fade to transparent at left/right (blends wall/floor edges). */
    const edgeFadeTexture = this.createEdgeFadeAlphaTexture()

    /* Room: wall — FrontSide so it's not visible when camera is behind it */
    const wallGeometry = new THREE.PlaneGeometry(20 * M, 1000 * M)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaMap: edgeFadeTexture,
      side: THREE.FrontSide,
      roughness: 0.9,
      metalness: 0.0,
    })
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    wall.position.set(0, 0, -0.5 * CM)
    this.scene.add(wall)
    this.wallZ = wall.position.z
    const returnMargin = 0.5 * M
    const isCameraBehindWall = () => this.camera.position.z < this.wallZ + returnMargin

    /* Room: floor */
    const floorGeometry = new THREE.PlaneGeometry(20 * M, 20 * M)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      alphaMap: edgeFadeTexture,
      side: THREE.DoubleSide,
      roughness: 0.92,
      metalness: 0,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.position.set(0, -90 * CM, 0)
    floor.rotation.x = -Math.PI / 2
    this.scene.add(floor)

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 200)
    this.camera.position.set(0, 0, this.baseCameraDistance)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const ambient = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambient)
      ;[
        [5, 5, 5],
        [-5, 5, 5],
        [0, 0, 5],
      ].forEach(([x, y, z]) => {
        const light = new THREE.DirectionalLight(0xffffff, 0.5)
        light.position.set(x, y, z)
        this.scene.add(light)
      })

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

    this.createModel()

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
        this.scheduleCameraUpdate()

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

        if (this.modelType() === 'Bookcase' && this.bookcase) this.bookcase.update()
        else if (this.modelType() === 'Desk' && this.desk) this.desk.update()
        else if (this.modelType() === 'TvStand' && this.tvStand) this.tvStand.update()
        else if (this.modelType() === 'ShoeRack' && this.shoeRack) this.shoeRack.update()
        else if (this.modelType() === 'BedsideTable' && this.bedsideTable) this.bedsideTable.update()

        controls.update()
        this.renderer.render(this.scene, this.camera)
        if (this.showDimensions()) this.updateDimensionOverlay()
      }

      this.animationId = requestAnimationFrame(animate)
    }

    animate()
  }

  /** Project model group local position to overlay pixel coordinates; returns null if behind camera. */
  private projectDimensionPoint(localPoint: { x: number; y: number; z: number }): { left: number; top: number } | null {
    const group = this.modelType() === 'Bookcase'
      ? this.bookcase?.build()
      : this.modelType() === 'TvStand'
      ? this.tvStand?.build()
      : this.modelType() === 'ShoeRack'
      ? this.shoeRack?.build()
      : this.modelType() === 'BedsideTable'
      ? this.bedsideTable?.build()
      : this.desk?.build()
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
      this.modelType() === 'Bookcase'
        ? this.bookcase?.getDimensionData() ?? null
        : this.modelType() === 'TvStand'
        ? this.tvStand?.getDimensionData() ?? null
        : this.modelType() === 'ShoeRack'
        ? this.shoeRack?.getDimensionData() ?? null
        : this.modelType() === 'BedsideTable'
        ? this.bedsideTable?.getDimensionData() ?? null
        : this.desk?.getDimensionData() ?? null
    if (!data || !this.renderer) return
    if (!data) return
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
    data.cells.forEach((cell: CellDimensionOverlay, i: number) => {
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
