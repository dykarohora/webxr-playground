import * as THREE from 'three'
import { Camera, DirectionalLight, HemisphereLight, Scene, WebGLRenderer } from 'three'
import { Sea } from './Sea'
import { SkyboxNode } from '../render/nodes/sky-box/SkyBox'
import { Sky } from './Sky'
import { AirPlane } from './AirPlane'

export class Aviator {

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

  public constructor(htmlElement: HTMLDivElement) {
    this.height = window.innerHeight
    this.width = window.innerWidth

    this.scene = new Scene()
    this.scene.fog = new THREE.Fog(0xf7d9aa, 100, 950)
    this.aspectRatio = this.width / this.height
    this.fov = 60
    this.nearPlane = 1
    this.farPlane = 10000

    this.camera = new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane)

    this.camera.position.x = 0
    this.camera.position.z = 200
    this.camera.position.y = 100

    this.renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true
    })

    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true

    htmlElement.appendChild(this.renderer.domElement)

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

    this.loop()
  }

  private createSea() {
    this.sea = new Sea(600, 800)
    this.sea.mesh.position.y = -600
    this.scene.add(this.sea.mesh)
  }

  private createSky() {
    this.sky = new Sky()
    this.sky.mesh.position.y = -600
    this.scene.add(this.sky.mesh)
  }

  private createAirPlane() {
    this.airPlane = new AirPlane()
    this.airPlane.mesh.scale.set(.25, .25, .25)
    this.airPlane.mesh.position.y = 100
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

  private loop = () => {
    this.airPlane.propeller.rotation.x += 0.3
    this.sea.mesh.rotation.z += .005
    this.sky.mesh.rotation.z += .01

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.loop)
  }
}
