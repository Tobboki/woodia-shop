import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core'
import { ZardLoaderComponent } from '@shared/components/loader/loader.component'
import { Drawer } from 'src/app/core/services/components/drawer'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BookShelf } from 'src/app/core/services/models/bookshelf'
import { CM, M } from 'src/app/core/services/types'

@Component({
  selector: 'woodia-design-configurator',
  templateUrl: './design-configurator.html',
  imports: [
    ZardLoaderComponent,
  ],
  styleUrl: './design-configurator.scss',
})
export class DesignConfigurator implements AfterViewInit, OnDestroy {
  @ViewChild('designConfiguratorCanvas', { static: false })
  designConfiguratorCanvas!: ElementRef<HTMLCanvasElement>

  private resizeObserver!: ResizeObserver
  private renderer!: THREE.WebGLRenderer
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private animationId!: number

  private isResizing = false
  private resizeTimeout: number | null = null
  designLoading = signal(false)

  ngAfterViewInit(): void {
    const loadingManager = new THREE.LoadingManager()

    loadingManager.onLoad = () => {
      this.designLoading.set(false)
    }

    const canvas = this.designConfiguratorCanvas.nativeElement
    const parent = canvas.parentElement!

    /* ================= Scene ================= */
    this.scene = new THREE.Scene()
    
    /* ================= Axes ================= */
    const axesHelper = new THREE.AxesHelper( 5 )
    this.scene.add( axesHelper )
    
    /* ================= Room(wall) ================= */
    const wallGeometry = new THREE.PlaneGeometry(
      10 * M,  // width
      1000 * M   // height
    )
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    })
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    
    // Position it behind the shelf
    wall.position.set(0, 0, -0.5 * CM)
    
    this.scene.add(wall)

    /* ================= Room(floor) ================= */
    const floorGeometry = new THREE.PlaneGeometry(
      10 * M,  // width
      6 * M   // depth
    )

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    })

    const floor = new THREE.Mesh(floorGeometry, floorMaterial)

    // Position it under the shelf
    floor.position.set(0, -90 * CM, 0)

    // Rotate to lie flat
    floor.rotation.x = -Math.PI / 2

    this.scene.add(floor)

    /* ================= Camera ================= */
    this.scene.fog = new THREE.Fog(
      0xffffff,   // same color as wall
      4 * M,     // start distance
      8 * M      // fully fogged
    )

    /* ================= Camera ================= */
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100)
    this.camera.position.set(0, 0, 4*M)

    /* ================= Renderer ================= */
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })

    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    /* ================= Lights ================= */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(ambientLight)
    
    const rightDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rightDirectionalLight.position.set(5, 5, 5)
    this.scene.add(rightDirectionalLight)
    
    const leftDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    leftDirectionalLight.position.set( -5, 5, 5)
    this.scene.add(leftDirectionalLight)
    
    const centerDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    centerDirectionalLight.position.set( 0, 0, 5)
    this.scene.add(centerDirectionalLight)
    
    const upperCenterDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    upperCenterDirectionalLight.position.set( 0, 0, 5)
    this.scene.add(upperCenterDirectionalLight)

    /* ================= Orbital Controls ================= */
    const controls = new OrbitControls( this.camera, this.renderer.domElement )
    controls.enableZoom = false   // no zoom
    controls.enablePan = false    // no dragging the scene
    controls.rotateSpeed = 0.6    // optional: smoother rotation
    controls.enableDamping = true // enable inertia after mouseleave
    controls.dampingFactor = 0.08 // the force of inertia

    // Limit vertical rotation (IMPORTANT)
    controls.minPolarAngle = Math.PI / 4    // can't look too much from top
    controls.maxPolarAngle = Math.PI / 2.1  // can't go under the floor
    
    // Limit Horizontal  rotation (IMPORTANT)
    // controls.minAzimuthAngle = -Math.PI / 4   // left limit
    // controls.maxAzimuthAngle =  Math.PI / 4   // right limit

    controls.target.set(0, 0, 0) // default target position
    controls.update()

    const initialCameraPosition = this.camera.position.clone()
    const initialTarget = controls.target.clone()

    let isUserInteracting = false
    let returnStrength = 0.05 // smaller = slower return
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

    /* ================= TEST ================= */
    const shelf = new BookShelf(
      4,     // rows
      3,     // columns
      120 * CM, // width
      180 * CM, // height
      35 * CM, // depth
      2 * CM, // thickness
      { x: 0, y: 0, z: 0 }, // origin
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }), //
      300, // mesh id
      true // has back
    )

    this.scene.add(shelf.build())
    
    /* ================= Image Loader ================= */
    const imgLoader = new THREE.ImageLoader()
    const humanModel = imgLoader.loadAsync('')
    // let model: THREE.Object3D | null = null
    
    /* ================= GLTF Loader ================= */
    const gltfLoader = new GLTFLoader()
    // let model: THREE.Object3D | null = null

    /* ================= Resize Observer ================= */
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

        this.isResizing = false
      }, 5)
    })

    this.resizeObserver.observe(parent)

    /* ================= Animation Loop ================= */
    const animate = () => {
      if (!this.isResizing) {

        // Smooth return to initial pose
        if (!isUserInteracting) {
          this.camera.position.lerp(initialCameraPosition, returnStrength)
          controls.target.lerp(initialTarget, returnStrength)
        }

        shelf.update()

        controls.update()
        this.renderer.render(this.scene, this.camera)
      }

      this.animationId = requestAnimationFrame(animate)
    }


    animate()
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId)
    this.resizeObserver?.disconnect()
    this.renderer?.dispose()
  }
}
