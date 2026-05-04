import { Injectable, computed, signal } from '@angular/core'
import * as THREE from 'three'
import {
  Bookcase, Desk, TvStand, ShoeRack, BedsideTable,
  CM, M,
  BookcaseModelConfig, DeskColumnConfig, DeskModelConfig,
  TvStandModelConfig, TvColumnConfig, ShoeRackModelConfig,
  ShoeColumnConfig, BedsideTableModelConfig, BedsideColumnConfig,
  Product, ProductCategory, RowFill, RowHeight, RowStyle,
  ShelfRowConfig, StorageSectionConfig, ProductModelConfig,
  DEFAULT_MODEL_CONFIGS, FURNITURE_COLORS, DESIGN_CATEGORIES
} from '../../../furniture'
import { MODEL_TABS } from './configurator-tabs'

@Injectable()
export class ConfiguratorStore {
  // --- Provided by Host ---
  scene = signal<THREE.Scene | null>(null)
  onCameraUpdateNeeded: () => void = () => { }
  modelLoaded = signal(false)
  designLoading = signal(false)
  configError = signal(false)

  // --- Constants ---
  static readonly FLOOR_Y = -90 * CM
  wallZ = 0
  wallMargin = 1 * CM

  readonly FURNITURE_COLORS = FURNITURE_COLORS
  readonly TV_STAND_STYLES: RowStyle[] = ['grid', 'gradient', 'stagger']
  readonly styleOptions: RowStyle[] = ['grid', 'slant', 'stagger', 'gradient', 'mosaic']

  // --- UI State ---
  showControls = signal(true)
  activeControlTab = signal<string>('width')
  activeMainTab = signal<string>('model')
  showDimensions = signal(false)

  currentMainTabs = computed(() => MODEL_TABS[this.modelType()].mainTabs)
  currentControlTabs = computed(() => MODEL_TABS[this.modelType()].controlTabs)

  styleCarouselIndex = computed(() => {
    const idx = this.styleOptions.indexOf(this.bookcaseStyle())
    return idx >= 0 ? idx : 0
  })

  product = signal<Product | null>(null)
  modelType = signal<ProductCategory>('Desk')

  setControlTab(tab: string) {
    this.activeControlTab.set(tab)
  }

  setMainTab(tab: string) {
    this.activeMainTab.set(tab)
  }

  // --- Models ---
  bookcase!: Bookcase
  bookcaseWrapper!: THREE.Group
  desk!: Desk
  deskWrapper!: THREE.Group
  tvStand!: TvStand
  tvStandWrapper!: THREE.Group
  shoeRack!: ShoeRack
  shoeRackWrapper!: THREE.Group
  bedsideTable!: BedsideTable
  bedsideTableWrapper!: THREE.Group

  // --- State: Desk ---
  deskWidthCm = signal(180)
  deskHeightCm = signal(75)
  deskDepthCm = signal(60)
  deskColor = signal('#d4cfc9')
  deskTopOverhangCm = signal(0)
  legroomPosition = signal(0)
  selectedColumnIndex = signal(0)
  columnCount = signal(0)

  // --- State: Bookcase ---
  bookcaseWidthCm = signal(120)
  bookcaseHeightCm = signal(180)
  bookcaseDepthCm = signal(35)
  bookcaseColor = signal('#d4cfc9')
  bookcaseStyle = signal<RowStyle>('grid')
  bookcaseDensity = signal(50)
  withBack = signal(true)
  topStorageConfig = signal<StorageSectionConfig | null>(null)
  bottomStorageConfig = signal<StorageSectionConfig | null>(null)
  selectedRowIndex = signal(0)
  rowCount = signal(0)

  // --- State: TvStand ---
  tvStandWidthCm = signal(150)
  tvStandHeightCm = signal(60)
  tvStandDepthCm = signal(40)
  tvStandColor = signal('#d4cfc9')
  tvStandWithBack = signal(true)
  tvStandWithLegs = signal(false)
  tvStandStyle = signal<RowStyle>('grid')
  selectedTvColumnIndex = signal(0)
  tvColumnCount = signal(0)

  // --- State: ShoeRack ---
  shoeRackWidthCm = signal(120)
  shoeRackDepthCm = signal(30)
  shoeRackDefaultHeightCm = signal(60)
  shoeRackColor = signal('#d4cfc9')
  shoeRackWithBack = signal(true)
  selectedShoeColumnIndex = signal(0)
  shoeColumnCount = signal(0)

  // --- State: BedsideTable ---
  bedsideWidthCm = signal(45)
  bedsideHeightCm = signal(60)
  bedsideDepthCm = signal(40)
  bedsideDensity = signal(50)
  bedsideTopOverhangCm = signal(Math.round(1.5))
  bedsideColor = signal('#d4cfc9')
  bedsideWithBack = signal(true)
  selectedBedsideColumnIndex = signal(0)
  bedsideColumnCount = signal(0)

  // --- Methods ---

  applyProductConfig(val: Product | null): void {
    this.product.set(val)
    if (val) {
      const category = (val.modelConfig as any)?.modelType ?? val.category;
      if (!category || !DESIGN_CATEGORIES.includes(category as ProductCategory)) {
        this.configError.set(true);
        return;
      }
      this.configError.set(false);
      this.modelType.set(category)
      this.applyConfig(category, val.modelConfig)

      // Reset tabs to avoid staying on a tab that doesn't exist for the new model
      this.activeMainTab.set('model')
      this.activeControlTab.set('width')

      if (this.scene()) {
        this.createModel()
      }
    } else {
      this.configError.set(false);
    }
  }

  applyModelType(val: ProductCategory): void {
    this.modelType.set(val)
    if (!this.product()) {
      this.applyConfig(val, DEFAULT_MODEL_CONFIGS[val])
    }

    // Reset tabs
    this.activeMainTab.set('model')
    this.activeControlTab.set('width')

    if (this.scene()) {
      this.createModel()
    }
  }

  private applyConfig(category: ProductCategory, config: any): void {
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

  removeAllModelWrappers() {
    const s = this.scene()
    if (!s) return
    if (this.bookcaseWrapper) s.remove(this.bookcaseWrapper)
    if (this.deskWrapper) s.remove(this.deskWrapper)
    if (this.tvStandWrapper) s.remove(this.tvStandWrapper)
    if (this.shoeRackWrapper) s.remove(this.shoeRackWrapper)
    if (this.bedsideTableWrapper) s.remove(this.bedsideTableWrapper)
  }

  createModel(): void {
    if (!this.scene()) return
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
    this.onCameraUpdateNeeded()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.modelLoaded.set(true))
    })
  }

  createDesk(options?: { color?: string }) {
    const s = this.scene()
    if (!s) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.deskColor()
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.82),
      roughness: 0.9,
      metalness: 0.0,
    })
    const desk = new Desk(
      this.deskWidthCm() * CM,
      this.deskHeightCm() * CM,
      this.deskDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      backPanelMaterial,
      300,
      this.legroomPosition()
    )
    this.desk = desk
    const productVal = this.product()
    if (this.modelType() === 'Desk' && productVal?.category === 'Desk' && productVal.modelConfig) {
      const c = productVal.modelConfig as DeskModelConfig
      if (c.columnConfigs) {
        c.columnConfigs.forEach((cc, i) => this.desk.setColumnConfig(i, cc))
      }
    }
    this.deskWrapper = new THREE.Group()
    this.deskWrapper.position.set(0, ConfiguratorStore.FLOOR_Y, this.wallZ + this.wallMargin)
    this.deskWrapper.add(this.desk.build())
    s.add(this.deskWrapper)
    this.columnCount.set(this.desk.getColumns())
  }

  createBookcase(options?: { withBack?: boolean; color?: string }) {
    const s = this.scene()
    if (!s) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.bookcaseColor()
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.82),
      roughness: 0.9,
      metalness: 0.0,
    })
    const bookcase = new Bookcase(
      this.bookcaseWidthCm() * CM,
      this.bookcaseHeightCm() * CM,
      this.bookcaseDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      backPanelMaterial,
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
      if (c.rowConfigs) {
        c.rowConfigs.forEach((rc, i) => this.bookcase.setRowConfig(i, rc))
      }
    }
    this.bookcaseWrapper = new THREE.Group()
    this.bookcaseWrapper.position.set(0, ConfiguratorStore.FLOOR_Y, this.wallZ + this.wallMargin)
    this.bookcaseWrapper.add(this.bookcase.build())
    s.add(this.bookcaseWrapper)
    this.rowCount.set(this.bookcase.getRows())
  }

  createTvStand(options?: { withBack?: boolean; color?: string }) {
    const s = this.scene()
    if (!s) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.tvStandColor()
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.82),
      roughness: 0.9,
      metalness: 0.0,
    })
    const tvStand = new TvStand(
      this.tvStandWidthCm() * CM,
      this.tvStandHeightCm() * CM,
      this.tvStandDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      backPanelMaterial,
      600,
      options?.withBack ?? this.tvStandWithBack()
    )
    this.tvStand = tvStand
    this.tvStand.setRowStyle(this.tvStandStyle())
    this.tvStand.setWithLegs(this.tvStandWithLegs())
    const productVal = this.product()
    if (this.modelType() === 'TvStand' && productVal?.category === 'TvStand' && productVal.modelConfig) {
      const c = productVal.modelConfig as TvStandModelConfig
      if (c.columnConfigs) {
        c.columnConfigs.forEach((cc, i) => this.tvStand.setColumnConfig(i, cc))
      }
    }
    this.tvStandWrapper = new THREE.Group()
    this.tvStandWrapper.position.set(0, ConfiguratorStore.FLOOR_Y, this.wallZ + this.wallMargin)
    this.tvStandWrapper.add(this.tvStand.build())
    s.add(this.tvStandWrapper)
    this.tvColumnCount.set(this.tvStand.getColumns())
  }

  createShoeRack(options?: { withBack?: boolean; color?: string }) {
    const s = this.scene()
    if (!s) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.shoeRackColor()
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.82),
      roughness: 0.9,
      metalness: 0.0,
    })
    const shoeRack = new ShoeRack(
      this.shoeRackWidthCm() * CM,
      this.shoeRackDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      backPanelMaterial,
      900,
      options?.withBack ?? this.shoeRackWithBack()
    )
    this.shoeRack = shoeRack
    const productVal = this.product()
    if (this.modelType() === 'ShoeRack' && productVal?.category === 'ShoeRack' && productVal.modelConfig) {
      const c = productVal.modelConfig as ShoeRackModelConfig
      if (c.columnConfigs) {
        c.columnConfigs.forEach((cc, i) => this.shoeRack.setColumnConfig(i, cc))
      }
    } else {
      this.shoeRack.setAllColumnsHeight(this.shoeRackDefaultHeightCm())
    }
    this.shoeRackWrapper = new THREE.Group()
    this.shoeRackWrapper.position.set(0, ConfiguratorStore.FLOOR_Y, this.wallZ + this.wallMargin)
    this.shoeRackWrapper.add(this.shoeRack.build())
    s.add(this.shoeRackWrapper)
    this.shoeColumnCount.set(this.shoeRack.getColumns())
  }

  createBedsideTable(options?: { withBack?: boolean; color?: string }) {
    const s = this.scene()
    if (!s) return
    this.removeAllModelWrappers()

    const colorHex = options?.color ?? this.bedsideColor()
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const backPanelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(0.82),
      roughness: 0.9,
      metalness: 0.0,
    })
    const bedsideTable = new BedsideTable(
      this.bedsideWidthCm() * CM,
      this.bedsideHeightCm() * CM,
      this.bedsideDepthCm() * CM,
      2 * CM,
      { x: 0, y: 0, z: 0 },
      material,
      backPanelMaterial,
      1200,
      options?.withBack ?? this.bedsideWithBack(),
      this.bedsideDensity()
    )
    this.bedsideTable = bedsideTable
    const productVal = this.product()
    if (this.modelType() === 'BedsideTable' && productVal?.category === 'BedsideTable' && productVal.modelConfig) {
      const c = productVal.modelConfig as BedsideTableModelConfig
      if (c.columnConfigs) {
        c.columnConfigs.forEach((cc, i) => this.bedsideTable.setColumnConfig(i, cc))
      }
    }
    this.bedsideTableWrapper = new THREE.Group()
    this.bedsideTableWrapper.position.set(0, ConfiguratorStore.FLOOR_Y, this.wallZ + this.wallMargin)
    this.bedsideTableWrapper.add(this.bedsideTable.build())
    s.add(this.bedsideTableWrapper)
    this.bedsideColumnCount.set(this.bedsideTable.getColumns())
  }

  // --- Handlers: Desk ---
  onDeskWidthChange(value: number) {
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
    this.onCameraUpdateNeeded()
  }

  onDeskHeightChange(value: number) {
    this.deskHeightCm.set(value)
    if (this.desk) this.desk.setHeight(value * CM)
    this.onCameraUpdateNeeded()
  }

  onDeskDepthChange(value: number) {
    this.deskDepthCm.set(value)
    if (this.desk) this.desk.setDepth(value * CM)
    this.onCameraUpdateNeeded()
  }

  onDeskColorInputChange(value: string) {
    this.deskColor.set(value)
    if (this.desk) this.desk.setColor(value)
  }

  onDeskTopOverhangChange(value: number) {
    this.deskTopOverhangCm.set(value)
    if (this.desk) this.desk.setTopOverhang(value)
    this.onCameraUpdateNeeded()
  }

  onLegroomPositionChange(value: number) {
    this.legroomPosition.set(value)
    if (this.desk) this.desk.setLegroomPosition(value)
  }

  deskColumnIndices(): number[] {
    const n = this.columnCount()
    return Array.from({ length: n }, (_, i) => i)
  }

  selectedDeskColumnConfig(): DeskColumnConfig | null {
    if (!this.desk) return null
    const c = this.selectedColumnIndex()
    if (c < 0 || c >= this.desk.getColumns()) return null
    return this.desk.getColumnConfig(c)
  }

  onDeskColumnSelect(value: number | string | string[]) {
    if (typeof value === 'number') {
      this.selectedColumnIndex.set(value)
      return
    }
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedColumnIndex.set(idx)
  }

  onDeskColumnDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.desk || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    const next: Partial<DeskColumnConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.desk.setColumnConfig(c, { ...cur, ...next })
  }

  onDeskColumnDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.desk || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    const next: Partial<DeskColumnConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.desk.setColumnConfig(c, { ...cur, ...next })
  }

  onDeskColumnDensityChange(value: number) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, density: value })
  }

  onDeskColumnHugeCellChange(value: boolean) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, hugeCell: value, hugeCellDoor: value ? cur.hugeCellDoor : false })
  }

  onDeskColumnHugeCellDoorChange(value: boolean) {
    if (!this.desk) return
    const c = this.selectedColumnIndex()
    const cur = this.desk.getColumnConfig(c)
    this.desk.setColumnConfig(c, { ...cur, hugeCellDoor: value })
  }

  // --- Handlers: Bookcase ---
  onBookcaseWidthChange(value: number) {
    this.bookcaseWidthCm.set(value)
    if (this.bookcase) this.bookcase.setWidth(value * CM)
    this.onCameraUpdateNeeded()
  }

  onBookcaseHeightChange(value: number) {
    this.bookcaseHeightCm.set(value)
    if (this.bookcase) {
      this.bookcase.setHeight(value * CM)
      const n = this.bookcase.getRows()
      this.rowCount.set(n)
      if (this.selectedRowIndex() >= n) this.selectedRowIndex.set(Math.max(0, n - 1))
    }
    this.onCameraUpdateNeeded()
  }

  onBookcaseDepthChange(value: number) {
    this.bookcaseDepthCm.set(value)
    if (this.bookcase) this.bookcase.setDepth(value * CM)
    this.onCameraUpdateNeeded()
  }

  onBookcaseColorInputChange(value: string) {
    this.bookcaseColor.set(value)
    if (this.bookcase) this.bookcase.setColor(value)
  }

  onBookcaseStyleChange(value: string | string[] | RowStyle) {
    const style = (Array.isArray(value) ? value[0] : value) as RowStyle
    if (!this.styleOptions.includes(style)) return
    this.bookcaseStyle.set(style)
    if (this.bookcase) this.bookcase.setRowStyle(style)
  }

  onBookcaseDensityChange(value: number) {
    this.bookcaseDensity.set(value)
    if (this.bookcase) this.bookcase.setDensity(value)
  }

  onBookcaseBackPanelToggle(enabled: boolean) {
    this.withBack.set(enabled)
    this.createBookcase({ withBack: enabled })
  }

  bookcaseTopStorageValue(): string {
    const c = this.topStorageConfig()
    return c == null ? 'none' : c.height
  }

  bookcaseBottomStorageValue(): string {
    const c = this.bottomStorageConfig()
    return c == null ? 'none' : c.height
  }

  onBookcaseTopStorageChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as string
    const next: StorageSectionConfig | null = v === 'none' ? null : { height: v as RowHeight }
    if (next && next.height !== 'sm' && next.height !== 'md' && next.height !== 'lg') return
    this.topStorageConfig.set(next)
    if (this.bookcase) {
      this.bookcase.setTopStorage(next)
      this.onCameraUpdateNeeded()
    }
  }

  onBookcaseBottomStorageChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as string
    const next: StorageSectionConfig | null = v === 'none' ? null : { height: v as RowHeight }
    if (next && next.height !== 'sm' && next.height !== 'md' && next.height !== 'lg') return
    this.bottomStorageConfig.set(next)
    if (this.bookcase) {
      this.bookcase.setBottomStorage(next)
      this.onCameraUpdateNeeded()
    }
  }

  bookcaseRowIndices(): number[] {
    return Array.from({ length: this.rowCount() }, (_, i) => i)
  }

  selectedRowConfig(): ShelfRowConfig | null {
    if (!this.bookcase) return null
    const r = this.selectedRowIndex()
    if (r < 0 || r >= this.bookcase.getRows()) return null
    return this.bookcase.getRowConfig(r)
  }

  onBookcaseRowSelect(value: number | string | string[]) {
    if (typeof value === 'number') {
      this.selectedRowIndex.set(value)
      return
    }
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedRowIndex.set(idx)
  }

  onBookcaseRowHeightChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowHeight
    if (!this.bookcase || (v !== 'sm' && v !== 'md' && v !== 'lg')) return
    this.bookcase.setRowConfig(this.selectedRowIndex(), { height: v })
  }

  onBookcaseRowDoorsChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bookcase || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const r = this.selectedRowIndex()
    const cur = this.bookcase.getRowConfig(r)
    const next: Partial<ShelfRowConfig> = { doors: v }
    if (v === 'all') next.drawers = 'none'
    this.bookcase.setRowConfig(r, { ...cur, ...next })
  }

  onBookcaseRowDrawersChange(value: string | string[]) {
    const v = (Array.isArray(value) ? value[0] : value) as RowFill
    if (!this.bookcase || (v !== 'none' && v !== 'some' && v !== 'all')) return
    const r = this.selectedRowIndex()
    const cur = this.bookcase.getRowConfig(r)
    const next: Partial<ShelfRowConfig> = { drawers: v }
    if (v === 'all') next.doors = 'none'
    this.bookcase.setRowConfig(r, { ...cur, ...next })
  }

  // --- Handlers: TvStand ---
  onTvStandWidthChange(value: number) {
    this.tvStandWidthCm.set(value)
    if (this.tvStand) {
      this.tvStand.setWidth(value * CM)
      const newCount = this.tvStand.getColumns()
      this.tvColumnCount.set(newCount)
      if (this.selectedTvColumnIndex() >= newCount) this.selectedTvColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.onCameraUpdateNeeded()
  }

  onTvStandHeightChange(value: number) {
    this.tvStandHeightCm.set(value)
    if (this.tvStand) this.tvStand.setHeight(value * CM)
    this.onCameraUpdateNeeded()
  }

  onTvStandDepthChange(value: number) {
    this.tvStandDepthCm.set(value)
    if (this.tvStand) this.tvStand.setDepth(value * CM)
    this.onCameraUpdateNeeded()
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
    this.onCameraUpdateNeeded()
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

  onTvColumnSelect(value: number | string | string[]) {
    if (typeof value === 'number') {
      this.selectedTvColumnIndex.set(value)
      return
    }
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

  // --- Handlers: ShoeRack ---
  onShoeRackWidthChange(value: number) {
    this.shoeRackWidthCm.set(value)
    if (this.shoeRack) {
      this.shoeRack.setWidth(value * CM)
      const newCount = this.shoeRack.getColumns()
      this.shoeColumnCount.set(newCount)
      if (this.selectedShoeColumnIndex() >= newCount)
        this.selectedShoeColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.onCameraUpdateNeeded()
  }

  onShoeRackDepthChange(value: number) {
    this.shoeRackDepthCm.set(value)
    if (this.shoeRack) this.shoeRack.setDepth(value * CM)
    this.onCameraUpdateNeeded()
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

  onShoeColumnSelect(value: number | string | string[]) {
    if (typeof value === 'number') {
      this.selectedShoeColumnIndex.set(value)
      return
    }
    const v = Array.isArray(value) ? value[0] : value
    const idx = parseInt(v, 10)
    if (!Number.isNaN(idx)) this.selectedShoeColumnIndex.set(idx)
  }

  onShoeColumnHeightChange(value: number) {
    if (!this.shoeRack) return
    const c = this.selectedShoeColumnIndex()
    const cur = this.shoeRack.getColumnConfig(c)
    this.shoeRack.setColumnConfig(c, { ...cur, heightCm: value })
    this.onCameraUpdateNeeded()
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
    this.onCameraUpdateNeeded()
  }

  // --- Handlers: BedsideTable ---
  onBedsideWidthChange(value: number) {
    this.bedsideWidthCm.set(value)
    if (this.bedsideTable) {
      this.bedsideTable.setWidth(value * CM)
      const newCount = this.bedsideTable.getColumns()
      this.bedsideColumnCount.set(newCount)
      if (this.selectedBedsideColumnIndex() >= newCount)
        this.selectedBedsideColumnIndex.set(Math.max(0, newCount - 1))
    }
    this.onCameraUpdateNeeded()
  }

  onBedsideHeightChange(value: number) {
    this.bedsideHeightCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setHeight(value * CM)
    this.onCameraUpdateNeeded()
  }

  onBedsideDepthChange(value: number) {
    this.bedsideDepthCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setDepth(value * CM)
    this.onCameraUpdateNeeded()
  }

  onBedsideDensityChange(value: number) {
    this.bedsideDensity.set(value)
    if (this.bedsideTable) this.bedsideTable.setDensity(value)
  }

  onBedsideTopOverhangChange(value: number) {
    this.bedsideTopOverhangCm.set(value)
    if (this.bedsideTable) this.bedsideTable.setTopOverhang(value)
    this.onCameraUpdateNeeded()
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

  onBedsideColumnSelect(value: number | string | string[]) {
    if (typeof value === 'number') {
      this.selectedBedsideColumnIndex.set(value)
      return
    }
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

  // --- Get Config ---
  getModelConfig(): ProductModelConfig | null {
    if (this.modelType() === 'Bookcase' && this.bookcase) {
      return {
        category: 'Bookcase',
        modelConfig: {
          modelType: 'Bookcase',
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
          modelType: 'Desk',
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
          modelType: 'TvStand',
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
          modelType: 'ShoeRack',
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
          modelType: 'BedsideTable',
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
}
