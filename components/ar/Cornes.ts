import { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import * as THREE from 'three'
import { ARButton } from './ARButton'

export class Cornes {
  private container: HTMLDivElement
  private scene: Scene
  private camera: PerspectiveCamera
  private renderer: WebGLRenderer
  private controller: Group

  public constructor(element: HTMLDivElement) {
    this.container = element
    document.body.appendChild(this.container)

    this.scene = new Scene()
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
    light.position.set(0, 1, 0)
    this.scene.add(light)

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.xr.enabled = true
    this.container.appendChild(this.renderer.domElement)

    const arButton = ARButton.createButton(this.renderer)
    document.body.appendChild(arButton)

    const geometry = new THREE.CylinderBufferGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2)

    this.controller = this.renderer.xr.getController(0)
    this.controller.addEventListener('select', () => {
      const material = new THREE.MeshPhongMaterial({color: 0xffffff * Math.random()})
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(0, 0, -0.3).applyMatrix4(this.controller.matrixWorld)
      mesh.quaternion.setFromRotationMatrix(this.controller.matrixWorld)
      this.scene.add(mesh)
    })
    this.scene.add(this.controller)

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateMatrixWorld()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }, false)

    this.animate()
  }

  animate() {
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera)
    })
  }
}
