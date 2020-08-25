import * as THREE from 'three'
import { Camera, DirectionalLight, HemisphereLight, LineBasicMaterial, LineSegments, Scene, WebGLRenderer } from 'three'
import { Sea } from '../../scripts/aviator/Sea'
import { Sky } from '../../scripts/aviator/Sky'
import { AirPlane } from '../../scripts/aviator/AirPlane'
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry'
import { ARButton } from 'three/examples/jsm/webxr/ARButton'

export class AviatorAR {

  private scene: Scene
  private height: number
  private width: number
  private aspectRatio: number
  private fov: number
  private nearPlane: number
  private farPlane: number
  private camera: Camera

  private hemiSphereLight!: HemisphereLight
  private shadowLight!: DirectionalLight

  private renderer: WebGLRenderer

  private sea!: Sea
  private sky!: Sky
  private airPlane!: AirPlane

  private room: LineSegments

  public constructor(htmlElement: HTMLDivElement, button: HTMLButtonElement) {
    button.addEventListener('click', () => {
      navigator.xr!.requestSession('immersive-ar').then((session) => {
        this.renderer.xr.setReferenceSpaceType('local')
        this.renderer.xr.setSession(session)
      })
    })

    this.scene = new Scene()
    this.scene.fog = new THREE.Fog(0xf7d9aa, 100, 950)

    this.height = window.innerHeight / 2
    this.width = window.innerWidth / 2
    this.aspectRatio = this.width / this.height
    this.fov = 50
    this.nearPlane = 0.1
    this.farPlane = 10

    this.camera = new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane)
    this.room = new LineSegments(new BoxLineGeometry(6, 6, 6, 10, 10, 10), new LineBasicMaterial({color: 0x808080}))
    this.room.geometry.translate(0, 3, 0)
    // this.scene.add(this.room)

    // TODO ??
    this.camera.position.set(0, 1.6, 0)

    this.renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.shadowMap.enabled = true
    this.renderer.xr.enabled = true
    htmlElement.appendChild(this.renderer.domElement)
    htmlElement.append(ARButton.createButton(this.renderer))
    // VRButton

    window.addEventListener('resize', () => {
      this.height = window.innerHeight
      this.width = window.innerWidth
      this.renderer.setSize(this.width, this.height)
      // TODO camera
    }, false)

    this.createSea()
    this.createSky()
    this.createLights()
    this.createAirPlane()

    this.scene.position.y += -0.25
    this.scene.position.z += -0.5
    this.animate()
  }

  private createSea() {
    this.sea = new Sea(600, 400)
    const s = .0005
    this.sea.mesh.scale.set(s, s, s)
    this.scene.add(this.sea.mesh)
  }

  private createSky() {
    this.sky = new Sky()
    const s = .0005
    this.sky.mesh.scale.set(s, s, s)
    this.sky.mesh.position.z = 0.2
    this.scene.add(this.sky.mesh)
  }

  private createAirPlane() {
    this.airPlane = new AirPlane()
    const s = .0005
    this.airPlane.mesh.scale.set(s, s, s)
    this.airPlane.mesh.position.y = 0.4
    this.scene.add(this.airPlane.mesh)
  }

  private createLights() {
    // 半球光とは、グラデーションカラーの光のことです。
    // 第1のパラメータは空の色、第2のパラメータは地の色、第3のパラメータは光の強度です。
    this.hemiSphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

    this.shadowLight = new THREE.DirectionalLight(0xffffff, .9)
    this.shadowLight.position.set(150, 350, 350)
    this.shadowLight.castShadow = true

    this.shadowLight.shadow.camera.left = -400
    this.shadowLight.shadow.camera.right = 400
    this.shadowLight.shadow.camera.top = 400
    this.shadowLight.shadow.camera.bottom = -400
    this.shadowLight.shadow.camera.near = 1
    this.shadowLight.shadow.camera.far = 1000

    this.shadowLight.shadow.mapSize.width = 2048
    this.shadowLight.shadow.mapSize.height = 2048

    this.scene.add(this.hemiSphereLight)
    this.scene.add(this.shadowLight)
  }

  private animate() {
    this.renderer.setAnimationLoop(this.render)
  }

  private render = () => {
    this.airPlane.propeller.rotation.x += 0.3
    this.sea.mesh.rotation.z += .002
    this.sky.mesh.rotation.z += .005

    this.renderer.render(this.scene, this.camera)
  }
}
